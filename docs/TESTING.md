# Guia e Estratégia de Testes (TESTING.md)

Este documento estabelece as diretrizes, comandos, suítes existentes, convenções e o mapeamento do que **não** está coberto pela suíte de testes do **CalorieSync**.

---

## 1. Como Rodar [CONFIRMADO]

Os comandos oficiais atuais são `npm test`, `npm run test:strict`, `npm run test:file -- tests/integration/meal_items_batch.test.ts` e `npm run test:frontend` (ou `npm --prefix frontend test`). Os aliases `test:backend:file` e `test:frontend:file` permanecem disponíveis. Não invoque `tsx --test`, `npx` ou Vitest avulsos. Todos os comandos de teste usam o wrapper de processos com teto global de 300 s, ajustável por `TEST_PROCESS_TIMEOUT_MS` (1..3600000 ms). Comandos longos adicionais usam `node scripts/bounded-command.mjs <comando> <argumentos>`.

O runner resolve os caminhos a partir do script, fixa o CWD, `NODE_ENV=test`, `DB_NAME=contador_calorias_test` e o fuso. O `.env` vem exclusivamente do caminho absoluto do backend; variáveis já definidas no processo prevalecem. Variáveis obrigatórias vazias/ausentes falham via Zod sem imprimir seus valores. Não altere o `.env` para testes negativos: passe a variável vazia no ambiente do processo filho.

Toda suíte que alcance pool/app, inclusive por services, models ou helpers, registra `closeTestPool()` de `backend/tests/helpers/lifecycle.ts` antes dos testes; passe a limpeza como callback. O helper executa a limpeza em `try` e `await pool.end()` em `finally`. Não combine encerramentos próprios com o helper. A guarda AST `node scripts/check-test-hygiene.mjs`, integrada ao lint, verifica imports transitivos locais.

`test` usa `--test-force-exit` como proteção extra. `test:strict` e `test:file` não usam essa flag e desabilitam `allowExitOnIdle` para expor sockets esquecidos. Execute strict na verificação final e no CI. O timeout de 30 s do Node é herdado pelos subtestes e não substitui o teto global: handles após o fim dos testes ainda podem manter o processo vivo. Frontend: `vitest run`, teste/hook 10 s e teardown 5 s; MSW fecha em `afterAll`.

Os resultados históricos abaixo não representam a validação desta mudança; os resultados atuais e a tabela completa estão em [TEST_HYGIENE_REPORT.md](TEST_HYGIENE_REPORT.md).

Comandos executados a partir da **raiz** do monorepo:

```bash
# 1. Testes de Backend (Node Native Test Runner contra banco isolado)
npm run test

# 2. Testes de Frontend (Vitest + RTL + MSW)
npm --prefix frontend test

# 3. Validação de Linter (ESLint em todo o projeto)
npm run lint

# 4. Validação de Build e Tipagem (TypeScript + Vite)
npm run build
```

---

## 2. O Que Existe e Status Verificado em Sessão [CONFIRMADO]

Abaixo está o status real verificado através da execução direta dos comandos no ambiente local:

| Camada | Ferramenta / Runner | Total de Testes | Status Atual | Detalhes / Observações |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | `node:test` + `node:assert` + `supertest` via `tsx --test` | **110 testes em 27 suítes** | ✅ **110 PASSOU / 0 FALHOU** (~10s) | Roda exclusivamente contra o banco `contador_calorias_test` com trava `_test` e limpeza via `cleanupTestData`. |
| **Frontend** | `Vitest 5.0.3` + `React Testing Library` + `MSW 2.15.0` + `@vitest/coverage-v8` | **24 testes em 8 arquivos** | ✅ **24 PASSOU / 0 FALHOU** (~7s) | Suporte completo a relatório de cobertura v8 via `npm --prefix frontend run test:coverage`. |
| **Linter** | `ESLint 10` + `check-test-hygiene.mjs` | Monorepo completo | ✅ **0 Erros / 0 Warnings** | Higiene de testes, guarda AST de pool e regras de código sem apontamentos. |
| **Build** | `tsc -b && vite build` | Frontend | ✅ **Compilação com Sucesso** | Code-splitting por rota com chunks separados de vendor (`react-vendor`, `tanstack-vendor`, etc.). |

### Suítes Existentes no Backend (`backend/tests/`) [CONFIRMADO]
1. **Unitários (`tests/unit/`):**
   - `nutrition.service.test.ts`: Validação matemática de cálculo de TMB (Mifflin-St Jeor, Katch-McArdle com LBM), TDEE, superávit/déficit e distribuição de macros para IMC alto conforme D-15.
   - `meal.test.ts`: Cálculos nutricionais proporcionais de itens (`calculateItemNutrients`) para porções em gramas, ml e unidades.
   - `auth_middleware.test.ts`: Rejeição de segredos legados/fallback (`fallback_jwt_secret`), autenticação estrita com `env.JWT_SECRET` e cabeçalhos ausentes.
   - `date_utils.test.ts`: Conformidade de datas civis e fuso horário `America/Sao_Paulo` (D-01).
   - `db_cleanup.test.ts`: Trava de segurança de runtime checando `_test` e padrão `tester-%` (D-11 / PC-14).
   - `input_limits.test.ts`: Validação de tetos de payload e sanitização Zod (CA-11).
   - `password_security.test.ts`: Política de senha forte e mitigação de timing attacks via compare dummy (PC-08).
   - `pool_ssl.test.ts`: Validação de SSL estrito em produção com suporte a certificado CA customizado (CA-05 / D-19).
   - `reset_db_guard.test.ts`: Trava de segurança impedindo execução de reset de banco fora do ambiente isolado (CA-12).
   - `routes_registration.test.ts`: Verificação de unicidade no registro de sub-roteadores no Express (PC-04).
   - `validate_middleware.test.ts`: Validação particionada de body, query e params (CA-15).
   - `user.schema.test.ts`: Validação de contratos de schemas Zod para registro, login, onboarding, atualização e exclusão.
2. **Integração (`tests/integration/`):**
   - `user.routes.test.ts`: Registro, login, obtenção de perfil, fluxo de onboarding, prévia e atualização de metas com vigência, atualização protegida de perfil com senha e exclusão com senha.
   - `meal.routes.test.ts`: Criação de refeição com múltiplos itens, listagem de refeições do dia (`/today`), atualização com substituição atômica, exclusão e estatísticas por período.
   - `food.routes.test.ts`: Busca de alimentos com tolerância a acentos (`unaccent`) e caixa (`ILIKE`), proximidade trigram (`pg_trgm`), paginação, cache privado HTTP (PC-03 / D-07) e projeção explícita de colunas com `source` (PC-09 / D-08).
   - `authorization.test.ts`: Testes rigorosos de autorização multiusuário (IDOR) cobrindo isolamento total de refeições, metas e dados de perfil (PC-18 / D-14).
   - `user_transactions.test.ts`: Transações atômicas com `BEGIN`/`COMMIT`/`ROLLBACK` e rollback automático sob falhas em onboarding, perfil e metas (PC-17).
   - `health.routes.test.ts`: Probe ativo de saúde do banco de dados no contrato `{ success, data }` (PC-11).
   - `meal_items_batch.test.ts`: Inserção multi-row em lote de itens de refeição (PC-22 / D-14).
3. **Carga (`tests/load/autocannon.js`):**
   - Script de estresse com `autocannon` para medição de requisições por segundo e latência da API sob concorrência.

### Suítes Existentes no Frontend (`frontend/src/`) [CONFIRMADO]
1. `src/tests/router.test.tsx`: Testes de roteamento SPA declarativo via `react-router` v7, redirecionamentos de rotas públicas/protegidas e sincronização de histórico (PC-21 / D-16).
2. `src/tests/api.test.ts`: Resiliência contra respostas não-JSON (502 HTML) e sincronização do evento global `auth:unauthorized` sob status 401 (PC-06).
3. `src/tests/auth_storage.test.tsx`: Sanitização do `localStorage` mantendo apenas metadados de sessão não-sensíveis e hidratação em memória de dados biométricos (PC-19).
4. `src/tests/LoginPage.test.tsx`: Renderização da tela de login e alternância de abas.
5. `src/components/auth/LoginForm.test.tsx`: Renderização, preenchimento, submissão e tratamento de erros via MSW.
6. `src/components/auth/RegisterForm.test.tsx`: Validação de senha forte, campos obrigatórios, conflito de e-mail e cadastro com sucesso.
7. `src/components/meals/NewMealModal.test.tsx`: Abertura do modal, autocomplete de alimentos com cancelamento de requisição e preservação de macros base ao editar refeição (PC-15).
8. `src/pages/private/__tests__/StatsPage.test.tsx`: Renderização de métricas e gráficos nutricionais via Recharts.

---

## 3. Convenções e Regras de Testes [CONFIRMADO]

### Backend: Isolamento Mandatório de Banco
- **Fail-Safe no Pool (`backend/src/database/pool.ts`):** O pool de conexões possui uma trava em código que verifica:
  ```ts
  if (process.env.NODE_ENV === 'test' && !dbName.endsWith('_test')) {
    console.error('FATAL: Testes devem rodar exclusivamente em banco terminado em _test!');
    process.exit(1);
  }
  ```
  Se qualquer desenvolvedor ou agente tentar rodar a suíte contra `contador_calorias` de desenvolvimento, o runner aborta instantaneamente.
- **Limpeza Determinística Entre Testes (D-11 / PC-14):**
  - Conforme decisão D-11, vigora uma exceção explícita e restrita à proibição de deleções em massa do `AGENTS.md` §4:
  - É permitido exclusivamente no código de testes (hook `after`):
    ```sql
    DELETE FROM users WHERE email LIKE 'tester-%';
    ```
    (O `ON DELETE CASCADE` do esquema cuida da remoção das tabelas filhas `meals`, `meal_items`, `user_goals`, `body_measurements`).
  - **Trava de Runtime Obrigatória:** O teste deve checar ativamente se `current_database()` termina com `_test` antes de deletar (abortar caso contrário).
  - É terminantemente proibido o uso de `TRUNCATE` ou `DROP TABLE/SCHEMA`.

### Frontend: Acessibilidade e MSW
- **Seleção por Acessibilidade (RTL):** Elementos devem ser buscados via `getByRole`, `getByLabelText`, `getByPlaceholderText`, simulando como o usuário interage. **É terminantemente proibido** buscar elementos por classes CSS (`.btn`, `.bg-primary`) ou seletores hierárquicos genéricos (`div > span`).
- **Interceptação de Rede (MSW):** Todas as chamadas de API são interceptadas em `src/mocks/handlers.ts`. Não são permitidos mocks manuais de `global.fetch` em arquivos de teste individuais.

---

## 4. O Que NÃO Está Coberto (Gaps da Suíte) [CONFIRMADO]

Os seguintes itens foram verificados no código e **não possuem cobertura de testes automatizados**:

### No Frontend:
1. **`DashboardPage.tsx`:** A tela principal (resumo de calorias de hoje, barras de progresso de macronutrientes e listagem de refeições consumidas) não possui suite de teste no Vitest.
2. **`ProfilePage.tsx` / `EditProfilePage.tsx`:** Telas de visualização e edição de perfil do usuário (atualização de peso, altura, e-mail e senha) não possuem testes de frontend.
3. **`OnboardingPage.tsx` / `OnboardingFlow.tsx`:** O fluxo de primeiro acesso onde o usuário preenche suas medidas e gera o cálculo inicial de metas não possui teste automatizado.
4. **Modais de Ação Específica:**
   - `EditMealModal.tsx`: Fluxo de edição de refeição existente.
   - `GoalsModal.tsx`: Modal de alteração de metas automáticas/manuais.
   - `MeasurementModal.tsx`: Modal de registro de novas medições de peso/gordura.
   - `DeleteAccountModal.tsx`: Confirmação com senha para exclusão definitiva de conta.
5. **Tema Escuro / Claro:** Não há testes visuais ou de regressão para alternância do tema via tokens de CSS.

### No Backend:
1. **Rotas de Medições Corporais:** Não há arquivo `measurement.routes.test.ts` dedicado. As medições em `body_measurements` são testadas apenas como efeito colateral do onboarding ou updateProfile.
2. **Rate Limiting em Cenário Real:** Os limites de requisição do `express-rate-limit` não são testados na suíte de integração para evitar falsos positivos nos testes normais.

### Ponta a Ponta (E2E):
1. **Testes E2E (Playwright / Cypress):** Inexistentes no repositório. Não há testes cobrindo o fluxo completo real com navegador interagindo com o backend vivo e banco de dados simultaneamente.
2. **Race Conditions de Concorrência:** Comportamento sob múltiplos acessos simultâneos ao mesmo registro de refeição não possui teste específico de isolamento de transação.
