# Deploy Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o código pronto para os passos 5 e 6 de `docs/HOSPEDAGEM.md` (e-mail via Apps Script, Netlify na raiz, domínio SEO real, script de papéis compatível com Neon).

**Architecture:** Novo `HttpMailer` em `backend/src/mail/mailer.ts` atrás da interface `Mailer`, escolhido por `MAIL_TRANSPORT=http` e validado em `env.ts`. Resto é configuração e documentação.

**Tech Stack:** Node 24 (`fetch`, `AbortSignal.timeout`, `node:http` nos testes), Zod, `node:test`.

**Spec:** pedido do usuário nesta sessão (seções A–D).

## Global Constraints
- Nenhuma dependência nova; nada de `any`; não tocar banco remoto; não criar segredos reais.
- Nunca logar segredo, URL do script, destinatário, código ou link (só `auth_email_delivery_failed`).
- `NODE_ENV=test` continua forçando `MemoryMailer`; `smtp` e `memory` inalterados.
- Mensagens genéricas de auth inalteradas.

## Review Focus
- Mensagem de erro do `HttpMailer` não pode conter URL/segredo (é logada via `error.message`): testes afirmam que a mensagem não contém a URL nem o segredo.
- Redirect 302 → GET deve ser seguido: teste com stub que redireciona.
- Corpo JSON com `ok: "true"` (string) não é sucesso: coberto pelo caso `ok:false`/estrito `=== true`.
- `MAIL_HTTP_URL` com `127.0.0.1` em produção: recusada junto com `localhost`.
- Placeholder em `MAIL_HTTP_SECRET`: reutiliza `PLACEHOLDER_SECRET`.

---

### Task 1: Validação de env para `MAIL_TRANSPORT=http`

**Files:** Modify `backend/src/config/env.ts`; Test `backend/tests/unit/env_and_cors.test.ts`

- [ ] Testes falhando: `http` aceito em produção com URL https + segredo de 64 chars; issues em `MAIL_HTTP_URL` sem URL, com `http://` ou `localhost`/`127.0.0.1` em produção; issue em `MAIL_HTTP_SECRET` ausente, < 32 chars ou placeholder.
- [ ] Implementar: enum `['smtp','memory','http']`; `MAIL_HTTP_URL: z.string().url().optional()`, `MAIL_HTTP_SECRET: z.string().optional()`; regras no `superRefine`; placeholder via loop existente.
- [ ] `npm run test:file -- tests/unit/env_and_cors.test.ts` verde; commit `feat(env): valida MAIL_TRANSPORT=http`.

### Task 2: `HttpMailer`

**Files:** Modify `backend/src/mail/mailer.ts`; Create `backend/tests/unit/http_mailer.test.ts`

**Interfaces:** `export class HttpMailer implements Mailer { constructor(config: { url: string; secret: string; timeoutMs?: number }) }` (timeout padrão 10 000 ms).

- [ ] Testes com stub `node:http` em `127.0.0.1:0`: sucesso (corpo recebido = `{secret,to,subject,text,html}`), `ok:false`, HTML, status 500, JSON inválido, timeout (`timeoutMs: 100`), 302 → GET seguido. Rejeições não contêm URL nem segredo.
- [ ] Implementar `send` com `fetch(url, { method:'POST', redirect:'follow', signal: AbortSignal.timeout(ms) })`; erros com mensagens fixas (`mail_http_status_<n>`, `mail_http_invalid_response`, `mail_http_rejected`, `mail_http_request_failed`). `getMailer` usa `HttpMailer` quando `MAIL_TRANSPORT=http`.
- [ ] Teste verde; commit `feat(mail): adaptador HttpMailer`.
- [ ] Docs: `backend/.env.example`, `docs/EMAIL_SETUP.md`, remover "Mudança de código pendente" em `HOSPEDAGEM.md`; commit `docs`.

### Task 3: `netlify.toml` na raiz
- [ ] Criar com o conteúdo do pedido (command `npm --prefix shared ci && npm --prefix frontend ci && npm --prefix frontend run build`); passo 6 de `HOSPEDAGEM.md` atualizado (raiz, base vazio). Commit `feat(deploy)`.

### Task 4: Domínio SEO
- [ ] Trocar `https://app.caloriesync.com` por `https://caloriesync-luiscorreia.netlify.app` nos 4 arquivos; `git grep` só deve restar em docs históricos/fixtures backend; frontend tests verdes. Commit `feat(seo)`.

### Task 5: Papéis no Neon
- [ ] `provision-db-roles.sql`: `ALTER ROLE ... PASSWORD` separado; atributos via `\gexec` condicional em `rolsuper/rolcreatedb/rolcreaterole`.
- [ ] `docs/DB_ROLES.md` e passo 4: `GRANT migration_user TO neondb_owner;`, loop `ALTER TABLE/SEQUENCE ... OWNER TO migration_user` + `ALTER FUNCTION public.f_unaccent(text) OWNER TO migration_user`. Commit `fix(db)`.

### Final
- [ ] Revisores `revisor-seguranca` e `revisor-codigo`; corrigir.
- [ ] `npm run lint`, `npm run test:strict`, `npm --prefix frontend test`, `npm run build`, `npm run test:full`.
- [ ] Push, PR, `gh pr checks` verde.
