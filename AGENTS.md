# AGENTS.md

Instruções e diretrizes operacionais de IA para o projeto **CalorieSync**.

---

## 1. Stack e Versões [CONFIRMADO]
- **Runtime:** Node.js v24.14.0 (mínimo v20+), npm 11.9.0.
- **Frontend:** React 19.2.8, Vite 8.2.1, TypeScript 6.0.2, Tailwind CSS 3.4.19, Radix UI, TanStack Query v5.101.4, Zod 3.24.2, React Router 7.18.4.
- **Backend:** Node.js com Express 4.21.2, TypeScript 5.7.3 (`tsx` 4.23.9), Zod 3.24.2, JWT (`jsonwebtoken` 9.0.2), `bcrypt` 5.1.1, PostgreSQL (driver `pg` 8.13.1, sem ORMs), `compression` 1.8.2.
- **Banco de Dados:** PostgreSQL 14+, migrações puras via `node-pg-migrate` 9.0.0 em `backend/migrations/`.
- **Testes Backend:** Node Native Test Runner (`node:test` + `node:assert` + `supertest` 7.3.0 via `tsx --test`).
- **Testes Frontend:** Vitest 5.0.3 + React Testing Library (RTL) + MSW 2.15.0 + `@vitest/coverage-v8` 5.0.5.

---

## 2. Comandos Principais [CONFIRMADO]
Executar na **raiz** do monorepo:
- `npm run dev:all` — Inicia backend (`:3001`) e frontend (`:5173`) via `concurrently`.
- `npm run server` — Inicia apenas a API backend em modo watch (`tsx`).
- `npm run dev` — Inicia apenas o frontend Vite.
- `npm run setup` — Executa as migrações do banco (`npm --prefix backend run migrate up`).
- `npm run test` — Executa testes do backend em banco isolado (`contador_calorias_test`).
- `npm run test:strict` — Executa backend sem force-exit e mantém sockets ociosos visíveis; obrigatório na verificação final.
- `npm run test:file -- tests/integration/meal_items_batch.test.ts` — Executa um arquivo em modo estrito, com CWD fixo e timeout.
- `npm run test:backend:file <caminho>` — Executa um único arquivo de teste no backend (ex: `tests/integration/meal_items_batch.test.ts`).
- `npm --prefix frontend test` — Executa testes do frontend via Vitest.
- `npm run test:frontend:file <caminho>` — Executa um único arquivo de teste no frontend (ex: `src/components/meals/NewMealModal.test.tsx`).
- `npm run lint` — Valida ESLint em todo o repositório e executa a guarda de cores (`check:colors`).
- `npm --prefix frontend run check:colors` — Executa a guarda de cores do design brutalista (tokens semânticos, ausência de literais/dark:).
- `npm run build` — Compila bundle de produção do frontend (`tsc -b && vite build`).

---

## 3. Convenções Essenciais
1. **Contrato de API Estrito:** Toda resposta HTTP segue `{ success: boolean, data?: unknown, message?: string }`.
2. **Validação Zod Obrigatória:** Todo payload HTTP (body/query/params) validado via middleware Zod na rota (ver `.agents/rules/backend-rules.md`).
3. **Data Fetching:** Toda chamada no React deve usar TanStack Query consumindo funções de `src/services/` (ver `.agents/rules/react-rules.md`).
4. **Arquitetura Backend 4 Camadas:** `routes` → `controllers` (HTTP apenas) → `services` (regras puras) → `models` (SQL puro via `pool.query`).
5. **Estilo Brutalista & Acessibilidade:** Design brutalista (`rounded-none`, contornos firmes), tokens semânticos via CSS Variables, sem alert/confirm nativos (ver `.agents/rules/style-rules.md`).

---

## 4. O que NÃO Fazer (Regras Rígidas)
- ❌ **PROIBIDO Comandos Destrutivos de Banco:** NUNCA execute `DROP TABLE`, `DROP DATABASE` ou `TRUNCATE` sem consentimento explícito prévio do usuário. *(Exceção D-11: no código de teste em hook `after`, é permitido `DELETE FROM users WHERE email LIKE 'tester-%'` com checagem em runtime de que `current_database()` termina em `_test`)*.
- ❌ **PROIBIDO ORMs:** Não instale nem utilize Prisma, Sequelize, TypeORM ou Drizzle; utilize driver `pg` e SQL puro.
- ❌ **PROIBIDO Fetch Manual no React:** Proibido `window.fetch()` nativo fora de `api.ts`, e proibido chamar serviços em `useEffect` para carregar dados de servidor.
- ❌ **PROIBIDO Alert/Confirm Nativos:** Não use `alert()` ou `confirm()`. Use modais acessíveis com focus trap (Radix UI) e tecla `Esc`.
- ❌ **PROIBIDO Modificar Código quando a Tarefa for de Documentação:** Obedeça estritamente o escopo solicitado.
- ❌ **PROIBIDO Banco de Produção/Dev em Testes:** Testes que tocam o banco só podem rodar se o nome terminar em `_test`.
- ❌ **PROIBIDO Testes com Pool Aberto:** Toda suíte que importe pool/app ou módulos que os importem DEVE registrar `closeTestPool()` de `backend/tests/helpers/lifecycle.ts`; passe a limpeza como callback. O helper registra `after` e fecha o pool em `finally`, mesmo se a limpeza falhar.
- ❌ **PROIBIDO Encerramento Registrado Após Asserções:** Use `describe`/`it` e registre o helper antes dos testes. Uma falha antes do registro impede qualquer hook de existir; hooks já registrados não são ignorados automaticamente por AssertionError.
- ❌ **PROIBIDO Runner Avulso ou Sem Limite:** Não invoque `tsx --test`, `npx` ou Vitest diretamente. Use `test`, `test:strict`, `test:file` e os scripts oficiais do frontend, todos com teto global de 300 s (`TEST_PROCESS_TIMEOUT_MS`). Comandos longos adicionais devem passar por `node scripts/bounded-command.mjs <comando> <argumentos>`.

---

## 5. Ponteiros de Documentação e Regras Detalhadas
- **Regras Detalhadas:**
  - Backend: [.agents/rules/backend-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/backend-rules.md)
  - React: [.agents/rules/react-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/react-rules.md)
  - Estilo e UI: [.agents/rules/style-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/style-rules.md)
- **Documentação de Sistema:**
  - Arquitetura & Banco (ER): [docs/ARCHITECTURE.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ARCHITECTURE.md)
  - Especificação e Fórmulas de Negócio: [docs/SPEC.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/SPEC.md)
  - Estratégia de Testes: [docs/TESTING.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/TESTING.md)
  - Planejamento de Fases: [docs/ROADMAP.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ROADMAP.md)
  - Débitos Técnicos e Backlog: [docs/BACKLOG.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/BACKLOG.md) (histórico em [docs/archive/TECH_DEBT.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/archive/TECH_DEBT.md))

SE EXISTIR AUDITORIA.md NA RAIZ E A AUDITORIA NÃO ESTIVER CONCLUÍDA: leia-o inteiro e continue a partir do CHECKPOINT. Modo somente leitura.
