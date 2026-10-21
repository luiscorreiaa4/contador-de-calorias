# AGENTS.md

Instruções e diretrizes operacionais de IA para o projeto **CalorieSync**.

---

## 1. Stack e Versões [CONFIRMADO]
- **Runtime:** Node.js v24.14.0 (mínimo v20+), npm 11.9.0.
- **Frontend:** React 19.2.8, Vite 8.2.1, TypeScript 6.0.2, Tailwind CSS 3.4.19, Radix UI, TanStack Query v5.101.4, Zod 3.24.2, React Router 7.18.4.
- **Backend:** Node.js com Express 4.21.2, TypeScript 5.7.3 (`tsx` 4.23.9), Zod 3.24.2, JWT (`jsonwebtoken` 9.0.2), `bcrypt` 5.1.1, PostgreSQL (driver `pg` 8.13.1, sem ORMs), `compression` 1.8.2, `nodemailer` 7.0.13 (SMTP; Mailpit em desenvolvimento).
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
- `npm run docker:up` — Sobe PostgreSQL e Mailpit (SMTP `:1025`, UI `http://localhost:8025`).
- `npm run docker:down` — Encerra os containers de desenvolvimento.
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
6. **Autenticação por E-mail (BL-12/BL-05):** Rotas públicas em `/api/auth/*` com `Cache-Control: no-store`; cadastro responde `202` sem JWT; login de conta não verificada responde `403` com `code: "EMAIL_NOT_VERIFIED"`; JWT carrega `tv` validado contra `users.token_version`.
7. **Entrega de E-mail:** `Mailer` plugável (`SmtpMailer`/`MemoryMailer`) escolhido por `MAIL_TRANSPORT`; Mailpit em desenvolvimento (UI `http://localhost:8025`); `NODE_ENV=test` usa memória.

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
- ❌ **PROIBIDO Logar Segredos de Autenticação:** Nunca registre código de verificação, token de reset, URL de reset, senha ou pepper em logs, mensagens de erro ou respostas HTTP.
- ❌ **PROIBIDO Persistir E-mail/Código/Token de Reset no Cliente:** O e-mail de verificação usa apenas o state do router; o token de reset fica no fragmento `#token=...`, é lido uma vez e removido com `history.replaceState`; nunca use `localStorage`/`sessionStorage` para esses valores.
- ❌ **PROIBIDO Alterar Mensagens Genéricas de Autenticação:** `register`, `resend-code` e `forgot-password` devem manter status e corpo idênticos exista ou não a conta, evitando enumeração.

---

## 5. Ponteiros de Documentação e Regras Detalhadas
- **Regras Detalhadas & Skills:**
  - Backend: [.agents/rules/backend-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/backend-rules.md)
  - React: [.agents/rules/react-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/react-rules.md)
  - Estilo e UI: [.agents/rules/style-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/style-rules.md)
  - Inspeção no Browser (E2E): [.agents/skills/browser-inspection/SKILL.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/skills/browser-inspection/SKILL.md)
- **Documentação de Sistema:**
  - Arquitetura & Banco (ER): [docs/ARCHITECTURE.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ARCHITECTURE.md)
  - Especificação e Fórmulas de Negócio: [docs/SPEC.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/SPEC.md)
  - Estratégia de Testes: [docs/TESTING.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/TESTING.md)
  - Planejamento de Fases: [docs/ROADMAP.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ROADMAP.md)
  - Design System e Cores: [docs/CORES.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/CORES.md)
  - Navegação e Rotas: [docs/UX_NAVIGATION.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/UX_NAVIGATION.md)
  - Migrações: [docs/MIGRATIONS.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/MIGRATIONS.md)
  - E-mail transacional: [docs/EMAIL_SETUP.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/EMAIL_SETUP.md)
  - Decisões de arquitetura: [docs/DECISOES.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/DECISOES.md)

---

## 6. Inspeções no Navegador (Browser Subagent / E2E) e Conta de Teste
- **Skill de Referência:** [.agents/skills/browser-inspection/SKILL.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/skills/browser-inspection/SKILL.md)
- ❌ **PROIBIDO Abrir Navegador para Alterações Simples de CSS/Estilo:** NUNCA abra o subagente do navegador (`browser_subagent`) para conferir pequenas alterações visuais, classes CSS, cores, paddings ou ajustes pontuais. Isso consome tempo e tokens em excesso.
- ✅ **Casos Exclusivos em que o Browser Pode ser Aberto:**
  1. Apenas quando o usuário **pedir explicitamente** (ex: "abra o navegador", "tire prints", "inspecione a tela no chrome").
  2. Em casos de extrema necessidade para validar fluxos interativos complexos ou quebras de tela críticas que não possam ser verificadas de outra forma.
- **Credenciais da Conta Pré-Existente (Onboarding Concluído):**
  - **E-mail:** `teste@teste.com` (alternativa: `test@example.com`)
  - **Senha:** `123456` (alternativa: `Senha123!` para `test@example.com`)
  - **Usuário:** `testador123`
  - **Status:** `onboarding_completed: true` (dados corporais, rotina e metas diárias já calculados) e e-mail verificado. Não altere o cadastro dessa conta.
- **Regras Mandatórias ao Executar o Browser Subagent:**
  - ❌ **PROIBIDO Criar Conta ou Refazer Onboarding:** Nunca acesse `/cadastro` nem passe pelas 5 etapas do wizard de onboarding (`/onboarding`).
  - ✅ **Fluxo de Login Direto:**
    1. Acesse `http://localhost:5173/login`.
    2. Na aba "ENTRAR", insira `teste@teste.com` no campo de e-mail e `123456` na senha.
    3. Clique no botão de submissão ("ENTRAR").
    4. O sistema autentica imediatamente e direciona para o Dashboard (`/`), com acesso liberado a todas as telas (`/`, `/evolucao`, `/metas`, `/configuracoes`, `/perfil`).
