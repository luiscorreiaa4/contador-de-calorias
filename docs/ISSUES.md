# Backlog da auditoria

Origem: `docs/AUDITORIA.md` (itens ❌ e 🟡). Cada item abaixo tem o formato de uma issue: contexto, evidência, o que fazer, critério de aceite e link do guia. Os links apontam para `docs/guia-tech/`.

- **Status:** `[ ]` aberto · `[~]` em andamento · `[x]` feito (com a data e o commit/PR).
- **Prioridade:** `priority:high` = risco alto na auditoria.

```
Trabalhe no item 1 de docs/ISSUES.md. Leia o item e a seção correspondente em docs/guia-tech/.
1. Se houver decisão de design em aberto, use /grill-me comigo antes de codar.
2. Escreva primeiro o teste que prova o problema (deve falhar), depois a correção.
3. Rode lint, type-check e todos os testes (npm run lint, npm run test:strict, npm --prefix frontend test).
4. Rode /ponytail-review no diff e a skill differential-review da Trail of Bits.
5. Faça commits no padrão Conventional Commits. atualize docs/ISSUES.md", explicando o que mudou e como testar.
```


## Índice

| # | Item | Labels | Status |
|---|---|---|---|
| 1 | [navegador] mover JWT para cookie HttpOnly e reduzir TTL da sessão | security, auth, priority:high | [ ] |
| 2 | [navegador] unificar leitura do token em `apiFetch` | auth, quality | [ ] |
| 3 | [navegador] CSP, HSTS e headers de segurança no host do front | security, devops | [ ] |
| 4 | [auth] bloqueio ou atraso progressivo de login por conta | security, auth, priority:high | [ ] |
| 5 | [auth] rate limit com store compartilhado, `TRUST_PROXY` e limiter por e-mail/global | security, auth, priority:high | [ ] |
| 6 | [auth] captcha em register, login e forgot-password | security, auth | [ ] |
| 7 | [auth] MFA (TOTP), ao menos para administradores | security, auth | [ ] |
| 8 | [auth] `register` não sobrescreve credenciais de conta não verificada | security, auth | [ ] |
| 9 | [autorização] role de banco com menor privilégio e role de migração | security, devops, priority:high | [ ] |
| 10 | [autorização] avaliar RLS no Postgres | security | [ ] |
| 11 | [entrada] min/max nos schemas numéricos, teto de `page` e `.strict()` | security, quality | [ ] |
| 12 | [infra] mapear erros do `pg` e não expor `err.code`/`err.message` brutos | security | [ ] |
| 13 | [infra] CORS: rejeitar `*` e `localhost` em produção | security | [ ] |
| 14 | [infra] e-mail: proibir `memory` em produção, exigir TLS e timeouts | security, devops | [ ] |
| 15 | [infra] criptografia em repouso para dados de saúde | security, legal | [ ] |
| 16 | [infra] atualizar deps `high` e auditar backend/frontend no CI | security, devops, priority:high | [ ] |
| 17 | [devops] fixar Docker/Actions por versão/SHA, `permissions` e handlers de processo | devops, security | [ ] |
| 18 | [segredos] `sourcemap: false`, remover `/test-compression-payload`, exigir VAPID | security | [ ] |
| 19 | [qualidade] formatter, commitlint/Husky e knip | quality | [ ] |
| 20 | [qualidade] `down` utilizável em todas as migrations e teste de rollback | quality, devops | [ ] |
| 21 | [tests] cobertura do backend e `thresholds` no front | tests | [ ] |
| 22 | [tests] E2E com Playwright | tests | [ ] |
| 23 | [tests] testes de autorização por recurso e carga no CI | tests, security | [ ] |
| 24 | [devops] deploy: Dockerfile, ambientes e etapa no CI | devops | [ ] |
| 25 | [observability] rastreio de erros, métricas e alertas | observability | [ ] |
| 26 | [devops] backup do Postgres com teste de restauração | devops | [ ] |
| 27 | [ux] página 404 própria | ux, seo | [ ] |
| 28 | [ux] auditar `prefers-reduced-motion` | ux, a11y | [ ] |
| 29 | [seo] meta OG/Twitter/canonical, `robots.txt`, `sitemap.xml`, `noindex` | seo | [ ] |
| 30 | [legal] consentimento específico e versionado para dados de saúde | legal, security, priority:high | [ ] |
| 31 | [legal] minimização dos campos de saúde | legal | [ ] |
| 32 | [legal] exclusão, retenção e plano de incidentes | legal | [ ] |
| 33 | [a11y] skip link, landmarks, contraste WCAG AA e axe no CI | a11y, tests | [ ] |

---

## Itens

### #1 [navegador] mover JWT para cookie HttpOnly e reduzir TTL da sessão
**Labels:** security, auth, priority:high · **Branch:** `feat/1-jwt-cookie-httponly`
- **Contexto:** o token fica em `localStorage`/`sessionStorage` e vale 7 dias. Qualquer XSS rouba a sessão inteira.
- **Evidência:** `frontend/src/context/AuthContext.tsx:79-87`, `frontend/src/services/api.ts:53-57`, `backend/src/config/env.ts:25`, `backend/src/utils/jwt.ts:10-11`. O backend não define nenhum cookie.
- **O que fazer:** emitir o JWT em cookie `HttpOnly; Secure; SameSite=Lax/Strict`, ler o cookie no `authenticate`, proteger mutações contra CSRF e remover o token do JS. Reduzir o TTL e avaliar refresh token com rotação.
- **Aceite:**
  - [ ] Nenhum token em `localStorage`/`sessionStorage`.
  - [ ] Login, logout e "lembrar-me" funcionam com cookie (persistente vs de sessão).
  - [ ] Mutações exigem proteção CSRF (token ou `SameSite` + checagem de `Origin`).
  - [ ] Teste prova que o JS não lê o token.
  - [ ] TTL documentado em `docs/ARCHITECTURE.md`.
- **Guia:** `03-seguranca-web.md` §2 (Armazenamento no navegador) e §3 (Expiração de sessão).

### #2 [navegador] unificar leitura do token em `apiFetch`
**Labels:** auth, quality · **Branch:** `fix/2-apifetch-token-storage`
- **Contexto:** o `AuthContext` grava em `sessionStorage` quando "lembrar-me" está desmarcado, mas `apiFetch` lê só `localStorage`. Não testado em runtime.
- **Evidência:** `frontend/src/services/api.ts:53` e `:100`; `frontend/src/context/AuthContext.tsx:50,79-87`.
- **O que fazer:** escrever o teste que reproduz (login sem "lembrar-me" e chamada autenticada) e centralizar a leitura num único helper. Fica obsoleto se o #1 for feito antes.
- **Aceite:**
  - [ ] Teste falhando antes e passando depois.
  - [ ] Uma só função lê o token.
- **Guia:** `03-seguranca-web.md` §2.

### #3 [navegador] CSP, HSTS e headers de segurança no host do front
**Labels:** security, devops · **Branch:** `chore/3-front-security-headers`
- **Contexto:** o CSP do helmet vale só para a API. O front não tem CSP e HTTPS/HSTS dependem do host (ainda sem deploy).
- **Evidência:** `backend/src/app.ts:29-42`; `frontend/index.html` sem CSP.
- **O que fazer:** definir CSP, HSTS, `X-Content-Type-Options`, `frame-ancestors` e `Referrer-Policy` na hospedagem do front (depende do #24).
- **Aceite:**
  - [ ] Headers presentes na resposta real.
  - [ ] CSP sem `unsafe-inline` ou com nonce/hash.
  - [ ] Teste com `curl -I` documentado.
- **Guia:** `03-seguranca-web.md` §6 (HTTPS e domínio com certificado SSL).

### #4 [auth] bloqueio ou atraso progressivo de login por conta
**Labels:** security, auth, priority:high · **Branch:** `feat/4-login-lockout`
- **Contexto:** uma falha de login não grava nada no banco. O único freio é o rate limit em memória.
- **Evidência:** `backend/src/services/auth.service.ts:187-196`, `backend/src/routes/auth.routes.ts:29-40`.
- **O que fazer:** contar falhas por conta (migração nova), aplicar atraso progressivo ou bloqueio temporário, avisar por e-mail, manter a resposta genérica (sem enumeração).
- **Aceite:**
  - [ ] Migração com `down`.
  - [ ] N falhas bloqueiam por T minutos; sucesso zera.
  - [ ] Resposta idêntica para conta inexistente e bloqueada.
  - [ ] Testes de integração cobrem os três casos.
- **Guia:** `03-seguranca-web.md` §3 (Quantidade de tentativas de login).

### #5 [auth] rate limit com store compartilhado, `TRUST_PROXY` e limiter por e-mail/global
**Labels:** security, auth, priority:high · **Branch:** `feat/5-rate-limit-store`
- **Contexto:** `MemoryStore` por processo zera no restart e não é compartilhado. Sem `TRUST_PROXY`, atrás de proxy todos dividem um balde de IP.
- **Evidência:** `backend/src/middlewares/authRateLimit.ts:31-38`, `backend/src/app.ts:22-25`, `backend/src/utils/trustProxy.ts`.
- **O que fazer:** store em Redis ou Postgres, exigir/documentar `TRUST_PROXY` no deploy, adicionar limiter só por e-mail e um limiter geral da API.
- **Aceite:**
  - [ ] Limites sobrevivem a restart e valem entre instâncias.
  - [ ] Teste com `X-Forwarded-For` e `TRUST_PROXY` configurado.
  - [ ] `docs/EMAIL_SETUP.md` ou `ARCHITECTURE.md` explica a variável.
- **Guia:** `03-seguranca-web.md` §3 (Rate limit nos endpoints).

### #6 [auth] captcha em register, login e forgot-password
**Labels:** security, auth · **Branch:** `feat/6-captcha`
- **Contexto:** nada encontrado; só um comentário de trabalho futuro.
- **Evidência:** `backend/src/middlewares/authRateLimit.ts:11`.
- **O que fazer:** integrar Turnstile/hCaptcha com validação no backend, desligável em `NODE_ENV=test`. Decisão em aberto: ativar sempre ou só após falhas (use `/grill-me`).
- **Aceite:**
  - [ ] Token inválido responde 400/403 padronizado.
  - [ ] Chave só em variável de ambiente (validada no `env.ts`).
  - [ ] Testes usam um provedor falso.
- **Guia:** `03-seguranca-web.md` §3 (Captchas).

### #7 [auth] MFA (TOTP), ao menos para administradores
**Labels:** security, auth · **Branch:** `feat/7-mfa-totp`
- **Contexto:** não existe segundo fator. A conta admin dá acesso ao catálogo global.
- **Evidência:** `backend/src/routes/admin.routes.ts:9`; nada de TOTP no código.
- **O que fazer:** TOTP com códigos de recuperação, obrigatório para `role = 'admin'`, segredo guardado cifrado. Respeitar a regra de não criar admin por seed/env.
- **Aceite:**
  - [ ] Admin sem MFA não acessa `/api/admin/*`.
  - [ ] Códigos de recuperação de uso único.
  - [ ] Auditoria registra ativação/remoção.
- **Guia:** `03-seguranca-web.md` §3 (MFA).

### #8 [auth] `register` não sobrescreve credenciais de conta não verificada
**Labels:** security, auth · **Branch:** `fix/8-register-no-overwrite`
- **Contexto:** cadastro em e-mail existente não verificado troca `name` e `password_hash`; quem cadastra por último define a senha e o `verifyEmail` emite sessão.
- **Evidência:** `backend/src/services/auth.service.ts:166`, `backend/src/models/auth.model.ts:247-262`.
- **O que fazer:** não regravar credenciais; só reenviar o código, mantendo o 202 genérico (sem enumeração).
- **Aceite:**
  - [ ] Teste: dois cadastros no mesmo e-mail; o segundo não altera `password_hash`.
  - [ ] Resposta idêntica à de e-mail novo.
- **Guia:** `03-seguranca-web.md` §3.

### #9 [autorização] role de banco com menor privilégio e role de migração
**Labels:** security, devops, priority:high · **Branch:** `chore/9-db-least-privilege`
- **Contexto:** compose e CI usam o superusuário `postgres`.
- **Evidência:** `docker-compose.yml`, `docker/init-db.sql`, `.github/workflows/ci.yml`, `backend/src/database/pool.ts`.
- **O que fazer:** role da aplicação só com `SELECT/INSERT/UPDATE/DELETE` nas tabelas; role separada para migrações. Atualizar compose, CI e documentação.
- **Aceite:**
  - [ ] App roda sem `CREATE/DROP`.
  - [ ] Migrações usam a outra role.
  - [ ] `docs/MIGRATIONS.md` atualizado.
- **Guia:** `03-seguranca-web.md` §4 (Princípio do menor privilégio).

### #10 [autorização] avaliar RLS no Postgres
**Labels:** security · **Branch:** `feat/10-rls-postgres`
- **Contexto:** o isolamento por dono existe só no `WHERE` da aplicação.
- **Evidência:** nenhuma política em `backend/migrations/`.
- **O que fazer:** decidir (use `/grill-me`) se vale RLS com `SET LOCAL app.user_id`; se sim, começar por `meals` e `body_measurements`.
- **Aceite:**
  - [ ] Decisão registrada em `docs/DECISOES.md`.
  - [ ] Se adotado: política + teste que falha sem o contexto de usuário.
- **Guia:** `03-seguranca-web.md` §4 (Políticas de RLS).

### #11 [entrada] min/max nos schemas numéricos, teto de `page` e `.strict()`
**Labels:** security, quality · **Branch:** `fix/11-schema-bounds`
- **Contexto:** `weight`, `height`, metas, `serving_weight`, `unit_weight` não têm `max`; `page` sem teto; chaves extras são ignoradas.
- **Evidência:** `shared/src/schemas/user.schema.ts:140-141,164-165,181-184`, `food.schema.ts:18,20`.
- **O que fazer:** limites coerentes com as colunas `NUMERIC`, `measured_at` com limite inferior, `.strict()` onde fizer sentido.
- **Aceite:**
  - [ ] Valor fora do limite responde 400 (não 500 do Postgres).
  - [ ] Testes de fronteira nos schemas.
- **Guia:** `03-seguranca-web.md` §5 (Validação de inputs).

### #12 [infra] mapear erros do `pg` e não expor `err.code`/`err.message` brutos
**Labels:** security · **Branch:** `fix/12-error-handler-pg`
- **Contexto:** erros não-500 devolvem `err.message`; `err.code` é copiado para a resposta, inclusive SQLSTATE do `pg`.
- **Evidência:** `backend/src/middlewares/errorHandler.ts:30,48-50`.
- **O que fazer:** lista de `code` de negócio permitidos, mapear erros do `pg` (23505, 22003 etc.) para 400/409 com mensagem genérica, `app.disable('x-powered-by')` explícito.
- **Aceite:**
  - [ ] Teste: valor fora de faixa não vaza SQLSTATE.
  - [ ] Só códigos de negócio estáveis chegam ao cliente.
- **Guia:** `03-seguranca-web.md` §6 (Esconder infos do sistema).

### #13 [infra] CORS: rejeitar `*` e `localhost` em produção
**Labels:** security · **Branch:** `fix/13-cors-production`
- **Contexto:** `*` é aceito com `credentials: true`; origem rejeitada vira 500 com stack no log.
- **Evidência:** `backend/src/app.ts:44-56`, `backend/src/config/env.ts:26`.
- **O que fazer:** validar `CORS_ORIGIN` no `env.ts` em produção (https, sem `*`/`localhost`) e responder 403 limpo.
- **Aceite:**
  - [ ] `env.ts` encerra a subida com valor inválido em produção.
  - [ ] Teste de origem não permitida.
- **Guia:** `03-seguranca-web.md` §6 (CORS).

### #14 [infra] e-mail: proibir `memory` em produção, exigir TLS e timeouts
**Labels:** security, devops · **Branch:** `fix/14-mailer-production`
- **Contexto:** `MAIL_TRANSPORT=memory` passa em produção; SMTP sem `requireTLS` nem timeouts.
- **Evidência:** `backend/src/.../mailer.ts:93`, `backend/src/config/env.ts`.
- **O que fazer:** falhar na subida em produção com `memory`; exigir TLS; definir timeouts.
- **Aceite:**
  - [ ] Teste do `env.ts` cobre `memory` em produção.
  - [ ] Timeouts configurados e documentados em `docs/EMAIL_SETUP.md`.
- **Guia:** `03-seguranca-web.md` §6.

### #15 [infra] criptografia em repouso para dados de saúde
**Labels:** security, legal · **Branch:** `feat/15-health-data-encryption`
- **Contexto:** peso, altura, sexo, nascimento e medidas ficam em texto no Postgres.
- **Evidência:** `backend/migrations/1790883887302_baseline.js:21-26`, `1791310642375_history-tables.js`.
- **O que fazer:** confirmar criptografia de disco no provedor; decidir (use `/grill-me`) se haverá criptografia por coluna, considerando o impacto em consultas e estatísticas.
- **Aceite:**
  - [ ] Decisão registrada em `docs/DECISOES.md`.
  - [ ] Se por coluna: migração com `down` e teste de leitura/escrita.
- **Guia:** `03-seguranca-web.md` §6 (Criptografia de dados sensíveis).

### #16 [infra] atualizar deps `high` e auditar backend/frontend no CI
**Labels:** security, devops, priority:high · **Branch:** `fix/16-dependency-audit`
- **Contexto:** `npm audit`: backend 3 high (`nodemailer`, `body-parser`, `zod`), frontend 3 high (`vite`, `undici`, `zod`). O CI audita só a raiz.
- **Evidência:** `.github/workflows/ci.yml` (`npm audit --audit-level=high`); resultado do `npm audit --json` em cada pasta.
- **O que fazer:** atualizar os pacotes (cuidado com o salto de major do `zod`), rodar `npm audit --audit-level=high` em `backend/` e `frontend/` no CI.
- **Aceite:**
  - [ ] `npm audit --audit-level=high` com 0 em backend, frontend e raiz.
  - [ ] CI executa as três auditorias.
  - [ ] Testes passam após as atualizações.
- **Guia:** `03-seguranca-web.md` §6 (Dependências).

### #17 [devops] fixar Docker/Actions por versão/SHA, `permissions` e handlers de processo
**Labels:** devops, security · **Branch:** `chore/17-ci-hardening`
- **Contexto:** `mailpit:latest`, Actions por tag, sem `permissions`, sem `unhandledRejection`/`uncaughtException`.
- **Evidência:** `docker-compose.yml`, `.github/workflows/ci.yml`, `backend/src/server.ts`.
- **O que fazer:** fixar versões/SHA, `permissions: contents: read`, registrar handlers e encerrar com `gracefulShutdown`.
- **Aceite:**
  - [ ] Nenhuma imagem/Action sem versão fixa.
  - [ ] Handlers registrados com teste.
- **Guia:** `05-engenharia-qualidade-devops.md` §1 e §5 (pipeline de CI).

### #18 [segredos] `sourcemap: false`, remover `/test-compression-payload`, exigir VAPID
**Labels:** security · **Branch:** `chore/18-prod-leftovers`
- **Contexto:** três sobras de configuração em produção.
- **Evidência:** `frontend/vite.config.ts` (sem opção), `backend/src/app.ts:104`, `backend/src/services/push.service.ts:15,24`.
- **O que fazer:** `build.sourcemap: false` explícito; mover a exceção de teste para fora do `app.ts` (ajustando `compression.test.ts`); exigir `VAPID_*` no `env.ts` quando o push for ligado.
- **Aceite:**
  - [ ] `npm run build` sem arquivos `.map`.
  - [ ] `/test-compression-payload` responde 404 em produção.
  - [ ] Testes de compressão continuam passando.
- **Guia:** `03-seguranca-web.md` §1 (Proteger source maps, Rota debug).

### #19 [qualidade] formatter, commitlint/Husky e knip
**Labels:** quality · **Branch:** `chore/19-quality-tooling`
- **Contexto:** não há formatter, hooks de commit nem detecção de código morto.
- **Evidência:** raiz sem `.prettierrc`/`biome.json`/`.husky`/`commitlint.config.*`/`knip.*`.
- **O que fazer:** escolher formatter (decisão com `/grill-me`), commitlint com Conventional Commits, Husky e knip no CI.
- **Aceite:**
  - [ ] `npm run lint` inclui a checagem de formatação.
  - [ ] Commit fora do padrão é rejeitado.
  - [ ] Knip roda no CI sem falsos positivos relevantes.
- **Guia:** `05-engenharia-qualidade-devops.md` §4.

### #20 [qualidade] `down` utilizável em todas as migrations e teste de rollback
**Labels:** quality, devops · **Branch:** `test/20-migration-rollback`
- **Contexto:** nem todas as migrações foram verificadas; `history-tables` e `add-food-scale-features` usam `exports.up/down`.
- **Evidência:** `backend/migrations/*.js`, `docs/MIGRATIONS.md`.
- **O que fazer:** revisar cada `down` (respeitando a regra de não editar migrações já aplicadas, criar migração nova quando preciso) e testar `migrate up` seguido de `down` em banco `_test`.
- **Aceite:**
  - [ ] Teste de ida e volta no CI.
  - [ ] `docs/MIGRATIONS.md` descreve o procedimento de rollback.
- **Guia:** `05-engenharia-qualidade-devops.md` §2 (Rollback).

### #21 [tests] cobertura do backend e `thresholds` no front
**Labels:** tests · **Branch:** `test/21-coverage-thresholds`
- **Contexto:** o front gera cobertura sem piso mínimo; o backend não mede.
- **Evidência:** `frontend/vite.config.ts:61-65`.
- **O que fazer:** definir `thresholds` realistas a partir da medição atual, medir o backend e publicar o relatório no CI.
- **Aceite:**
  - [ ] Queda de cobertura abaixo do piso falha o CI.
  - [ ] Relatório do backend gerado.
- **Guia:** `05-engenharia-qualidade-devops.md` §5 (Codecov).

### #22 [tests] E2E com Playwright
**Labels:** tests · **Branch:** `test/22-e2e-playwright`
- **Contexto:** não há E2E.
- **Evidência:** ausência de `playwright.config.*`.
- **O que fazer:** fluxo mínimo cadastro → verificação (via Mailpit/memória) → registrar refeição, rodando no CI. Respeitar a regra de não usar a conta `teste@teste.com` para criar cadastro.
- **Aceite:**
  - [ ] Fluxo verde no CI.
  - [ ] Dados de teste isolados no banco `_test`.
- **Guia:** `05-engenharia-qualidade-devops.md` §5 (Playwright).

### #23 [tests] testes de autorização por recurso e carga no CI
**Labels:** tests, security · **Branch:** `test/23-authz-and-load`
- **Contexto:** não confirmei testes "usuário A não acessa dados do usuário B" por recurso; `tests/load` não roda no CI.
- **Evidência:** `backend/tests/integration`, `backend/tests/load`.
- **O que fazer:** para cada recurso (meals, saved-meals, favoritos, medidas, metas, push) testar acesso cruzado e rota admin com usuário comum; rodar a carga leve no CI.
- **Aceite:**
  - [ ] Cada recurso tem teste de acesso cruzado.
  - [ ] Teste de carga com limite de tempo no CI.
- **Guia:** `03-seguranca-web.md` §4 (IDOR e BOLA).

### #24 [devops] deploy: Dockerfile, ambientes e etapa no CI
**Labels:** devops · **Branch:** `feat/24-deploy-pipeline`
- **Contexto:** sem Dockerfile da aplicação, compose de produção nem deploy.
- **Evidência:** `docker-compose.yml` (só Postgres e Mailpit), `.github/workflows/ci.yml`.
- **O que fazer:** decidir a hospedagem (use `/grill-me`), criar Dockerfile do backend, ambientes staging/produção, variáveis por ambiente, deploy por PR/merge.
- **Aceite:**
  - [ ] Staging sobe a partir do CI.
  - [ ] Variáveis documentadas.
  - [ ] Destrava os itens #3 e #5.
- **Guia:** `05-engenharia-qualidade-devops.md` §1.

### #25 [observability] rastreio de erros, métricas e alertas
**Labels:** observability · **Branch:** `feat/25-observability`
- **Contexto:** só há logs estruturados próprios.
- **Evidência:** nenhuma dependência de Sentry/Prometheus/OpenTelemetry nos `package.json`.
- **O que fazer:** erro tracking no backend e no front (sem dados pessoais), métricas básicas e alerta de indisponibilidade; separar liveness de readiness no `/health`.
- **Aceite:**
  - [ ] Erro 500 aparece na ferramenta com `requestId`.
  - [ ] Scrubbing de e-mail, token e corpo.
  - [ ] Alerta de teste disparado.
- **Guia:** `05-engenharia-qualidade-devops.md` §3.

### #26 [devops] backup do Postgres com teste de restauração
**Labels:** devops · **Branch:** `chore/26-db-backup`
- **Contexto:** nada no repositório sobre backup.
- **Evidência:** ausência de rotina em `docker/`, `scripts/` e no CI.
- **O que fazer:** backup diário com retenção definida, restauração testada periodicamente.
- **Aceite:**
  - [ ] Restauração documentada e testada.
  - [ ] Prazo de retenção compatível com a política de privacidade (#32).
- **Guia:** `05-engenharia-qualidade-devops.md` §2.

### #27 [ux] página 404 própria
**Labels:** ux, seo · **Branch:** `feat/27-not-found-page`
- **Contexto:** a rota `*` redireciona para `/`.
- **Evidência:** `frontend/src/router.tsx:137`.
- **O que fazer:** criar página 404 no estilo brutalista, com link de volta, e status 404 no host.
- **Aceite:**
  - [ ] URL inexistente mostra a página.
  - [ ] Teste RTL consulta por papel/texto.
- **Guia:** `07-seo-geo-presenca-online.md` §1 (Página 404 própria).

### #28 [ux] auditar `prefers-reduced-motion`
**Labels:** ux, a11y · **Branch:** `chore/28-reduced-motion`
- **Contexto:** só o swipe tem regra explícita; não conferi as outras animações.
- **Evidência:** `docs` da regra em `.claude/rules/react-rules.md` §7, `frontend/src/styles/index.css`.
- **O que fazer:** usar `/design-motion-principles` em modo auditoria e garantir que toda animação respeite a preferência.
- **Aceite:**
  - [ ] Nenhuma animação ignora `prefers-reduced-motion`.
  - [ ] Relatório da auditoria guardado em `docs/`.
- **Guia:** `08-legal-lgpd-acessibilidade.md` §4 (Acessibilidade).

### #29 [seo] meta OG/Twitter/canonical, `robots.txt`, `sitemap.xml`, `noindex`
**Labels:** seo · **Branch:** `feat/29-seo-basics`
- **Contexto:** só `title` e `description` genéricos; sem robots, sitemap ou `noindex`.
- **Evidência:** `frontend/index.html`, `frontend/public/`.
- **O que fazer:** Open Graph/Twitter e `canonical`; `robots.txt` bloqueando áreas autenticadas e `/admin`; sitemap com as rotas públicas (`/login`, `/cadastro`, `/termos`, `/privacidade`, `/seguranca`); `noindex` nas rotas privadas. Opcional: `llms.txt`.
- **Aceite:**
  - [ ] Arquivos servidos na raiz do domínio.
  - [ ] Rotas privadas com `noindex`.
- **Guia:** `07-seo-geo-presenca-online.md` §1 e §2.

### #30 [legal] consentimento específico e versionado para dados de saúde
**Labels:** legal, security, priority:high · **Branch:** `feat/30-health-data-consent`
- **Contexto:** um único aceite de Termos cobre peso, altura, sexo, nascimento, medidas e metas (dados sensíveis, art. 11 da LGPD).
- **Evidência:** `frontend/src/components/auth/RegisterForm.tsx:226`, `shared/src/schemas/user.schema.ts:22-23`, `backend/src/services/auth.service.ts:171`, `frontend/src/pages/public/LegalPage.tsx`.
- **O que fazer:** consentimento separado e destacado para dados de saúde, registro da versão do documento e da data, possibilidade de revogar. Decisão sobre usuários existentes com `/grill-me`. Revisão jurídica do texto.
- **Aceite:**
  - [ ] Cadastro exige o consentimento específico.
  - [ ] Versão e data gravadas (migração com `down`).
  - [ ] Revogação disponível em Configurações.
  - [ ] Política de privacidade atualizada.
- **Guia:** `08-legal-lgpd-acessibilidade.md` §1 (Conformidade LGPD, Formulários na LGPD).

### #31 [legal] minimização dos campos de saúde
**Labels:** legal · **Branch:** `docs/31-data-minimization`
- **Contexto:** `sex`, `birth_date`, `weight`, `height` e `activity_level` são coletados para o cálculo de metas; falta justificar cada um.
- **Evidência:** `backend/migrations/1790883887302_baseline.js:20-28`, `docs/SPEC.md`.
- **O que fazer:** justificar cada campo na política, tornar opcional o que não for essencial, ajustar onboarding se mudar.
- **Aceite:**
  - [ ] Tabela campo → finalidade na política de privacidade.
  - [ ] Campos opcionais validados no schema.
- **Guia:** `08-legal-lgpd-acessibilidade.md` §1 (Só dados necessários).

### #32 [legal] exclusão, retenção e plano de incidentes
**Labels:** legal · **Branch:** `docs/32-retention-incidents`
- **Contexto:** não li a FK de `foods.user_id` nem o `deleteUser`; backups e logs sem prazo; não há plano de incidente.
- **Evidência:** `backend/migrations/1792500000000_add-diary-and-user-features.js:48`, `backend/src/services/user.service.ts:304-326`.
- **O que fazer:** confirmar que a exclusão remove alimentos personalizados, definir prazos para backups, logs, códigos expirados e `admin_audit_log`, e escrever o plano de resposta a incidentes (comunicação à ANPD). Cobrir a exportação com todas as tabelas.
- **Aceite:**
  - [ ] Teste: após excluir a conta, nenhuma linha do usuário resta.
  - [ ] Prazos de retenção na política de privacidade.
  - [ ] Plano de incidentes em `docs/`.
- **Guia:** `08-legal-lgpd-acessibilidade.md` §1 e §2.

### #33 [a11y] skip link, landmarks, contraste WCAG AA e axe no CI
**Labels:** a11y, tests · **Branch:** `feat/33-a11y-baseline`
- **Contexto:** o grep não achou `<main>` nem skip link; contraste não medido; sem auditoria automatizada.
- **Evidência:** `frontend/src/components/layout/`, `docs/CORES.md`.
- **O que fazer:** landmarks (`main`, `nav`), "pular para o conteúdo", medir contraste nos temas claro e escuro, `jest-axe` ou Lighthouse para login, diário e metas.
- **Aceite:**
  - [ ] Navegação por teclado alcança o conteúdo em um Tab.
  - [ ] Razões de contraste AA registradas.
  - [ ] Teste de acessibilidade verde no CI.
- **Guia:** `08-legal-lgpd-acessibilidade.md` §4 (Auditoria de acessibilidade, Contraste, Navegação por teclado).
