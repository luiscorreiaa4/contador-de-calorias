# ADMIN_PLAN.md — Painel Administrativo do Catálogo e Curadoria

> Plano vinculado à decisão **D-22** (decisões B1 a B12). Documento idempotente de referência para execução autônoma.

---

## 1. Como é hoje (descoberta a partir do código real)

### 1.1 Esquema de Banco de Dados

#### Tabela `users`
- **Colunas reais:** `id` (UUID PK), `name` (VARCHAR 255), `email` (VARCHAR 255 UNIQUE), `password_hash` (VARCHAR 255), `goal` (VARCHAR 50), `sex` (VARCHAR 20), `birth_date` (DATE), `weight` (NUMERIC 5,2), `height` (NUMERIC 5,2), `body_fat` (NUMERIC 5,2), `activity_level` (VARCHAR 50), `daily_calories_goal` (NUMERIC 6,2), `daily_proteins_goal` (NUMERIC 6,2), `onboarding_completed` (BOOLEAN), `terms_accepted_at` (TIMESTAMPTZ), `email_verified_at` (TIMESTAMPTZ), `token_version` (INT DEFAULT 1), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Situação de Papéis:** Não existe coluna `role` atualmente no banco. Todos os usuários possuem exatamente o mesmo nível de privilégio.

#### Tabela `foods`
- **Colunas reais:** `id` (UUID PK), `name` (VARCHAR 255), `calories` (NUMERIC 8,2), `proteins` (NUMERIC 8,2), `carbs` (NUMERIC 8,2), `fats` (NUMERIC 8,2), `base_unit` (VARCHAR 10, 'g'|'ml'), `serving_weight` (NUMERIC 8,2, default 100), `unit_name` (VARCHAR 50, nullable), `unit_weight` (NUMERIC 8,2, nullable), `source` (VARCHAR 50, nullable), `external_id` (VARCHAR 100, nullable), `active` (BOOLEAN NOT NULL DEFAULT true), `user_id` (UUID NULL REFERENCES users(id) ON DELETE CASCADE), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Valores Nutricionais:** Armazenados referenciados a `serving_weight` (por convenção do seed e importador, 100 g ou 100 ml).
- **Restrições e Índices:**
  - `foods_source_external_id_key UNIQUE (source, external_id)`
  - `idx_foods_name_trgm ON foods USING GIN (f_unaccent(name) gin_trgm_ops)`
  - `idx_foods_user_id ON foods (user_id) WHERE user_id IS NOT NULL`
  - `idx_foods_catalog_unique_name ON foods (f_unaccent(lower(name))) WHERE active = true AND user_id IS NULL` (A-003 / 1792700000000)
  - `idx_foods_custom_user_unique_name ON foods (user_id, f_unaccent(lower(name))) WHERE active = true AND user_id IS NOT NULL`
- **Situação de Curadoria e Rastreamento:** Não existem colunas `source_ref` nem `admin_edited_at`.

### 1.2 Integridade do Histórico e `meal_items`
- **Como `meal_items` guarda nutrição:**
  - A tabela `meal_items` possui colunas próprias: `quantity, unit, display_amount, calories, proteins, carbs, fats`.
  - No momento da criação da refeição (`createMealWithItems`), os nutrientes são calculados proporcionalmente e gravados **como snapshot imutável** em `meal_items`.
  - As consultas de histórico diário e estatísticas de período (`getPeriodStats` em `meal.model.ts`) calculam totais fazendo `SUM(mi.calories), SUM(mi.proteins)...` direto da tabela `meal_items`. Nem sequer fazem join com `foods`.
  - A hidratação de refeições (`hydrateMealsWithItems`) faz `JOIN foods f ON f.id = mi.food_id` apenas para buscar metadados de apresentação (`food_name`, `food_base_unit`, `food_unit_name`, `food_unit_weight`).
  - **Filtro `active` no histórico:** **NENHUMA** consulta de refeição ou histórico filtra por `active = true`. Alimentos desativados continuam aparecendo perfeitamente nas refeições passadas.
  - **Constatação B6:** Como o banco utiliza snapshot de macros em `meal_items`, a edição nutricional de alimentos não altera os lançamentos passados.

### 1.3 Autenticação e Autorização
- **Middleware atual (`backend/src/middlewares/auth.ts`):**
  - Valida JWT HS256 (`{ userId, tv }`).
  - Consulta o banco a cada requisição (`getTokenVersion(userId)` em `auth.model.ts`) e compara com `tv`.
  - Não faz autorização de papéis (RBAC).

### 1.4 Frontend e Navegação
- **Recepção do Usuário:** O endpoint `/api/auth/login` e `/api/users/me` retornam `UserProfile`. O `AuthContext` mantém `user` em estado e serializa `SafeUserSession` no `localStorage`/`sessionStorage`.
- **Roteador (`frontend/src/router.tsx`):** Utiliza `createBrowserRouter` com `RootLayout`, `PublicRoute` e `ProtectedRoute`.
- **Navegação (`frontend/src/components/layout/AppHeader.tsx`):** `primaryLinks` define as abas centrais (Dashboard, Evolução, Metas, Perfil, Configurações).

### 1.5 Pacote `@caloriesync/shared`
- Tipos unificados em `shared/src/types/`: `User`, `UserWithoutPassword`, `Food`, `TokenPayload`.
- Schemas Zod em `shared/src/schemas/`: `food.schemas.ts`, `auth.schemas.ts`, etc.

### 1.6 Script de Importação Atual (`backend/scripts/import-foods.ts`)
- Executa upsert `ON CONFLICT (source, external_id) DO UPDATE SET active = EXCLUDED.active` (reativa inativos se reimportado).
- Não respeita alimentos curados ou editados manualmente.

### 1.7 Situação Atual do Banco de Desenvolvimento (`contador_calorias`)
- **Total no catálogo (`user_id IS NULL`):** 10 alimentos (originários do seed baseline `1790883891276_seed-foods.js`).
- **Ativos:** 10.
- **Inativos:** 0.
- **Alimentos personalizados:** 0.
- O dump completo da TACO está disponível em arquivo bruto em `backend/data/taco-full.json` (597 alimentos).

---

## 2. Como Fica (Desenho-Alvo com Decisões B1 a B12)

1. **RBAC no Banco e Modelo:**
   - Coluna `users.role VARCHAR(20) NOT NULL DEFAULT 'user'` com `CHECK (role IN ('user', 'admin'))`.
   - `foods.source_ref VARCHAR(255) NULL` para registrar a fonte oficial auditável do alimento.
   - `foods.admin_edited_at TIMESTAMPTZ NULL` como marcador de curadoria protegida contra sobrescrita de importadores.
   - Tabela `admin_audit_log` para trilha imutável de todas as ações de escrita (API e CLI).
2. **Autorização no Backend (B1, B11):**
   - Middleware `authenticate` carrega `role` e `token_version` do banco por chave primária em toda requisição.
   - Middleware `requireAdmin` valida `req.userRole === 'admin'`, respondendo 403 Forbidden para usuários comuns.
   - Roteador isolado `router.use(authenticate, requireAdmin)` para todas as rotas `/api/admin/*`.
3. **Endpoints Administrativos de Catálogo (`/api/admin/foods` - B3, B4, B5, B12):**
   - `GET /api/admin/foods?search=&status=all|active|inactive&page=1&limit=50`: listagem paginada (limit ≤ 100), escape de ILIKE.
   - `POST /api/admin/foods`: criação de alimento oficial (`user_id = NULL`, `source = 'catalog'`), exigindo `source_ref`, validação dura de 100 g e tolerância de 25% para cálculo calórico devolvendo warnings. Auditoria atômica.
   - `PUT /api/admin/foods/:id`: edição de dados do catálogo. Marca `admin_edited_at = NOW()`. Auditoria atômica.
   - `PATCH /api/admin/foods/:id/status`: alternância de status ativo/inativo (`active: boolean`). Sem rota DELETE. Auditoria atômica.
4. **Integridade de Refeições com Alimentos Inativos (B7):**
   - `POST /api/meals`: se um novo item utilizar alimento com `active = false`, rejeita com 422 e mensagem clara.
   - `PUT /api/meals/:id`: se a refeição já continha o alimento inativo, preserva; se o usuário tentar adicionar novo alimento inativo, rejeita com 422.
5. **CLI de Gestão de Administradores (B2, B3):**
   - `npm run admin:promote <email>`: promove usuário com e-mail verificado, incrementa `token_version`, grava auditoria.
   - `npm run admin:demote <email>`: rebaixa admin para user, incrementa `token_version`, recusa se deixaria 0 admins, grava auditoria.
   - `npm run admin:list`: lista administradores ativos.
6. **Ferramentas de Curadoria (B9, B10):**
   - `npm run catalog:export`: exporta `backend/data/catalog-review.csv` com heurística de sugestões de duplicatas.
   - `npm run catalog:apply <arquivo.csv>`: simulação por padrão, grava com `--apply`, marca `admin_edited_at`, grava auditoria.
   - `npm run catalog:import-curated <arquivo.json>`: validação Zod com `source` e `source_ref` obrigatórios.
   - `import-foods.ts` protegido: nunca reativa alimentos inativos nem sobrescreve alimentos com `admin_edited_at IS NOT NULL`.
7. **Frontend (B1):**
   - `AdminRoute` protegendo a rota `/admin/alimentos`.
   - Navegação no `AppHeader` exibindo "Catálogo" apenas quando `user.role === 'admin'`.
   - Tela brutalista de catálogo com busca, filtro, paginação, modal de novo alimento com fonte, modal de edição, toggle de status com confirmação, exibição de warnings e tratamento de erros 409/422.
   - Modal de refeição tratando erro 422 caso alimento esteja inativo.

---

## 3. Checklist de Implementação

| Caminho | Ação | Status |
| :--- | :--- | :---: |
| `backend/migrations/1792900000000_add-admin-roles-and-audit.js` | Migração: `users.role`, `foods.source_ref`, `foods.admin_edited_at`, tabela `admin_audit_log` | [x] |
| `shared/src/types/user.types.ts` | Adicionar `role: 'user' \| 'admin'` em `User` e `UserWithoutPassword` | [x] |
| `shared/src/types/food.types.ts` | Adicionar `source_ref`, `admin_edited_at`, `active` opcionais em `Food` | [x] |
| `shared/src/schemas/admin-food.schemas.ts` | Schemas Zod de criação, edição, busca e status admin | [x] |
| `shared/src/index.ts` | Reexportar novos schemas e tipos admin | [x] |
| `backend/src/models/auth.model.ts` | Buscar `role` junto com `token_version` do banco por PK | [x] |
| `backend/src/middlewares/auth.ts` | Carregar `req.userRole` no `authenticate` e criar middleware `requireAdmin` | [x] |
| `backend/src/models/admin-audit.model.ts` | Model para inserção transacional em `admin_audit_log` | [x] |
| `backend/src/models/admin-food.model.ts` | Model de busca administrativa (all/active/inactive), update e insert de alimentos globais | [x] |
| `backend/src/services/admin-food.service.ts` | Regras de validação dura por 100 g, divergência calórica (warnings) e auditoria | [x] |
| `backend/src/controllers/admin-food.controller.ts` | Tradução HTTP das rotas administrativas de catálogo | [x] |
| `backend/src/routes/admin-food.routes.ts` | Rotas sob `/api/admin/foods` protegidas por `router.use(authenticate, requireAdmin)` | [x] |
| `backend/src/routes/index.ts` | Registro do router `/api/admin` na aplicação Express | [x] |
| `backend/src/services/meal.service.ts` | Validação de B7: rejeitar 422 para novo alimento inativo em criação/edição | [x] |
| `backend/src/services/admin-user.service.ts` | Serviço testável de CLI (promote, demote, list) com verificação de e-mail e última conta admin | [ ] |
| `backend/scripts/admin-cli.ts` | Scripts CLI para `npm run admin:promote`, `admin:demote`, `admin:list` | [ ] |
| `backend/scripts/catalog-export.ts` | Script `npm run catalog:export` gerando CSV com heurísticas de duplicatas | [ ] |
| `backend/scripts/catalog-apply.ts` | Script `npm run catalog:apply` com simulação padrão e flag `--apply` | [ ] |
| `backend/scripts/catalog-import-curated.ts` | Script `npm run catalog:import-curated` para carregar JSON estruturado | [ ] |
| `backend/scripts/import-foods.ts` | Proteção contra reativação e sobreposição de alimentos com `admin_edited_at` | [ ] |
| `backend/data/curated-foods.json` | Modelo vazio com array `[]` e exemplo documentado | [ ] |
| `docs/CURADORIA_CATALOGO.md` | Documentação do fluxo de curadoria (export → decidir → apply) e fontes válidas | [ ] |
| `frontend/src/services/auth.service.ts` | Incluir `role?: 'user' \| 'admin'` em `UserProfile` | [ ] |
| `frontend/src/context/AuthContext.tsx` | Incluir `role` em `SafeUserSession` sanitizada | [ ] |
| `frontend/src/components/AdminRoute.tsx` | Componente de guarda de rota para UX administrativa | [ ] |
| `frontend/src/services/admin-food.service.ts` | Chamadas de API para `/api/admin/foods` | [ ] |
| `frontend/src/pages/admin/AdminCatalogPage.tsx` | Tela de gestão do catálogo global | [ ] |
| `frontend/src/components/admin/AdminFoodModal.tsx` | Modal brutalista de criação/edição de alimento global | [ ] |
| `frontend/src/components/layout/AppHeader.tsx` | Exibir link "Catálogo" no menu e dropdown se `user.role === 'admin'` | [ ] |
| `frontend/src/router.tsx` | Adicionar rota protegida `/admin/alimentos` | [ ] |
| `frontend/src/components/meals/NewMealModal.tsx` | Tratar erro 422 de alimento inativo | [ ] |
| `backend/tests/integration/admin_rbac.test.ts` | Testes de RBAC, enumeração de rotas 401/403 e rebaixamento imediato | [x] |
| `backend/tests/integration/admin_foods.test.ts` | Testes de CRUD, auditoria atômica, integridade B6/B7 e warnings | [x] |
| `backend/tests/integration/admin_cli.test.ts` | Testes de promoção, demote com trava de último admin e verificação de e-mail | [ ] |
| `backend/tests/integration/catalog_curation.test.ts` | Testes de exportação, apply simulação/real e proteção do `import-foods` | [ ] |
| `frontend/src/pages/admin/__tests__/AdminCatalogPage.test.tsx` | Testes de frontend com RTL, MSW e acessibilidade | [ ] |
| `docs/ADMIN.md` | Manual de operação de admins, RBAC, auditoria e curadoria | [ ] |
| `docs/DECISOES.md` | Registro de D-22 | [x] |
| `docs/AGENT_LOG.md` | Registro cronológico da execução | [x] |

---

## 4. Decisões do Agente

1. **Snapshots de macros em `meal_items` (B6):** Confirmado pelo código de `createMealWithItems` e `getPeriodStats` que `meal_items` persiste as calorias e macronutrientes calculados no momento do lançamento. Dessa forma, a edição de um alimento no catálogo global é permitida sem impactar lançamentos retroativos.
2. **Consultas de Histórico e Alimentos Inativos:** Confirmado que `hydrateMealsWithItems` realiza `JOIN foods` sem restringir `active = true`. A desativação de um alimento não apaga nem oculta itens de refeições passadas.
3. **Consulta de Papel por Requisição (B1):** Unificamos a query de validação de versão de sessão em `getUserAuthContext(userId)`, que busca `token_version` e `role` em uma única ida ao Postgres por PK, mantendo tempo de resposta negligenciável (< 1 ms).
4. **Auditoria Transacional Atômica (B5):** Toda operação administrativa de escrita (`admin-food.service`, `admin-user.service`, `catalog:apply`) utiliza o mesmo `client` de transação para registrar em `admin_audit_log`, garantindo que nenhuma alteração ocorra sem auditoria e que nenhum log fique órfão em caso de erro.
