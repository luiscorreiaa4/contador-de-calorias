# Guia e Estratégia de Testes (TESTING.md)

Este documento estabelece as diretrizes, comandos, suítes existentes, convenções e o mapeamento do que **não** está coberto pela suíte de testes do **CalorieSync**.

---

## 1. Como Rodar [CONFIRMADO]

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
| **Backend** | `node:test` + `node:assert` + `supertest` via `tsx --test` | **37 testes em 11 arquivos** | ✅ **37 PASSOU / 0 FALHOU** (~9s) | Roda exclusivamente contra o banco `contador_calorias_test`. Todas as suítes passaram com sucesso. |
| **Frontend** | `Vitest 3.0.0` + `React Testing Library` + `MSW 2.7.0` | **13 testes em 5 arquivos** | ⚠️ **4 PASSOU / 9 FALHOU** | 2 arquivos passaram (`LoginForm.test.tsx`, `RegisterForm.test.tsx`), 3 falharam (`NewMealModal.test.tsx`, `StatsPage.test.tsx`, `LoginPage.test.tsx`). |
| **Linter** | `ESLint` | Monorepo completo | ❌ **1 Erro / 1 Warning** | 1 erro (`prefer-const` em `NewMealModal.tsx:298:9` `timeToUse`) e 1 warning (`unused eslint-disable`). |
| **Build** | `tsc -b && vite build` | Frontend | ❌ **Erro de Tipagem TS** | Erro de compatibilidade de tipos no `react-select` em `NewMealModal.tsx(455,19)` e `(461,33)`. |

### Suítes Existentes no Backend (`backend/tests/`) [CONFIRMADO]
1. **Unitários (`tests/unit/nutrition.service.test.ts`):**
   - Validação matemática de cálculo de TMB: Mifflin-St Jeor (masculino e feminino/neutro) e Katch-McArdle (quando % de gordura corporal é fornecido).
   - Validação de TDEE com base nos multiplicadores de nível de atividade.
   - Aplicação de déficit calórico (20% para perda de peso) e superávit (15% para ganho de massa).
   - Validação do piso calórico de segurança (1500 kcal para homens, 1200 kcal para mulheres).
   - Divisão de macronutrientes: 2.0g/kg de proteína, 1.0g/kg de gordura e o saldo em carboidratos.
2. **Integração (`tests/integration/`):**
   - `user.routes.test.ts`: Registro, login, obtenção de perfil, fluxo de onboarding, prévia e atualização de metas com vigência, e exclusão física de conta com validação de senha.
   - `meal.routes.test.ts`: Criação de refeição com múltiplos itens calculados, listagem de refeições do dia (`/today`), atualização completa (com substituição atômica de itens), exclusão e estatísticas por período via `LATERAL JOIN`.
   - `food.routes.test.ts`: Busca de alimentos com tolerância a acentos (`unaccent`) e caixa (`ILIKE`), cálculo de proximidade trigram (`pg_trgm`), paginação (`limit`/`offset`) e bloqueio de criação/edição/deleção por usuários comuns (catálogo somente-leitura).
3. **Carga (`tests/load/autocannon.js`):**
   - Script de estresse com `autocannon` para medição de requisições por segundo e latência da API sob concorrência.

### Suítes Existentes no Frontend (`frontend/src/`) [CONFIRMADO]
1. `src/components/auth/LoginForm.test.tsx`: Renderização, preenchimento, submissão e mensagens de erro via MSW.
2. `src/components/auth/RegisterForm.test.tsx`: Validação de senha mínima, campos obrigatórios e submissão.
3. `src/pages/public/__tests__/LoginPage.test.tsx`: Integração da página de login com redirecionamento.
4. `src/components/meals/NewMealModal.test.tsx`: Abertura do modal, preenchimento e seleção de alimentos. *(Atualmente com 4 falhas devido ao texto do botão de ação ser "CRIAR REFEIÇÃO" e o teste buscar por "Salvar")*.
5. `src/pages/private/__tests__/StatsPage.test.tsx`: Renderização de métricas e gráficos Recharts. *(Atualmente com falha de requisição não interceptada no MSW)*.

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
