# Guia para IA (CLAUDE.md)

## Stack e Versões
- **Frontend**: React 19, Vite, Tailwind CSS, Radix UI, React Query v5, Zod.
- **Backend**: Node.js 22+, Express, TypeScript, Zod, JWT, bcrypt.
- **Banco de Dados**: PostgreSQL (driver `pg`).
- **Testes**: Node Native Test Runner (`node:test`) + Supertest (Backend).

## Estrutura de Pastas
- `/backend`: API REST, MVC (Controllers -> Services -> Models -> Routes).
- `/frontend`: SPA React, componentes UI (Radix), consumo de API via React Query.
- `/.agents`: Regras e templates de prompt para uso por IA.

## Comandos Principais (rodar na raiz)
- `npm run setup`: Inicializa banco de dados (`backend/init-db.js`).
- `npm run dev:all`: Roda Frontend + Backend via `concurrently`.
- `npm run server`: Roda apenas o backend.
- `npm run dev`: Roda apenas o frontend.
- `npm run lint`: Executa ESLint.
- `npm run test`: Roda os testes do backend via `tsx`.
- `npm run build`: Build do frontend.

## Convenções de Código e Arquitetura (Resumo)
- [CONFIRMADO] **Zod obrigatório**: Todo input do usuário deve ser validado no Backend (rotas) e Frontend (formulários).
- [CONFIRMADO] **Sem `fetch` manual**: Usar sempre React Query no frontend para requisições assíncronas.
- [CONFIRMADO] **Sem lógica no Controller**: Controladores apenas lidam com HTTP. Regras vão para os Services.
- [CONFIRMADO] **Segurança BD**: Proibido executar scripts destrutivos (`DROP TABLE`, etc) sem confirmação do usuário.
- [CONFIRMADO] **UX e Modais**: Proibido o uso de `alert()` ou `confirm()` nativos do navegador. Utilizar modais semânticos (ex: `DeleteAccountModal`, `AlertCircle` do lucide-react) para acessibilidade.

## Variáveis de Ambiente Necessárias (Backend)
- `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`.

## Customizações / Agentes Locais (`/.agents`)
Existem regras do projeto em `/.agents/rules/` que determinam:
- `backend-rules.md`: Arquitetura, uso de env, validação e DB.
- `react-rules.md`: Padrões do frontend e React Query.
- `style-rules.md`: Acessibilidade e Radix UI.

## Regras de Trabalho para a IA
1. Rode os testes antes de dizer que terminou a tarefa.
2. Faça commits pequenos e atômicos.
3. Não altere o que está fora do escopo da tarefa.
4. Pergunte quando houver ambiguidade, não invente requisitos.
5. Toda resposta da API deve ser padronizada no formato `{ success, data, message }`.
