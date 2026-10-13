# AGENTS.md

Diretrizes gerais e agentes especialistas do projeto **CalorieSync** (React + TypeScript + Node.js + PostgreSQL).

---

## 1. Visão Geral da Stack e Comandos

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS (Design Brutalista com CSS Variables), Radix UI, TanStack Query v5, Zod.
- **Backend:** Node.js 22+, Express, TypeScript (via `tsx`), Zod, JWT, bcrypt, PostgreSQL (driver `pg`, sem ORMs).
- **Banco de Dados:** PostgreSQL com migrações gerenciadas por `node-pg-migrate` em `backend/migrations/`.
- **Testes:**
  - Backend: Node Native Test Runner (`node:test` + `node:assert` + `supertest`) via `tsx --test`.
  - Frontend: `Vitest` + `React Testing Library (RTL)` + `MSW` (Mock Service Worker).

### Comandos Principais (executar na raiz)
- `npm run dev:all` — Inicia Frontend e Backend simultaneamente via `concurrently`.
- `npm run server` — Inicia apenas a API backend em modo watch (`http://localhost:3001`).
- `npm run dev` — Inicia apenas o frontend Vite (`http://localhost:5173`).
- `npm run setup` — Executa as migrações do banco de dados (`npm --prefix backend run migrate up`).
- `npm run test` — Executa os testes do backend em banco de dados isolado (`_test`).
- `npm run lint` — Executa a validação de ESLint em todo o repositório.
- `npm run build` — Compila o bundle de produção do frontend.

### Variáveis de Ambiente Necessárias (Backend `.env`)
`PORT` (default 3001), `DB_HOST`, `DB_PORT` (5432), `DB_USER`, `DB_PASSWORD`, `DB_NAME` (`contador_calorias`), `JWT_SECRET` (mínimo 32 caracteres), `JWT_EXPIRES_IN` (ex: `7d`), `CORS_ORIGIN` (`http://localhost:5173`).

---

## 2. Regras de Trabalho para IA / Pareamento

1. **Validação Contínua:** Rode os testes e linters (`npm run test`, `npm run lint`, `npm run build`) antes de considerar uma tarefa concluída.
2. **Commits Atômicos:** Faça commits pequenos, focados e semânticos.
3. **Escopo Estrito:** Não altere arquivos ou configurações fora do escopo da tarefa solicitada.
4. **Sem Premissas Ocultas:** Pergunte quando houver ambiguidade; não invente regras de negócio.
5. **Contrato de API Padronizado:** Toda resposta da API deve seguir estritamente o formato `{ success: boolean, data?: unknown, message?: string }`.
6. **Zod Obrigatório:** Todo input do usuário deve ser validado via Zod nas rotas do backend e nos formulários do frontend.
7. **Sem Fetch Manual:** Proibido o uso de `fetch` solto com `useEffect` manual no React; utilize sempre TanStack Query.
8. **Segurança de Banco de Dados:** É TERMINANTEMENTE PROIBIDO executar comandos destrutivos (`DROP TABLE`, `DROP DATABASE`, `TRUNCATE`) sem confirmação explícita do usuário.
9. **Acessibilidade e UX:** Proibido o uso de `alert()` ou `confirm()` nativos do navegador. Use modais customizados acessíveis (Radix UI com focus trap e suporte a tecla `Esc`).

---

## 3. Agentes Especialistas

As regras detalhadas estão em `.agents/rules/` (`backend-rules.md`, `react-rules.md`, `style-rules.md`); os procedimentos práticos estão nas skills em `.agents/skills/`.

### desenvolvedor-backend
**Quando acionar:** criação, alteração ou refatoração de rotas, controllers, services, models e validações do backend.

- Segue a arquitetura em 4 camadas (`models` → `services` → `controllers` → `routes`) definida em `.agents/rules/backend-rules.md`.
- Utiliza a skill `create-backend-resource` para novos módulos e `backend-middlewares` para validação Zod e autenticação JWT.
- Toda resposta HTTP segue o formato `{ success, data?, message? }`.
- Nenhuma credencial hardcoded — leitura estrita de variáveis de ambiente.

**Checklist de saída:**
- [ ] Código em `.ts`, sem `any`.
- [ ] Camadas isoladas: sem lógica de negócio no controller.
- [ ] Validação Zod ativa na rota antes do controller.
- [ ] Resposta no formato padrão do projeto com status HTTP correto.
- [ ] Ao concluir, aciona o agente `testador`.

---

### testador
**Quando acionar:** sempre que uma alteração no backend ou frontend for criada, editada ou removida.

- **Ferramentas Backend:** `node:test` + `node:assert` + `supertest` executados via `tsx --test`.
- **Ferramentas Frontend:** Vitest + React Testing Library (RTL) + MSW.
- **Regra Crítica de Banco (Backend):** Testes que tocam o banco de dados **devem** rodar exclusivamente em banco isolado (`contador_calorias_test`). O runner aborta imediatamente se o banco não terminar em `_test`.
- **Regra Crítica de Frontend:** Consultar elementos por acessibilidade (`getByRole`, `getByLabelText`), nunca por classes CSS. Interceptar requisições exclusivamente com MSW.
- **Roteiro de Verificação:**
  1. A rota/componente responde no caminho e método esperado?
  2. Input inválido retorna `400` com mensagem explicativa?
  3. Acesso não autenticado retorna `401`; sem permissão retorna `403`?
  4. Lógica de negócio processa corretamente no service (com transações quando aplicável)?
  5. Retorno padronizado `{ success, data, message }`?

**Ao final:**
- Todos os testes passaram → reporta sucesso e libera a alteração.
- Testes falharam → reporta a falha específica e devolve ao desenvolvedor responsável.

---

### desenvolvedor-frontend
**Quando acionar:** criação ou alteração de telas, componentes, hooks ou fluxos visuais no frontend.

- Segue `.agents/rules/react-rules.md` e `.agents/rules/style-rules.md`: TypeScript, Tailwind com variáveis CSS de tema, e React Query para estado assíncrono (skill `connect-react-to-backend`).
- Rotas autenticadas protegidas via `ProtectedRoute`.
- Jamais utiliza `dangerouslySetInnerHTML` com conteúdo não sanitizado.

**Checklist de saída:**
- [ ] Componente em `.tsx` fortemente tipado, sem `any`.
- [ ] Suporte a tema claro/escuro via tokens semânticos CSS (sem cores fixas).
- [ ] Estados `loading`, `error`, `empty` e `data` tratados explicitamente.
- [ ] Ao concluir, aciona o agente `testador` e em seguida `ux-ui`.

---

### ux-ui
**Quando acionar:** revisão de acessibilidade e experiência visual após conclusão do frontend.

- Garante conformidade com WCAG (nível AA): elementos semânticos, contraste adequado, labels associados a todos os inputs e navegação completa por teclado.
- Substitui `confirm()`/`alert()` nativo por modais customizados: focus trap, fechamento com `Esc`/clique externo, foco retornado ao elemento de origem, `role="dialog"` e `aria-modal="true"`.
- Assegura aderência à identidade brutalista (`rounded-none`, contornos fortes, sem adornos desnecessários).

**Checklist de saída:**
- [ ] Nenhum `confirm()` ou `alert()` nativo.
- [ ] Modais com focus trap, `Esc` e restauração de foco.
- [ ] Contraste e navegação por teclado verificados.
- [ ] Labels e atributos acessíveis presentes.

---

### banco-de-dados
**Quando acionar:** criação ou alteração de tabelas, índices, constraints ou migrações do PostgreSQL.

- Migrações puras gerenciadas via `node-pg-migrate` em `backend/migrations/`.
- Definição de PKs (UUID), FKs com integridade referencial, índices e constraints no momento da criação.
- **Regra Crítica:** PROIBIDO `DROP TABLE`, `DROP DATABASE`, `TRUNCATE` ou deleção em massa sem autorização expressa do usuário.
- Operações atômicas com múltiplas tabelas executadas em transação (`BEGIN`/`COMMIT`/`ROLLBACK`).

**Checklist de saída:**
- [ ] Migração versionada e nomeada descritivamente em `backend/migrations/`.
- [ ] Constraints e índices (ex: `pg_trgm`, `unaccent`) criados na migração.
- [ ] Nenhuma alteração destrutiva sem aprovação explícita.
- [ ] Tipos TypeScript correspondentes atualizados em `backend/src/types/`.