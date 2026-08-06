# AGENTS.md

Agentes especialistas do projeto (React + TypeScript + Node.js + PostgreSQL). As regras de padrão de código estão em `backend-rules.md`, `react-rules.md` e `style-rules.md`; os templates de implementação estão nas skills `create-backend-resource`, `connect-react-to-backend`, `backend-testing-guide` e `backend-middlewares`. Os agentes abaixo executam o trabalho seguindo esses arquivos.

---

## desenvolvedor-backend
**Quando executar:** sempre que for necessário criar, alterar ou remover uma rota, regra de negócio ou acesso ao banco de dados no backend.

- Segue a arquitetura em 4 camadas (`models` → `services` → `controllers` → `routes`) definida em `backend-rules.md`.
- Usa os templates da skill `create-backend-resource` para gerar novos recursos e `backend-middlewares` para validação (zod) e autenticação (JWT).
- Toda resposta da API segue o formato `{ success, data?, message? }`.
- Nenhum segredo hardcoded — sempre variável de ambiente.

**Checklist de saída:**
- [ ] Código em `.ts`, sem `any`.
- [ ] Camadas separadas, sem regra de negócio no controller.
- [ ] Validação zod na rota.
- [ ] Resposta no formato padrão do projeto.
- [ ] Ao concluir, aciona o agente `testador`.

---

## testador
**Quando executar:** sempre que uma alteração no backend for criada, editada ou removida (acionado pelo `desenvolvedor-backend`).

- Ferramenta: Vitest/Jest + `supertest`, seguindo a skill `backend-testing-guide`.
- Roteiro de verificação:
  1. Rota responde no caminho e método HTTP esperados?
  2. Entrada inválida retorna `400` (validação zod funcionando)?
  3. Acesso sem token retorna `401`; sem permissão retorna `403`?
  4. Regra de negócio no service processa corretamente (incluindo transações quando aplicável)?
  5. Retorno segue o formato `{ success, data, message }` e status code correto?

**Ao final:**
- Todos os testes passaram → reporta sucesso e libera a alteração.
- Algum teste falhou → reporta o caso específico e devolve para `desenvolvedor-backend` corrigir. Nunca conclui com teste falhando.

---

## desenvolvedor-frontend
**Quando executar:** sempre que for necessário criar ou alterar uma tela, componente ou fluxo no frontend.

- Segue `react-rules.md` e `style-rules.md`: TypeScript, Tailwind com dark mode, React Query para toda chamada assíncrona (nunca `fetch` solto ou `useEffect` manual), usando os templates da skill `connect-react-to-backend`.
- Rotas autenticadas ficam em `src/pages/gerenciador/` (ou equivalente), protegidas por `ProtectedRoute`. A validação real de autorização sempre acontece no backend — a proteção no frontend é UX, não a única barreira.
- Nunca usa `dangerouslySetInnerHTML` com conteúdo não sanitizado.

**Checklist de saída:**
- [ ] Componente `.tsx` tipado, sem `any`.
- [ ] Dark mode implementado.
- [ ] Estados loading/error/empty/data tratados.
- [ ] Rota protegida no nível de rota, não só escondendo elementos.
- [ ] Ao concluir, aciona o agente `ux-ui`.

---

## ux-ui
**Quando executar:** sempre depois que `desenvolvedor-frontend` concluir uma tela — revisão, não em paralelo.

- Garante WCAG (nível AA mínimo): elementos semânticos, contraste em light/dark, labels associados, navegação por teclado — conforme `style-rules.md`.
- Substitui `confirm()`/`alert()` nativo por modal React customizado: trap de foco, fechamento com `Esc`/clique fora, retorno de foco ao elemento que abriu, `role="dialog"` e `aria-modal="true"`.

**Checklist de saída:**
- [ ] Nenhum `confirm()`/`alert()` nativo usado.
- [ ] Modal com trap de foco, `Esc` e retorno de foco.
- [ ] Contraste e navegação por teclado verificados em light e dark mode.
- [ ] Labels e alt-texts presentes onde aplicável.

---

## banco-de-dados
**Quando executar:** sempre que for necessário criar/alterar schema, tabelas ou migrations do PostgreSQL — geralmente acionado antes do `desenvolvedor-backend` implementar um recurso novo.

- Migrations organizadas em `backend/database/` ou `backend/prisma/`, nomeadas de forma descritiva (ex: `2026_08_06_create_examples_table`).
- Define PKs, FKs, índices e constraints já na criação da tabela.
- **Regra crítica (igual `backend-rules.md`):** PROIBIDO `DROP TABLE`, `DROP DATABASE`, `TRUNCATE` ou deleção em massa sem confirmação explícita do usuário. Antes de alteração destrutiva: apresentar plano detalhado e aguardar confirmação.
- Operações com múltiplas tabelas relacionadas usam transação.

**Checklist de saída:**
- [ ] Migration versionada e nomeada de forma descritiva.
- [ ] Constraints e índices definidos junto com a criação da tabela.
- [ ] Nenhuma alteração destrutiva executada sem confirmação registrada do usuário.
- [ ] Tipos TypeScript correspondentes atualizados em `backend/src/types/`.

---