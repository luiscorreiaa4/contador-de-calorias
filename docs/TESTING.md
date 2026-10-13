# Guia e Estratégia de Testes (TESTING.md)

Este documento descreve a arquitetura, ferramentas e procedimentos para execução e escrita de testes automatizados no **CalorieSync**.

---

## 1. Visão Geral da Suíte

| Camada | Ferramentas | Runner | Banco / Mocks | Comando (Raiz) |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | `node:test` + `node:assert` + `supertest` | `tsx --test` | Banco Postgres isolado (`contador_calorias_test`) | `npm run test` |
| **Frontend** | `Vitest` + `React Testing Library` + `MSW` | `vitest run` | MSW (Mock Service Worker) + `jsdom` | `npm --prefix frontend test` |
| **Linter** | ESLint + `typescript-eslint` | `eslint .` | N/A | `npm run lint` |
| **Build & Tipagem** | `tsc` + Vite | `tsc` / `vite build` | N/A | `npm run build` |

---

## 2. Testes de Backend (Node.js + TypeScript)

### Execução
```bash
npm run test
# Ou diretamente na pasta backend:
npm --prefix backend test
```

### Regra Crítica: Banco de Dados Isolado
- **Isolamento Mandatório:** Testes que tocam o banco de dados rodam exclusivamente contra o banco `contador_calorias_test`.
- **Fail-Safe em `backend/src/database/pool.ts`:** Se `NODE_ENV === 'test'` e o banco de dados configurado não terminar com o sufixo `_test`, o pool aborta o processo imediatamente (`process.exit(1)`), impedindo que dados manuais de desenvolvimento ou produção sejam alterados.
- O script injeta automaticamente:
  `cross-env NODE_ENV=test DB_NAME=contador_calorias_test TZ=America/Sao_Paulo tsx --test tests/**/*.test.ts`

### Estrutura de Testes do Backend (`backend/tests/`)
1. **Testes Unitários (`tests/unit/`):**
   - Focados em funções puras de regras de negócio sem tocar o banco.
   - Exemplo: `tests/unit/nutrition.service.test.ts` (validação das fórmulas de TMB Mifflin-St Jeor e Katch-McArdle, TDEE e pisos mínimos de calorias).
2. **Testes de Integração (`tests/integration/`):**
   - Validam rotas HTTP com `supertest` e persistência real no PostgreSQL isolado.
   - Cobrem caminhos felizes (200/201), validação de entrada Zod (400), autenticação JWT (401) e recursos inexistentes (404).
   - Arquivos: `user.routes.test.ts`, `meal.routes.test.ts`, `food.routes.test.ts`.
3. **Testes de Carga (`tests/load/`):**
   - Script `autocannon.js` para aferição de vazão e latência sob concorrência.

---

## 3. Testes de Frontend (React + Vite)

### Execução
```bash
npm --prefix frontend test
# Ou modo watch para desenvolvimento:
cd frontend && npm run test -- --watch
```

### Diretrizes e Boas Práticas
1. **Consultas Baseadas em Acessibilidade (RTL):**
   - Selecione elementos exclusivamente por `getByRole`, `getByLabelText`, `getByText`.
   - **Proibido** selecionar elementos por classes CSS (`.btn-primary`) ou seletores genéricos (`div > button`).
2. **Interceptação de Rede (MSW):**
   - Todas as chamadas de API (`apiFetch`) são interceptadas em nível de rede por MSW (`frontend/src/mocks/server.ts` e `handlers.ts`).
   - Não utilizamos mocks manuais de `global.fetch` dentro dos testes.
3. **Tratamento de Estados Assíncronos:**
   - Testes cobrem os fluxos de sucesso e estados de erro/carregamento renderizados via React Query.
4. **Arquivos Cobertos:**
   - `LoginForm.test.tsx` e `RegisterForm.test.tsx`: submissão, validação Zod e mensagens de erro.
   - `NewMealModal.test.tsx`: abertura de modal, busca de alimentos, seleção e salvamento de refeição.
   - `StatsPage.test.tsx`: renderização de gráficos, histórico e cálculo de médias.
   - `LoginPage.test.tsx`: integração de página pública e redirecionamento.

---

## 4. Integração Contínua (CI)

O repositório conta com pipeline automatizado via **GitHub Actions** em `.github/workflows/ci.yml`. A cada push ou Pull Request na branch principal, o pipeline:
1. Sobe um contêiner oficial do PostgreSQL como service.
2. Roda `npm run lint` em todo o monorepo.
3. Executa as migrações do banco com `npm run setup`.
4. Roda os testes de backend (`npm run test`).
5. Roda os testes de frontend (`npm --prefix frontend test`).
6. Valida o build de produção (`npm run build`).
