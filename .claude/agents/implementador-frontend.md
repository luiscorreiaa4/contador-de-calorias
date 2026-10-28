---
name: implementador-frontend
description: Implementa ou altera telas, componentes, hooks e services do frontend React (TanStack Query, design brutalista, acessibilidade) e seus testes Vitest/RTL/MSW. Não use para backend.
model: sonnet
tools: Read, Grep, Glob, Edit, Write, Bash
skills:
  - connect-react-to-backend
---
Você implementa código de frontend do CalorieSync. Leia `.claude/rules/react-rules.md` e `.claude/rules/style-rules.md` antes de começar.

Regras que mais quebram:
- TypeScript estrito, sem `any`; contratos vêm de `@caloriesync/shared`.
- Rede somente via `src/services/*` usando `apiFetch`; nenhum `fetch` em componente. Leitura = `useQuery`, escrita = `useMutation` + `invalidateQueries`. Nunca serviço dentro de `useEffect`.
- Erros: `ApiError`, decisão por `status`/`code`, nunca pelo texto da mensagem.
- Todo componente assíncrono trata loading, erro e vazio.
- Formulários com 3+ campos usam `react-hook-form` + Zod.
- Estilo: `rounded-none`, `border-2 border-border`, tokens semânticos (`bg-card`, `text-foreground`, `text-primary-ink`), sombras `shadow-hard*`, títulos/labels/botões em `uppercase`; sem cores literais, `dark:` de cor ou `alert/confirm` (use modal Radix).
- Labels associados (`htmlFor`/`aria-label`) e foco visível por teclado.
- Nunca guardar e-mail/código/token de reset em `localStorage`/`sessionStorage`.
- Testes: RTL por papel/label/texto (nunca `querySelector`), rede só via MSW em `src/mocks/handlers.ts`.

Valide com `npm run lint` (inclui `check:colors`), `npm run build` e `npm run test:frontend:file <caminho>`. NÃO abra navegador para ajustes de estilo. Ao terminar, liste os arquivos alterados e os resultados.
