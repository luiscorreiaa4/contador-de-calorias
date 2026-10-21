# AUDITORIA DO PROJETO

## 🧭 INSTRUÇÕES PARA MIM MESMO (LEIA PRIMEIRO, SEMPRE)
Eu sou um modelo de IA fazendo uma auditoria SOMENTE LEITURA deste projeto.
- Não posso alterar nenhum arquivo além deste.
- Meu contexto é compactado com frequência. Este arquivo é minha única memória confiável.
- Ao (re)começar: leio este arquivo inteiro, vou ao CHECKPOINT e continuo do "Próximo passo".
- Depois de cada arquivo revisado: registro os achados, marco [x] no inventário e atualizo o CHECKPOINT.
- Não revisito arquivos marcados [x]. Não invento problemas. Sempre cito arquivo:linha.
- Código morto só é afirmado depois de buscar (grep) os usos no projeto inteiro.
- Não paro para pedir permissão. Sigo até terminar todas as fases.
- Ordem das fases: 0 Setup → 1 Mapa → 2 Revisão arquivo a arquivo → 3 Análise transversal → 4 Resumo final.

> NOTA OPERACIONAL: o console do PowerShell deste ambiente decodifica UTF-8 como ANSI e mostra
> "mojibake" (`ǜ`, `�?"`). Isso NÃO é corrupção dos arquivos — confirmado lendo com a ferramenta
> de leitura (UTF-8 correto). Não registrar isso como achado.

## 📍 CHECKPOINT
- Fase atual: 4 (resumo final) — CONCLUÍDA. Auditoria encerrada.
- Último arquivo concluído: `docs/COLOR_MIGRATION.md` (último item do inventário)
- Arquivo em andamento (e até qual linha): —
- Próximo passo (bem específico): nenhum. Se retomar, apenas validar que `AUDITORIA.md` continua sendo o único arquivo alterado (a auditoria é somente leitura).
- Próximo ID de achado: A-130 (nenhum novo previsto)
- Progresso: 198 / 198 arquivos elegíveis (inventário completo)

## 🗺️ MAPA DO PROJETO

### Stack
- Monorepo npm sem workspaces formais: raiz (scripts/CI), `backend/`, `frontend/`, `shared/`, `scripts/`, `docs/`, `docker/`.
- Backend: Node 24, Express 4.21, TypeScript 5.7 (`tsx` watch), PostgreSQL via `pg` (sem ORM), Zod 3.24, JWT (`jsonwebtoken`), bcrypt, helmet, cors, compression, express-rate-limit 8. Migrações: `node-pg-migrate` em `backend/migrations/`.
- Frontend: React 19, Vite 8, TS 6, Tailwind 3, Radix (label/slot), TanStack Query 5, React Router 7 (`react-router`), react-hook-form + zod resolver, react-select, recharts, lucide-react, MSW/Vitest/RTL.
- Shared: `@caloriesync/shared` — schemas Zod, tipos DTO e cálculo nutricional (`nutrition/nutrients.ts`), consumido por backend e frontend via `paths` do tsconfig e `exports` do package.json.
- Banco: PostgreSQL 16 (docker-compose) — tabelas `users`, `foods`, `meals`, `meal_items`, `user_goals`, `body_measurements`, `user_favorite_foods`, `saved_meals`, `saved_meal_items`, `push_subscriptions`. Extensões `uuid-ossp`, `pg_trgm`, `unaccent`; função imutável `f_unaccent`.

### Ponto de entrada e fluxo
- Backend: `backend/src/server.ts` → importa `config/threadpool` (UV_THREADPOOL_SIZE) → `app.ts` → rotas `/api/users|foods|meals|saved-meals|push` + `/health`. Middlewares globais: requestLogger → helmet (CSP restritiva) → cors (origem única, credenciais) → compression → express.json (50kb) → rotas → errorHandler.
- Auth: JWT Bearer (`userId` no payload), middleware `authenticate`; rate limit só em `/register` e `/login` (10/15min por IP+e-mail).
- Camadas backend: `routes` (validação Zod + auth) → `controllers` (HTTP, try/catch repetido) → `services` (regras) → `models` (SQL puro). Transações manuais com `pool.connect()` + BEGIN/COMMIT/ROLLBACK em user/meal/saved_meal/history.
- Frontend: `main.tsx` (QueryClient + AuthProvider + RouterProvider) → `router.tsx` (rotas públicas/privadas com `ProtectedRoute`/`PublicRoute`) → páginas privadas (`Dashboard`, `Stats`, `Measurements`, `Notifications`, `Routine`, `EditProfile`, `Account*`) e públicas (`Login`, `Legal`). Dados via `services/*.ts` (fetch central em `services/api.ts`) + TanStack Query.

### Convenções observadas
- Resposta HTTP sempre `{ success, data?, message? }`.
- IDs UUID; datas de negócio em `America/Sao_Paulo` (backend autoridade, `utils/date.ts`; offset -03:00 fixo em vários pontos).
- UI brutalista (`rounded-none`), tokens semânticos CSS, guarda de cores (`scripts/check-colors.mjs`).
- Idioma misto: código/DB em inglês (`meal_time`, `body_fat`), mensagens/DTOs/comentários em português.
- Testes backend: node:test + supertest + banco `_test`, helper `closeTestPool`.
- Scripts raiz orquestram testes com teto de 300s (`scripts/run-tests.mjs`, `bounded-command.mjs`).

## 📋 INVENTÁRIO DE ARQUIVOS

### Raiz / config / CI (prioridade alta)
- [x] package.json (36) — A-046,A-047
- [x] backend/package.json (54) — A-048,A-049
- [x] frontend/package.json (63) — A-050
- [x] shared/package.json (14) — A-051
- [x] backend/tsconfig.json (18)
- [x] frontend/tsconfig.json (7) / tsconfig.app.json (28) / tsconfig.node.json (21)
- [x] shared/tsconfig.json (14)
- [x] eslint.config.js (24) — A-052
- [x] docker-compose.yml (18) — A-001
- [x] .gitignore (33)
- [x] backend/.env.example (20) — A-053
- [x] .github/workflows/ci.yml (69) — A-111
- [x] .gitleaks.toml (20) / .gitleaksignore (6) — A-112
- [x] docker/init-db.sql (3) — sem achados
- [x] README.md (226) — A-125,A-126
- [x] scripts/audit-test-baseline.mjs (30) — sem achados
- [x] scripts/bounded-command.mjs (4) — sem achados
- [x] scripts/check-test-hygiene.mjs (36) — sem achados
- [x] scripts/inspect-test-processes.mjs (11) — sem achados
- [x] scripts/run-bounded.mjs (51) — sem achados
- [x] scripts/run-tests.mjs (28) — A-046
- [x] scripts/verify-process-timeout.mjs (22) — sem achados
- [x] scripts/verify-test-hygiene.mjs (42) — sem achados

### Backend — núcleo
- [x] backend/src/app.ts (68) — A-017,A-054
- [x] backend/src/server.ts (30) — A-055
- [x] backend/src/config/env.ts (34) — A-056
- [x] backend/src/config/logger.ts (23) — A-031
- [x] backend/src/config/threadpool.ts (10)
- [x] backend/src/config/trustProxy.ts (17)
- [x] backend/src/database/pool.ts (37) — A-016,A-057
- [x] backend/src/middlewares/auth.ts (26) — A-010
- [x] backend/src/middlewares/errorHandler.ts (23) — A-018
- [x] backend/src/middlewares/requestLogger.ts (27) — A-058
- [x] backend/src/middlewares/validate.ts (56) — A-041
- [x] backend/src/utils/date.ts (29) — A-024

### Backend — rotas/controllers/services/models
- [x] backend/src/routes/user.routes.ts (45) — A-059
- [x] backend/src/routes/food.routes.ts (15)
- [x] backend/src/routes/meal.routes.ts (14)
- [x] backend/src/routes/saved_meal.routes.ts (11)
- [x] backend/src/routes/push.routes.ts (11)
- [x] backend/src/controllers/user.controller.ts (255) — A-007,A-022
- [x] backend/src/controllers/food.controller.ts (94) — A-007,A-022
- [x] backend/src/controllers/meal.controller.ts (89) — A-007,A-022
- [x] backend/src/controllers/saved_meal.controller.ts (44) — A-007,A-022
- [x] backend/src/controllers/push.controller.ts (63) — A-007,A-005
- [x] backend/src/services/user.service.ts (369) — A-008,A-009,A-019,A-021,A-060
- [x] backend/src/services/nutrition.service.ts (148) — A-020,A-061
- [x] backend/src/services/meal.service.ts (179) — A-034,A-062
- [x] backend/src/services/food.service.ts (40) — A-063
- [x] backend/src/services/saved_meal.service.ts (33) — A-013
- [x] backend/src/services/push.service.ts (20) — A-005,A-030
- [x] backend/src/models/user.model.ts (144) — A-002,A-045
- [x] backend/src/models/food.model.ts (219) — A-014,A-015
- [x] backend/src/models/history.model.ts (129) — A-006
- [x] backend/src/models/meal.model.ts (333) — A-026
- [x] backend/src/models/saved_meal.model.ts (159) — A-013,A-027
- [x] backend/src/models/push.model.ts (45)

### Backend — migrations
- [x] backend/migrations/1790883887302_baseline.js (88) — A-002,A-064
- [x] backend/migrations/1790883891276_seed-foods.js (38)
- [x] backend/migrations/1791310642375_history-tables.js (30)
- [x] backend/migrations/1791390511650_add-food-scale-features.js (53)
- [x] backend/migrations/1792099463766_add-food-and-meal-indexes.js (28)
- [x] backend/migrations/1792445063766_add-terms-accepted-at.js (28)
- [x] backend/migrations/1792445063767_add-food-name-uniqueness.js (71) — A-003
- [x] backend/migrations/1792500000000_add-diary-and-user-features.js (74) — A-065

### Backend — scripts
- [x] backend/scripts/check-indices.ts (5) — A-110
- [x] backend/scripts/download-taco.ts (62) — A-107
- [x] backend/scripts/import-foods.ts (156) — A-105,A-106
- [x] backend/scripts/reset-db.js (28) — sem achados (proteção de ambiente correta)
- [x] backend/scripts/run-stats-explain.js (89) — A-109
- [x] backend/scripts/seed-perf.js (125) — A-108

### Backend — testes
- [x] backend/tests/helpers/db.ts (29) / lifecycle.ts (12) — sem achados (P-08)
- [x] backend/tests/unit/*.ts (12 arquivos) — sem achados próprios
- [x] backend/tests/integration/*.ts (19 arquivos) — A-116,A-117,A-118,A-119,A-120
- [x] backend/tests/meal.test.ts (94) / user.test.ts (186) — sem achados próprios
- [x] backend/tests/load/autocannon.js (23) — A-121

### Shared
- [x] shared/src/index.ts (9)
- [x] shared/src/nutrition/nutrients.ts (78) — A-023,A-066
- [x] shared/src/schemas/common.schema.ts (11) — A-011
- [x] shared/src/schemas/food.schema.ts (20) — A-028
- [x] shared/src/schemas/meal.schema.ts (34)
- [x] shared/src/schemas/push.schema.ts (13)
- [x] shared/src/schemas/user.schema.ts (86) — A-002,A-012,A-067
- [x] shared/src/types/food.types.ts (13)
- [x] shared/src/types/meal.types.ts (58)
- [x] shared/src/types/user.types.ts (35)

### Frontend — núcleo
- [x] frontend/src/main.tsx (27) — sem achados
- [x] frontend/src/App.tsx (11) — sem achados
- [x] frontend/src/router.tsx (123) — sem achados
- [x] frontend/src/components/ProtectedRoute.tsx (24) / PublicRoute.tsx (16) — sem achados
- [x] frontend/src/context/AuthContext.tsx (91) — A-074,A-075
- [x] frontend/src/services/api.ts (43) — A-079,A-080
- [x] frontend/src/services/auth.service.ts (93) — sem achados próprios
- [x] frontend/src/services/food.service.ts (38) — sem achados
- [x] frontend/src/services/goals.service.ts (39) — sem achados
- [x] frontend/src/services/meal.service.ts (58) — sem achados
- [x] frontend/src/services/measurement.service.ts (16) — sem achados
- [x] frontend/src/services/push.service.ts (168) — A-086,A-087
- [x] frontend/src/services/savedMeal.service.ts (17) — sem achados
- [x] frontend/src/hooks/useProfileSettings.ts (24) — sem achados
- [x] frontend/src/types/auth.ts (25) — A-088 / profile.ts — A-068,A-070 / meal-modal.ts — sem achados
- [x] frontend/src/utils/date.ts (31) — A-089,A-090 / download.ts — sem achados
- [x] frontend/src/lib/utils.ts (5) — sem achados

### Frontend — componentes
- [x] frontend/src/components/layout/AppHeader.tsx (261) — sem achados próprios
- [x] frontend/src/components/layout/RootLayout.tsx (66) — sem achados
- [x] frontend/src/components/layout/Footer.tsx (5) — sem achados
- [x] frontend/src/components/layout/SectionLayout.tsx (24) — sem achados
- [x] frontend/src/components/auth/AuthCard.tsx (111) — A-076,A-083,A-084
- [x] frontend/src/components/auth/LoginForm.tsx (157) — A-081,A-082
- [x] frontend/src/components/auth/RegisterForm.tsx (247) — A-076,A-077,A-078
- [x] frontend/src/components/common/DatePickerInput.tsx (242) — sem achados
- [x] frontend/src/components/common/DeleteAccountModal.tsx (197) — A-085
- [x] frontend/src/components/meals/NewMealModal.tsx (998) — A-091,A-092,A-093,A-094
- [x] frontend/src/components/meals/FoodQuantityForm.tsx (208) — sem achados
- [x] frontend/src/components/meals/FoodSearchSelect.tsx (129) — sem achados
- [x] frontend/src/components/meals/MealItemList.tsx (128) — sem achados
- [x] frontend/src/components/meals/MealModalFooter.tsx (60) — sem achados
- [x] frontend/src/components/onboarding/OnboardingFlow.tsx (338) — A-068,A-072
- [x] frontend/src/components/profile/BiometricsSection.tsx (96) — A-069
- [x] frontend/src/components/profile/BodyHeightForm.tsx (31) — A-035 (recalculo)
- [x] frontend/src/components/profile/GoalSettingsCard.tsx (101) — A-035 (recalculo)
- [x] frontend/src/components/profile/PersonalInfoSection.tsx (130) — A-072
- [x] frontend/src/components/profile/ProfileFormFeedback.tsx (11) — sem achados
- [x] frontend/src/components/profile/ProfileQueryBoundary.tsx (15) — sem achados
- [x] frontend/src/components/profile/RoutineGoalsSection.tsx (101) — sem achados
- [x] frontend/src/components/profile/SecuritySection.tsx (148) — sem achados
- [x] frontend/src/components/ui/*.tsx (7 arquivos, ~318 linhas) — sem achados

### Frontend — páginas
- [x] frontend/src/pages/private/DashboardPage.tsx (561) — A-095,A-096,A-097,A-098
- [x] frontend/src/pages/private/MeasurementsPage.tsx (379) — A-099,A-100
- [x] frontend/src/pages/private/StatsPage.tsx (259) — A-090
- [x] frontend/src/pages/private/NotificationsPage.tsx (144) — A-071
- [x] frontend/src/pages/private/EditProfilePage.tsx (58) — A-067,A-068
- [x] frontend/src/pages/private/RoutinePage.tsx (30) — A-073
- [x] frontend/src/pages/private/AccountPrivacyPage.tsx (32) — sem achados próprios
- [x] frontend/src/pages/private/AccountSecurityPage.tsx (20) — sem achados próprios
- [x] frontend/src/pages/public/LoginPage.tsx (13) — sem achados
- [x] frontend/src/pages/public/LegalPage.tsx (186) — A-066

### Frontend — estilos / PWA / config
- [x] frontend/src/styles/index.css (146) — A-104 / App.css (1) — sem achados
- [x] frontend/src/styles/tokens.contrast.test.ts (179) — A-113,A-114
- [x] frontend/tailwind.config.js (84) — sem achados
- [x] frontend/vite.config.ts (65) — sem achados
- [x] frontend/index.html (25) — sem achados
- [x] frontend/public/sw.js (92) — A-101,A-102,A-104
- [x] frontend/public/manifest.webmanifest (18) — A-103
- [x] frontend/scripts/check-colors.mjs (149) — A-115

### Frontend — testes e mocks
- [x] frontend/src/mocks/handlers.ts (472) / server.ts (3) — A-116,A-127
- [x] frontend/src/setupTests.ts (11) — sem achados
- [x] frontend/src/tests/*.tsx|ts (5 arquivos) — A-127,A-129
- [x] frontend/src/components/**/*.test.tsx (5 arquivos) — A-116,A-127
- [x] frontend/src/pages/**/__tests__/*.tsx (7 arquivos) — A-116,A-129
- [x] frontend/src/types/__tests__/meal-modal.test.ts (46) — sem achados (paridade com shared)
- [x] frontend/src/utils/__tests__/date.test.ts (32) — A-089 (teste consagra fallback)

### Docs (leitura transversal, prioridade baixa)
- [x] docs/ARCHITECTURE.md, SPEC.md, TESTING.md, ROADMAP.md, BACKLOG.md, MIGRATIONS.md, PERFORMANCE_BASELINE.md, UX_NAVIGATION.md — A-122,A-123,A-124,A-125
- [x] docs/COLOR_MIGRATION.md — A-128 / CORES.md, TEST_HYGIENE_REPORT.md — sem achados novos
- [x] docs/reviews/*.md, docs/archive/*, docs/AGENT_LOG.md — históricos; sem achados novos (A-123 cobre o backlog)

### Ignorados
- `node_modules`, `dist`, `coverage`, `.git`, `build`; `package-lock.json` (4 arquivos); `backend/data/*.json` e `data/taco-full.json` (dados TACO, 6.5k linhas cada, não código); imagens/fontes.

## 🔎 ACHADOS

### [A-001] 🔴 Senha padrão do PostgreSQL hardcoded no docker-compose
- **Categoria:** 🔒 Segurança
- **Local:** `docker-compose.yml:9`
- **Problema:** `POSTGRES_PASSWORD: ${DB_PASSWORD:-vN7qL2xR9mK4zP8wT6aB3}` define uma senha real como fallback versionado. Qualquer clone do repositório sobe um Postgres com credencial conhecida.
- **Por que importa:** Se a porta 5432 for exposta (é: `ports: 5432:5432`), o banco fica acessível com senha pública na rede. Credencial vazada em histórico do Git não deve ser reutilizada.
- **Sugestão:** `POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD é obrigatória}`; remover o valor default e rotacionar a senha. Não publicar a porta fora de `127.0.0.1:5432:5432`.
- **Confiança:** Alta

### [A-002] 🟠 E-mail é UNIQUE case-sensitive e nunca é normalizado → contas duplicadas
- **Categoria:** 🐛 Bugs / 🔒 Segurança
- **Local:** `backend/migrations/1790883887302_baseline.js:18`; `shared/src/schemas/user.schema.ts:11,21,27`; `backend/src/models/user.model.ts:32-37`
- **Problema:** `email VARCHAR(255) NOT NULL UNIQUE` compara bytes. Nenhum schema aplica `.trim().toLowerCase()` e `findUserByEmail` faz `WHERE email = $1`. `User@x.com` e `user@x.com` viram duas contas; no login só o casing exato funciona.
- **Por que importa:** Usuário pode se cadastrar duas vezes (dados divididos), e a checagem `existingUser` de `register` não impede isso. Também permite contornar limites por e-mail no rate limit.
- **Sugestão:** Normalizar no schema (`z.string().trim().toLowerCase().email()`) **e** criar índice único `CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email))`; ler sempre por `lower(email) = $1`.
- **Confiança:** Alta

### [A-003] 🟠 Índice único global de nome de alimento quebra alimentos personalizados de usuários diferentes
- **Categoria:** 🐛 Bugs / 🏗️ Arquitetura
- **Local:** `backend/migrations/1792445063767_add-food-name-uniqueness.js:59-63`; `backend/src/models/food.model.ts:215-233`
- **Problema:** `CREATE UNIQUE INDEX ... ON foods (f_unaccent(lower(name))) WHERE active = true` ignora `user_id`. Dois usuários não podem ter um alimento personalizado com o mesmo nome (ex.: "Bolo da vó"), e um usuário não pode criar alimento com nome igual a um item do catálogo TACO.
- **Por que importa:** O `INSERT` viola a constraint → `error` 23505 não tratado → HTTP 500 genérico ("Erro interno no servidor") para uma ação legítima do usuário.
- **Sugestão:** Índices parciais separados: catálogo `WHERE active AND user_id IS NULL` e personalizados `UNIQUE (user_id, f_unaccent(lower(name))) WHERE active AND user_id IS NOT NULL`. Tratar `23505` retornando 409 com mensagem clara.
- **Confiança:** Alta

### [A-004] 🟠 Cadastro/edição de e-mail sem tratamento de corrida e de violação UNIQUE
- **Categoria:** 🔀 Concorrência / 🚨 Tratamento de erros
- **Local:** `backend/src/services/user.service.ts:16-32,183-188`
- **Problema:** `findUserByEmail` seguido de `createUser`/`updateUser` é check-then-act. Duas requisições simultâneas passam pela checagem; a segunda viola `users_email_key` e o erro do Postgres não é mapeado (vira 500).
- **Por que importa:** 500 em cenário comum (duplo clique no cadastro), com log genérico e UX ruim.
- **Sugestão:** Capturar `error.code === '23505'` e responder 409; ou usar `INSERT ... ON CONFLICT (email) DO NOTHING RETURNING *` e checar `rowCount`.
- **Confiança:** Alta

### [A-005] 🟠 Endpoint de notificação push "de teste" não envia nada e sempre responde sucesso
- **Categoria:** 🐛 Bugs / 🚨 Tratamento de erros
- **Local:** `backend/src/services/push.service.ts:18-25`; `backend/src/controllers/push.controller.ts:53-61`
- **Problema:** `sendTestNotification` só conta inscrições e retorna `{ sent: true }`. Nenhuma chamada ao serviço de push (web-push) é feita, e retorna 200 mesmo com `recipientCount: 0`.
- **Por que importa:** Usuário recebe "Lembrete enviado com sucesso!" sem nenhuma notificação — funcionalidade fantasma (também sem dependência `web-push` no `backend/package.json`).
- **Sugestão:** Implementar envio real (web-push + VAPID privada) ou responder 501/remover o endpoint. Se `recipientCount === 0`, retornar 409/422 com mensagem específica.
- **Confiança:** Alta

### [A-006] 🟠 Registrar medição corporal retroativa sobrescreve o peso atual do perfil
- **Categoria:** 🐛 Bugs
- **Local:** `backend/src/models/history.model.ts:113-140`
- **Problema:** `addBodyMeasurement` insere a medição (com `measuredAt` arbitrário do cliente) e faz `UPDATE users SET weight = $1` sem considerar a data. Uma medição de 6 meses atrás substitui o peso atual.
- **Por que importa:** Metas e métricas (TMB/TDEE) passam a usar peso errado; dados de evolução ficam inconsistentes sem aviso.
- **Sugestão:** Só atualizar `users.weight` quando a medição for a mais recente (`measuredAt >= (SELECT max(measured_at) ...)`); caso contrário, apenas inserir no histórico.
- **Confiança:** Alta

### [A-007] 🟡 try/catch de erro duplicado em todos os controllers (errorHandler global inútil)
- **Categoria:** 📋 Duplicação / 🏗️ Arquitetura / 🚨 Tratamento de erros
- **Local:** `backend/src/controllers/user.controller.ts:11-268`; `food.controller.ts:11-106`; `meal.controller.ts:10-96`; `saved_meal.controller.ts:10-48`; `push.controller.ts:19-68`
- **Problema:** O mesmo bloco de 14 linhas (`catch` → cast `CustomError` → statusCode → message → json) é repetido ~17 vezes. O `errorHandler` global de `app.ts:77` nunca recebe esses erros, portanto não há log centralizado nem stack trace.
- **Por que importa:** ~250 linhas duplicadas; qualquer mudança de contrato de erro exige editar 17 lugares; erros 500 de services são logados apenas como mensagem, sem requestId.
- **Sugestão:** Criar `asyncHandler(fn)` que faz `Promise.resolve(fn(req,res)).catch(next)` e usar `next(err)`; manter a formatação no `errorHandler` (com `requestId` e `stack` quando não produção).
- **Confiança:** Alta

### [A-008] 🟡 `JWT_EXPIRES_IN` é validado/documentado mas ignorado (7d hardcoded)
- **Categoria:** ⚙️ Config / 💀 Código morto
- **Local:** `backend/src/services/user.service.ts:282-284`; `backend/src/config/env.ts:21`; `backend/.env.example:13`
- **Problema:** `generateToken` usa `expiresIn: '7d'` fixo; a variável de ambiente é lida mas nunca usada.
- **Por que importa:** Operador acha que pode reduzir a validade do token e não consegue; configuração enganosa.
- **Sugestão:** `jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] })` ou remover a env.
- **Confiança:** Alta

### [A-009] 🟡 Tokens JWT não podem ser revogados (troca de senha/exclusão não invalida sessões)
- **Categoria:** 🔒 Segurança
- **Local:** `backend/src/middlewares/auth.ts:18-23`; `backend/src/services/user.service.ts:282-284`
- **Problema:** JWT stateless de 7 dias sem `jti`/versão de token. Trocar a senha não invalida tokens antigos; após `DELETE /me`, um token ainda válido continua autenticando até expirar (o middleware não verifica se o usuário existe).
- **Por que importa:** Em caso de token vazado, o usuário não tem como "deslogar de todos os dispositivos"; conta excluída mantém credencial tecnicamente aceita.
- **Sugestão:** Campo `token_version`/`password_changed_at` no usuário e checagem no middleware; ou refresh tokens com rotação e blacklist.
- **Confiança:** Média

### [A-010] 🟡 Payload do JWT é confiado sem validação de forma
- **Categoria:** 🏷️ Tipagem / 🔒 Segurança
- **Local:** `backend/src/middlewares/auth.ts:20-22`
- **Problema:** `jwt.verify(...) as { userId: string }` não valida que `userId` existe, é string e é UUID. Token assinado com o mesmo segredo mas payload diferente (ex.: `{}`) faz `req.userId === undefined`, e vários controllers usam `req.userId!`, enviando `undefined` ao SQL.
- **Por que importa:** Falhas imprevisíveis (500/404) em vez de 401; esconde erros de emissão de token.
- **Sugestão:** Validar com Zod (`z.object({ userId: z.string().uuid() })`) e retornar 401 se inválido.
- **Confiança:** Alta

### [A-011] 🟠 Regex de data aceita datas impossíveis → 500 no Postgres
- **Categoria:** 🐛 Bugs / 🌐 API e dados
- **Local:** `shared/src/schemas/common.schema.ts:7-14`; uso em `backend/src/models/meal.model.ts:324-325,343`
- **Problema:** `/^\d{4}-\d{2}-\d{2}$/` aceita `2026-13-45`, `2026-02-31`. Em `getPeriodStats`, `$3::date` recebe valor inválido e o Postgres lança `date/time field value out of range` → 500. Em `getTodayMeals`, `Date.UTC(2026, 12, 45)` faz rollover silencioso para outra data.
- **Por que importa:** Entrada do usuário/URL causa erro 500 (não 400) e consultas em datas inesperadas.
- **Sugestão:** `z.coerce.date()`/`.refine(isRealDate)` ou regex + `new Date()` válido e comparação com o round-trip; manter `YYYY-MM-DD` como string via `z.string().date()` (Zod 3.23+).
- **Confiança:** Alta

### [A-012] 🟡 `birthDate` e `measured_at` aceitam qualquer string
- **Categoria:** 🌐 API e dados / 🐛 Bugs
- **Local:** `shared/src/schemas/user.schema.ts:30,53,63,82`; `backend/src/services/user.service.ts:420`
- **Problema:** `z.string().min(10)` aceita `abcdefghij`; `measured_at: z.string().optional()` aceita qualquer coisa. `new Date('lixo')` → `Invalid Date` → erro 22007 no Postgres (500). Não há limite de idade nem de data futura.
- **Por que importa:** 500 em vez de 400 e possibilidade de registrar medições no futuro.
- **Sugestão:** `z.string().date()` + `refine(data <= hoje)`/idade mínima; para `measured_at`, `z.string().datetime()` ou `.date()`.
- **Confiança:** Alta

### [A-013] 🟡 Criação de combo salvo faz N inserts e depois refaz a listagem inteira
- **Categoria:** ⚡ Performance / 📖 Legibilidade
- **Local:** `backend/src/models/saved_meal.model.ts:150-162`
- **Problema:** O comentário diz "Batch insert items", mas há um `await` por item dentro do loop. Após o commit, `listByUser(userId)` carrega **todos** os combos do usuário com todos os itens para retornar um único registro, e usa `!` no `find`.
- **Por que importa:** Com 50 itens são 50 round-trips; com muitos combos a resposta fica O(n) desnecessariamente. O `!` pode estourar se a linha desaparecer.
- **Sugestão:** Reutilizar `insertMealItemsBatch`-style multi-row e montar o retorno a partir dos `RETURNING`, sem re-listar.
- **Confiança:** Alta

### [A-014] 🟡 Código de busca/listagem de alimentos duplicado quatro vezes
- **Categoria:** 📋 Duplicação
- **Local:** `backend/src/models/food.model.ts:18-64,65-105,51-63,91-103,136-148,160-172`
- **Problema:** O bloco `rows.map(r => ({...}))` é repetido em 4 funções; o cálculo de `total`/fallback de contagem é repetido 2 vezes.
- **Por que importa:** Um novo campo em `Food` exige 4 edições; divergências de conversão (`Number` em uns, não em outros) já existem.
- **Sugestão:** `mapFoodRow(row)` e `mapFoodRows(rows)` únicos + helper de contagem.
- **Confiança:** Alta

### [A-015] 🟡 Alimentos de outros usuários/inativos podem ser usados em refeições
- **Categoria:** 🔒 Segurança (autorização) / 🌐 API
- **Local:** `backend/src/models/food.model.ts:108-117`; `backend/src/services/meal.service.ts:19-21`
- **Problema:** `findByIds`/`findById` não filtram `active = true AND (user_id IS NULL OR user_id = <caller>)`. Se um usuário conhecer o UUID de um alimento personalizado de outro, pode registrar refeição com ele (e `addFavorite` também o aceita).
- **Por que importa:** Vazamento de dados entre contas (nome/macros de alimento privado) e uso de itens desativados.
- **Sugestão:** Receber `userId` e aplicar o mesmo filtro de `searchFoods`; validar em `food.service.addFavorite`.
- **Confiança:** Média

### [A-016] 🟡 Parser global de NUMERIC para `parseFloat` perde precisão
- **Categoria:** 🏷️ Tipagem / 🐛 Bugs
- **Local:** `backend/src/database/pool.ts:7`
- **Problema:** `pg.types.setTypeParser(1700, parseFloat)` converte **todo** NUMERIC (inclusive futuros valores monetários) para float binário, perdendo exatidão decimal.
- **Por que importa:** Somatórios de macros podem apresentar `0.30000000000000004`; qualquer valor financeiro futuro ficaria incorreto.
- **Sugestão:** Manter NUMERIC como string e converter explicitamente só nos campos nutricionais (como já é feito em vários mappers), ou usar `numeric`→string no driver e `Number()` na borda.
- **Confiança:** Média

### [A-017] 🟡 Sem handler 404 e erros de JSON expõem mensagem interna
- **Categoria:** 🌐 API e dados / 🚨 Tratamento de erros
- **Local:** `backend/src/app.ts:49-77`; `backend/src/middlewares/errorHandler.ts:16-17`
- **Problema:** Não existe middleware 404 (rota inexistente cai no handler de erro do Express com HTML). `express.json` gera erro com `status=400` e `message` técnica (`Unexpected token ... in JSON at position ...`), que o `errorHandler` devolve ao cliente porque só mascara 500.
- **Por que importa:** Contrato `{success:false}` quebrado em 404; mensagens internas expostas.
- **Sugestão:** Adicionar `app.use((req,res)=>res.status(404).json({success:false,message:'Rota não encontrada.'}))` antes do `errorHandler` e mapear erros de `body-parser` para mensagem genérica.
- **Confiança:** Alta

### [A-018] 🟡 `errorHandler` não registra stack nem requestId
- **Categoria:** 🚨 Tratamento de erros
- **Local:** `backend/src/middlewares/errorHandler.ts:19-21`
- **Problema:** Loga apenas `err.message`. O `requestId` gerado em `requestLogger` não é anexado à requisição nem ao log de erro; `err.stack` é descartado.
- **Por que importa:** Impossível correlacionar um 500 com a requisição HTTP registrada; depuração em produção fica cega.
- **Sugestão:** Guardar `(req as any).requestId` no middleware e logar `requestId`, `method`, `url`, `stack`.
- **Confiança:** Alta

### [A-019] 🔵 `getActiveGoal` inventa meta com `id: 'fallback'` fora do contrato UUID
- **Categoria:** 🏷️ Tipagem / 🌐 API e dados
- **Local:** `backend/src/services/user.service.ts:350-370`
- **Problema:** Quando não existe `user_goals`, retorna objeto com `id: 'fallback'`, `carbs: 0`, `fats: 0`, embora o tipo `UserGoal` prometa UUID e números reais.
- **Por que importa:** Frontend pode usar `id` como chave/rota; macros zerados distorcem cálculos e gráficos.
- **Sugestão:** Retornar `null` com 204/200 `data:null`, ou criar a meta real no onboarding; se manter fallback, tipar como `Goal | FallbackGoal` explícito.
- **Confiança:** Alta

### [A-020] 🔵 Multiplicadores de atividade tipados como `Record<string, number>`
- **Categoria:** 🏷️ Tipagem
- **Local:** `backend/src/services/nutrition.service.ts:22-28,90`
- **Problema:** `ACTIVITY_MULTIPLIERS[profile.activity_level] || 1.2` nunca dá erro de compilação para valores inválidos; qualquer typo cai silenciosamente em sedentário.
- **Por que importa:** Cálculo calórico errado sem aviso.
- **Sugestão:** `Record<UserProfile['activity_level'], number>` e remover o fallback (ou usar `?? 1.2` com validação Zod garantindo o enum).
- **Confiança:** Alta

### [A-021] 🔵 `body_fat || null` converte 0 em `null`
- **Categoria:** 🐛 Bugs (borda)
- **Local:** `backend/src/services/user.service.ts:143`; também `shared/src/nutrition/nutrients.ts:67,72,76`; `backend/src/models/saved_meal.model.ts:71,79,91,94`
- **Problema:** Uso de truthiness em valores numéricos opcionais. `display_amount = 0` vira `null`; `unit_weight`/`serving_weight = 0` são tratados como ausentes.
- **Por que importa:** Dados válidos são silenciosamente descartados; no caso de `serving_weight` 0 o fallback para 100 mascara dado corrompido.
- **Sugestão:** Trocar por `??`/`!== null && !== undefined`.
- **Confiança:** Alta

### [A-022] 🔵 `req.userId!` repetido em controllers e services
- **Categoria:** 🏷️ Tipagem
- **Local:** `backend/src/controllers/food.controller.ts:38,56,69,82,96`; `meal.controller.ts:12,25,40,54,68,84`; `saved_meal.controller.ts:12,25,38`; `push.controller.ts:21,38,55`
- **Problema:** Non-null assertion em ~17 pontos, confiando no middleware `authenticate`. O tipo `AuthenticatedRequest.userId` é opcional.
- **Por que importa:** Se a rota perder o `authenticate` num refactor, o erro é runtime (SQL com `undefined`) e não de compilação.
- **Sugestão:** Middleware que estreita o tipo (`req.userId` obrigatório) ou helper `requireUserId(req)` que lança 401.
- **Confiança:** Alta

### [A-023] 🔵 Item em `un` sem `unit_weight` é contado como gramas silenciosamente
- **Categoria:** 🐛 Bugs / 🌐 API
- **Local:** `shared/src/nutrition/nutrients.ts:71-78`
- **Problema:** Se `unit === 'un'` e `food.unit_weight` for nulo, o código cai no `else` e usa `quantity` como gramas. O item "2 unidades" de um alimento sem peso unitário vira "2 g" (ou 2 ml).
- **Por que importa:** Valores nutricionais absurdamente baixos sem qualquer aviso ao usuário.
- **Sugestão:** Rejeitar com erro de validação ("alimento não possui peso por unidade") ou exigir `unit_weight` no cadastro quando `unit_name` existir.
- **Confiança:** Alta

### [A-024] 🟡 Offset `-03:00` hardcoded em três pontos de data
- **Categoria:** 🐛 Bugs (datas/fuso)
- **Local:** `backend/src/utils/date.ts:32-34`; `backend/src/services/meal.service.ts:49-50`
- **Problema:** A conversão "data + hora de São Paulo" é feita por concatenação `${date}T${time}-03:00`. O Brasil não tem mais DST, mas o código assume offset fixo e ignora a regra histórica/futura e o fuso do processo.
- **Por que importa:** Datas de refeições copiadas/registradas podem deslocar 1h se a política de fuso mudar; testes ficam dependentes do ambiente.
- **Sugestão:** Usar `Temporal.ZonedDateTime` (ou `date-fns-tz`/`luxon`) com `America/Sao_Paulo`; centralizar em `utils/date.ts`.
- **Confiança:** Média

### [A-025] 🟡 `findMealById` e `copyMeal` fazem a mesma consulta duas vezes
- **Categoria:** ⚡ Performance
- **Local:** `backend/src/services/meal.service.ts:176-186`; `backend/src/models/meal.model.ts:178-202`
- **Problema:** `copyMealOrDay` já buscou a refeição com `findMealById`; `MealModel.copyMeal` busca de novo (com hidratação de itens) antes de copiar.
- **Por que importa:** 2 consultas extras por cópia (uma delas com `JOIN` de itens) — desnecessário.
- **Sugestão:** Passar o `sourceMeal` já carregado para `copyMeal` (ou remover a checagem duplicada no service).
- **Confiança:** Alta

### [A-026] 🟡 `total_calories`/`total_proteins` só existem para dois macros
- **Categoria:** 🎯 Consistência / 🌐 API
- **Local:** `backend/src/models/meal.model.ts:118-129`; `shared/src/types/meal.types.ts:30-33`
- **Problema:** `hydrateMealsWithItems` calcula apenas calorias e proteínas; carboidratos e gorduras não têm total, embora os itens tenham. O frontend precisa recalcular no cliente.
- **Por que importa:** Contrato parcial gera lógica duplicada no front (que pode divergir no arredondamento).
- **Sugestão:** Calcular os 4 totais no backend e tipar `total_carbs`/`total_fats` (ou remover totais e expor `totals: NutrientValues`).
- **Confiança:** Alta

### [A-027] 🟡 Combos salvos recalculam macros com os dados atuais do alimento
- **Categoria:** 🐛 Bugs (dados históricos)
- **Local:** `backend/src/models/saved_meal.model.ts:74-99`
- **Problema:** `saved_meal_items` guarda só `food_id/quantity`, e a listagem recalcula com `calculateItemNutrients` usando a versão atual do alimento. Se o alimento for editado/desativado, o combo muda (ou quebra se desativado).
- **Por que importa:** O "combo salvo" pode representar valores diferentes dos que o usuário salvou; não há snapshot.
- **Sugestão:** Persistir calorias/macros no momento da criação (como `meal_items` faz) e/ou versionar alimentos.
- **Confiança:** Média

### [A-028] 🔵 `listFoodsSchema` exportado e nunca usado
- **Categoria:** 💀 Código morto
- **Local:** `shared/src/schemas/food.schema.ts:11`
- **Problema:** `export const listFoodsSchema = z.object({});` não aparece em nenhum import (verificado por busca).
- **Por que importa:** Código morto no pacote compartilhado.
- **Sugestão:** Remover.
- **Confiança:** Alta

### [A-029] 🔵 `getById`/`getFavoriteIds` em `food.service` parecem ter uso apenas interno
- **Categoria:** 💀 Código morto (a confirmar na Fase 3)
- **Local:** `backend/src/services/food.service.ts:19-27,48-50`
- **Problema:** `getById` é usado só por `addFavorite`; `getFavoriteIds` não aparece em rotas/controllers.
- **Por que importa:** Export sem consumidor incentiva duplicação futura.
- **Sugestão:** Tornar privado/remover `getFavoriteIds` se a Fase 3 confirmar.
- **Confiança:** Média

### [A-030] 🟡 Fallback de chave VAPID pública fictícia hardcoded
- **Categoria:** 🔒 Segurança / ⚙️ Config
- **Local:** `backend/src/services/push.service.ts:4-8`
- **Problema:** Se `VAPID_PUBLIC_KEY` não estiver definida, é devolvida uma chave de exemplo (`BEl62iUY...`), que não corresponde a nenhuma chave privada do servidor. Além disso, a env não está em `.env.example` nem no schema de `config/env`.
- **Por que importa:** O frontend assina com chave inválida, o registro "funciona" e nenhuma notificação jamais será entregue.
- **Sugestão:** Validar `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` no `env.ts` (obrigatórias em produção) e falhar explicitamente quando ausentes.
- **Confiança:** Alta

### [A-031] 🔵 `structuredLog` usa `console.log` até para `error`
- **Categoria:** ⚙️ Config / 📖 Legibilidade
- **Local:** `backend/src/config/logger.ts:18-27`
- **Problema:** Todos os níveis vão para stdout; coletores normalmente separam stderr para erros. Não há níveis `debug`, nem supressão em testes.
- **Por que importa:** Alertas de produção dependem de stdout; logs de teste poluem a saída.
- **Sugestão:** `console.error` para `error`, `console.warn` para `warn`, e silenciar em `NODE_ENV=test`.
- **Confiança:** Média

### [A-032] 🔵 `validate` muta `req.query`/`req.params` com dados do Zod
- **Categoria:** 🏷️ Tipagem / 🏗️ Arquitetura
- **Local:** `backend/src/middlewares/validate.ts:35,46,57`
- **Problema:** Atribui `req.params = result.data as Record<string, string>` e `req.query = result.data`. Em Express 5 `req.query` é getter; além disso, o cast esconde que o schema pode retornar números (ex.: `page`/`limit` coergidos).
- **Por que importa:** Migração para Express 5 quebra; tipos mentem (controllers fazem cast manual depois).
- **Sugestão:** Guardar em `res.locals.validated`/`req.validated` tipado e usar nos controllers.
- **Confiança:** Média

### [A-033] 🟠 Exportação LGPD carrega todo o histórico em memória
- **Categoria:** ⚡ Performance / 🌐 API
- **Local:** `backend/src/services/user.service.ts:385-407`; `backend/src/models/meal.model.ts:146-156`
- **Problema:** `exportUserData` busca **todas** as refeições + todos os itens (com JOIN) e monta um único JSON na memória, sem paginação/streaming.
- **Por que importa:** Usuário com anos de registros pode gerar dezenas de MB, estourando memória/timeout (statement_timeout 10s) e derrubando a resposta.
- **Sugestão:** Streaming JSON (`res.write`) ou exportação assíncrona com arquivo; limitar janela/period.
- **Confiança:** Média

### [A-034] 🟡 Listagens sem paginação (combos, medições, favoritos, recentes)
- **Categoria:** ⚡ Performance / 🌐 API
- **Local:** `backend/src/models/saved_meal.model.ts:5-18`; `history.model.ts:93-110`; `food.model.ts:119-173`
- **Problema:** `GET /saved-meals`, `/me/measurements`, `/foods/favorites` retornam tudo. Só `/foods` tem `page/limit`.
- **Por que importa:** Crescimento linear do payload; mobile sofre.
- **Sugestão:** Adicionar `limit/offset` (ou cursor) com defaults e testes de contrato.
- **Confiança:** Alta

### [A-035] 🟡 `updateProfile` altera peso/objetivo sem recalcular metas
- **Categoria:** 🐛 Bugs (regra de negócio)
- **Local:** `backend/src/services/user.service.ts:158-256`
- **Problema:** Ao mudar `weight`, `height`, `body_fat`, `goal` ou `activity_level`, as metas (`daily_calories_goal`/`user_goals`) permanecem as antigas. O onboarding calcula; a edição de perfil não.
- **Por que importa:** Dashboard mostra meta incoerente com o perfil; usuário precisa salvar metas manualmente.
- **Sugestão:** Recalcular (modo `auto`) e inserir novo `user_goal` quando campos antropométricos mudarem, ou documentar que é intencional.
- **Confiança:** Média

### [A-036] 🟡 Rate limit de auth é aplicado também ao cadastro e a chave inclui e-mail arbitrário
- **Categoria:** 🔒 Segurança
- **Local:** `backend/src/routes/user.routes.ts:21-37`
- **Problema:** `keyGenerator` = `ip:email`. Um atacante varia o e-mail para obter 10 tentativas por e-mail por IP (bypass do limite global por IP); `/register` também consome o mesmo balde, permitindo bloquear o cadastro de um e-mail específico (DoS direcionado).
- **Por que importa:** Mitigação de brute force enfraquecida e possibilidade de lockout de vítima.
- **Sugestão:** Limite duplo (por IP e por conta) com `rateLimit` separados; não incluir e-mail no balde de registro.
- **Confiança:** Média

### [A-037] 🔵 `addFavoriteFood`/`removeFavorite` sempre retornam `true`
- **Categoria:** 🚨 Tratamento de erros / 🌐 API
- **Local:** `backend/src/services/food.service.ts:37-46`; `backend/src/models/food.model.ts:175-191`
- **Problema:** `removeFavorite` responde 200 "removido" mesmo quando o favorito não existia; `addFavoriteFood` ignora `ON CONFLICT DO NOTHING` e sempre `true`.
- **Por que importa:** Cliente não distingue sucesso real de no-op; impossível detectar bug de sincronização.
- **Sugestão:** Usar `rowCount` e responder 404/409 conforme o caso.
- **Confiança:** Alta

### [A-038] 🔵 Mensagens e contratos misturam inglês/português e snake_case/camelCase
- **Categoria:** 🎯 Consistência
- **Local:** `shared/src/schemas/meal.schema.ts:5` (`mealTime`) vs `shared/src/types/meal.types.ts:27` (`meal_time`); `createMeasurementSchema` (`measured_at`) vs `createCustomFoodSchema` (`base_unit`)
- **Problema:** DTOs de entrada usam camelCase em alguns campos e snake_case em outros; o banco e as respostas usam snake_case.
- **Por que importa:** Cada nova rota exige mapeamento mental; erros de contrato (ex.: enviar `meal_time` e receber 400).
- **Sugestão:** Padronizar DTOs de entrada em camelCase com mapeamento explícito, ou tudo snake_case — documentar em `docs/ARCHITECTURE.md`.
- **Confiança:** Alta

### [A-039] 🔵 `getTodayMeals` aceita `dateStr` com hora e faz parsing manual
- **Categoria:** 📖 Legibilidade / 🐛 Bugs
- **Local:** `backend/src/services/meal.service.ts:37-53`
- **Problema:** Regex `/^\d{4}-\d{2}-\d{2}/` (sem `$`) aceita `2026-10-21lixo` e o split `'T'` é frágil. A validação Zod já garante o formato, então há dupla validação divergente.
- **Por que importa:** Lógica duplicada e potencialmente inconsistente com o schema.
- **Sugestão:** Confiar no schema validado e centralizar normalização em `utils/date.ts`.
- **Confiança:** Média

### [A-040] 🔵 Health check sem timeout próprio e sempre público
- **Categoria:** ⚡ Performance / 🔒 Segurança
- **Local:** `backend/src/app.ts:57-74`
- **Problema:** `SELECT 1` herda `statement_timeout` de 10s; um banco lento deixa o probe pendurado. O endpoint expõe nome do serviço e estado do banco sem autenticação.
- **Por que importa:** Orquestradores podem considerar o pod saudável por até 10s; informação de infraestrutura exposta.
- **Sugestão:** Timeout curto dedicado (1–2s) e resposta mínima `{status:'ok'}`; detalhes só em rota interna.
- **Confiança:** Média

### [A-041] 🔵 `DELETE FROM users` sem transação explícita para dados relacionados
- **Categoria:** 🗄️ Dados / 🏗️ Arquitetura
- **Local:** `backend/src/models/user.model.ts:152-155`; FKs com `ON DELETE CASCADE` nas migrations
- **Problema:** A exclusão depende inteiramente de `ON DELETE CASCADE`; `user_goals`/`body_measurements`/`meals`/`saved_meals`/`push_subscriptions` caem em cascata. Não há confirmação de que todos os dados pessoais são apagados (ex.: logs, backups).
- **Por que importa:** LGPD: exclusão precisa ser demonstrável; cascade silencioso dificulta auditoria.
- **Sugestão:** Excluir em transação com `DELETE` explícito por tabela e registrar evento de exclusão (sem PII).
- **Confiança:** Baixa

### [A-042] 🔵 `structuredLog('server_started')` loga `uvThreadpoolSize` possivelmente `NaN`
- **Categoria:** 🏷️ Tipagem / 🧹 Resíduos
- **Local:** `backend/src/server.ts:14`
- **Problema:** `Number(process.env.UV_THREADPOOL_SIZE)` pode ser `NaN` se a env estiver com valor inválido, embora `config/threadpool` exporte o valor já saneado.
- **Por que importa:** Log enganoso; valor correto já está disponível.
- **Sugestão:** Importar `UV_THREADPOOL_SIZE` do módulo de threadpool.
- **Confiança:** Alta

### [A-043] 🔵 `previewGoals` faz cast de `birth_date` para string sem checar nulo
- **Categoria:** 🏷️ Tipagem
- **Local:** `backend/src/services/user.service.ts:294-302`
- **Problema:** `data.birthDate ?? (user.birth_date as string) ?? ''` — se `birth_date` for `null`, cai em `''`; `calculateAge('')` produz `NaN` e a TMB vira `NaN` (JSON serializa como `null`).
- **Por que importa:** Usuário sem data de nascimento recebe metas inválidas em vez de erro claro.
- **Sugestão:** Validar campos obrigatórios e responder 422 ("complete seu perfil").
- **Confiança:** Alta

### [A-044] 🔵 Seed de alimentos usa `ON CONFLICT DO NOTHING` sem alvo
- **Categoria:** 🌐 API e dados
- **Local:** `backend/migrations/1790883891276_seed-foods.js:13-24`
- **Problema:** `ON CONFLICT DO NOTHING` sem coluna engole qualquer conflito (inclusive de outra constraint), mascarando erros de seed.
- **Por que importa:** Dados podem faltar silenciosamente em ambientes novos.
- **Sugestão:** Especificar alvo (`ON CONFLICT (f_unaccent...)`) ou usar `WHERE NOT EXISTS`.
- **Confiança:** Média

### [A-045] 🔵 `updateUser` converte `dd/mm/aaaa` sem validar e mistura formatos
- **Categoria:** 🐛 Bugs / 🎯 Consistência
- **Local:** `backend/src/models/user.model.ts:99-107`
- **Problema:** Se a string contém `/`, assume `dd/mm/yyyy` e monta `yyyy-mm-dd` sem checar partes; o schema aceita qualquer string de 10+ chars.
- **Por que importa:** Datas inválidas chegam ao Postgres e viram 500; formatos diferentes circulam no sistema.
- **Sugestão:** Aceitar apenas ISO `YYYY-MM-DD` no schema e remover a conversão.
- **Confiança:** Alta

### [A-046] 🔵 Falta script `test:frontend` coerente / aliases duplicados nos scripts raiz
- **Categoria:** ⚙️ Config
- **Local:** `package.json:6-19`
- **Problema:** `test:backend:file` e `test:file` apontam para o mesmo comando; `test:frontend` e `test:frontend:file` também são idênticos (`run-tests.mjs frontend`), sem distinção de arquivo único. O `AGENTS.md` descreve `npm run test:frontend:file <caminho>` como execução de um único arquivo.
- **Por que importa:** Comando documentado pode rodar a suíte inteira (lento) em vez do arquivo; ambiguidade operacional.
- **Sugestão:** Unificar aliases e repassar `process.argv` ao runner; atualizar AGENTS.md.
- **Confiança:** Média

### [A-047] 🟡 `overrides` de dependências no root sem justificativa e sem lockfile sincronizado?
- **Categoria:** ⚙️ Config / 🔒 Segurança
- **Local:** `package.json:25-29`
- **Problema:** `zod: ^3.25.76` é forçado no root enquanto backend declara `^3.24.2` e shared `^3.24.2`; `shell-quote`/`brace-expansion` sobrescritos sem nota. Overrides de zod podem divergir do lockfile de subpacotes.
- **Por que importa:** Resoluções diferentes entre ambientes; risco de duas versões de Zod (tipos incompatíveis).
- **Sugestão:** Alinhar a versão de zod nos três `package.json` e documentar overrides (motivo/CVE).
- **Confiança:** Média

### [A-048] 🔵 `cross-env` e `tsx` em `devDependencies`, mas `start`/`dev` dependem deles
- **Categoria:** ⚙️ Config
- **Local:** `backend/package.json:15-24,36-47`
- **Problema:** `npm start` (produção) executa `cross-env ... tsx src/server.ts` com ferramentas de desenvolvimento. Não há build compilado (`build` = `tsc --noEmit`).
- **Por que importa:** Deploy em produção depende de devDependencies e transpila TS em runtime (startup lento, maior superfície).
- **Sugestão:** `tsc` para `dist/` e `node dist/server.js` em produção; mover `tsx`/`cross-env` conforme o caso (ou usar `NODE_OPTIONS`/`TZ` do ambiente).
- **Confiança:** Alta

### [A-049] 🔵 `@types/express` v5 com Express 4
- **Categoria:** ⚙️ Config / 🏷️ Tipagem
- **Local:** `backend/package.json:39` (`@types/express: ^5.0.0`) vs `express: ^4.21.2:29`
- **Problema:** Tipos da v5 para runtime v4. O `@types/express-rate-limit` v5 também não corresponde ao express-rate-limit 8 (que já traz tipos próprios).
- **Por que importa:** Tipos podem divergir do comportamento real (especialmente `req.query`/`RequestHandler`).
- **Sugestão:** `@types/express@^4.17`, remover `@types/express-rate-limit`.
- **Confiança:** Alta

### [A-050] 🔵 `react-router` v7 como dependência direta (sem `react-router-dom`)
- **Categoria:** ⚙️ Config / 🎯 Consistência
- **Local:** `frontend/package.json:22`
- **Problema:** O projeto usa `react-router` 7 (novo pacote unificado) — correto na v7 —, mas o padrão mais comum/documentado para web é `react-router-dom`/`react-router` híbridos; verificar se todo o time sabe. Não é bug, apenas risco de confusão.
- **Por que importa:** Tutoriais e LLMs frequentemente geram imports divergentes.
- **Sugestão:** Documentar a escolha no README/ARCHITECTURE.
- **Confiança:** Baixa

### [A-051] 🔵 Pacote `shared` sem `build`/`typecheck` e sem script de teste
- **Categoria:** ⚙️ Config / 🧪 Testes
- **Local:** `shared/package.json:1-14`; `shared/tsconfig.json`
- **Problema:** O pacote compartilhado não tem scripts (`build`, `typecheck`, `test`) nem é referenciado por workspaces; é consumido por caminho relativo via `paths`. Erros de tipo no shared só aparecem ao rodar o build de quem importa.
- **Por que importa:** Feedback tardio; impossível validar o pacote isoladamente.
- **Sugestão:** Adicionar `"scripts": {"typecheck": "tsc --noEmit"}` e incluir no `lint`/CI.
- **Confiança:** Média

### [A-052] 🔵 ESLint sem regras de acessibilidade e sem `no-floating-promises`
- **Categoria:** ⚙️ Config / ♿ Acessibilidade
- **Local:** `eslint.config.js:10-23`
- **Problema:** Só `js.configs.recommended`, `tseslint.recommended` (não `recommended-type-checked`), hooks e refresh. Não há `eslint-plugin-jsx-a11y` nem regras type-aware (promises flutuantes, `any` implícito).
- **Por que importa:** Problemas de a11y e promises não tratadas passam no lint.
- **Sugestão:** Adicionar `jsx-a11y` e `tseslint.configs.recommendedTypeChecked` com `parserOptions.projectService`.
- **Confiança:** Alta

### [A-053] 🟡 `.env.example` não cobre variáveis usadas (VAPID, UV_THREADPOOL_SIZE, DB_SSL_CA)
- **Categoria:** ⚙️ Config / 🔒 Segurança
- **Local:** `backend/.env.example:1-20`; `backend/src/config/env.ts:23`; `backend/src/services/push.service.ts:7`; `backend/src/config/threadpool.ts:8`
- **Problema:** `DB_SSL_CA` está no schema mas não no exemplo; `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` e `UV_THREADPOOL_SIZE` são lidas em runtime e não documentadas. `docker-compose.yml` usa `env_file: ./backend/.env` (ignorado pelo Git), então um clone novo não sobe o compose.
- **Por que importa:** Onboarding quebrado e configuração de produção incompleta (push silenciosamente inativo).
- **Sugestão:** Documentar todas as envs no `.env.example`, com comentários; criar `.env.docker.example` ou usar `env_file` opcional.
- **Confiança:** Alta

### [A-054] 🔵 CORS aceita origem única e `credentials: true` — validar produção
- **Categoria:** 🔒 Segurança
- **Local:** `backend/src/app.ts:41-44`; `backend/src/config/env.ts:22`
- **Problema:** `CORS_ORIGIN` default `http://localhost:5173` em produção se a env faltar (não há validação por `NODE_ENV`). Não há suporte a múltiplas origens (ex.: www + apex).
- **Por que importa:** Deploy sem env quebra o front; se alguém setar `*`, `credentials: true` fica inválido.
- **Sugestão:** Exigir `CORS_ORIGIN` quando `NODE_ENV=production` e aceitar lista separada por vírgula.
- **Confiança:** Média

### [A-055] 🟡 Shutdown gracioso não força timeout nem trata conexões pendentes
- **Categoria:** 🧠 Recursos / 🚨 Tratamento de erros
- **Local:** `backend/src/server.ts:18-34`
- **Problema:** `server.close` espera indefinidamente conexões keep-alive; não há `server.closeAllConnections()`/timeout. O callback só roda quando todas fecham, e `process.exit(0)` nunca é alcançado se um cliente ficar pendurado. Sinais repetidos disparam múltiplos shutdowns.
- **Por que importa:** Deploy/restart trava até o SIGKILL do orquestrador.
- **Sugestão:** Timeout (ex.: 10s) + `closeAllConnections`, guardar flag `isShuttingDown`.
- **Confiança:** Alta

### [A-056] 🔵 `PORT` validado como string livre e `TRUST_PROXY` sem coerção numérica
- **Categoria:** ⚙️ Config
- **Local:** `backend/src/config/env.ts:13,16,25-30`
- **Problema:** `PORT: z.string().default('3001')` aceita `abc` (falha só no `listen`); `DB_PORT` é validado por regex/refine corretamente, mas `PORT` não.
- **Por que importa:** Erro tardio e confuso.
- **Sugestão:** `z.coerce.number().int().min(1).max(65535).default(3001)`.
- **Confiança:** Alta

### [A-057] 🔵 `allowExitOnIdle` só em teste e `NODE_ENV` lido direto de `process.env`
- **Categoria:** ⚙️ Config / 🎯 Consistência
- **Local:** `backend/src/database/pool.ts:11,19,38`
- **Problema:** O módulo usa `process.env.NODE_ENV` em vez de `env.NODE_ENV` já validado; a checagem de banco `_test` também ignora `env`. Se `NODE_ENV` inválido, `env.ts` já aborta, mas a inconsistência dificulta testes.
- **Por que importa:** Duas fontes de verdade para ambiente.
- **Sugestão:** Usar `env.NODE_ENV` em todo o backend.
- **Confiança:** Alta

### [A-058] 🔵 `requestLogger` confia em `x-request-id` arbitrário do cliente
- **Categoria:** 🔒 Segurança / 📖 Legibilidade
- **Local:** `backend/src/middlewares/requestLogger.ts:11-15`
- **Problema:** O header recebido é reaproveitado sem validação de tamanho/formato. Um cliente pode injetar IDs enormes ou com quebras de linha (log injection) e poluir/corromper logs JSON.
- **Por que importa:** Log forging e payloads grandes em toda linha de log.
- **Sugestão:** Validar `/^[A-Za-z0-9-]{8,64}$/` e gerar UUID caso contrário.
- **Confiança:** Média

### [A-059] 🟡 Rate limit de auth não é aplicado a `/me` (troca de senha, exclusão)
- **Categoria:** 🔒 Segurança
- **Local:** `backend/src/routes/user.routes.ts:36-49`
- **Problema:** `PUT /me` (com `currentPassword`) e `DELETE /me` (com senha) não têm limite de tentativas. Um token roubado permite brute force da senha atual sem throttling.
- **Por que importa:** A senha é a última barreira para trocar e-mail/senha e excluir a conta.
- **Sugestão:** Aplicar limiter específico por usuário nas rotas sensíveis e/ou bloquear após N falhas.
- **Confiança:** Média

### [A-060] 🔵 `generateToken` não inclui `iss`/`aud` e `verify` não restringe algoritmos
- **Categoria:** 🔒 Segurança
- **Local:** `backend/src/services/user.service.ts:282-284`; `backend/src/middlewares/auth.ts:20`
- **Problema:** Não há `issuer`/`audience` nem `algorithms: ['HS256']` explícito na verificação.
- **Por que importa:** Dificulta rotação de segredo/validação cruzada; dependência de default do jsonwebtoken.
- **Sugestão:** Definir `algorithms`, `issuer`, `audience` no sign/verify.
- **Confiança:** Média

### [A-061] 🔵 Fórmula de TMB ignora `prefiro_nao_responder` e usa piso único por sexo
- **Categoria:** 🐛 Bugs (regra de negócio) / 📖 Legibilidade
- **Local:** `backend/src/services/nutrition.service.ts:76-87,101-105`
- **Problema:** `prefiro_nao_responder` é tratado como feminino (`-161`) e o piso calórico também (`< masculino ? 1500 : 1200`). A decisão está só em comentário.
- **Por que importa:** Metas potencialmente inseguras/incorretas para esse grupo; regra de saúde sem documentação em `docs/SPEC.md` (verificar).
- **Sugestão:** Documentar a decisão em SPEC e considerar usar média/faixa; tornar o piso configurável.
- **Confiança:** Média

### [A-062] 🔵 `createMeal`/`updateMeal` duplicam validação de alimentos e não usam transação na validação
- **Categoria:** 📋 Duplicação / 🔀 Concorrência
- **Local:** `backend/src/services/meal.service.ts:15-35,55-75`
- **Problema:** Os dois blocos são idênticos (~20 linhas). `findByIds` seguido de insert não é atômico: se o alimento for desativado/excluído entre a checagem e o insert, a FK falha com 500.
- **Por que importa:** Manutenção duplicada; corrida gera erro genérico.
- **Sugestão:** Extrair `resolveItemsNutrients(userId, items)` e tratar `23503` como 400/409.
- **Confiança:** Média

### [A-063] 🔵 `removeFavorite` não valida existência do alimento
- **Categoria:** 🎯 Consistência
- **Local:** `backend/src/services/food.service.ts:43-46`
- **Problema:** `addFavorite` valida (`getById`), `removeFavorite` não. Remove um UUID inexistente responde 200.
- **Por que importa:** Comportamento assimétrico.
- **Sugestão:** Retornar 404 quando `rowCount === 0`.
- **Confiança:** Alta

### [A-064] 🟡 `daily_calories_goal`/`daily_proteins_goal` duplicam `user_goals` (fonte dupla de verdade)
- **Categoria:** 🏗️ Arquitetura / 🐛 Bugs
- **Local:** `backend/migrations/1790883887302_baseline.js:27-28`; `backend/src/services/user.service.ts:120-123,331-338`; `backend/src/services/user.service.ts:350-370`
- **Problema:** Metas ficam em `users.daily_*_goal` **e** em `user_goals`. Update atualiza ambas, mas o fallback de `getActiveGoal` lê a coluna legada com `carbs/fats = 0`. Qualquer escrita que esqueça uma das fontes gera divergência.
- **Por que importa:** Dashboard pode mostrar metas diferentes dependendo do caminho; macros zerados.
- **Sugestão:** Remover as colunas legadas (migração) e usar só `user_goals`; se necessário, view de compatibilidade.
- **Confiança:** Alta

### [A-065] 🔵 `gen_random_uuid()` sem extensão `pgcrypto` declarada
- **Categoria:** ⚙️ Config / 🗄️ Dados
- **Local:** `backend/migrations/1792500000000_add-diary-and-user-features.js:26,35,55`
- **Problema:** As tabelas novas usam `gen_random_uuid()` (nativo no PG13+, ok no PG16 do compose), enquanto o baseline usa `uuid_generate_v4()`. Não há declaração de `pgcrypto`; em PG<13 quebraria.
- **Por que importa:** Inconsistência de geração de UUID e requisito implícito de versão do Postgres.
- **Sugestão:** Padronizar `gen_random_uuid()` e documentar PG>=13 (ou `CREATE EXTENSION pgcrypto`).
- **Confiança:** Baixa

### [A-066] 🟠 Páginas legais prometem invalidação de sessão na troca de senha que não existe
- **Categoria:** 🔒 Segurança / 📋 Documentação
- **Local:** `frontend/src/pages/public/LegalPage.tsx:187-191` (também `:159-160`, `:196-198`)
- **Problema:** A página "Segurança" afirma que "Em caso de troca de senha, a sessão anterior é invalidada" e a Política de Privacidade promete exclusão permanente e "limite de tentativas por IP e por e-mail". O backend emite JWT stateless de 7 dias sem versão/revogação (A-009), portanto tokens antigos continuam válidos após troca de senha.
- **Por que importa:** É uma declaração formal de segurança (e potencialmente LGPD) que o sistema não cumpre; usuário acredita ter revogado sessões comprometidas.
- **Sugestão:** Implementar revogação (A-009) ou corrigir o texto para refletir o comportamento real; revisar as demais promessas da página com o time jurídico.
- **Confiança:** Alta

### [A-067] 🟡 Não é possível apagar a data de nascimento no perfil
- **Categoria:** 🐛 Bugs
- **Local:** `frontend/src/pages/private/EditProfilePage.tsx:34`
- **Problema:** O payload inclui `birthDate` apenas quando `data.birthDate` é truthy (`...(data.birthDate ? { birthDate: data.birthDate } : {})`). Se o usuário limpar o campo, nada é enviado e o valor antigo permanece no banco; o formulário parece ter salvo, mas a data continua lá.
- **Por que importa:** O usuário não consegue remover um dado pessoal opcional (direito de correção/eliminação), e o `reset` pós-sucesso mantém a data antiga na tela.
- **Sugestão:** Enviar `birthDate: null` explicitamente e aceitar `null` no schema/`updateUser` para limpar a coluna.
- **Confiança:** Alta

### [A-068] 🟡 Validação de data de nascimento do perfil aceita datas impossíveis e diverge do onboarding
- **Categoria:** 🐛 Bugs / 🎯 Consistência
- **Local:** `frontend/src/types/profile.ts:9-21`; `frontend/src/pages/private/EditProfilePage.tsx:20`; `frontend/src/components/onboarding/OnboardingFlow.tsx:11-29`
- **Problema:** `personalInfoSchema` valida apenas `month 1..12` e `year 1900..atual`; não valida o dia contra o mês (`45/02/2020` passa) nem data futura. `OnboardingFlow` tem um validador completo (`daysInMonth`, data futura, idade), então o mesmo campo tem duas regras diferentes. O valor `dd/mm/aaaa` é enviado ao backend, que faz split sem validar (A-045) → `Invalid Date` → 500.
- **Por que importa:** Entrada inválida chega ao servidor e gera erro genérico; a experiência difere entre cadastro e edição.
- **Sugestão:** Extrair um único validador (idealmente `z.string().date()`/`Temporal` no shared) e reutilizar nos dois fluxos; enviar sempre ISO `YYYY-MM-DD`.
- **Confiança:** Alta

### [A-069] 🔵 `BiometricsSection` é componente morto
- **Categoria:** 💀 Código morto
- **Local:** `frontend/src/components/profile/BiometricsSection.tsx:18-102`
- **Problema:** Busca no projeto inteiro não encontra nenhum import de `BiometricsSection`; o componente existe apenas com sua própria definição (a página de medidas usa `BodyHeightForm`).
- **Por que importa:** ~100 linhas de UI sem uso, com campos (`bodyFat`) sem tratamento de erro, induzem manutenção enganosa.
- **Sugestão:** Remover o arquivo (ou integrá-lo se a intenção era usar na edição de perfil).
- **Confiança:** Alta

### [A-070] 🔵 `editProfileSchema`/`EditProfileFormInputs` são código morto
- **Categoria:** 💀 Código morto
- **Local:** `frontend/src/types/profile.ts:31-68`
- **Problema:** `editProfileSchema` agrupa perfil + senha, mas nenhuma página o importa (edição usa `personalInfoSchema`; segurança usa `passwordSchema`). Busca não encontra consumidores.
- **Por que importa:** Schema extenso e divergente dos usados de fato; pode ser copiado por engano em futuras telas.
- **Sugestão:** Remover ou consolidar os schemas de perfil em um único ponto.
- **Confiança:** Alta

### [A-071] 🟡 Botão de "enviar lembrete de teste" fica ativo mesmo com push desabilitado
- **Categoria:** 🎯 Consistência / 🐛 Bugs
- **Local:** `frontend/src/pages/private/NotificationsPage.tsx:39-70,141-148`
- **Problema:** Os três canais estão marcados como "TEMPORARIAMENTE DESABILITADO"/"EM IMPLEMENTAÇÃO" e os checkboxes estão `disabled`, mas o botão de teste continua habilitado e exibe "LEMBRETE DE TESTE ENVIADO COM SUCESSO!" — chamando o endpoint fictício do backend (A-005).
- **Por que importa:** A tela se contradiz e confirma uma ação que não acontece, minando a confiança do usuário.
- **Sugestão:** Ocultar/desabilitar o botão enquanto o recurso não estiver implementado, ou exibir um aviso de indisponibilidade.
- **Confiança:** Alta

### [A-072] 🟡 Onboarding usa `label` sem associação com os campos
- **Categoria:** ♿ Acessibilidade
- **Local:** `frontend/src/components/onboarding/OnboardingFlow.tsx:171-180,185,234-243,249-257,263-274`
- **Problema:** Vários `<label>` não têm `htmlFor` e os inputs/selects não têm `id` (sexo, nascimento, peso, altura, gordura). Leitores de tela não anunciam o rótulo; clicar no texto não foca o campo.
- **Por que importa:** O primeiro fluxo do produto (onboarding) fica inacessível para usuários de tecnologia assistiva.
- **Sugestão:** Adicionar `id`/`htmlFor` (ou `aria-labelledby`) em todos os campos; o `DatePickerInput` já recebe `id` para o campo de data, mas o label acima não aponta para ele.
- **Confiança:** Alta

### [A-073] 🔵 `RoutinePage` mascara nível de atividade inválido como "sedentario"
- **Categoria:** 🐛 Bugs (borda) / 🏷️ Tipagem
- **Local:** `frontend/src/pages/private/RoutinePage.tsx:16`
- **Problema:** `routineSchema.shape.activityLevel.safeParse(user.activity_level).data || 'sedentario'` descarta o erro e assume sedentário quando o backend devolve um valor fora do enum. Ao salvar, o usuário pode sobrescrever silenciosamente o valor original.
- **Por que importa:** Dados válidos do servidor (ex.: novo nível adicionado) são rebaixados sem aviso; metas passam a usar multiplicador errado.
- **Sugestão:** Exibir erro/valor desconhecido em vez de coagir; alinhar o enum com o shared.
- **Confiança:** Média

### [A-074] 🟠 `JSON.parse` de `localStorage` sem proteção derruba a aplicação
- **Categoria:** 🐛 Bugs
- **Local:** `frontend/src/context/AuthContext.tsx:31-34`
- **Problema:** O estado inicial de `user` executa `JSON.parse(savedUser)` diretamente. Se `user_session` estiver corrompido (escrita interrompida, versão antiga do formato, extensão do navegador), o parse lança `SyntaxError` durante a renderização do `AuthProvider` e o app inteiro fica em tela branca, sem chance de logout.
- **Por que importa:** O único caminho de recuperação seria limpar o armazenamento manualmente; qualquer mudança de formato entre versões pode travar todos os usuários já logados.
- **Sugestão:** Envolver em `try/catch`, validar o objeto com Zod (`safeParse`) e remover as chaves inválidas antes de retornar `null`.
- **Confiança:** Alta

### [A-075] 🟡 Sessão persistida é parcial, mas tipada como `UserProfile` completo
- **Categoria:** 🏷️ Tipagem / 🐛 Bugs
- **Local:** `frontend/src/context/AuthContext.tsx:4-16,31-34,39,43-46`
- **Problema:** `sanitizeUserSession` grava apenas `id`, `name`, `email` e `onboarding_completed`, mas o estado é tipado como `UserProfile` e repassado a todo o app. Após recarregar a página, `user.daily_calories_goal`, `weight`, `goal`, `sex` etc. são `undefined` até o `GET /users/me` responder. Se essa chamada falhar por rede (não 401), o estado incompleto permanece indefinidamente.
- **Por que importa:** O Dashboard usa `user?.daily_calories_goal` e cai em fallbacks fixos (A-095); telas de perfil podem exibir campos vazios e formulários podem enviar valores `undefined`.
- **Sugestão:** Tipar o estado como `SafeUserSession | UserProfile` com um discriminante, ou persistir o perfil completo validado; adicionar estado `isBootstrapping`/erro explícito enquanto o perfil é recarregado.
- **Confiança:** Alta

### [A-076] 🟡 Cadastro autentica o usuário, mas a UI diz que é preciso fazer login
- **Categoria:** 🎯 Consistência / 🐛 Bugs
- **Local:** `frontend/src/components/auth/RegisterForm.tsx:70-72`; `frontend/src/components/auth/AuthCard.tsx:31-45`
- **Problema:** `registerUser` já retorna `{ user, token }` e `RegisterForm` chama `setAuthSession`. Em seguida `AuthCard.handleAuthSuccess` define a mensagem "Conta criada! Faça login para continuar.", troca a aba para login e navega para `/login`. O usuário está autenticado, então o `PublicRoute` tende a redirecioná-lo para `/` imediatamente, exibindo uma mensagem contraditória por poucos instantes.
- **Por que importa:** Fluxo confuso no primeiro contato; a mensagem afirma o oposto do que o sistema fez.
- **Sugestão:** Decidir um comportamento único: ou o cadastro não autentica (remover `setAuthSession`) e mantém a mensagem, ou autentica e navega direto para o onboarding/dashboard com "Conta criada com sucesso".
- **Confiança:** Alta

### [A-077] 🟡 Placeholder de senha promete 6 caracteres, validação exige 8
- **Categoria:** 🎯 Consistência / ♿ Acessibilidade
- **Local:** `frontend/src/components/auth/RegisterForm.tsx:158`
- **Problema:** O campo mostra `MÍNIMO 6 CARACTERES`, enquanto o schema local (`:23-29`) e o `strongPasswordSchema` compartilhado exigem 8 caracteres com letra e número.
- **Por que importa:** O usuário digitando 6 ou 7 caracteres recebe erro que contradiz a instrução visível.
- **Sugestão:** Atualizar o placeholder para "MÍNIMO 8 CARACTERES COM LETRA E NÚMERO" (ou remover o número e usar `aria-describedby` com a regra).
- **Confiança:** Alta

### [A-078] 🟡 Schema de cadastro do frontend duplica e divergência do schema compartilhado
- **Categoria:** 📋 Duplicação / 🎯 Consistência
- **Local:** `frontend/src/components/auth/RegisterForm.tsx:15-38`; `shared/src/schemas/user.schema.ts:9-18`
- **Problema:** O formulário redefine nome, e-mail, senha e termos em vez de reutilizar `registerUserSchema`. Divergências já existentes: nome aceita 1 caractere no front e 2 no back; senha não tem `max(72)`; e-mail não é normalizado; mensagens diferem. `confirmPassword` existe só no cliente.
- **Por que importa:** Regras de validação passam a ter duas fontes de verdade; o usuário pode ver "válido" no cliente e receber 400 do servidor (ou vice-versa).
- **Sugestão:** Importar `registerUserSchema` do `@caloriesync/shared` e estender apenas com `confirmPassword` + refinamento de igualdade.
- **Confiança:** Alta

### [A-079] 🟡 Logout automático depende de comparar a mensagem `"Usuário não encontrado."`
- **Categoria:** 🚨 Tratamento de erros / 🏷️ Tipagem
- **Local:** `frontend/src/services/api.ts:34-41`
- **Problema:** Além de 401, o cliente desloga quando recebe **404** cuja `message` é exatamente `'Usuário não encontrado.'`. Isso acopla o frontend ao texto de uma mensagem de negócio usada em vários services (perfil, metas, exportação). Se o texto mudar, o usuário excluído fica preso em estado autenticado; se outra rota passar a usar a mesma mensagem para um recurso, ele é deslogado indevidamente.
- **Por que importa:** Regra de sessão baseada em string frágil; erros de tradução/wording quebram autenticação silenciosamente.
- **Sugestão:** O backend deve responder 401 para usuário inexistente em rotas autenticadas (ou um código de erro estável, ex. `code: 'USER_NOT_FOUND'`); o cliente deve comparar o código, não o texto.
- **Confiança:** Alta

### [A-080] 🟡 Fallback de API aponta para `localhost` em qualquer build
- **Categoria:** ⚙️ Config
- **Local:** `frontend/src/services/api.ts:1`
- **Problema:** `import.meta.env.VITE_API_URL || 'http://localhost:3001/api'` não distingue desenvolvimento de produção. Um build de produção sem a variável configurada compila e sobe, mas todas as requisições vão para o computador do usuário.
- **Por que importa:** Falha silenciosa em deploy; o app parece "fora do ar" sem erro de configuração no build.
- **Sugestão:** Falhar no build quando `import.meta.env.PROD` e `VITE_API_URL` estiver ausente (ou usar caminho relativo `/api` com proxy).
- **Confiança:** Alta

### [A-081] 🟡 "Lembrar-me" não tem efeito algum
- **Categoria:** 🎯 Consistência / 🔒 Segurança
- **Local:** `frontend/src/components/auth/LoginForm.tsx:17-21,134-143`; `frontend/src/services/auth.service.ts:41-49`
- **Problema:** O checkbox altera `formData.rememberMe`, mas `loginUser` envia somente `email` e `password`. O token é sempre gravado em `localStorage` (`AuthContext:39-40`) e o backend sempre emite JWT de 7 dias (A-008).
- **Por que importa:** O usuário acredita controlar a duração da sessão; em computador compartilhado, marcar ou desmarcar não muda nada.
- **Sugestão:** Implementar semântica real (`sessionStorage` + token curto quando desmarcado) ou remover o controle.
- **Confiança:** Alta

### [A-082] 🔵 Link "Esqueci minha senha" é inerte
- **Categoria:** 💀 Código morto / 🎯 Consistência
- **Local:** `frontend/src/components/auth/LoginForm.tsx:145-151`
- **Problema:** O link aponta para `#forgot-password` e o `onClick` só faz `preventDefault()`; não existe rota, modal ou fluxo de recuperação no frontend nem endpoint no backend.
- **Por que importa:** Um dos caminhos mais procurados em telas de login termina em nada; o usuário fica sem saída para recuperar a conta.
- **Sugestão:** Remover o link enquanto não houver fluxo, ou implementar o reset de senha (rota + e-mail).
- **Confiança:** Alta

### [A-083] 🟡 `tablist` de autenticação não suporta navegação por teclado
- **Categoria:** ♿ Acessibilidade
- **Local:** `frontend/src/components/auth/AuthCard.tsx:64-99`
- **Problema:** Os botões têm `role="tab"` e `aria-selected`, mas não há `tabIndex` roving nem tratamento de `ArrowLeft`/`ArrowRight`/`Home`/`End`. Pela especificação ARIA Authoring Practices, abas devem ser navegáveis com setas e apenas a aba ativa deve estar na ordem de tabulação.
- **Por que importa:** Leitores de tela anunciam "aba" mas o comportamento esperado não existe; usuários de teclado percorrem as duas abas como botões comuns.
- **Sugestão:** Implementar o padrão completo de tabs (ou remover os roles e tratá-los como botões de alternância).
- **Confiança:** Alta

### [A-084] 🔵 Título "Bem-vindo de volta" aparece também no cadastro
- **Categoria:** 🎯 Consistência
- **Local:** `frontend/src/components/auth/AuthCard.tsx:53-55`
- **Problema:** O `<h1>` é fixo, independentemente de `mode === 'register'`.
- **Por que importa:** Quem chega em `/cadastro` lê uma saudação de retorno, incoerente com "Criar conta".
- **Sugestão:** Alternar o título conforme a aba ("Crie sua conta" / "Bem-vindo de volta").
- **Confiança:** Alta

### [A-085] 🟡 Efeito do modal de exclusão reinicia a cada render do pai
- **Categoria:** 🐛 Bugs / 🧠 Recursos
- **Local:** `frontend/src/components/common/DeleteAccountModal.tsx:24-68`
- **Problema:** O `useEffect` depende de `onClose`, normalmente passado como arrow function inline pela página. A cada render do pai, o efeito é limpo e reexecutado: `setPassword('')`, `setShowPassword(false)` e novo `setTimeout` de foco. O usuário pode perder o que digitou e ver o foco pular enquanto o modal está aberto.
- **Por que importa:** Bug intermitente e difícil de reproduzir; digitar a senha enquanto a página re-renderiza (ex.: refetch do React Query) apaga o campo.
- **Sugestão:** Separar efeitos (reset apenas quando `isOpen` muda) e estabilizar `onClose` com `useCallback`/ref; limpar o timeout no cleanup.
- **Confiança:** Alta

### [A-086] 🔵 Timeout do Service Worker nunca é cancelado
- **Categoria:** 🧠 Recursos
- **Local:** `frontend/src/services/push.service.ts:119-126`
- **Problema:** `setTimeout` de 8s é criado em `ensureServiceWorkerReady` e nunca é limpo. Quando o SW fica pronto antes, o timer permanece agendado e o `reject` de uma promise já resolvida é ignorado, mas o handle segura o evento/JS por 8s.
- **Por que importa:** Em fluxos repetidos (tentar ativar push várias vezes) acumulam-se timers desnecessários; em testes, pode gerar handles abertos.
- **Sugestão:** Guardar o id do timer e `clearTimeout` no `finally` do `Promise.race`; usar `AbortSignal.timeout` se disponível.
- **Confiança:** Alta

### [A-087] 🟡 `sendTestPush` simula a notificação no cliente
- **Categoria:** 🐛 Bugs / 🎯 Consistência
- **Local:** `frontend/src/services/push.service.ts:34-64`
- **Problema:** O backend não envia push (A-005), então o frontend cria uma notificação local com `registration.showNotification`/`new Notification` e retorna a resposta do servidor, que a tela apresenta como "enviado com sucesso". A notificação parece vir do servidor, mas é gerada no próprio navegador.
- **Por que importa:** Mascara a funcionalidade inexistente e pode induzir o usuário a confiar em lembretes que nunca chegarão com o app fechado.
- **Sugestão:** Remover o fallback local quando o objetivo é testar o envio real; se for apenas demonstração visual, rotular explicitamente como simulação.
- **Confiança:** Alta

### [A-088] 🔵 `OnboardingFormData` é tipo morto
- **Categoria:** 💀 Código morto
- **Local:** `frontend/src/types/auth.ts:17-25`
- **Problema:** Busca no projeto inteiro encontra apenas a própria declaração; nenhum componente ou serviço importa `OnboardingFormData`.
- **Por que importa:** Tipo extenso e divergente dos DTOs compartilhados, sujeito a ser copiado por engano.
- **Sugestão:** Remover ou substituir por `CompleteOnboardingDTO` do shared.
- **Confiança:** Alta

### [A-089] 🟡 `parseLocalDateString` devolve "hoje" para entrada inválida
- **Categoria:** 🐛 Bugs (borda)
- **Local:** `frontend/src/utils/date.ts:21-27`
- **Problema:** Se a string for inválida/nula, a função retorna `new Date()` silenciosamente em vez de falhar. `addDaysToDateString('lixo', -1)` vira "ontem a partir de hoje", e o modal de refeição pode registrar em uma data que o usuário não escolheu.
- **Por que importa:** Erros de dados são convertidos em ações com data errada, sem aviso.
- **Sugestão:** Retornar `null`/lançar erro e tratar na borda; manter uma variante explícita `parseOrToday` se o fallback for desejado.
- **Confiança:** Alta

### [A-090] 🟡 Frontend usa a data local do navegador como autoridade, backend usa São Paulo
- **Categoria:** 🐛 Bugs (datas/fuso) / 🎯 Consistência
- **Local:** `frontend/src/utils/date.ts:1-3`; `frontend/src/pages/private/DashboardPage.tsx:41-48`; `frontend/src/pages/private/StatsPage.tsx:12,20-24`; `backend/src/services/meal.service.ts:37-52`
- **Problema:** `getLocalDateString` usa `toLocaleDateString('en-CA')` no fuso do navegador e envia essa data como `?date=`; o backend monta o intervalo com offset fixo de São Paulo (A-024). Um usuário em outro fuso (ou com relógio errado) pode ver o "hoje" do dashboard deslocado em um dia em relação ao que o servidor considera hoje.
- **Por que importa:** Refeições aparecem no dia errado, estatísticas divergem e o botão "hoje" pode apontar para outra data.
- **Sugestão:** Backend deve devolver a data corrente de São Paulo (ou o intervalo resolvido) e o frontend usá-la como fonte; se o produto é mono-fuso, converter explicitamente com `Intl`/`Temporal` em vez de depender do fuso do dispositivo.
- **Confiança:** Média

### [A-091] 🟡 `NewMealModal` é um componente "god object" de ~1000 linhas
- **Categoria:** 🏗️ Arquitetura / 📖 Legibilidade
- **Local:** `frontend/src/components/meals/NewMealModal.tsx:1-998`
- **Problema:** O arquivo concentra formulário de refeição, busca de alimentos, quantidade, combos salvos, edição, criação, cálculo nutricional, estados de erro, três mutations e toda a marcação/estilos. Há múltiplos `useEffect`, refs e regras de data/hora embutidas.
- **Por que importa:** Qualquer mudança (ex.: corrigir o combo, A-092) exige navegar por centenas de linhas; testes unitários ficam inviáveis e o risco de regressão cresce.
- **Sugestão:** Extrair `MealComposer` (itens/totais), `SavedComboPicker`, `MealSubmit` e um hook `useMealForm` com as regras de data; manter o modal apenas como orquestrador.
- **Confiança:** Alta

### [A-092] 🟠 Combo salvo cria "alimento fake" com base por 100 g incompatível com os macros
- **Categoria:** 🐛 Bugs (cálculo)
- **Local:** `frontend/src/components/meals/NewMealModal.tsx:211-241`; recálculo em `:413-434`
- **Problema:** `handleApplyCombo` monta `food` com `calories/proteins/carbs/fats` iguais aos totais do item (que correspondem à quantidade salva) e `serving_weight: 100`. `calculateNutrients` trata esses valores como "por 100 g". Ao editar a quantidade inline, o recálculo usa os macros do item como se fossem densidade por 100 g e multiplica pela nova quantidade, gerando valores errados (ex.: item de 150 g/250 kcal recalculado para 200 g vira 500 kcal em vez de ~333).
- **Por que importa:** Usuário pode salvar refeição com calorias/macros incorretos depois de ajustar um combo; o erro não é visível porque os totais são recalculados silenciosamente.
- **Sugestão:** No combo, reconstruir o alimento com a densidade correta (`valor / quantidade * 100`) ou guardar os macros por 100 g no snapshot do combo; nunca usar totais como base por 100.
- **Confiança:** Alta

### [A-093] 🟡 Exclusão de combo salvo ocorre sem confirmação
- **Categoria:** 🎯 Consistência / 🐛 Bugs (UX)
- **Local:** `frontend/src/components/meals/NewMealModal.tsx:945-952`
- **Problema:** O botão "X" chama `deleteComboMutation.mutate(combo.id)` imediatamente. Não há modal de confirmação, desfazer ou aviso, ao contrário da exclusão de refeição no Dashboard (que tem confirmação) e do padrão do projeto de não usar `confirm()` nativo.
- **Por que importa:** Um clique acidental apaga um combo permanentemente; a ação é destrutiva e não reversível.
- **Sugestão:** Reutilizar um modal acessível de confirmação (ou "desfazer" com toast temporário).
- **Confiança:** Alta

### [A-094] 🟡 Edição de refeição desloca o horário conforme o fuso do navegador
- **Categoria:** 🐛 Bugs (datas/fuso)
- **Local:** `frontend/src/components/meals/NewMealModal.tsx:263-266,444-459`
- **Problema:** Ao abrir para editar, o horário é lido com `new Date(meal.meal_time).getHours()` (fuso local) e, ao salvar, `timeToUse` é a data original com `setHours` local e convertida com `toISOString()`. Para um usuário fora de São Paulo, abrir e salvar sem mudar nada altera o instante da refeição.
- **Por que importa:** Editar o nome de uma refeição pode movê-la de dia/horário; os dados mudam sem intenção.
- **Sugestão:** Preservar o instante original quando o campo de hora não for alterado e formatar/editar o horário explicitamente em `America/Sao_Paulo`.
- **Confiança:** Média

### [A-095] 🟡 Dashboard inventa metas de carboidratos/gordura (250 g / 65 g)
- **Categoria:** 🐛 Bugs / 🎯 Consistência
- **Local:** `frontend/src/pages/private/DashboardPage.tsx:94-98`
- **Problema:** Calorias e proteínas têm fallback no perfil/2000/100, mas carboidratos e gorduras usam `250` e `65` fixos quando `activeGoal` não traz os valores (o backend pode devolver `carbs: 0`/`fats: 0` no fallback de A-019). `|| 250` também transforma meta real `0` em 250.
- **Por que importa:** Barras e percentuais de macros mostram metas fictícias, induzindo o usuário a comer quantidades não prescritas.
- **Sugestão:** Usar `??` e exibir "meta não definida"/estado de carregamento quando o valor não existir; nunca hardcodar metas nutricionais.
- **Confiança:** Alta

### [A-096] 🟡 Modais de confirmação do Dashboard não têm focus trap, Esc nem rótulo
- **Categoria:** ♿ Acessibilidade
- **Local:** `frontend/src/pages/private/DashboardPage.tsx:493-593`
- **Problema:** Os modais de excluir refeição e copiar refeições usam `role="dialog"`/`aria-modal`, mas não têm `aria-labelledby`, não movem o foco para dentro, não prendem o foco e não fecham com `Esc`. O foco permanece no botão que abriu o modal, atrás do overlay.
- **Por que importa:** Usuários de teclado/leitores de tela não conseguem operar a confirmação de forma previsível; viola o padrão já implementado em `DeleteAccountModal`.
- **Sugestão:** Extrair um `ConfirmDialog` acessível (Radix AlertDialog) com foco inicial, trap, Esc e retorno de foco; reutilizar nos dois casos e no combo (A-093).
- **Confiança:** Alta

### [A-097] 🟡 Ações de refeição só aparecem no hover, mas continuam focáveis e invisíveis
- **Categoria:** ♿ Acessibilidade / 🎯 Consistência
- **Local:** `frontend/src/pages/private/DashboardPage.tsx:397-429`
- **Problema:** O contêiner usa `opacity-100 sm:opacity-0 group-hover:opacity-100`: em telas `sm+` os botões ficam transparentes até o hover, porém continuam na ordem de tabulação. Ao receber foco pelo teclado, o `opacity-0` permanece (não há `focus-within:opacity-100`), então o usuário tabula para botões invisíveis.
- **Por que importa:** Ações de editar/excluir/duplicar são inacessíveis visualmente para teclado e podem ser acionadas sem o usuário ver o foco.
- **Sugestão:** Adicionar `focus-within:opacity-100` (e `group-focus-within`) ou manter os botões sempre visíveis; garantir contraste do foco.
- **Confiança:** Alta

### [A-098] 🔵 Erro ao buscar a meta ativa é descartado
- **Categoria:** 🚨 Tratamento de erros
- **Local:** `frontend/src/pages/private/DashboardPage.tsx:55-58`
- **Problema:** A query de `active-goal` só desestrutura `data`; `isError`/`error` são ignorados. Uma falha (500/rede) é indistinguível de "sem meta" e cai nos fallbacks fixos (A-095).
- **Por que importa:** Usuário vê metas erradas sem qualquer aviso; não há retry explícito nem telemetria.
- **Sugestão:** Tratar `isError` com mensagem/retry e não exibir números inventados.
- **Confiança:** Alta

### [A-099] 🟡 Medição corporal aceita data futura
- **Categoria:** 🐛 Bugs / 🌐 API e dados
- **Local:** `frontend/src/pages/private/MeasurementsPage.tsx:22-24`; `shared/src/schemas/user.schema.ts:79-83`
- **Problema:** O schema do formulário valida apenas formato e `Date.parse`, sem limite superior; o schema compartilhado (`measured_at: z.string().optional()`) também não restringe. É possível registrar peso em 2099.
- **Por que importa:** A medição futura vira a "mais recente" e, por A-006, sobrescreve o peso atual do perfil; o gráfico de evolução fica distorcido.
- **Sugestão:** `refine(data <= hoje)` no cliente e no shared; no backend, validar `measured_at <= now()` e rejeitar 400.
- **Confiança:** Alta

### [A-100] 🟠 Data da medição é convertida para UTC e exibida um dia antes em São Paulo
- **Categoria:** 🐛 Bugs (datas/fuso)
- **Local:** `frontend/src/pages/private/MeasurementsPage.tsx:62-64`
- **Problema:** O input entrega `YYYY-MM-DD`; `onSubmit` faz `new Date(data.measured_at).toISOString()`. `new Date('2026-10-21')` é meia-noite UTC, então o timestamp vira `2026-10-21T00:00:00Z`, que em `America/Sao_Paulo` é `2026-10-20T21:00`. O backend grava o instante e as listagens/gráficos exibem 20/10.
- **Por que importa:** Toda medição registrada aparece com um dia de atraso; o histórico e o "peso atual" ficam desalinhados da data escolhida.
- **Sugestão:** Enviar `measured_at` como data de calendário (`YYYY-MM-DD`) ou meio-dia local (`T12:00:00-03:00`); normalizar no backend e nunca usar `toISOString()` em data-only.
- **Confiança:** Alta

### [A-101] 🟠 Service Worker serve o app shell do cache para sempre (cache-first sem versionamento)
- **Categoria:** 🐛 Bugs / ⚡ Performance
- **Local:** `frontend/public/sw.js:1-7,44-58`
- **Problema:** `CACHE_NAME` é fixo em `caloriesync-cache-v1` e o fetch faz `return cached || fetchPromise`: se `/` ou `/index.html` estiverem no cache, a rede nunca é consultada para eles e o `cache.put` correspondente nunca roda. Como o Vite gera nomes de assets com hash, o `index.html` antigo referencia assets que podem não existir mais após um deploy, e o usuário fica preso na versão antiga até o cache ser limpo manualmente.
- **Por que importa:** Correções e funcionalidades novas não chegam a usuários recorrentes; em casos de assets removidos, a tela pode quebrar.
- **Sugestão:** Usar network-first (ou stale-while-revalidate) para navegação/HTML, cache-first apenas para assets com hash; gerar/versionar `CACHE_NAME` no build e remover caches antigos no `activate`.
- **Confiança:** Alta

### [A-102] 🟡 `notificationclick` compara URL relativa com absoluta e nunca foca a aba
- **Categoria:** 🐛 Bugs
- **Local:** `frontend/public/sw.js:87-101`
- **Problema:** `targetUrl` vem de `data.url` (normalmente `/`) e é comparado com `client.url`, que é absoluto (`https://host/`). A igualdade nunca é verdadeira; o código sempre abre uma nova janela em vez de focar a existente.
- **Por que importa:** Cada clique em notificação abre outra aba do app, acumulando janelas.
- **Sugestão:** Normalizar com `new URL(targetUrl, self.location.origin).href` antes de comparar e focar/navegar a aba existente.
- **Confiança:** Alta

### [A-103] 🔵 Ícone do manifest declara tamanhos inexistentes e `any maskable` no mesmo SVG
- **Categoria:** ⚙️ Config / 🎯 Consistência
- **Local:** `frontend/public/manifest.webmanifest:10-16`
- **Problema:** Um único SVG é anunciado como `64x64 192x192 512x512` e `purpose: "any maskable"`. O `sizes` não descreve o arquivo (SVG é escalável) e `maskable` exige área de segurança própria; usar a mesma arte para ambos pode cortar o logo em Android.
- **Por que importa:** Instalação PWA pode exibir ícone cortado ou rejeitar o formato em navegadores que exigem PNG 192/512.
- **Sugestão:** Fornecer PNGs 192x192 e 512x512, com variantes `any` e `maskable` separadas; remover a lista falsa de `sizes`.
- **Confiança:** Média

### [A-104] 🔵 Animações e transições ignoram `prefers-reduced-motion`
- **Categoria:** ♿ Acessibilidade
- **Local:** `frontend/src/styles/index.css:128,150-152`; `frontend/public/sw.js:78`
- **Problema:** `transition-colors duration-300` no `body`, `.animate-in` com `fadeIn` e `vibrate` nas notificações não consultam `prefers-reduced-motion`. Não há bloco `@media (prefers-reduced-motion: reduce)`.
- **Por que importa:** Usuários com sensibilidade a movimento não têm como desativar animações; a vibração da notificação é particularmente invasiva.
- **Sugestão:** Adicionar `@media (prefers-reduced-motion: reduce)` zerando animações/transições e condicionar `vibrate`.
- **Confiança:** Alta

### [A-105] 🟠 Importação de alimentos desativa alimentos personalizados de usuários com o mesmo nome
- **Categoria:** 🐛 Bugs / 🗄️ Dados
- **Local:** `backend/scripts/import-foods.ts:101-109`
- **Problema:** Antes do upsert, o script executa `UPDATE foods SET active = false WHERE active = true AND f_unaccent(lower(name)) = ... AND NOT (source = ... AND external_id = ...)`, sem filtrar `user_id IS NULL`. Se um usuário tiver um alimento personalizado com nome igual a um item TACO (ex.: "Ovo Cozido"), ele é desativado globalmente pela importação.
- **Por que importa:** Refeições/combos do usuário passam a referenciar alimento inativo; o item pode sumir da busca e o combo quebrar (A-027/A-015).
- **Sugestão:** Restringir o UPDATE ao catálogo (`user_id IS NULL`) e resolver conflitos apenas entre itens do mesmo `source`/`external_id`.
- **Confiança:** Alta

### [A-106] 🟡 Falha na importação é engolida e o script sai com código 0
- **Categoria:** 🚨 Tratamento de erros / ⚙️ Config
- **Local:** `backend/scripts/import-foods.ts:162-167,170-173`
- **Problema:** O `catch` faz `ROLLBACK` e apenas loga; `runImport` resolve normalmente e o `.then(() => process.exit(0))` encerra com sucesso. Um pipeline/CI que dependa do script não detecta a falha.
- **Por que importa:** Importações parcialmente falhas passam como sucesso; dados podem ficar ausentes sem alerta.
- **Sugestão:** Re-lançar o erro (ou `process.exitCode = 1`) após o rollback; fechar o pool em `finally`.
- **Confiança:** Alta

### [A-107] 🔴 Script de download da TACO gera todos os macros zerados (dados já corrompidos no repositório)
- **Categoria:** 🐛 Bugs (dados) / 🌐 API e dados
- **Local:** `backend/scripts/download-taco.ts:38-60`; `backend/data/taco-full.json:1-25`
- **Problema:** `saveData` lê `item.energy_kcal`, `item.protein_g`, `item.carbohydrate_g`, `item.lipid_g` no nível raiz, mas o próprio comentário (`:23-36`) documenta que os valores estão em `item.attributes.energy.kcal` / `attributes.protein.qty` etc. Resultado: `parseNum(undefined)` retorna 0. O arquivo versionado `backend/data/taco-full.json` confirma o efeito — os primeiros itens têm `"calories": 0, "proteins": 0, "carbs": 0, "fats": 0`.
- **Por que importa:** Qualquer importação a partir desse JSON cria um catálogo inteiro com zero calorias/macros; refeições calculadas com esses alimentos mostram 0 kcal e o app parece "não contar" nada. É corrupção silenciosa de dados em escala.
- **Sugestão:** Ler os campos aninhados corretamente (`item.attributes.energy.kcal`, `attributes.protein.qty`, `attributes.lipid.qty`, `attributes.carbohydrate.qty`), validar que ao menos um macro é > 0 antes de salvar e regenerar `taco-full.json`; adicionar teste de sanidade do dataset.
- **Confiança:** Alta

### [A-108] 🟡 Seed de performance usa senha default e não é idempotente
- **Categoria:** 🔒 Segurança / 🗄️ Dados
- **Local:** `backend/scripts/seed-perf.js:8-12,31-35`
- **Problema:** `pass = process.env.DB_PASSWORD || 'postgres'` cria um fallback de credencial conhecida. O script fixa `contador_calorias_perf` e insere sempre `perf-user@example.com`; rodar duas vezes viola o UNIQUE de e-mail e aborta (ou duplica se a constraint mudar).
- **Por que importa:** Credencial fraca em script operacional e execuções repetidas falham no meio, deixando o banco de performance em estado indefinido.
- **Sugestão:** Exigir `DB_PASSWORD` (sem fallback), usar `ON CONFLICT`/limpeza prévia do usuário de performance e `TRUNCATE` apenas no banco `_perf` com confirmação explícita.
- **Confiança:** Alta

### [A-109] 🔵 `run-stats-explain` repete o fallback de senha `postgres`
- **Categoria:** 🔒 Segurança / 📋 Duplicação
- **Local:** `backend/scripts/run-stats-explain.js:8-12`
- **Problema:** Mesmo padrão de conexão e mesmo fallback de senha do `seed-perf` (A-108); a configuração de banco é duplicada em dois scripts.
- **Por que importa:** Qualquer ajuste de conexão/SSL precisa ser feito em vários lugares; a senha fraca se espalha.
- **Sugestão:** Extrair um helper de conexão para scripts (reutilizando `config/env` ou um pool próprio) e exigir credenciais.
- **Confiança:** Alta

### [A-110] 🔵 `check-indices` pode pendurar o processo em caso de erro
- **Categoria:** 🧠 Recursos
- **Local:** `backend/scripts/check-indices.ts:2-4`
- **Problema:** `pool.end()` só é chamado no `.then`; no `.catch(console.error)` o pool permanece aberto e o processo pode não terminar (dependendo do `allowExitOnIdle`).
- **Por que importa:** Script de diagnóstico trava em vez de falhar rápido.
- **Sugestão:** `try/finally` com `await pool.end()` e `process.exitCode = 1` no erro.
- **Confiança:** Alta

### [A-111] 🟡 CI não verifica tipos de backend/shared e mistura instalação não determinística
- **Categoria:** ⚙️ Config / 🧪 Testes
- **Local:** `.github/workflows/ci.yml:14-16,45-50,60-82`
- **Problema:** O pipeline roda `npm install` (não `npm ci`) em quatro diretórios, usa PostgreSQL 15 enquanto o compose usa 16, roda lint e testes, mas nunca executa `tsc --noEmit` no backend nem no shared (o frontend só é checado no `build`). Erros de tipo no backend/shared passam no CI.
- **Por que importa:** Regressões de tipagem chegam à `main`; ambientes diferentes (PG15 vs 16) podem mascarar diferenças de SQL/`gen_random_uuid`.
- **Sugestão:** Usar `npm ci` com cache de lockfiles, alinhar a imagem do Postgres à de produção e adicionar passos `npm --prefix backend run build` e `npm --prefix shared run typecheck` (criar o script, A-051).
- **Confiança:** Alta

### [A-112] 🔵 Allowlist do Gitleaks é ampla e ignora commits por hash fixo
- **Categoria:** 🔒 Segurança / ⚙️ Config
- **Local:** `.gitleaks.toml:6-22`; `.gitleaksignore:1-6`
- **Problema:** A allowlist por caminho cobre qualquer `tests/`, `backend/tests/`, `frontend/src/tests/` e `frontend/src/mocks/`, então um segredo real commitado nesses diretórios nunca é detectado. O `.gitleaksignore` referencia hashes de commits específicos, que deixam de casar se o histórico for reescrito e não documentam o motivo.
- **Por que importa:** A proteção contra vazamento tem pontos cegos justamente onde credenciais de teste costumam ser copiadas; a manutenção por hash é frágil.
- **Sugestão:** Restringir a allowlist a fixtures/valores conhecidos (regexes específicas) em vez de diretórios inteiros e documentar cada exceção de histórico.
- **Confiança:** Média

### [A-113] 🟡 Contraste de texto destrutivo no modo escuro fica abaixo de WCAG AA e o teste aceita 3:1
- **Categoria:** ♿ Acessibilidade / 🧪 Testes
- **Local:** `frontend/src/styles/index.css:81-82`; `frontend/src/styles/tokens.contrast.test.ts:170-172`
- **Problema:** No modo escuro, `--destructive: 0 84% 60%` (#EF4343) com `--destructive-foreground: 0 0% 100%` resulta em ~3,78:1. O teste aceita `>= 3` com a justificativa "texto grande/negrito", mas a exceção de 3:1 da WCAG só vale para texto grande (≥24px, ou ≥18,66px em negrito); o token é usado em textos normais de botões/alerts. No modo claro o mesmo par exige 4,5:1 (`:124-126`).
- **Por que importa:** Botões destrutivos ("Excluir conta", "Excluir refeição") podem ter texto branco sobre vermelho sem contraste suficiente; o teste oficial "aprova" a violação e impede que uma regressão seja percebida.
- **Sugestão:** Escurecer `--destructive` no escuro (ex.: `0 74% 42%`, como no claro) ou usar texto preto; exigir 4,5:1 no teste e remover a exceção.
- **Confiança:** Alta (cálculo WCAG manual sobre os valores HSL do CSS)

### [A-114] 🟡 Teste de contraste cobre poucos pares e contém asserção tautológica
- **Categoria:** 🧪 Testes / ♿ Acessibilidade
- **Local:** `frontend/src/styles/tokens.contrast.test.ts:137-177`
- **Problema:** O modo escuro valida 10 pares contra 14 do claro; faltam pares usados na UI como `muted-foreground/background`, `muted-foreground/secondary`, `destructive/background`, `destructive/card` (existe), `border/background` e `secondary-foreground/secondary`. O teste das linhas 174-177 apenas exige `ratio > 1`, o que é verdadeiro para quaisquer duas cores distintas — não valida contraste nenhum. Além disso, `extractHslMap` ignora tokens ausentes sem erro específico: o mapa fica incompleto e o `NaN` resultante falha com mensagem genérica.
- **Por que importa:** Tokens novos ou pares realmente usados podem ficar abaixo de AA sem que a suíte perceba; a asserção tautológica dá falsa sensação de cobertura.
- **Sugestão:** Declarar uma tabela de pares obrigatórios por modo, validar a presença de cada token e remover o teste-nota; opcionalmente varrer as classes `text-*`/`bg-*` do código para descobrir pares em uso.
- **Confiança:** Alta

### [A-115] 🟡 Guarda de cores pode ser desativada por comentário e libera todo o diretório `public/`
- **Categoria:** 🎨 Estilo / ⚙️ Config
- **Local:** `frontend/scripts/check-colors.mjs:12-21,130-132`
- **Problema:** `isAllowedLiteralFile` retorna `true` para qualquer caminho que contenha `/public/` ou comece com `public/`, então arquivos novos nesse diretório nunca são checados. O escape `color-guard-allow:` (na própria linha ou na anterior) ignora a linha inteira sem registrar a supressão, e o script termina com "0 violações" mesmo que uma violação real tenha sido silenciada.
- **Por que importa:** A guarda é a única barreira automatizada contra cores literais (regra do projeto). Um comentário copiado ou um arquivo em `public/` contorna a regra sem deixar rastro, e o lint continua verde.
- **Sugestão:** Restringir a allowlist aos arquivos que realmente precisam de literais (`index.css`, `tailwind.config.js`, `index.html`), trocar o escape por uma lista explícita de exceções com justificativa e reportar cada supressão no resumo.
- **Confiança:** Alta

### [A-116] 🟠 Testes consagram o push fictício como sucesso
- **Categoria:** 🧪 Testes / 🐛 Bugs
- **Local:** `backend/tests/integration/push_notifications.test.ts:68-75`; `frontend/src/pages/private/__tests__/NotificationsPage.test.tsx:70-88`; `frontend/src/pages/private/__tests__/EditProfilePage.test.tsx:121-132`; `frontend/src/mocks/handlers.ts:288-294`
- **Problema:** Os testes afirmam apenas status 200/`success: true` e a mensagem "lembrete enviado com sucesso". Não há asserção de chamada a um provedor de push, de `recipientCount > 0` ou de notificação entregue; o mock do MSW devolve `{ sent: true, recipientCount: 1 }` fixo. O comportamento fictício de A-005/A-071/A-087 é tratado como contrato correto.
- **Por que importa:** A suíte protege o bug em vez da funcionalidade: implementar o envio real ou retornar 501 quebraria os testes, enquanto manter o endpoint que não envia nada permanece "verde".
- **Sugestão:** Após implementar o envio, testar o adaptador com mock do `web-push` (incluindo falha e zero inscrições) e ajustar o mock para refletir o contrato real; enquanto isso, marcar o endpoint como não implementado e testar o 501.
- **Confiança:** Alta

### [A-117] 🟠 Teste de rate limit exige o bypass por e-mail descrito em A-036
- **Categoria:** 🔒 Segurança / 🧪 Testes
- **Local:** `backend/tests/integration/auth_rate_limit.test.ts:10-25`
- **Problema:** O teste exige que 12 tentativas com e-mails diferentes, partindo do mesmo IP, **nunca** recebam 429. Isso fixa como contrato o bypass do limite global por IP (A-036) e impede a correção sem alterar o teste.
- **Por que importa:** Qualquer endurecimento do rate limit (limite por IP além do limite por conta) falha na CI, sinalizando que o comportamento inseguro é intencional.
- **Sugestão:** Testar separadamente o limite por conta (mesmo e-mail) e o limite por IP (e-mails distintos), com tetos explícitos; o teste de e-mails distintos deve esperar 429 ao ultrapassar o teto por IP.
- **Confiança:** Alta

### [A-118] 🟡 Teste de unicidade de alimentos valida o índice global multi-tenant incorreto
- **Categoria:** 🧪 Testes / 🗄️ Dados
- **Local:** `backend/tests/integration/foods_uniqueness.test.ts:16-34`
- **Problema:** O teste insere dois alimentos com `user_id` nulo e exige que o segundo seja rejeitado, consagrando o índice global de A-003. Não há caso de dois usuários com o mesmo nome de alimento personalizado (que hoje falha) nem de catálogo + personalizado (que também falha).
- **Por que importa:** O teste "prova" que a constraint atual está correta e não sinaliza o cenário multi-tenant quebrado; corrigir A-003 exige reescrever a suíte.
- **Sugestão:** Cobrir explicitamente os três cenários (catálogo×catálogo, usuário A×usuário B, catálogo×personalizado) e alinhar com os índices parciais propostos em A-003.
- **Confiança:** Alta

### [A-119] 🟡 Teste de "ordem cronológica" de medições só verifica o tamanho do array
- **Categoria:** 🧪 Testes / 🐛 Bugs
- **Local:** `backend/tests/integration/user_measurements.test.ts:75-90`; comportamento em `:56-72`
- **Problema:** O `it` diz "deve listar medições em ordem cronológica", mas só valida `Array.isArray` e `length >= 2`; não verifica `measured_at` crescente/decrescente. O teste anterior valida que uma medição atual sobrescreve o peso, mas não cobre a medição retroativa (A-006).
- **Por que importa:** A ordenação e a regra de "não sobrescrever peso com data antiga" podem quebrar sem falha; o nome do teste dá falsa cobertura.
- **Sugestão:** Comparar as datas retornadas, testar ordem explícita e adicionar o caso retroativo (peso atual deve permanecer).
- **Confiança:** Alta

### [A-120] 🔵 Teste de logging depende de `setTimeout(50)` e não de um evento observável
- **Categoria:** 🧪 Testes / 🚨 Tratamento de erros
- **Local:** `backend/tests/integration/request_logging.test.ts:42`
- **Problema:** Após a requisição, o teste espera 50 ms fixos para o log assíncrono do middleware. Em CI lento o log pode ainda não ter sido emitido; em máquina rápida o teste passa sem provar sincronização.
- **Por que importa:** Flakiness intermitente e falsos positivos em um teste de observabilidade.
- **Sugestão:** Expor/aguardar o evento `finish` da resposta ou usar uma promise/`waitFor` com condição e timeout.
- **Confiança:** Média

### [A-121] 🔵 Script de carga não faz asserções e imprime `\n` literal
- **Categoria:** 🧪 Testes / ⚡ Performance
- **Local:** `backend/tests/load/autocannon.js:17,23`
- **Problema:** `console.log('\\n--- RESULTADOS...')` imprime a barra invertida em vez de quebrar linha; o script só imprime métricas e termina com código 0, sem thresholds nem comparação com baseline. Não há script npm que o execute.
- **Por que importa:** Não há proteção de performance: uma regressão de latência/erros não falha em nenhum pipeline, e o script manual nem formata a saída corretamente.
- **Sugestão:** Usar `\n`, definir limites (ex.: P99 e `non2xx`) e `process.exit(1)` quando excedidos, integrar ao baseline documentado ou remover o arquivo.
- **Confiança:** Alta

### [A-122] 🟡 `docs/TESTING.md` está desatualizado em contagens, nomes de arquivos, timeouts e gaps
- **Categoria:** 📋 Documentação / 🧪 Testes
- **Local:** `docs/TESTING.md:15,43-44,49-81,114-124`
- **Problema:** O documento afirma "110 testes em 27 suítes" no backend (há 33 arquivos de teste: 12 unitários + 19 integrações + 2 na raiz) e "24 testes em 8 arquivos" no frontend (há 23 arquivos). Cita arquivos inexistentes (`user.schema.test.ts`, `user_transactions.test.ts`, `health.routes.test.ts`) e grafias diferentes das reais (`date_utils` vs `date.util`, `auth_middleware` vs `auth.middleware`, `validate_middleware` vs `validate.middleware`, `input_limits` vs `input.limits`); omite `threadpool.test.ts`, `trust_proxy.test.ts` e 10 integrações. Diz "teste/hook 10 s e teardown 5 s", mas `frontend/vite.config.ts:58-60` define 20 s/20 s/10 s. A seção de gaps diz que Dashboard, EditProfile e Onboarding não têm testes, mas existem `DashboardPage.test.tsx`, `EditProfilePage.test.tsx` e `OnboardingFlow.test.tsx` (além de Measurements, Legal e SettingsSeparation).
- **Por que importa:** Quem usa o guia para rodar/entender a suíte recebe comandos, arquivos e tempos errados; a seção de gaps esconde cobertura existente e o inventário não serve como referência.
- **Sugestão:** Gerar a lista a partir do filesystem, atualizar contagens e timeouts na mesma mudança que altera testes e substituir a seção de gaps por uma lista verificada (ou remover).
- **Confiança:** Alta (nomes, arquivos e timeouts verificados; a contagem de casos não foi executada)

### [A-123] 🟡 `docs/BACKLOG.md` mistura status "CORRIGIDO" com evidência do defeito e mantém BL-27 como concluído
- **Categoria:** 📋 Documentação / 🎯 Consistência
- **Local:** `docs/BACKLOG.md:47,56,155` (e D-10 em `:220`)
- **Problema:** Várias linhas marcadas `[CORRIGIDO]` mantêm, na coluna de evidência, exatamente a descrição do defeito original: CA-01 diz que `auth.ts`/`user.service.ts` "usam `process.env.JWT_SECRET || 'fallback_jwt_secret'`"; CA-10 diz que os blocos `catch` "retornam `err.message` diretamente em status 500". BL-27 marca push como `[CORRIGIDO]` ("gerenciamento e teste de lembretes"), mas o backend não envia nada (A-005) e os testes só checam 200 (A-116).
- **Por que importa:** O backlog é declarado como fonte consolidada de pendências; status contraditório faz o time acreditar que itens críticos estão resolvidos e impede priorização correta.
- **Sugestão:** Separar "problema original" de "evidência da correção" (arquivo:linha atual + teste), reabrir BL-27 até existir envio real e revisar todas as linhas `[CORRIGIDO]` com evidência ambígua.
- **Confiança:** Alta

### [A-124] 🔵 Decisão D-10 descreve um padrão de erros centralizado que o código não implementa
- **Categoria:** 📋 Documentação / 🚨 Tratamento de erros
- **Local:** `docs/BACKLOG.md:220`; código em `backend/src/controllers/*.ts` e `backend/src/middlewares/errorHandler.ts`
- **Problema:** D-10 define classes `AppError`, `asyncHandler`, `next(err)`, resposta `{ success:false, error }` e mapeamento de `23505/23503/22P02`, e referencia CA-10 como corrigido. Na prática os controllers repetem try/catch (A-007) e o `errorHandler` não possui classes nem mapeamento de códigos (A-017/A-018); os 23505 continuam virando 500 (A-003/A-004).
- **Por que importa:** A decisão arquitetural é citada como base de correções futuras, mas não há implementação correspondente; novos controllers copiam o padrão duplicado.
- **Sugestão:** Implementar o padrão descrito ou marcar D-10 como proposta futura, removendo a associação com CA-10 "corrigido".
- **Confiança:** Alta

### [A-125] 🟡 README e SPEC documentam `JWT_EXPIRES_IN=7d` como configuração efetiva
- **Categoria:** 📋 Documentação / ⚙️ Config
- **Local:** `README.md:79,146`; `docs/SPEC.md:20`; `backend/src/config/env.ts:21`; `backend/src/services/user.service.ts:282-284`
- **Problema:** A documentação afirma que a validade do token é configurável por `JWT_EXPIRES_IN` (exemplo `7d`), mas `generateToken` usa `expiresIn: '7d'` fixo; alterar a variável não muda nada (A-008).
- **Por que importa:** Operadores acreditam controlar a duração da sessão (segurança) e não conseguem; a documentação reforça a configuração enganosa.
- **Sugestão:** Usar `env.JWT_EXPIRES_IN` no `jwt.sign` (com tipo adequado) ou remover a variável do README, SPEC e `.env.example`.
- **Confiança:** Alta

### [A-126] 🔵 README promete gestão de push e um comando `test:frontend:file` que ignora o arquivo
- **Categoria:** 📋 Documentação / 🎯 Consistência
- **Local:** `README.md:13,179`; `package.json:15,20`
- **Problema:** O README lista "gerenciamento de notificações push" como funcionalidade (o backend não envia, A-005) e documenta `npm run test:frontend:file src/...` como execução de um único arquivo, mas o script aponta para `run-tests.mjs frontend` e não repassa o caminho (A-046), rodando a suíte inteira.
- **Por que importa:** Documentação de onboarding induz a acreditar em recurso inexistente e em um comando que não faz o que promete (lentidão inesperada em CI local).
- **Sugestão:** Ajustar o texto ao estado real e corrigir o alias/runner para aceitar o arquivo.
- **Confiança:** Alta

### [A-127] 🔵 Mock de login usa senha de 6 caracteres, incompatível com a política real
- **Categoria:** 🧪 Testes / 🎯 Consistência
- **Local:** `frontend/src/mocks/handlers.ts:8`; `frontend/src/components/auth/LoginForm.test.tsx:27,38`
- **Problema:** O handler do MSW só autentica com `password === '123456'` (6 dígitos) e os testes usam essa senha. O schema compartilhado exige 8+ caracteres com letra e número; o backend real rejeitaria essa credencial. O mock, portanto, valida um fluxo impossível e mascara a divergência do placeholder (A-077).
- **Por que importa:** Testes de login passam com uma senha que o produto não aceita; qualquer regra de senha futura continua sem cobertura no frontend.
- **Sugestão:** Usar uma senha válida (ex.: `senha123`) nos fixtures e, se possível, validar o payload do mock com o schema compartilhado.
- **Confiança:** Alta

### [A-128] 🔵 Checklist de migração de cores mantém tela de notificações como pendente
- **Categoria:** 📋 Documentação / 🎨 Estilo
- **Local:** `docs/COLOR_MIGRATION.md:65` (comparar com `:120`)
- **Problema:** A lista de revisão visual marca `- [ ] /configuracoes/notificacoes` como pendente, embora o inventário do mesmo documento já marque `NotificationsPage.tsx` como `[x]` e a página exista/esteja roteada.
- **Por que importa:** O checklist é usado para decidir o que falta; um item já migrado continua parecendo débito e pode gerar retrabalho.
- **Sugestão:** Marcar a tela como revisada ou explicitar que a pendência é apenas de inspeção visual manual.
- **Confiança:** Alta

### [A-129] 🔵 Testes de sessão não cobrem hidratação de `localStorage` (A-074/A-075)
- **Categoria:** 🧪 Testes / 🔒 Segurança
- **Local:** `frontend/src/tests/auth_storage.test.tsx:34-62`; `frontend/src/context/AuthContext.test.tsx:34-40`
- **Problema:** Os testes verificam a sanitização na escrita e o estado inicial sem sessão, mas nenhum remonta o `AuthProvider` com `user_session` persistido. O `JSON.parse` sem proteção (A-074) e o objeto parcial tipado como `UserProfile` completo (A-075) não são exercitados; a suíte passa com os dois bugs presentes.
- **Por que importa:** O caminho mais comum do usuário (recarregar a página) fica sem cobertura justamente onde há risco de tela branca e estado incompleto.
- **Sugestão:** Adicionar casos com JSON inválido, formato antigo e sessão parcial, verificando recuperação sem crash e presença de estado de bootstrap/erro explícito.
- **Confiança:** Alta

## 🔗 PENDÊNCIAS PARA A FASE 3
- [P-01] `food.service.getById` e `getFavoriteIds`: confirmar ausência de consumidores (A-029).
- [P-02] `shared/src/schemas/food.schema.ts:listFoodsSchema` — buscar import (A-028).
- [P-03] Dependências não usadas: `class-variance-authority`, `react-select`, `recharts`, `@fontsource/*`, `lucide-react`, `@radix-ui/react-slot`, `@hookform/resolvers`; backend `node-pg-migrate` (usado via CLI), `@types/*` extras. Confirmar com grep.
- [P-04] Código morto global: buscar `console.log`, `debugger`, `TODO`, `FIXME`, `HACK`, `localhost`, `dangerouslySetInnerHTML`, `any`, `@ts-ignore`, `as ` cast.
- [P-05] Inconsistência de arredondamento entre backend (`roundToTenth`) e frontend (cálculo local) — comparar `frontend/src/types/meal-modal.ts` com shared.
- [P-06] Variáveis `VAPID_*` também usadas no frontend? buscar.
- [P-07] `JWT_EXPIRES_IN`, `DB_SSL_CA`, `TRUST_PROXY`, `UV_THREADPOOL_SIZE`, `TEST_PROCESS_TIMEOUT_MS` — verificar documentação e uso.
- [P-08] Testes que tocam banco sem `closeTestPool` — revisar cada teste na Fase 2/3.
- [P-09] Frontend: chamadas `fetch` fora de `services/api.ts`.

## ✅ FASE 3 — RESOLUÇÃO DAS PENDÊNCIAS
- **[P-01] CONFIRMADO (A-029):** `getFavoriteIds` (`backend/src/services/food.service.ts:48`) só aparece na própria definição — código morto. `getById` (`:19`) é exportado, mas o único consumidor é `addFavoriteFood` (`:38`); pode virar função privada. Nenhum controller/rota importa qualquer um dos dois.
- **[P-02] CONFIRMADO (A-028):** `listFoodsSchema` aparece apenas na definição (`shared/src/schemas/food.schema.ts:11`); nenhum import no backend, frontend ou shared.
- **[P-03] SEM DEPENDÊNCIAS ÓRFÃS RELEVANTES:** todas as citadas são usadas — `class-variance-authority` (badge/alert/button/label), `react-select` (FoodSearchSelect), `recharts` (Stats/Measurements), `@fontsource/*` (index.css), `lucide-react` (15+ componentes), `@radix-ui/react-slot` (button), `@hookform/resolvers` (7 formulários); `node-pg-migrate` é usado via CLI (`migrate`/`migrate:create`). Exceção já registrada: `@types/express-rate-limit@5` é desnecessário para a v8 (A-049).
- **[P-04] SEM RESÍDUOS:** grep em `backend/src` e `frontend/src` não encontra `TODO`, `FIXME`, `HACK`, `debugger`, `@ts-ignore`, `@ts-expect-error`, `dangerouslySetInnerHTML` nem `any` explícito. O único `console.log` de backend é o logger estruturado (A-031); não há `fetch` manual no frontend (ver P-09). Os casts existentes são `as CustomError`/`AuthenticatedRequest` (A-007/A-022) e `as unknown as ListFoodsQueryDTO` (`food.controller.ts:13`).
- **[P-05] SEM DIVERGÊNCIA DE ARREDONDAMENTO:** frontend e backend usam `calculateNutrients`/`calculateItemNutrients` do shared (`roundToTenth`, `shared/src/nutrition/nutrients.ts:42-58`); `frontend/src/types/meal-modal.ts:22` só reexporta. O backend soma valores já arredondados em `meal.model.ts:120-121`. A ausência de totais de carbs/fats permanece em A-026.
- **[P-06] VAPID SÓ NO BACKEND:** nenhuma ocorrência de `VAPID` em `frontend/src` ou `frontend/public`; o fallback fictício está em `backend/src/services/push.service.ts:4-8` (A-030).
- **[P-07] ENVS:** `TRUST_PROXY` e `TEST_PROCESS_TIMEOUT_MS` agora estão documentados em `backend/.env.example:19,24`; `JWT_EXPIRES_IN` está documentado mas é ignorado (A-008/A-125); `DB_SSL_CA`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `UV_THREADPOOL_SIZE` continuam ausentes do exemplo (A-053).
- **[P-08] HIGIENE DE POOL OK:** os 33 arquivos de teste do backend que importam `app`/`pool` registram `closeTestPool()`; não há `.only`, `.skip`, `xit` ou `xdescribe`. Nenhuma violação além dos problemas de conteúdo já registrados (A-116..A-121).
- **[P-09] OK:** a única chamada `fetch` do frontend está em `frontend/src/services/api.ts:18`; todos os serviços passam por `apiFetch`.

## 📊 RESUMO FINAL

### Contagem por severidade
| Severidade | Quantidade |
| :--- | ---: |
| 🔴 Crítico | 2 |
| 🟠 Alto | 15 |
| 🟡 Médio | 59 |
| 🔵 Baixo | 53 |
| ⚪ Informativo | 0 |
| **Total** | **129** |

### Distribuição por categoria (um achado pode ter mais de uma)
| Categoria | Ocorrências |
| :--- | ---: |
| 🐛 Bugs | 39 |
| 🎯 Consistência | 23 |
| 🔒 Segurança | 21 |
| ⚙️ Config | 21 |
| 🧪 Testes | 13 |
| 🗄️ Dados | 13 |
| 🚨 Tratamento de erros | 12 |
| 🏷️ Tipagem | 12 |
| ♿ Acessibilidade | 9 |
| 🌐 API e dados | 7 |
| 💀 Código morto | 7 |
| ⚡ Performance | 7 |
| 📋 Documentação | 7 |
| 🏗️ Arquitetura | 6 |
| 📖 Legibilidade | 6 |
| 📋 Duplicação | 5 |
| 🧠 Recursos | 4 |
| 🔀 Concorrência | 2 |
| 🎨 Estilo | 2 |

### Top 10 prioridades
1. **A-001 (🔴)** — senha real do PostgreSQL como fallback versionado no `docker-compose.yml`, com a porta 5432 exposta.
2. **A-107 (🔴)** — `download-taco.ts` lê campos inexistentes e o `taco-full.json` versionado está com todos os macros zerados; qualquer importação cria um catálogo de 0 kcal.
3. **A-074 (🟠)** — `JSON.parse` sem `try/catch` no estado inicial do `AuthContext`: uma sessão corrompida deixa o app em tela branca sem logout.
4. **A-003 (🟠)** — índice único global de nome de alimento ignora `user_id`: dois usuários não podem ter o mesmo alimento personalizado e o erro vira 500.
5. **A-005 (🟠)** — endpoint de push "de teste" não envia nada e responde sucesso; a UI e os testes confirmam a funcionalidade fantasma (A-071/A-087/A-116).
6. **A-006 (🟠)** — medição corporal retroativa sobrescreve o peso atual do perfil, contaminando TMB/TDEE/metas.
7. **A-092 (🟠)** — combo salvo usa os totais como se fossem macros por 100 g; editar a quantidade gera calorias/macros errados silenciosamente.
8. **A-100 (🟠)** — `toISOString()` em data-only desloca toda medição registrada um dia para trás em São Paulo.
9. **A-002 (🟠)** — e-mail é UNIQUE case-sensitive e nunca normalizado: contas duplicadas e bypass do rate limit por casing.
10. **A-101 (🟠)** — service worker cache-first sem versionamento prende o usuário na versão antiga do app shell.

**Menções honrosas:** A-011 (datas impossíveis → 500), A-033 (exportação LGPD em memória), A-066 (página legal promete revogação de sessão inexistente), A-105 (importação desativa alimentos personalizados), A-117 (teste que exige o bypass do rate limit).

### Quick wins (baixo esforço, alto retorno)
- **A-008/A-125:** usar `env.JWT_EXPIRES_IN` no `jwt.sign` (ou remover a env e a menção no README/SPEC).
- **A-017/A-018:** adicionar handler 404 e logar `stack`/`requestId` no `errorHandler`.
- **A-042:** logar `UV_THREADPOOL_SIZE` importado do módulo em vez de recalcular `Number(...)`.
- **A-067:** enviar `birthDate: null` ao limpar o campo e aceitar `null` no backend.
- **A-077/A-084:** corrigir o placeholder para 8 caracteres e alternar o título entre login/cadastro.
- **A-093/A-096:** extrair um `ConfirmDialog` acessível e reutilizar na exclusão de combo e nos modais do Dashboard.
- **A-098:** tratar `isError` da meta ativa em vez de cair em metas fixas.
- **A-113:** escurecer `--destructive` no dark mode e exigir 4,5:1 no teste.
- **A-126/A-127/A-128:** alinhar README/checklist e usar senha válida nos mocks.

### Refatorações estruturais recomendadas
1. **Centralizar erros HTTP (A-007, A-017, A-018, A-124):** `asyncHandler` + `AppError` + mapeamento de `23505/23503/22P02` no `errorHandler`; elimina ~250 linhas duplicadas e resolve os 500 genéricos de A-003/A-004.
2. **Fonte única de metas (A-019, A-035, A-064):** remover colunas legadas `users.daily_*_goal`, usar só `user_goals` e recalcular metas ao alterar peso/altura/objetivo/atividade.
3. **Contrato nutricional completo (A-026, A-027):** expor `totals` dos quatro macros e persistir snapshot dos macros em combos salvos.
4. **Decompor `NewMealModal` (A-091):** separar `MealComposer`, `SavedComboPicker`, `MealSubmit` e `useMealForm`; corrige A-092/A-093/A-094 com testes unitários.
5. **Estratégia de PWA (A-101/A-102/A-104):** network-first para navegação/HTML, cache versionado por build e respeito a `prefers-reduced-motion`.
6. **Sessão revogável (A-009, A-060, A-066):** `token_version`/refresh token rotacionado e cookies `HttpOnly`, alinhando a página legal ao comportamento real.
7. **Suíte de testes orientada a contrato (A-116..A-120, A-127, A-129):** deixar de consagrar bugs, testar entrega real de push, rate limit por IP+conta, multi-tenancy de alimentos e hidratação de sessão.

### Notas de saúde (0–10, heurística da auditoria)
| Dimensão | Nota | Justificativa resumida |
| :--- | :---: | :--- |
| Segurança | 4 | Senha default, JWT sem revogação, rate limit contornável e página legal que promete o que não existe. |
| Correção funcional | 5 | Bugs de cálculo (combo), datas (medição/edição) e push fictício afetam dados do usuário. |
| Arquitetura / qualidade | 5,5 | Quatro camadas claras e shared bem-feito, mas controllers duplicados, metas em duas fontes e modal de ~1000 linhas. |
| Testes | 5 | Boa infraestrutura (MSW, pool isolado, strict), porém vários testes codificam defeitos e a documentação está defasada. |
| Performance | 6 | Índices e batch insert presentes; faltam paginação em listagens, exportação em streaming e cache de shell corretivo. |
| Acessibilidade | 5 | Bom uso de roles/labels em partes, mas modais sem focus trap, tabs incompletas, labels soltos e contraste no dark. |
| Documentação | 4 | README/SPEC/TESTING/BACKLOG com afirmações desatualizadas ou contraditórias em pontos sensíveis. |
| Config / DevOps | 5 | CI roda lint/testes, mas sem typecheck de backend/shared, com `npm install` e PG15 vs PG16. |
| **Geral** | **5,0** | Produto funcional e bem estruturado em partes, com dívidas críticas de segurança/dados que bloqueiam uso público confiável. |

## 📝 LOG DE SESSÕES
- Sessão 1: criado o arquivo, inventário montado, backend completo (app/config/middlewares/routes/controllers/services/models/migrations) e pacote `shared` revisados; achados A-001..A-065.
- Sessão 2: frontend (núcleo, componentes, páginas, estilos/PWA), scripts, CI e configurações revisados; achados A-066..A-112.
- Sessão 3: testes de backend/frontend, mocks, `tokens.contrast.test.ts`, `check-colors.mjs` e documentação revisados; achados A-113..A-129. Fase 3 concluída (P-01..P-09) e RESUMO FINAL preenchido. Auditoria encerrada.
