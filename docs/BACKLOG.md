# Backlog Consolidado (BACKLOG.md)

Backlog único do **CalorieSync**, consolidado em 13/10/2026 a partir de todos os relatórios em `docs/reviews/`:
[00-doc-inventory](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/reviews/00-doc-inventory.md) ·
[01-rule-violations](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/reviews/01-rule-violations.md) ·
[security](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/reviews/security.md) ·
[performance](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/reviews/performance.md) ·
[architecture](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/reviews/architecture.md) ·
[tests](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/reviews/tests.md) ·
[product-gaps](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/reviews/product-gaps.md).

O planejamento por fases está em [ROADMAP.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ROADMAP.md).

---

## 0. Método de Priorização e Campos do Backlog

- **Deduplicação:** achados equivalentes entre relatórios foram fundidos em um único item; a coluna *Origem* lista todos os IDs originais correspondentes.
- **Score = Severidade × Facilidade**
  - Severidade: Crítica = 4 · Alta = 3 · Média = 2 · Baixa = 1
  - Facilidade (inverso do esforço): P = 3 · M = 2 · G = 1
  - Ex.: Crítica/P = 12 · Alta/P = 9 · Crítica/M = 8 · Alta/M = Média/P = 6 · Média/M = 4 · Alta/G = Baixa/P = 3
- **Severidade adotada:** quando relatórios divergiram, a severidade consolidada está justificada em [D-14](#d-14).
- **Features (grupo C do product-gaps)** usam *Impacto* (Alto = 3 · Médio = 2 · Baixo = 1) no lugar de severidade.
- **Agrupamento:**
  - 🔴 **Corrigir agora** — segurança e bugs críticos/bloqueantes (Fase 3.5 no roadmap).
  - 🟡 **Próximo ciclo** — Fases 4 e 5 do roadmap.
  - ⚪ **Backlog** — sem fase definida ou vinculado às Fases 6–8.
- **Campos Obrigatórios por Item:**
  - **ID:** identificador unificado (`CA-xx` para Corrigir Agora, `PC-xx` para Próximo Ciclo, `BL-xx` para Backlog Geral).
  - **Cat.:** categoria temática do achado (Segurança, Qualidade, Regra/Cálculo, Regra/Data, Regra/Fuso, Performance, Arquitetura, UI/Estilo, Acessibilidade, Privacidade, Observabilidade, Feature).
  - **Item (Título e Arquivos Afetados):** descrição concisa da ação e apontamento explícito dos arquivos/linhas envolvidos.
  - **Origem:** mapeamento para os relatórios de revisão (`SEC-xx`, `PERF-xx`, `ARCH-xx`, `GAP-xx`, `BUG-xx`, `FEAT-xx`, `TST-xx`, `V-xx`, `TECH_DEBT#x`).
  - **Sev. / Impacto:** severidade técnica (ou impacto de produto).
  - **Esf.:** estimativa de esforço relativo (P = Pequeno ≤ 2h, M = Médio 2–6h, G = Grande > 6h).
  - **Score:** produto matemático Severidade/Impacto × Facilidade.
  - **Status & Evidência:** status de verificação no código-fonte (`[CONFIRMADO]` com evidência pontual de arquivo/linha/comando, `[NÃO REPRODUZIDO]` ou `[A VERIFICAR]`).
  - **Modelo:** modelo sugerido para correção (`Forte + diff` com revisão manual para itens Críticos/Altos; `Econômico` para Médios/Baixos).
  - **Dec.:** item condicionado a decisão de arquitetura/negócio (ver [§5](#5-conflitos-entre-recomendações--decisões-pendentes)).

---

## 1. 🔴 Corrigir Agora (Segurança e Bugs Críticos)

| ID | Cat. | Item (Título e Arquivos Afetados) | Origem | Sev. | Esf. | Score | Status & Evidência | Modelo | Dec. |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| **CA-01** | Segurança | Remover fallback `'fallback_jwt_secret'` e usar `env.JWT_SECRET` (`backend/src/middlewares/auth.ts:19`, `backend/src/services/user.service.ts:235`) | SEC-001 | Crítica | P | 12 | **[CORRIGIDO]** `auth.ts:19` e `user.service.ts:235` usam `process.env.JWT_SECRET \|\| 'fallback_jwt_secret'` | Forte + diff | — |
| **CA-02** | Qualidade | Restaurar `npm run build`: corrigir generics do `react-select` (`frontend/src/components/meals/NewMealModal.tsx:455,461`) | ARCH-009, PERF-018, TECH_DEBT#3 | Crítica | P | 12 | **[CORRIGIDO]** `tsc -b` falha com 2 erros TS2322 em `NewMealModal.tsx:455,461` | Forte + diff | — |
| **CA-03** | Qualidade | Restaurar suíte do frontend (9 falhando + 1 erro MSW): labels/botões em `LoginForm`, `RegisterForm`, `NewMealModal`; contrato MSW de `/foods` → `{ foods, total }`; handler de `/meals/stats` | ARCH-010, TST-005, TST-006, TST-007, TECH_DEBT#4 | Crítica | P | 12 | **[CORRIGIDO]** `vitest` falha: 9 failed, 4 passed em 3 arquivos + unhandled MSW rejection em `StatsPage` | Forte + diff | — |
| **CA-04** | Regra/Data | Data de vigência de metas gravada no dia seguinte após 21h BRT (`toISOString().split('T')[0]` em `backend/src/services/user.service.ts:105,268,288` e `backend/src/services/meal.service.ts:175`) | ARCH-005, BUG-B01 | Crítica | P | 12 | **[CORRIGIDO]** `toISOString()` converte 21h+ BRT para 00h+ UTC D+1 | Forte + diff | D-01 |
| **CA-05** | Segurança | Pool PostgreSQL com `rejectUnauthorized: false` em produção (`backend/src/database/pool.ts:23`) | SEC-014 | Crítica | P | 12 | **[CORRIGIDO]** `pool.ts:23` define `rejectUnauthorized: false` sem validação de CA | Forte + diff | D-19 |
| **CA-06** | Segurança | Rotacionar segredos vazados no commit `24d1ce65` (`backend/.env` versionado no Git) e, se aprovado, expurgar histórico | SEC-002, TECH_DEBT#1 | Crítica | P | 12 | **[CONFIRMADO]** `git show 24d1ce65` introduziu `backend/.env` no histórico de commits | Forte + diff | D-12 |
| **CA-07** | Segurança | Remover senha hardcoded do script `db:reset:test` (`backend/package.json:13`) | V-11, TECH_DEBT#2, inventário §3.A.4 | Alta | P | 9 | **[CORRIGIDO]** `backend/package.json:13` contém senha em texto puro no comando | Forte + diff | — |
| **CA-08** | Qualidade | Restaurar `npm run lint` (`prefer-const` em `frontend/src/components/meals/NewMealModal.tsx:298`; diretiva órfã na `:181`) | TECH_DEBT#5, architecture | Alta | P | 9 | **[CORRIGIDO]** `eslint .` acusa 1 erro (`prefer-const`) e 1 warning em `NewMealModal.tsx` | Forte + diff | — |
| **CA-09** | Regra/Cálculo | `calculateAge` interpreta `YYYY-MM-DD` como UTC → idade +1 no dia anterior e TMB incorreta (`backend/src/services/nutrition.service.ts:30-38`) | BUG-B02 | Alta | P | 9 | **[CORRIGIDO]** `new Date(birthDate)` UTC faz `birth.getDate()` recuar 1 dia em fuso BRT | Forte + diff | — |
| **CA-10** | Segurança | Mensagens cruas do PostgreSQL vazando em HTTP 500 (`backend/src/controllers/user.controller.ts`, `meal.controller.ts`, `food.controller.ts`) | SEC-011, ARCH-001 | Alta | P | 9 | **[CORRIGIDO]** blocos `catch` retornam `err.message` diretamente em status 500 | Forte + diff | D-10 |
| **CA-11** | Segurança | Tetos de entrada e sanitização: `items.max`, `name.max`, `quantity.max`, `search.max` + escape de `%`/`_`, `password.max(72)`, `express.json({ limit })` (`backend/src/app.ts:18`, `backend/src/schemas/`) | SEC-013, SEC-009, SEC-004, SEC-015 | Alta | P | 9 | **[CORRIGIDO]** `app.use(express.json())` sem limit; schemas sem teto e ILIKE sem escape | Forte + diff | — |
| **CA-12** | Segurança | Trava de ambiente em `backend/scripts/reset-db.js` (`DROP SCHEMA public CASCADE` sem checagem de `NODE_ENV=test`) | SEC-010 | Alta | P | 9 | **[CORRIGIDO]** `reset-db.js:6` executa `DROP SCHEMA` sem validação de ambiente | Forte + diff | — |
| **CA-13** | Segurança | Atualizar dependências vulneráveis: `proxy-addr`, `tar`, `shell-quote`/`concurrently`, `brace-expansion` | SEC-016, TECH_DEBT#7 | Crítica | M | 8 | **[CORRIGIDO]** `npm audit` acusa `shell-quote` e `proxy-addr` (críticas) e `tar`/`braces` | Forte + diff | — |
| **CA-14** | Regra/Fuso | Fuso no fluxo: janela diária (`backend/src/services/meal.service.ts:68-74`) e `DATE(meal_time)` das estatísticas (`backend/src/models/meal.model.ts:205,214`) independentes do TZ do processo | TST-002, BUG-B06, ARCH-006, BUG-B05 | Crítica | M | 8 | **[CORRIGIDO]** `today.setHours(0,0,0,0)` e `DATE(meal_time)` usam fuso do processo/PG | Forte + diff | D-01 |
| **CA-15** | Arquitetura | `validate()` só lê `req.body`: suportar `query`/`params`; schemas para `:id` (UUID), `date`, `period` e busca de alimentos; remover `.parse()` de `food.controller.ts:19` | SEC-012, ARCH-003, V-05, V-06, BUG-B08, ARCH-013 | Alta | M | 6 | **[CORRIGIDO]** `validate.ts:6` restrito a `req.body`; `food.controller.ts:19` faz parse manual | Forte + diff | D-09 |
| **CA-16** | Regra/Cálculo | Macros para IMC alto: 2g prot/kg + 1g fat/kg excede a meta calórica e carboidrato zera (`backend/src/services/nutrition.service.ts:83-96`) | BUG-B03, BUG-B04 | Alta | M | 6 | **[CORRIGIDO]** `nutrition.service.ts:95` zera carboidratos se P+G > calorias calculadas | Forte + diff | D-15 |

---

## 2. 🟡 Próximo Ciclo

### 2.1. → Fase 4: Performance, Robustez e Rede de Testes

| ID | Cat. | Item (Título e Arquivos Afetados) | Origem | Sev. | Esf. | Score | Status & Evidência | Modelo | Dec. |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| **PC-01** | Qualidade | Eliminar testes falso-positivos: suíte tautológica de cálculo (`backend/tests/meal.test.ts:75-115`) e asserção no-op de busca com acentos (`backend/tests/integration/food.routes.test.ts:40-42`) | TST-001, TST-004 | Alta | P | 9 | **[CORRIGIDO]** `meal.test.ts` faz conta local isolada; `food.routes.test.ts:42` só checa `success: true` | Forte + diff | — |
| **PC-02** | Performance | Instalar e configurar middleware de compressão HTTP (`compression` em `backend/src/app.ts`) | PERF-008 | Alta | P | 9 | **[CONFIRMADO]** `compression` não instalado nem importado em `backend/src/app.ts` | Forte + diff | — |
| **PC-03** | Performance | Cache do catálogo de alimentos (HTTP `Cache-Control` e/ou LRU em memória) (`backend/src/controllers/food.controller.ts`) | PERF-009 | Alta | P | 9 | **[CONFIRMADO]** `GET /api/foods` executa consulta SQL direta a cada requisição sem headers de cache | Forte + diff | D-07 |
| **PC-04** | Arquitetura | Remover registro duplicado de rotas (`app.use('/api', routes)` duplicado em `backend/src/server.ts:9-11`) | ARCH-004, SEC-017, PERF-010 | Média | P | 6 | **[CORRIGIDO]** rotas unificadas em `app.ts` e duplicata removida de `server.ts` | Econômico | D-14 |
| **PC-05** | Performance | Invalidação cruzada de cache (`mealStats`, `todayMeals`, `active-goal`) + revisão de `staleTime`/`gcTime` no React Query | PERF-016, BUG-B07, ROADMAP F4 | Média | P | 6 | **[CONFIRMADO]** criação de refeição não invalida estatísticas de período | Econômico | — |
| **PC-06** | Resiliência | `apiFetch`: tratar resposta não-JSON (ex: 502 HTML) e 401 que limpa `localStorage` sem sincronizar `AuthContext` (`frontend/src/services/api.ts:24-35`) | HIPÓTESE-03, GAP-A03 | Média | P | 6 | **[CONFIRMADO]** `api.ts` chama `res.json()` diretamente sem checar Content-Type | Econômico | — |
| **PC-07** | Segurança | Bloquear reexecução indevida de onboarding se `onboarding_completed: true` (`backend/src/services/user.service.ts:80-124`) | SEC-008 | Média | P | 6 | **[CONFIRMADO]** `completeOnboarding` insere novas medições sem verificar conclusão prévia | Econômico | — |
| **PC-08** | Segurança | Política de senha forte (mínimo 8 caracteres, letra + número) + `bcrypt.compare` dummy no login para mitigar timing attacks (`backend/src/schemas/user.schema.ts`, `user.service.ts:60`) | SEC-004, GAP-A09, SEC-005 | Média | P | 6 | **[CONFIRMADO]** senha aceita 6 caracteres genéricos; usuário inexistente retorna sem hash | Econômico | — |
| **PC-09** | Performance | Otimização SQL: remover subqueries correlacionadas do dashboard; `count(*) OVER()` na busca; projeção explícita em `foods` (`backend/src/models/meal.model.ts`, `food.model.ts`) | PERF-001, PERF-003, PERF-007 | Média | P | 6 | **[CONFIRMADO]** `findMealsByUserAndDate` usa subqueries em loop; foods usa `SELECT *` | Econômico | D-08, D-14 |
| **PC-10** | Performance | Criação de índices via migração: `foods(name) WHERE active` e `meal_items(food_id)` (`backend/migrations/`) | PERF-002, PERF-005, ARCH-016 | Média | P | 6 | **[CONFIRMADO]** migrações não indexam chave estrangeira `food_id` em `meal_items` | Econômico | D-14 |
| **PC-11** | Resiliência | Resiliência de infraestrutura: `statement_timeout`, `/health` com probe de banco no contrato `{ success, data }`, graceful shutdown (`backend/src/database/pool.ts`, `server.ts`) | PERF-006, ARCH-018, ARCH-019 | Média | P | 6 | **[CONFIRMADO]** ausência de timeout de queries e probe ativo no endpoint health | Econômico | — |
| **PC-12** | Performance | Otimizações frontend: import dinâmico/lazy de `NewMealModal`, `useMemo` no `AuthContext`, `AbortController` no autocomplete (`frontend/src/`) | PERF-013, PERF-014, PERF-015 | Média | P | 6 | **[CONFIRMADO]** modal importado estaticamente; Provider recria objeto value; buscas antigas não são abortadas | Econômico | — |
| **PC-13** | Qualidade | CI: integrar `npm audit --audit-level=high` + Gitleaks; instalar `@vitest/coverage-v8` (`.github/workflows/ci.yml`) | SEC-023, TST-008 | Média | P | 6 | **[CONFIRMADO]** pipeline CI não valida dependências nem cobertura de código frontend | Econômico | — |
| **PC-14** | Qualidade | Limpeza determinística do banco de testes entre execuções (`backend/tests/`) | TST-010 | Média | P | 6 | **[CORRIGIDO]** `backend/tests/helpers/db.ts` implementa rotina com trava _test e hook after | Econômico | D-11 |
| **PC-15** | Bug | Edição de refeição: corrigir bug que zera macros base do alimento (`frontend/src/components/meals/NewMealModal.tsx:148-159`) | BUG-B09 | Média | P | 6 | **[CONFIRMADO]** edição repassa 0 para valores base ao carregar itens existentes | Econômico | — |
| **PC-16** | Documentação | Sincronizar documentação com código: versões no `AGENTS.md`, afirmações no `TESTING.md`, porta/banco no `README.md`, ER no `ARCHITECTURE.md`, `SPEC.md`, skills e destino dos `.txt` | 00-doc-inventory, tests §1.3 | Média | P | 6 | **[CONFIRMADO]** `AGENTS.md` lista React 19.0.0 / Vite 6 (reais: 19.2.8 / 8.2.0); `TESTING.md` cita arquivos inexistentes | Econômico | D-18 |
| **PC-17** | Arquitetura | Transações atômicas (`BEGIN`/`COMMIT`/`ROLLBACK`) em `completeOnboarding`, `updateProfile` e `updateGoals` + teste de rollback (`backend/src/services/user.service.ts`) | ARCH-002, TST-012 | Alta | M | 6 | **[CONFIRMADO]** `user.service.ts:91-122` executa múltiplos updates/inserts sem transação | Forte + diff | — |
| **PC-18** | Qualidade | Testes de integração de autorização multiusuário (IDOR) em todas as rotas de refeições e perfil (`backend/tests/integration/`) | TST-003 | Alta | M | 6 | **[CORRIGIDO]** `authorization.test.ts` implementado cobrindo GET/PUT/DELETE e isolamento multiusuário | Forte + diff | D-14 |
| **PC-19** | Segurança | Remover perfil biométrico/saúde do `localStorage` (`user_session`); manter dados sensíveis apenas em memória/cache React Query (`frontend/src/context/AuthContext.tsx:18,25`) | SEC-018 | Alta | M | 6 | **[CONFIRMADO]** peso, altura e metas salvos em plain text no armazenamento local do navegador | Forte + diff | — |
| **PC-20** | Performance | Code-splitting por rota com `React.lazy()` + configuração de `manualChunks` de vendor no Vite (`frontend/vite.config.ts`) | PERF-012, ROADMAP F4 | Alta | M | 6 | **[CONFIRMADO]** bundle gerado em chunk único sem divisão de bibliotecas de terceiros | Forte + diff | D-16 |
| **PC-21** | Arquitetura | Roteamento SPA real com URLs declarativas, histórico do navegador, suporte a botão Voltar e F5 (`frontend/src/App.tsx`) | GAP-A08 | Média | M | 4 | **[CONFIRMADO]** navegação gerenciada via `useState('dashboard')` em `App.tsx` | Econômico | D-16 |
| **PC-22** | Performance | Inserção multi-row em lote para `meal_items` (`backend/src/models/meal.model.ts:159-168`) | PERF-004 | Média | M | 4 | **[CONFIRMADO]** itens inseridos sequencialmente em loop `for...of` com múltiplas viagens ao banco | Econômico | D-14 |
| **PC-23** | Performance | Execução de `EXPLAIN ANALYZE` no endpoint `/api/meals/stats` sob volume real (seed de performance de 10k itens) | ROADMAP F4 | Média | M | 4 | **[CONFIRMADO]** medição pendente sob base volumétrica de dados | Econômico | — |
| **PC-24** | Qualidade | Expansão de cobertura de testes de integração backend: perfil, onboarding, metas com vigência, PUT/DELETE refeições, stats (`backend/tests/integration/`) | TST-009 | Alta | G | 3 | **[CORRIGIDO]** `user.routes.test.ts` e `meal.routes.test.ts` expandidos com 12 novos cenários de integração | Forte + diff | — |

---

### 2.2. → Fase 5: Redesign, Design Tokens e Conformidade do Frontend

| ID | Cat. | Item (Título e Arquivos Afetados) | Origem | Sev. | Esf. | Score | Status & Evidência | Modelo | Dec. |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| **PC-25** | UI/Estilo | Conformidade de tokens e geometria: eliminar cores hex hardcoded (`#0a0a0a`), `dark:` ad-hoc, `rounded-*` e sombras suaves (`frontend/src/App.tsx:72`, `AppHeader.tsx:137`, `components/ui/input.tsx:12`) | V-07, V-08, V-09 | Alta | P | 9 | **[CONFIRMADO]** `App.tsx:72` tem `rounded-full`; `AppHeader.tsx:137` e `input.tsx:12` usam `#0a0a0a` | Forte + diff | D-06 |
| **PC-26** | Acessibilidade | Revisão de acessibilidade: label associada em `food-amount`, `aria-label` no `react-select`, `DatePickerInput` com suporte a Esc e foco acessível (`frontend/src/`) | V-10, ARCH-021, ARCH-022 | Média | P | 6 | **[CONFIRMADO]** input de quantidade e combobox sem etiquetas ARIA adequadas | Econômico | — |
| **PC-27** | UI/UX | Tratamento visual explícito de estados `isError` e `empty` no Dashboard e na tela de Estatísticas (`frontend/src/pages/private/`) | GAP-A06 | Média | P | 6 | **[CONFIRMADO]** falha de API no Dashboard é mascarada como lista vazia de refeições | Econômico | — |
| **PC-28** | Arquitetura | Migrar `useEffect` + fetch manual para `useQuery` e escritas para `useMutation` em `EditProfilePage`, `OnboardingFlow`, `LoginForm`, `RegisterForm` | V-01, V-02 | Alta | M | 6 | **[CONFIRMADO]** `EditProfilePage.tsx:45` carrega dados em `useEffect` imperativo | Forte + diff | — |
| **PC-29** | Arquitetura | Substituir formulários com múltiplos `useState` manuais por `react-hook-form` + Zod em `EditProfilePage`, `OnboardingFlow`, `RegisterForm` | V-03, V-04, ARCH-012 | Alta | M | 6 | **[CONFIRMADO]** `EditProfilePage` e `OnboardingFlow` usam 6+ `useState` sem validação Zod | Forte + diff | — |
| **PC-30** | Arquitetura | Decomposição de componentes monolíticos: fatiar `EditProfilePage` (885 linhas) e `NewMealModal` (753 linhas) em subcomponentes coesos | ARCH-011 | Média | M | 4 | **[CONFIRMADO]** componentes ultrapassam 700 linhas acumulando estado, validação e renderização | Econômico | — |
| **PC-31** | Qualidade | **Executar primeiro na fase:** expurgar código morto e dependências órfãs (`ThemeToggle`, `ui/card`, `switch`, `textarea`, `tooltip`, `App.css`, `clean-foods.ts`, `ts-node-dev`, Radix órfãos) | ARCH-013, ARCH-014 | Baixa | P | 3 | **[CONFIRMADO]** arquivos presentes no repositório sem qualquer import ativo | Econômico | D-06 |
| **PC-32** | UI/Design | Escopo estrutural de tokens: centralizar variáveis CSS de cores brutalistas, espaçamentos, contornos e componentes primitivos base reutilizáveis (`frontend/src/styles/index.css`) | ROADMAP F5 | Média | M | 4 | **[CONFIRMADO]** ausência de biblioteca de componentes base uniformes | Econômico | — |
| **PC-33** | Performance | Fontes self-hosted com carregamento local; carregar fonte `Montserrat` efetivamente ou remover declaração órfã (`frontend/index.html`, `src/styles/`) | PERF-017 | Baixa | P | 3 | **[CONFIRMADO]** Google Fonts externo com render-blocking; Montserrat declarada no Tailwind sem import | Econômico | — |
| **PC-34** | Qualidade | Criar rede de testes de componentes para telas principais: Dashboard, Onboarding, EditProfile e AuthContext (rede de proteção para refatorações PC-28/29/30) | TST-011 | Alta | G | 3 | **[CONFIRMADO]** zero testes de componentes para telas críticas de gestão de perfil e diário | Forte + diff | — |

---

## 3. ⚪ Backlog

### 3.1. Técnico, Segurança e Conformidade

| ID | Cat. | Item (Título e Arquivos Afetados) | Origem | Sev. | Esf. | Score | Fase alvo | Status & Evidência | Modelo | Dec. |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: |
| **BL-01** | Segurança | Habilitar `trust proxy` no Express e estender rate limiter para considerar IP + e-mail (`backend/src/app.ts`, `routes/user.routes.ts`) | SEC-006 | Alta | P | 9 | 8 | **[CONFIRMADO]** `trust proxy` não configurado; rate limit apenas por IP | Forte + diff | D-19 |
| **BL-02** | Produto | Navegação por datas no Dashboard e suporte a registro retroativo de refeições (`frontend/src/pages/private/DashboardPage.tsx`, `backend/src/routes/meal.routes.ts`) | GAP-A05 | Crítica | M | 8 | 4.5 | **[CONFIRMADO]** Dashboard restrito ao dia corrente; sem calendário interativo de datas | Forte + diff | D-20 |
| **BL-03** | Arquitetura | Pacote compartilhado de tipos e cálculo nutricional entre frontend e backend (`shared/` em monorepo) | ARCH-007, ARCH-008 | Alta | M | 6 | 5.5 | **[CONFIRMADO]** tipos DTO e cálculos matemáticos duplicados em `frontend/` e `backend/` | Forte + diff | D-17 |
| **BL-04** | Segurança | Revogação de sessão / refresh token rotacionado / migração de JWT para cookies seguros `HttpOnly` | SEC-003, GAP-A03, SEC-018, TECH_DEBT#6 | Alta | M | 6 | 8 | **[CONFIRMADO]** tokens JWT com 7 dias de validade sem blacklist ou revogação | Forte + diff | D-02 |
| **BL-05** | Produto/Auth | Fluxo de recuperação de senha com envio de e-mail e token assinado com expiração de 30 minutos | GAP-A01 | Alta | M | 6 | 6 | **[CONFIRMADO]** rotas e telas de recuperação de senha inexistentes | Forte + diff | D-03 |
| **BL-06** | Produto/Auth | Login social (OAuth2 via Google e Apple) integrado à autenticação do backend | GAP-A11 | Alta | M | 6 | 6 | **[CONFIRMADO]** apenas login local por e-mail/senha suportado | Forte + diff | D-03 |
| **BL-07** | Segurança | Configuração de Content Security Policy (CSP) rigorosa via Helmet (`backend/src/app.ts:16`) | SEC-019 | Média | P | 6 | 8 | **[CONFIRMADO]** Helmet ativo com configuração padrão sem CSP ajustada para APIs/SPA | Econômico | — |
| **BL-08** | Observabilidade | Logging HTTP estruturado em JSON com correlation ID e tempo de resposta (`backend/src/server.ts`) | ARCH-020 | Média | P | 6 | 8 | **[CONFIRMADO]** logs utilizam exclusivamente `console.log` em texto desestruturado | Econômico | — |
| **BL-09** | Arquitetura | Idempotência do seed de alimentos: migração para deduplicação e índice único parcial (`backend/migrations/`) | ARCH-015 | Média | P | 6 | 4 | **[CONFIRMADO]** reexecução do script de carga gera alimentos repetidos no catálogo | Econômico | D-13 |
| **BL-10** | Privacidade | Exportação e portabilidade de dados do usuário em JSON/CSV (atendimento à LGPD) (`backend/src/routes/user.routes.ts`) | SEC-021, GAP-A04 | Média | M | 4 | 7 | **[CONFIRMADO]** endpoint de download completo do histórico não implementado | Econômico | D-04 |
| **BL-11** | Legal/LGPD | Consentimento explícito de termos e links funcionais de páginas legais no rodapé (`frontend/src/components/layout/Footer.tsx:8`) | SEC-020 | Média | M | 4 | 7 | **[CONFIRMADO]** rodapé contém links fictícios com `href="#"` sem termos de uso reais | Econômico | — |
| **BL-12** | Segurança/Auth | Verificação de e-mail em duas etapas e cadastro com proteção contra enumeração de usuários | GAP-A02, SEC-005 | Média | M | 4 | 6 | **[CONFIRMADO]** registro expõe se e-mail já existe; contas ativadas sem confirmação | Econômico | — |
| **BL-13** | UI/Performance | Paginação infinita / virtual scrolling no combobox de seleção de alimentos (`frontend/src/components/meals/NewMealModal.tsx`) | GAP-A07 | Média | M | 4 | — | **[CONFIRMADO]** lista restrita aos primeiros 50 itens retornados na busca | Econômico | — |
| **BL-14** | UI/UX | Edição inline direta de quantidade dos itens já adicionados ao prato (`frontend/src/components/meals/NewMealModal.tsx`) | GAP-A10 | Baixa | P | 3 | — | **[CONFIRMADO]** alteração de quantidade exige excluir item e selecioná-lo novamente | Econômico | — |
| **BL-15** | Arquitetura | Padronização dos arquivos de migração existentes em formato ESM nativo (`backend/migrations/`) | ARCH-017 | Baixa | P | 3 | — | **[CONFIRMADO]** migrações antigas utilizam `exports.up = ...` (CommonJS) | Econômico | D-13 |
| **BL-16** | Privacidade | Implementação de rotina e política de retenção para expurgo de contas inativas há mais de 2 anos | SEC-022 | Baixa | P | 3 | 7 | **[CONFIRMADO]** ausência de rotina agendada para deleção de contas abandonadas | Econômico | — |
| **BL-17** | Performance | Ajuste de `UV_THREADPOOL_SIZE` no Node.js para otimizar operações concorrentes de hash bcrypt (`backend/src/server.ts`) | PERF-011 | Baixa | P | 3 | — | **[CONFIRMADO]** pool padrão de threads do libuv mantido em 4 | Econômico | — |

---

### 3.2. Features de Produto

| ID | Cat. | Item (Título e Resumo da Feature) | Origem | Impacto | Esf. | Score | Fase alvo | Status & Evidência | Modelo | Dec. |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: |
| **BL-18** | Feature | Copiar refeição ou dia inteiro anterior para o dia de hoje com um clique | FEAT-C03 | Alto | P | 9 | 4.5 | **[CONFIRMADO]** funcionalidade não existente nas rotas ou interface | Econômico | D-20 |
| **BL-19** | Feature | Seção de alimentos recentes e favoritos com acesso rápido no modal de refeição | FEAT-C01 | Alto | M | 6 | 4.5 | **[CONFIRMADO]** busca requer digitação manual a cada refeição | Econômico | D-20 |
| **BL-20** | Feature | Refeições salvas e combos reutilizáveis (ex: "Café da manhã padrão") | FEAT-C02 | Alto | M | 6 | 4.5 | **[CONFIRMADO]** alimentos precisam ser adicionados individualmente | Econômico | D-20 |
| **BL-21** | Feature | Tela e gráfico de evolução de peso e medidas corporais (`body_measurements`) | FEAT-C04 | Alto | M | 6 | — | **[CONFIRMADO]** tabela existe no banco, mas não há tela de visualização gráfica | Econômico | — |
| **BL-22** | Feature | Cadastro de alimentos personalizados pelo próprio usuário | FEAT-C05 | Alto | M | 6 | — | **[CONFIRMADO]** catálogo é estrito somente-leitura; usuário não cria itens | Econômico | D-07 |
| **BL-23** | Feature | Registro diário de consumo de água com meta personalizada | FEAT-C07 | Médio | P | 6 | — | **[CONFIRMADO]** ausência de modelagem e interface para hidratação | Econômico | — |
| **BL-24** | Feature | Leitor de código de barras para busca automática de alimentos via Open Food Facts | FEAT-C06 | Médio | M | 4 | — | **[CONFIRMADO]** busca restrita a texto no catálogo local | Econômico | — |
| **BL-25** | Feature | Aplicativo mobile dedicado desenvolvido com Expo / React Native | FEAT-C11 | Alto | G | 3 | Futura | **[CONFIRMADO]** aplicação opera exclusivamente como web SPA | Forte + diff | D-05 |
| **BL-26** | Feature | Suporte a PWA, manifesto web e modo offline com sincronização em segundo plano | FEAT-C08 | Médio | G | 2 | — | **[CONFIRMADO]** ausência de Service Worker ou manifesto PWA | Econômico | — |
| **BL-27** | Feature | Notificações push na web para lembretes de registro de refeições | FEAT-C09 | Baixo | M | 2 | — | **[CONFIRMADO]** ausência de suporte a Web Push API | Econômico | — |
| **BL-28** | Feature | Distribuição de metas nutricionais específicas por tipo de refeição | FEAT-C10 | Baixo | M | 2 | — | **[CONFIRMADO]** metas são apenas diárias globais | Econômico | — |

---

## 4. Hipóteses Descartadas e Itens Sem Ação

### 4.1. [HIPÓTESE] não confirmadas — fora do backlog

| ID original | Hipótese | Motivo do descarte | Reavaliar quando |
| :--- | :--- | :--- | :--- |
| tests.md **HIPÓTESE-001** | Race condition/deadlock no upsert de metas (`ON CONFLICT ... DO UPDATE`) | Sem reprodução. `INSERT ... ON CONFLICT DO UPDATE` é atômico por linha no PostgreSQL | Houver relato de meta duplicada ou erro de concorrência em produção |
| tests.md **HIPÓTESE-002** | Rate limiter (10/15 min) gerando 429 em testes de integração | Não observado na suíte atual (37 testes passam sem 429) | Executar PC-24 (expansão massiva de testes de integração) |
| TECH_DEBT **#7** `[A VERIFICAR]` | Dependência `brace-expansion` vulnerável | Não descartada: **absorvida e confirmada** em CA-13 com evidência de `npm audit` | — |

### 4.2. Hipóteses já rejeitadas nos próprios relatórios

- architecture **HIPÓTESE-01** (uso de `any` / `as any` no frontend): **Rejeitada** (zero ocorrências encontradas no código).
- architecture **HIPÓTESE-02** (uso de `alert`/`confirm` nativos): **Rejeitada** (zero ocorrências encontradas no código).
- architecture **HIPÓTESE-04** (presença de restrição `UNIQUE` em `foods.name`): **Rejeitada** (não existe constraint unique; reforça necessidade de BL-09).
- architecture **HIPÓTESE-03** (`apiFetch` falha ao receber resposta não-JSON em erros 502): **Confirmada** → incorporada como PC-06.

### 4.3. Verificados como conformes (sem ação)

- **SEC-007** — Isolamento multiusuário nas queries SQL está correto (todas utilizam cláusula explícita `WHERE user_id = $x`). O risco identificado reside exclusivamente na falta de testes automatizados de regressão, convertida no item **PC-18**.
- **SEC-022** — Exclusão de conta com cascateamento está em conformidade (`ON DELETE CASCADE` configurado nas tabelas filhas). Apenas a política preventiva de retenção para contas abandonadas foi mantida como **BL-16**.

### 4.4. Divergências de fato entre relatórios (resolvidas por verificação em 13/10/2026)

| Afirmação divergente | Verificação no código / comando | Resultado real verificado |
| :--- | :--- | :--- |
| tests.md: “12 de 13 testes do front falham” vs architecture/TECH_DEBT: “9 falham” | `npm --prefix frontend test -- --run` | **9 falham / 4 passam** em 3 arquivos (`LoginForm`, `RegisterForm`, `NewMealModal`) + 1 erro MSW não tratado em `StatsPage`. |
| 00-doc-inventory: “lint passa com 0 erros” | `npm run lint` | **Falha com 1 erro e 1 warning** (`prefer-const` e diretiva órfã em `NewMealModal.tsx`). |
| 01-rule-violations V-11: senha “estava na versão anterior” | Consulta a `backend/package.json` | **Ainda presente** na linha 13 no script `db:reset:test`. |
| ROADMAP 2.2: “Página de Estatísticas (`/estatisticas`)” | Análise de `frontend/src/App.tsx:15` | **Não existe rota**: a navegação usa estado React `currentView` via `useState`. |
| AGENTS.md §1: React 19.0.0, Vite 6.0.5, TS 5.6.3 | Análise de `frontend/package.json` | **Versões reais:** React 19.2.8, Vite 8.2.0, TS 6.0.2, Vitest 5.0.3, MSW 2.15.0, TanStack Query 5.101.4. |
| 00-doc-inventory: estrutura documental | Análise de diretórios | `AGENTS.md` na raiz, relatórios em `docs/reviews/`, `CLAUDE.md` e `OPEN_QUESTIONS.md` removidos. Pendência: organizar arquivos `.txt` da raiz. |

### 4.5. Itens Verificados como [NÃO REPRODUZIDO] (fora da priorização)

| ID original | Descrição alegada no relatório | Motivo do status [NÃO REPRODUZIDO] / Evidência técnica |
| :--- | :--- | :--- |
| **SEC-007** (vulnerabilidade ativa de IDOR) | Quebra ativa de isolamento multiusuário em leitura/escrita de dados | As queries em `meal.model.ts` e `user.model.ts` filtram rigorosamente por `WHERE user_id = $x`. Nenhuma query vaza dados sem validação de sessão. O problema real é a **ausência de testes de regressão**, que foi isolada no item **PC-18**. |
| **SEC-022** (falha de exclusão em cascata) | Deleção de conta deixa registros órfãos ou quebra integridade referencial | O schema SQL utiliza `ON DELETE CASCADE` em todas as foreign keys dependentes de `users` (`meals`, `meal_items`, `user_goals`, `body_measurements`). A deleção funciona perfeitamente. Apenas a política de inatividade permaneceu em **BL-16**. |
| **tests.md HIPÓTESE-001** | Deadlock/conflito concorrente em `insertGoal` | `INSERT ... ON CONFLICT (user_id, effective_from) DO UPDATE` é atômico a nível de linha no PostgreSQL e não gera contenção observável. |
| **tests.md HIPÓTESE-002** | Falsos positivos em testes gerados por Rate Limiting (429) | A suíte de 37 testes roda inteira no ambiente isolado sem atingir o limitador de requisições. |

---

## 5. Decisões de Arquitetura e Negócio (D-01 a D-20 Formalizadas)

> [!NOTE]
> Todas as 20 decisões pendentes foram formalizadas pelo desenvolvedor e definem as regras inegociáveis de implementação para as Fases 4, 4.5, 5, 5.5, 6, 7 e 8.

| ID | Tópico | Decisão Formalizada e Regras de Implementação | Itens Afetados / Status |
| :--- | :--- | :--- | :--- |
| <a id="d-01"></a>**D-01** | **Estratégia de fuso horário** | **Servidor fixa fuso (Opção A) + cliente envia `?date=` (Opção B):** Servidor é a autoridade de fuso (`America/Sao_Paulo`) via `backend/src/utils/date.ts` (`APP_TIMEZONE` e `todayInAppTz()`). Datas civis (YYYY-MM-DD) tratadas estritamente como string (sem `toISOString().split('T')[0]`). Janelas diárias no SQL via filtro por faixa compatível com índice: `meal_time >= ($1::date)::timestamp AT TIME ZONE $tz AND meal_time < (($1::date + 1))::timestamp AT TIME ZONE $tz`. Agrupamento de estatísticas com `(meal_time AT TIME ZONE $tz)::date`. Query `?date=` validada com Zod (YYYY-MM-DD, data real, 2000-01-01 a hoje+1). Frontend monta data local por componentes numéricos (`getFullYear/getMonth/getDate`). Testes passam com `TZ=UTC` e `TZ=America/Sao_Paulo`. Opção C (fuso por usuário) fora de escopo. | CA-04 ([CORRIGIDO]), CA-14 ([CORRIGIDO]), BL-02 |
| <a id="d-02"></a>**D-02** | **Revogação de sessão** | **Adiada para a Fase 8:** Não implementar `token_version` agora para evitar retrabalho com cookie `HttpOnly` + refresh token rotacionado em banco na Fase 8. A Fase 8 é bloqueante para qualquer deploy público. PC-19 (remover biometria do `localStorage`) continua valendo para execução imediata. | BL-04 (Fase 8), PC-19 (Fase 4) |
| <a id="d-03"></a>**D-03** | **Prioridade das features de autenticação** | **Manter na Fase 6 (pós-Fases 4, 4.5 e 5):** Ordem sequencial estrita: BL-12 (confirmação de e-mail em duas etapas + cadastro sem enumeração) → BL-05 (recuperação de senha) → BL-06 (OAuth social). Recuperação de senha depende de e-mail verificado e provedor transacional da Fase 8. | BL-12, BL-05, BL-06 (Fase 6) |
| <a id="d-04"></a>**D-04** | **Exportação de dados / LGPD** | **Severidade Média/M na Fase 7:** Bloqueante para lançamento público (LGPD art. 18 - direitos do titular). Formato: download completo em JSON estruturado (principal) e CSV (opcional). | BL-10 (Fase 7) |
| <a id="d-05"></a>**D-05** | **App mobile** | **Fora do escopo da branch atual:** Sequência de evolução: web estável → pacote compartilhado `shared/` (D-17) → Expo mobile. Manter convenção única `.agents/skills/` (proibido criar workflows). Arquivos `.txt` soltos na raiz movidos para `docs/archive/` com `git mv` (PC-16), sem apagar. | BL-25, PC-16 |
| <a id="d-06"></a>**D-06** | **Código morto vs correção de estilo** | **Excluir primeiro (PC-31 antes de PC-25):** Antes de excluir, provar desuso com busca no código e build verde. Exclusões feitas com `git rm` rastreável (nunca `rm`); dependências órfãs removidas com `npm uninstall` em commit isolado. Só corrigir estilo no que permanecer ativo. | PC-31, PC-25 (Fase 5) |
| <a id="d-07"></a>**D-07** | **Cache do catálogo de alimentos** | **Cache HTTP seguro por usuário:** Headers `Cache-Control: private, max-age=300` + ETag nativo do Express + `Vary: Authorization`. Proibido cache público e LRU global em memória (rota autenticada; preserva viabilidade futura de alimentos personalizados em BL-22). | PC-03 (Fase 4), BL-22 |
| <a id="d-08"></a>**D-08** | **Contrato público de Food** | **Projeção explícita no SQL (proibido `SELECT *`):** Retornar colunas consumidas pelo frontend + `source` (atribuição da fonte de dados nutricionais). Não expor `external_id` nem `active` (filtrado no servidor com `active = true`). Tipos do frontend sincronizados ao DTO real. | PC-09 (Fase 4), BL-03 |
| <a id="d-09"></a>**D-09** | **Parâmetro de busca** | **Aceitar exclusivamente `search`:** `SPEC.md` §4.2 ajustado para `search` (não aceitar `q`). Validação Zod com teto máximo (`max(100)`) e sanitização de curingas `%`, `_` e `\` na montagem da query `ILIKE`. | CA-15 ([CORRIGIDO]), SPEC §4.2 |
| <a id="d-10"></a>**D-10** | **Tratamento de erros 500** | **Padrão centralizado completo com classes de erro:** Criar classes tipadas `AppError` com `statusCode` e mensagem pública (validação 400, não autorizado 401, não encontrado 404, conflito 409) e `asyncHandler` próprio sem dependências externas. Controllers chamam `next(err)`. O `errorHandler` central responde `{ success: false, error: ... }`. Erros internos não tratados retornam 500 com mensagem genérica (detalhes apenas no log do servidor). Códigos Postgres mapeados: 23505 → 409, 23503 → 409, 22P02 → 400. | CA-10 ([CORRIGIDO]) |
| <a id="d-11"></a>**D-11** | **Limpeza do banco de testes** | **Exceção explícita no AGENTS.md §4 restrita a hook `after`:** Permitido exclusivamente `DELETE FROM users WHERE email LIKE 'tester-%'` (cascateamento remove registros dependentes). Trava de runtime obrigatória checando se `current_database()` termina com `_test` antes de deletar (abortar caso contrário). Proibido `TRUNCATE` e `DROP`. Documentado em `TESTING.md` e `AGENTS.md` §4. | PC-14 (Fase 4), AGENTS.md, TESTING.md |
| <a id="d-12"></a>**D-12** | **Expurgar o histórico do Git** | **Adiado pelo desenvolvedor até a finalização desta branch:** O commit `24d1ce65` já é ancestral da `main`; expurgo via `git filter-repo` deve ser executado globalmente no repositório após o merge da branch para não causar divergência de DAG nem invalidar o PR. CA-06 fica fora dos lotes automáticos. | CA-06 (Pós-Merge) |
| <a id="d-13"></a>**D-13** | **Editar migrações já aplicadas** | **Migrações são imutáveis após aplicadas:** Proibido alterar arquivos existentes em `backend/migrations/`. BL-09 (deduplicação e índice parcial de alimentos) e BL-15 (migrações legadas) devem ser implementados exclusivamente via novas migrações versionadas. | BL-09, BL-15 |
| <a id="d-14"></a>**D-14** | **Severidades divergentes** | **Valores consolidados adotados:** Adotadas integralmente as severidades do BACKLOG.md (Média para PC-04, PC-09, PC-10, PC-22 e BL-09; Alta para PC-18 e PC-24). | PC-04, PC-09, PC-10, PC-18, PC-22, PC-24, BL-09 |
| <a id="d-15"></a>**D-15** | **Fórmula de macros para IMC alto e metas automáticas** | **Regras de negócio de saúde registradas no `SPEC.md`:** Massa de referência: se houver % de gordura, massa magra ($peso \times (1 - \%gordura)$); senão, se $\text{IMC} \ge 30$, peso ajustado: $PI + 0,25 \times (peso - PI)$ com $PI = 22,5 \times altura^2$; senão, peso atual. Proteína: $1,6 \text{ g/kg}$ da massa de referência (máx 35% kcal); Gordura: 25% kcal; Carboidrato: restante. Ordem de ajuste se carboidrato < 20%: reduz gordura até 20% → depois reduz proteína até $1,2 \text{ g/kg}$ da massa de referência. Invariantes: soma de kcal em $\pm 1\%$, sem macros negativos, carb nunca zerado. Pisos calóricos (1500M / 1200F) mantidos. | CA-16 ([CORRIGIDO]), SPEC §3.2 |
| <a id="d-16"></a>**D-16** | **Roteador antes do code-splitting** | **Adotar `react-router` v7 (PC-21 antes de PC-20):** Modo data router (`createBrowserRouter`). Code-splitting via `lazy` nativo das rotas + `manualChunks` de vendor no Vite. Rotas mapeadas: `/login`, `/cadastro`, `/onboarding`, `/`, `/estatisticas`, `/perfil`, reservando `/diario/:date` (D-20). Rotas protegidas via layout route. Deploy com fallback para `index.html`. | PC-21, PC-20 (Fase 4) |
| <a id="d-17"></a>**D-17** | **Pacote compartilhado de tipos** | **Fase própria (Fase 5.5) pós-Fase 5 e pré-Mobile:** Monorepo npm workspaces com pacote `shared/`, mantendo schemas Zod puros como fonte da verdade (`z.infer`). Schemas do backend não devem importar Express. Cálculo nutricional só é compartilhado após paridade completa de testes. Estrutura do monorepo mantida nesta branch. | BL-03 (Fase 5.5) |
| <a id="d-18"></a>**D-18** | **Fonte única de dívidas** | **`docs/BACKLOG.md` é a única fonte viva:** `docs/TECH_DEBT.md` arquivado em `docs/archive/` com cabeçalho "ARQUIVADO — ver BACKLOG.md". Referências atualizadas no ROADMAP. | PC-16 (Fase 4) |
| <a id="d-19"></a>**D-19** | **SSL estrito e trust proxy** | **Configuração segura por env:** Em produção, pool usa `ssl: { rejectUnauthorized: true }`, carregando CA via `DB_SSL_CA` quando definida; relaxar só com `DB_SSL_REJECT_UNAUTHORIZED=false` explícito com log de aviso. Variáveis validadas no Zod de env e documentadas em `.env.example`. BL-01 mantido na Fase 8 (`TRUST_PROXY` configurado como número de saltos, nunca `true`). | CA-05 ([CORRIGIDO]), BL-01 (Fase 8) |
| <a id="d-20"></a>**D-20** | **Navegação por data e recursos do diário** | **Criação da Fase 4.5 — Diário Completo:** Alocada entre a Fase 4 e a Fase 5. Agrupa BL-02 (navegação histórica por data `/diario/:date` e registro retroativo), BL-18 (copiar refeição/dia), BL-19 (alimentos recentes/favoritos) e BL-20 (refeições salvas e combos). Pré-requisitos: fuso D-01 e roteador D-16. | BL-02, BL-18, BL-19, BL-20 (Fase 4.5) |

---

## 6. Tabela de Conferência e Rastreabilidade Completa

Mapeamento integral de todos os achados dos 7 relatórios de revisão em relação aos itens consolidados no Backlog:

| Relatório de Origem | Total de IDs | IDs Originais Catalogados | Destino no BACKLOG / Status |
| :--- | :---: | :--- | :--- |
| **security.md** | 23 | SEC-001 a SEC-023 | SEC-001 (CA-01), SEC-002 (CA-06), SEC-003 (BL-04), SEC-004 (CA-11, PC-08), SEC-005 (PC-08, BL-12), SEC-006 (BL-01), SEC-007 (§4.3 Conforme / PC-18), SEC-008 (PC-07), SEC-009 (CA-11), SEC-010 (CA-12), SEC-011 (CA-10), SEC-012 (CA-15), SEC-013 (CA-11), SEC-014 (CA-05), SEC-015 (CA-11), SEC-016 (CA-13), SEC-017 (PC-04), SEC-018 (PC-19, BL-04), SEC-019 (BL-07), SEC-020 (BL-11), SEC-021 (BL-10), SEC-022 (§4.3 Conforme / BL-16), SEC-023 (PC-13) |
| **performance.md** | 18 | PERF-001 a PERF-018 | PERF-001 (PC-09), PERF-002 (PC-10), PERF-003 (PC-09), PERF-004 (PC-22), PERF-005 (PC-10), PERF-006 (PC-11), PERF-007 (PC-09), PERF-008 (PC-02), PERF-009 (PC-03), PERF-010 (PC-04), PERF-011 (BL-17), PERF-012 (PC-20), PERF-013 (PC-12), PERF-014 (PC-12), PERF-015 (PC-12), PERF-016 (PC-05), PERF-017 (PC-33), PERF-018 (CA-02) |
| **architecture.md** | 26 | ARCH-001 a ARCH-022 + 4 Hipóteses | ARCH-001 (CA-10), ARCH-002 (PC-17), ARCH-003 (CA-15), ARCH-004 (PC-04), ARCH-005 (CA-04), ARCH-006 (CA-14), ARCH-007 (BL-03), ARCH-008 (BL-03), ARCH-009 (CA-02), ARCH-010 (CA-03), ARCH-011 (PC-30), ARCH-012 (PC-29), ARCH-013 (CA-15, PC-31), ARCH-014 (PC-31), ARCH-015 (BL-09), ARCH-016 (PC-10), ARCH-017 (BL-15), ARCH-018 (PC-11), ARCH-019 (PC-11), ARCH-020 (BL-08), ARCH-021 (PC-26), ARCH-022 (PC-26), HIPÓTESE-01 (§4.2 Rejeitada), HIPÓTESE-02 (§4.2 Rejeitada), HIPÓTESE-03 (PC-06 Confirmada), HIPÓTESE-04 (§4.2 Rejeitada) |
| **product-gaps.md** | 31 | GAP-A01 a A11 (11) + BUG-B01 a B09 (9) + FEAT-C01 a C11 (11) | GAP-A01 (BL-05), GAP-A02 (BL-12), GAP-A03 (PC-06, BL-04), GAP-A04 (BL-10), GAP-A05 (BL-02), GAP-A06 (PC-27), GAP-A07 (BL-13), GAP-A08 (PC-21), GAP-A09 (PC-08), GAP-A10 (BL-14), GAP-A11 (BL-06), BUG-B01 (CA-04), BUG-B02 (CA-09), BUG-B03 (CA-16), BUG-B04 (CA-16), BUG-B05 (CA-14), BUG-B06 (CA-14), BUG-B07 (PC-05), BUG-B08 (CA-15), BUG-B09 (PC-15), FEAT-C01 (BL-19), FEAT-C02 (BL-20), FEAT-C03 (BL-18), FEAT-C04 (BL-21), FEAT-C05 (BL-22), FEAT-C06 (BL-24), FEAT-C07 (BL-23), FEAT-C08 (BL-26), FEAT-C09 (BL-27), FEAT-C10 (BL-28), FEAT-C11 (BL-25) |
| **tests.md** | 14 | TST-001 a TST-012 (12) + 2 Hipóteses | TST-001 (PC-01), TST-002 (CA-14), TST-003 (PC-18), TST-004 (PC-01), TST-005 (CA-03), TST-006 (CA-03), TST-007 (CA-03), TST-008 (PC-13), TST-009 (PC-24), TST-010 (PC-14), TST-011 (PC-34), TST-012 (PC-17), HIPÓTESE-001 (§4.1 Descartada), HIPÓTESE-002 (§4.1 Descartada) |
| **01-rule-violations.md** | 11 | V-01 a V-11 | V-01 (PC-28), V-02 (PC-28), V-03 (PC-29), V-04 (PC-29), V-05 (CA-15), V-06 (CA-15), V-07 (PC-25), V-08 (PC-25), V-09 (PC-25), V-10 (PC-26), V-11 (CA-07) |
| **Total de Achados** | **123** | **100% dos IDs mapeados** | **78 itens consolidados no backlog + 6 hipóteses/verificados em seção própria** |

### Resumo Quantitativo por Grupo e Severidade

| Grupo | Crítica | Alta | Média | Baixa | Alto Imp. | Méd. Imp. | Bx. Imp. | Total de Itens |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. 🔴 Corrigir Agora** | 6 | 10 | 0 | 0 | — | — | — | **16** |
| **2. 🟡 Próximo Ciclo (Fase 4)** | 0 | 8 | 16 | 0 | — | — | — | **24** |
| **2. 🟡 Próximo Ciclo (Fase 5)** | 0 | 4 | 4 | 2 | — | — | — | **10** |
| **3. ⚪ Backlog Técnico** | 1 | 5 | 7 | 4 | — | — | — | **17** |
| **3. ⚪ Backlog Features** | — | — | — | — | 6 | 3 | 2 | **11** |
| **Total Geral** | **7** | **27** | **27** | **6** | **6** | **3** | **2** | **78** |
