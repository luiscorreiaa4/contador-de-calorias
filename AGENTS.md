# AGENTS.md

Instruções e diretrizes operacionais de IA para o projeto **CalorieSync**.

---

## 1. Stack e Versões [CONFIRMADO]
- **Runtime:** Node.js v24.14.0 (mínimo v20+), npm 11.9.0.
- **Frontend:** React 19.0.0, Vite 6.0.5, TypeScript 5.6.3, Tailwind CSS 3.4.17, Radix UI, TanStack Query v5.62.8, Zod 3.24.1.
- **Backend:** Node.js com Express 4.21.2, TypeScript 5.7.2 (`tsx` 4.19.2), Zod 3.24.1, JWT (`jsonwebtoken` 9.0.2), `bcrypt` 5.1.1, PostgreSQL (driver `pg` 8.13.1, sem ORMs).
- **Banco de Dados:** PostgreSQL 14+, migrações puras via `node-pg-migrate` 7.8.0 em `backend/migrations/`.
- **Testes Backend:** Node Native Test Runner (`node:test` + `node:assert` + `supertest` 7.0.0 via `tsx --test`).
- **Testes Frontend:** Vitest 3.0.0 + React Testing Library (RTL) + MSW 2.7.0.

---

## 2. Comandos Principais [CONFIRMADO]
Executar na **raiz** do monorepo:
- `npm run dev:all` — Inicia backend (`:3001`) e frontend (`:5173`) via `concurrently`.
- `npm run server` — Inicia apenas a API backend em modo watch (`tsx`).
- `npm run dev` — Inicia apenas o frontend Vite.
- `npm run setup` — Executa as migrações do banco (`npm --prefix backend run migrate up`).
- `npm run test` — Executa testes do backend em banco isolado (`contador_calorias_test`).
- `npm --prefix frontend test` — Executa testes do frontend via Vitest.
- `npm run lint` — Valida ESLint em todo o repositório.
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
- ❌ **PROIBIDO Comandos Destrutivos de Banco:** NUNCA execute `DROP TABLE`, `DROP DATABASE` ou `TRUNCATE` sem consentimento explícito prévio do usuário.
- ❌ **PROIBIDO ORMs:** Não instale nem utilize Prisma, Sequelize, TypeORM ou Drizzle; utilize driver `pg` e SQL puro.
- ❌ **PROIBIDO Fetch Manual no React:** Proibido `window.fetch()` nativo fora de `api.ts`, e proibido chamar serviços em `useEffect` para carregar dados de servidor.
- ❌ **PROIBIDO Alert/Confirm Nativos:** Não use `alert()` ou `confirm()`. Use modais acessíveis com focus trap (Radix UI) e tecla `Esc`.
- ❌ **PROIBIDO Modificar Código quando a Tarefa for de Documentação:** Obedeça estritamente o escopo solicitado.
- ❌ **PROIBIDO Banco de Produção/Dev em Testes:** Testes que tocam o banco só podem rodar se o nome terminar em `_test`.

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
  - Débitos Técnicos: [docs/TECH_DEBT.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/TECH_DEBT.md)