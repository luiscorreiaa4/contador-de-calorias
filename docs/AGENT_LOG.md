# Diário de Execução de Agente (AGENT_LOG.md)

Este arquivo registra a execução autônoma em lote do plano de correção dos itens de Corrigir Agora (CA).

## 0. Linha de Base (Executada em 15/10/2026)

- **Backend Tests (`npm run test` / `npm --prefix backend test`):**
  - **Status:** PASSOU (37 testes passaram, 0 falhas, 11 suítes).
- **Backend Build (`npm --prefix backend run build`):**
  - **Status:** PASSOU (`tsc` código 0).
- **Lint Monorepo / Frontend (`npm run lint` / `npm --prefix frontend run lint`):**
  - **Status:** PASSOU (código 0).
- **Frontend Build (`npm run build` / `npm --prefix frontend run build`):**
  - **Status:** FALHOU (código 1).
  - **Erro:** TS2322 em `src/components/meals/NewMealModal.tsx:454,460` (generics incompatíveis do `react-select`).
- **Frontend Tests (`npm --prefix frontend test`):**
  - **Status:** FALHOU (3 arquivos falharam, 2 passaram; 9 testes falharam, 4 passaram; 1 erro não tratado do MSW em `StatsPage.test.tsx`).
  - **Falhas:**
    - `LoginForm.test.tsx`: 3 testes falharam.
    - `RegisterForm.test.tsx`: 4 testes falharam.
    - `NewMealModal.test.tsx`: 2 testes falharam.
    - `StatsPage.test.tsx`: Unhandled rejection do MSW.

---

## 1. Execução dos Itens (Ordem: CA-02, CA-08, CA-03, depois CA em ordem numérica)

### CA-02: Corrigir generics do react-select em NewMealModal.tsx
- **Status:** CORRIGIDO
- **Ação:** Criação do tipo `FoodOption` e aplicação explícita de generics `<FoodOption, false>` no componente `Select` e em `CustomMenuList` (`MenuListProps<FoodOption, false>`).
- **Validação:** `tsc -b && vite build` passou com sucesso (0 erros). Testes do backend e lint passaram com sucesso.
- **Commit:** `c81d59f`

### CA-08: Restaurar npm run lint (prefer-const e diretivas órfãs)
- **Status:** CORRIGIDO
- **Ação:** Variável `timeToUse` confirmada como `const`, diretiva órfã na `:181` removida e escopo de lint mantido limpo com 0 erros e 0 warnings.
- **Validação:** `npm run lint` passou com código 0 em todo o repositório.
- **Commit:** `fc7416c`

### CA-03: Restaurar suíte do frontend (MSW + RTL)
- **Status:** CORRIGIDO
- **Ação:**
  - `frontend/src/mocks/handlers.ts`: corrigido contrato de `/foods` para retornar `{ foods: [...], total: 2 }` e adicionado handler para `GET /meals/stats`.
  - `frontend/src/components/auth/LoginForm.test.tsx`: alinhadas consultas por acessibilidade com texto do botão (`Acessar Dashboard`), label (`Email`) e mensagens de validação.
  - `frontend/src/components/auth/RegisterForm.test.tsx`: alinhada consulta da label `Email` e mensagem de validação correspondente.
  - `frontend/src/components/meals/NewMealModal.test.tsx`: alinhadas buscas case-insensitive para alimento (`ARROZ BRANCO`), label `NOME`, unidade `150 G` e botão `CRIAR REFEIÇÃO`.
- **Validação:** `npm --prefix frontend test` com 13/13 testes passando (5 arquivos, 0 erros). `npm run test`, `npm run lint` e `npm run build` 100% verdes.
- **Commit:** `7cb617a`

### CA-01: Remover fallback de JWT_SECRET
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/middlewares/auth.ts`: remoção de `|| 'fallback_jwt_secret'` e uso estrito de `env.JWT_SECRET`.
  - `backend/src/services/user.service.ts`: remoção de `|| 'fallback_jwt_secret'` e uso estrito de `env.JWT_SECRET`.
  - `backend/tests/unit/auth.middleware.test.ts`: teste unitário criado garantindo rejeição (401) de tokens assinados com chaves fallback inseguras e validação com `env.JWT_SECRET`.
- **Validação:** 40 testes de backend passando (12 suítes), lint limpo e build verde.
- **Commit:** `6d59b0f`

### CA-04: Fuso horário em vigência de metas (Intl America/Sao_Paulo)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/utils/date.ts`: criado módulo de data com `getSaoPauloDateString` fixando `America/Sao_Paulo` via `Intl.DateTimeFormat('en-CA', ...)` (conforme decisão D-01).
  - `backend/src/services/user.service.ts`: substituídas chamadas a `toISOString().split('T')[0]` por `getSaoPauloDateString()` nas linhas 106, 268 e 288.
  - `backend/src/services/meal.service.ts`: substituída chamada a `toISOString().split('T')[0]` por `getSaoPauloDateString(d)` na linha 175.
  - `backend/tests/unit/date.util.test.ts`: teste unitário reproduzindo a virada indevida de data após as 21h BRT e comprovando a estabilidade com `getSaoPauloDateString`.
- **Validação:** 43 testes de backend passando (13 suítes), lint limpo e build verde.
- **Commit:** `0278db0`

### CA-05: SSL estrito no pool de conexões (rejectUnauthorized: true)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/config/env.ts`: adicionada variável opcional `DB_SSL_CA` ao `envSchema`.
  - `backend/src/database/pool.ts`: implementada e exportada função `getSslConfig()` que aplica SSL estrito com `rejectUnauthorized: true` em ambiente de produção, suportando CA personalizado via `DB_SSL_CA` (conforme decisão D-19).
  - `backend/tests/unit/pool.ssl.test.ts`: testes unitários garantindo que `rejectUnauthorized` nunca seja `false`, cobrindo cenários com e sem `DB_SSL_CA`.
- **Validação:** 46 testes de backend passando (14 suítes), lint limpo e build verde.
- **Commit:** `8863ad8`

### CA-06: Rotacionar segredos vazados no commit 24d1ce65
- **Status:** PULADO
- **Motivo:** Bloqueado por D-12 (decisão sobre expurgo definitivo do histórico via `git filter-repo`/BFG vs apenas rotação pendente de definição do desenvolvedor).

### CA-07: Remover senha hardcoded do script db:reset:test
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/package.json`: substituída a connection string com senha em texto puro por `node-pg-migrate --database-url-var DATABASE_URL_TEST up`.
  - `backend/.env.example`: documentada a variável `DATABASE_URL_TEST`.
- **Validação:** Verificado cumprimento das regras de segurança; 46 testes de backend passando (14 suítes), lint limpo e build verde.
- **Commit:** `d503412`

### CA-09: Ajuste do cálculo de idade (calculateAge com parse local YYYY-MM-DD)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/services/nutrition.service.ts`: ajustada a função `calculateAge` para extrair diretamente os componentes de ano, mês e dia no padrão `YYYY-MM-DD`, prevenindo o recuo de 1 dia gerado pelo parse UTC padrão do JavaScript no fuso horário brasileiro.
  - `backend/tests/unit/nutrition.service.test.ts`: criados testes unitários validando limites de aniversário, vésperas e virada de ano em 01 de janeiro.
- **Validação:** 48 testes de backend passando (15 suítes), lint limpo e build verde.
- **Commit:** `1df3505`

### CA-10: Mascarar mensagens internas do banco de dados em respostas HTTP 500
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/controllers/user.controller.ts`, `backend/src/controllers/meal.controller.ts`, `backend/src/controllers/food.controller.ts`: atualizados todos os blocos `catch` para que qualquer resposta de erro com status HTTP 500 retorne estritamente `'Erro interno no servidor.'`, impedindo vazamento de mensagens internas do PostgreSQL (sintaxe, tipagem, constraints ou tabelas).
  - `backend/tests/integration/meal.routes.test.ts`: adicionado teste de integração reproduzindo requisição com ID inválido e validando que o corpo da resposta 500 não expõe a mensagem nativa do Postgres.
- **Validação:** 49 testes de backend passando (15 suítes), 13 testes de frontend passando (5 suítes), lint limpo (0 erros / 0 avisos) e build de produção verde.
- **Commit:** `0c05d36`
