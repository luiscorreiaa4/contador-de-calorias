# Backlog da auditoria

Origem: `docs/AUDITORIA.md` (itens ❌ e 🟡). Cada item abaixo tem o formato de uma issue: contexto, evidência, o que fazer, critério de aceite e link do guia. Os links apontam para `docs/guia-tech/`.

- **Status:** `[ ]` aberto · `[~]` em andamento · `[x]` feito (com a data e o commit/PR) · `[adiado]` adiado aguardando decisão/ação do usuário.
- **Prioridade:** `priority:high` = risco alto na auditoria.

---

## Índice

| # | Item | Labels | Status |
|---|---|---|---|
| 1 | [navegador] mover JWT para cookie HttpOnly e reduzir TTL da sessão | security, auth, priority:high | [x] 01/11/2026 |
| 2 | [navegador] unificar leitura do token em `apiFetch` | auth, quality | [x] 01/11/2026 |
| 3 | [navegador] CSP, HSTS e headers de segurança no host do front | security, devops | [x] 02/11/2026 |
| 4 | [auth] bloqueio ou atraso progressivo de login por conta | security, auth, priority:high | [x] 02/11/2026 |
| 5 | [auth] rate limit com store compartilhado, `TRUST_PROXY` e limiter por e-mail/global | security, auth, priority:high | [x] 02/11/2026 |
| 6 | [auth] captcha em register, login e forgot-password | security, auth | [x] 02/11/2026 |
| 7 | [auth] MFA (TOTP), ao menos para administradores | security, auth | [x] 02/11/2026 |
| 8 | [auth] `register` não sobrescreve credenciais de conta não verificada | security, auth | [x] 01/11/2026 |
| 9 | [autorização] role de banco com menor privilégio e role de migração | security, devops, priority:high | [~] 02/11/2026 |
| 10 | [autorização] avaliar RLS no Postgres | security | [x] 02/11/2026 |
| 11 | [entrada] min/max nos schemas numéricos, teto de `page` e `.strict()` | security, quality | [x] 01/11/2026 |
| 12 | [infra] mapear erros do `pg` e não expor `err.code`/`err.message` brutos | security | [x] 01/11/2026 |
| 13 | [infra] CORS: rejeitar `*` e `localhost` em produção | security | [x] 01/11/2026 |
| 14 | [infra] e-mail: proibir `memory` em produção, exigir TLS e timeouts | security, devops | [x] 01/11/2026 |
| 15 | [infra] criptografia em repouso para dados de saúde | security, legal | [~] 02/11/2026 |
| 16 | [infra] atualizar deps `high` e auditar backend/frontend no CI | security, devops, priority:high | [~] 02/11/2026 |
| 17 | [devops] fixar Docker/Actions por versão/SHA, `permissions` e handlers de processo | devops, security | [x] 01/11/2026 |
| 18 | [segredos] `sourcemap: false`, remover `/test-compression-payload`, exigir VAPID | security | [x] 01/11/2026 |
| 19 | [qualidade] formatter, commitlint/Husky e knip | quality | [~] 02/11/2026 |
| 20 | [qualidade] `down` utilizável em todas as migrations e teste de rollback | quality, devops | [x] 02/11/2026 |
| 21 | [tests] cobertura do backend e `thresholds` no front | tests | [~] 02/11/2026 |
| 22 | [tests] E2E com Playwright | tests | [adiado] |
| 23 | [tests] testes de autorização por recurso e carga no CI | tests, security | [x] 01/11/2026 (IDOR) / [adiado] (Carga CI) |
| 24 | [devops] deploy: Dockerfile, ambientes e etapa no CI | devops | [~] 02/11/2026 |
| 25 | [observability] rastreio de erros, métricas e alertas | observability | [~] 02/11/2026 |
| 26 | [devops] backup do Postgres com teste de restauração | devops | [~] 02/11/2026 |
| 27 | [ux] página 404 própria | ux, seo | [x] 01/11/2026 |
| 28 | [ux] auditar `prefers-reduced-motion` | ux, a11y | [x] 01/11/2026 |
| 29 | [seo] meta OG/Twitter/canonical, `robots.txt`, `sitemap.xml`, `noindex` | seo | [x] 01/11/2026 |
| 30 | [legal] consentimento específico e versionado para dados de saúde | legal, security, priority:high | [adiado] |
| 31 | [legal] minimização dos campos de saúde | legal | [adiado] |
| 32 | [legal] exclusão, retenção e plano de incidentes | legal | [adiado] |
| 33 | [a11y] skip link, landmarks, contraste WCAG AA e axe no CI | a11y, tests | [x] 01/11/2026 |

---

## Itens

### #1 [navegador] mover JWT para cookie HttpOnly e reduzir TTL da sessão
**Labels:** security, auth, priority:high · **Status:** `[x]` (Concluído em 01/11/2026)
- **Decisões:** CSRF por `SameSite=Strict` + checagem de `Origin`; sem refresh token (só TTL menor, padrão `1d`); produção na mesma origem (front servido pelo Express ou proxy), pois `*.onrender.com`/`*.vercel.app` em hosts separados seriam sites distintos e o cookie Strict não iria.
- **O que foi feito:** `backend/src/utils/sessionCookie.ts` grava o JWT no cookie `cs_session` (`HttpOnly`, `SameSite=Strict`, `Secure` em produção, validade igual ao `exp`). Login, verify-email e `PUT /users/me` (token renovado) definem o cookie; novo `POST /api/auth/logout` o expira. `authenticate` aceita Bearer ou cookie; com cookie, métodos não seguros exigem `Origin` em `CORS_ORIGIN` (senão 403). `JWT_EXPIRES_IN` passou a `1d`. No front, `apiFetch` usa `credentials: 'include'` e não envia mais `Authorization`; o storage guarda só o marcador `auth_session` e o `user_session` sanitizado. O token deixou de ser armazenado ou exposto ao JS.
- **Limitação:** o backend ainda devolve `token` no corpo (e aceita Bearer) para clientes de API e testes; o front o ignora. Remover do corpo é um passo futuro.
- **Testes:** `backend/tests/integration/session_cookie.test.ts`; front: `api.test.ts`, `AuthContext.test.tsx`, `auth_storage.test.tsx`.
- **Guia:** `03-seguranca-web.md` §2 (Armazenamento no navegador) e §3 (Expiração de sessão).

### #2 [navegador] unificar leitura do token em `apiFetch`
**Labels:** auth, quality · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Centralizada a leitura do token de autenticação no helper único exportado `getStoredAuthToken()` em `frontend/src/services/api.ts`. Esse helper busca o token sequencialmente em `localStorage` e `sessionStorage`. Atualizados `apiFetch`, `apiFetchWithMeta` e `AuthContext.tsx` para consumir exclusivamente esse helper.
- **Testes:** `frontend/src/tests/api.test.ts` validando o envio do header `Authorization: Bearer <token>` a partir de `sessionStorage`.

### #3 [navegador] CSP, HSTS e headers de segurança no host do front
**Labels:** security, devops · **Status:** `[x]` (Concluído em 02/11/2026, parcial quanto ao host)
- **O que foi feito:** Criado `frontend/public/_headers` (copiado para `dist/` pelo Vite) com HSTS, CSP (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`.
- **Limitação:** o formato `_headers` é lido por Netlify e Cloudflare Pages. Vercel exige `vercel.json` e S3/CloudFront exige configuração própria; replicar os mesmos valores quando o host for escolhido (#24). `connect-src` está em `'self' https:`; restringir à origem da API em produção.
- **Guia:** `03-seguranca-web.md` §6 (HTTPS e domínio com certificado SSL).

### #4 [auth] bloqueio ou atraso progressivo de login por conta
**Labels:** security, auth, priority:high · **Status:** `[x]` (Concluído em 02/11/2026)
- **Política adotada (padrão, ajustável):** 5 falhas consecutivas bloqueiam a conta por 15 min (`MAX_LOGIN_ATTEMPTS`/`LOGIN_LOCK_MINUTES` em `auth.service.ts`). Sem e-mail de alerta nem desbloqueio antecipado; o fluxo de redefinição de senha zera o bloqueio. Conta bloqueada responde o mesmo 401 genérico, sem revelar o bloqueio nem a existência da conta. Após expirar, uma nova falha bloqueia de novo.
- **O que foi feito:** migration `1793100000000_add-login-lockout.js` (`failed_login_attempts`, `locked_until`), `recordFailedLogin`/`resetFailedLogins` em `auth.model.ts`, checagem em `login`.
- **Testes:** `backend/tests/integration/auth_login_lockout.test.ts` (escrito, ainda não executado: Docker/Postgres indisponíveis na sessão).
- **Guia:** `03-seguranca-web.md` §3 (Quantidade de tentativas de login).

### #5 [auth] rate limit com store compartilhado, `TRUST_PROXY` e limiter por e-mail/global
**Labels:** security, auth, priority:high · **Status:** `[x]` (Concluído em 02/11/2026)
- **O que foi feito:** store compartilhado em Postgres (`backend/src/middlewares/pgRateLimitStore.ts`, tabela `rate_limits`, migration `1793200000000`), usado por todos os limiters de `/api/auth/*` fora de `NODE_ENV=test`; novo limiter de login só por e-mail (`loginEmailLimiter`, 20/15 min) contra ataque distribuído a uma conta. `TRUST_PROXY` e a chave IP+e-mail já existiam.
- **Limitação:** linhas expiradas só são sobrescritas quando a chave reaparece; limpar por `reset_at` em um job se a tabela crescer. Redis ficou descartado (Postgres já existe).
- **Testes:** `backend/tests/unit/pg_rate_limit_store.test.ts`; `auth_rate_limit.test.ts` segue passando com o store em memória.
- **Guia:** `03-seguranca-web.md` §3 (Rate limit nos endpoints).

### #6 [auth] captcha em register, login e forgot-password
**Labels:** security, auth · **Status:** `[x]` (Concluído em 02/11/2026)
- **O que foi feito:** Cloudflare Turnstile (gratuito, modo invisível; o desafio só aparece se a Cloudflare exigir). Backend: `backend/src/middlewares/captcha.ts` valida `captcha_token` em `register`, `login` e `forgot-password`, falhando fechado (400 `CAPTCHA_FAILED`); desligado quando `CAPTCHA_SECRET_KEY` não está definido. Front: `frontend/src/services/captcha.ts` carrega o script e injeta o token nas três chamadas de `auth.service.ts`, desligado sem `VITE_CAPTCHA_SITE_KEY`. A CSP em `frontend/public/_headers` libera `challenges.cloudflare.com`.
- **Como ativar:** criar um widget em dash.cloudflare.com → Turnstile (modo "Managed"/invisível), então `CAPTCHA_SECRET_KEY=<secret>` em `backend/.env` e `VITE_CAPTCHA_SITE_KEY=<site key>` em `frontend/.env`. Para testar localmente use as chaves de teste da Cloudflare (site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`, sempre passam). Modo invisível exige citar o Termo de Privacidade do Turnstile na política de privacidade (feito: seção 7 em `LegalPage.tsx`). Basta preencher `CAPTCHA_SECRET_KEY` em `backend/.env` e `VITE_CAPTCHA_SITE_KEY` em `frontend/.env` (copie de `frontend/.env.example`).
- **Testes:** `backend/tests/unit/captcha_middleware.test.ts` (desligado, válido, inválido, ausente, erro de rede).
- **Guia:** `03-seguranca-web.md` §3 (Captchas).

### #7 [auth] MFA (TOTP), ao menos para administradores
**Labels:** security, auth · **Status:** `[x]` (Concluído em 02/11/2026, sem QR; obrigatório para admins)
- **O que foi feito (backend):** TOTP RFC 6238 com `node:crypto` (`backend/src/utils/totp.ts`), segredo cifrado com AES-256-GCM (chave derivada de `AUTH_TOKEN_PEPPER`), 8 códigos de recuperação de uso único (só o hash é salvo). Rotas autenticadas `POST /api/users/me/mfa/{setup,enable,disable}`; `login` aceita `mfa_code` e responde 401 `MFA_REQUIRED` quando falta; código errado conta no bloqueio do #4. Migration `1793300000000`.
- **O que foi feito (front):** `MfaCard` em Segurança (ativar com chave digitada no app, códigos de recuperação exibidos uma vez, desativar com código); `LoginForm` mostra o campo de código ao receber `MFA_REQUIRED`; `GET /users/me` devolve `mfa_enabled`.
- **Admins:** `requireAdmin` responde 403 `MFA_SETUP_REQUIRED` a admin sem MFA ativo (lido do banco a cada requisição, como o papel). `/api/users/me/mfa/*` não passa por esse guard, então o admin consegue ativar; `AdminRoute` redireciona para `/configuracoes/seguranca`. Helper de teste `createVerifiedAdmin` cria admin com MFA (opção `adminWithoutMfa`). Teste em `admin_rbac.test.ts`.
- **Pendente:** QR code (hoje só a chave para digitação manual).
- **Testes:** `backend/tests/integration/auth_mfa.test.ts` (vetor da RFC, fluxo completo, recuperação de uso único).
- **Guia:** `03-seguranca-web.md` §3 (MFA).

### #8 [auth] `register` não sobrescreve credenciais de conta não verificada
**Labels:** security, auth · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Em `backend/src/services/auth.service.ts`, foi removida a sobrescrita de `name` e `password_hash` para contas pendentes de verificação. A função insegura `overwriteUnverifiedUser` em `backend/src/models/auth.model.ts` foi eliminada. Se o e-mail já existe e não está verificado, o sistema apenas emite e envia um novo código de verificação, respondendo o 202 genérico sem vazar a existência da conta.
- **Testes:** `backend/tests/integration/auth_email_verification.test.ts` comprovando que o segundo cadastro não altera o `password_hash` existente.

### #9 [autorização] role de banco com menor privilégio e role de migração
**Labels:** security, devops, priority:high · **Status:** `[~]` (código e script prontos em 02/11/2026; falta provisionar)
- **O que foi feito:** `backend/scripts/provision-db-roles.sql` (idempotente) cria `app_user` (só DML, sem `UPDATE/DELETE` em `admin_audit_log`) e `migration_user` (DDL), com `ALTER DEFAULT PRIVILEGES` para tabelas futuras. A API (`DB_*`) e as migrations (`DATABASE_URL`) já usavam credenciais separadas; a API não executa DDL em runtime. Passo a passo em `docs/DB_ROLES.md`.
- **Pendente (usuário):** rodar o script no Postgres de staging/produção e trocar `DB_USER`/`DATABASE_URL`. Não executado nesta sessão.
- **Guia:** `03-seguranca-web.md` §4 (Princípio do menor privilégio).

### #10 [autorização] avaliar RLS no Postgres
**Labels:** security · **Status:** `[x]` (avaliado em 02/11/2026)
- **Decisão:** não adotar RLS agora (custo de reescrever os models com `SET LOCAL`, risco de bypass silencioso, admin/CLI/catálogo global; isolamento já coberto por `user_id` + testes IDOR). Critérios para reavaliar em `docs/DB_ROLES.md`.
- **Guia:** `03-seguranca-web.md` §4 (Políticas de RLS).

### #11 [entrada] min/max nos schemas numéricos, teto de `page` e `.strict()`
**Labels:** security, quality · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Em `shared/src/schemas/user.schema.ts` e `shared/src/schemas/food.schema.ts`, foram adicionados limites máximos (`weight` max 500kg, `height` max 300cm, `body_fat` max 100%, `calories` max 15000, `serving_weight` e `unit_weight` max 5000g), limite inferior para `measured_at` (a partir de 1900-01-01), teto de 10.000 para `page` em alimentos, e `.strict()` aplicado nos schemas que rejeitam propriedades desconhecidas.
- **Testes:** `backend/tests/unit/schema_bounds.test.ts` com testes de fronteira e rejeição de propriedades extras.

### #12 [infra] mapear erros do `pg` e não expor `err.code`/`err.message` brutos
**Labels:** security · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Em `backend/src/middlewares/errorHandler.ts`, implementado mapeamento seguro de SQLSTATE do PostgreSQL (23505 para 409, 22003, 22P02, 23503, 23514 para 400). A lista de códigos de negócio permitidos em respostas HTTP foi restrita estritamente a `ALLOWED_BUSINESS_CODES` (`EMAIL_NOT_VERIFIED`, `INVALID_VERIFICATION_CODE`, `INVALID_RESET_TOKEN`, `USER_NOT_FOUND`, `FORBIDDEN`), impedindo que códigos internos de driver cheguem ao cliente. Em `backend/src/app.ts`, adicionado `app.disable('x-powered-by')`.
- **Testes:** `backend/tests/unit/error_handler.test.ts` validando contenção de vazamentos e mensagens amigáveis.

### #13 [infra] CORS: rejeitar `*` e `localhost` em produção
**Labels:** security · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Em `backend/src/config/env.ts`, adicionada validação `superRefine` que impede inicialização em produção se `CORS_ORIGIN` contiver `*`, `localhost`, `127.0.0.1` ou origens não-HTTPS. Em `backend/src/app.ts`, origens não autorizadas são rejeitadas com HTTP 403 Forbidden e `{ success: false, code: 'FORBIDDEN' }` sem estourar 500 no log.
- **Testes:** `backend/tests/unit/env_and_cors.test.ts` testando rejeição em produção e resposta 403 padronizada.

### #14 [infra] e-mail: proibir `memory` em produção, exigir TLS e timeouts
**Labels:** security, devops · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Em `backend/src/config/env.ts`, o `envSchema` encerra a inicialização imediatamente se `MAIL_TRANSPORT === 'memory'` em produção. Em `backend/src/mail/mailer.ts`, foram configurados timeouts estritos (`connectionTimeout: 10000`, `greetingTimeout: 10000`, `socketTimeout: 15000`) e `requireTLS: true` em produção para transporte SMTP. A documentação foi atualizada em `docs/EMAIL_SETUP.md`.
- **Testes:** `backend/tests/unit/env_and_cors.test.ts` cobrindo validação de transporte em produção.

### #15 [infra] criptografia em repouso para dados de saúde
**Labels:** security, legal · **Status:** `[~]` (decidido em 02/11/2026; falta uma confirmação)
- **Decisão:** o banco será o Neon (`docs/HOSPEDAGEM.md`), que cifra os dados em repouso (AES-256) no provedor. Criptografia por coluna (`pgcrypto`) **não** será adotada agora: perde índice/busca e as agregações de metas, e a chave ficaria junto da API.
- **Pendente (usuário):** confirmar na página oficial de segurança do Neon que o plano gratuito inclui a cifragem em repouso (só encontrei fontes de terceiros). Reavaliar a cifragem por coluna se o produto passar a atender usuários reais.
- **Guia:** `03-seguranca-web.md` §6 (Criptografia de dados sensíveis).

### #16 [infra] atualizar deps `high` e auditar backend/frontend no CI
**Labels:** security, devops, priority:high · **Status:** `[~]` (parcial em 02/11/2026)
- **O que foi feito:** `npm audit fix` sem `--force` no front e no backend (lockfiles atualizados); suítes de backend e front passando.
- **Pendente (salto de major, precisa de autorização):** `zod` 3→4 (front e backend) e `nodemailer` 7→major seguinte (backend) ainda marcados `high` pelo `npm audit`. O CI continua falhando nesses até migrar.
- **Guia:** `03-seguranca-web.md` §6 (Dependências).

### #17 [devops] fixar Docker/Actions por versão/SHA, `permissions` e handlers de processo
**Labels:** devops, security · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Imagens no `docker-compose.yml` fixadas em `postgres:16.8-alpine` e `axllent/mailpit:v1.22.3`. No `.github/workflows/ci.yml`, adicionado `permissions: contents: read` e GitHub Actions fixadas por SHA imutável (`checkout`, `setup-node`, `gitleaks-action`). Criado módulo unificado `backend/src/config/processHandlers.ts` registrando escutas para `SIGTERM`, `SIGINT`, `uncaughtException` e `unhandledRejection` acionando o encerramento gracioso (`gracefulShutdown`).
- **Testes:** `backend/tests/unit/process_handlers.test.ts` com 4 testes cobrindo shutdown e tratamento de rejeições.

### #18 [segredos] `sourcemap: false`, remover `/test-compression-payload`, exigir VAPID
**Labels:** security · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Em `frontend/vite.config.ts`, configurado `build.sourcemap: false`. Em `backend/src/app.ts`, a rota de teste `/test-compression-payload` foi restrita para ser montada exclusivamente quando `env.NODE_ENV === 'test'` antes da captura geral de 404. Compilação do frontend validada sem emissão de arquivos `.map`.
- **Testes:** `backend/tests/integration/compression.test.ts` e validação do diretório de build.

### #19 [qualidade] formatter, commitlint/Husky e knip
**Labels:** quality · **Status:** `[~]` (parcial em 02/11/2026)
- **O que foi feito:** Prettier (`.prettierrc.json`, `npm run format`/`format:check`), Husky com hook `commit-msg` rodando commitlint (`@commitlint/config-conventional`, `commitlint.config.js`). O formatter não foi aplicado ao repo inteiro nem entra no CI, para não gerar um diff gigante.
- **Pendente:** knip (detecção de código morto) e rodar `npm run format` num commit isolado.
- **Guia:** `05-engenharia-qualidade-devops.md` §4.

### #20 [qualidade] `down` utilizável em todas as migrations e teste de rollback
**Labels:** quality, devops · **Status:** `[x]` (Concluído em 02/11/2026)
- **Autorização:** o usuário autorizou os `DROP TABLE` dos `down` apenas em banco de teste.
- **O que foi feito:** os 16 `down` já existiam e funcionam. `backend/scripts/test-migration-rollback.mjs` (`npm run test:rollback`, também no CI) usa o banco dedicado `contador_calorias_rollback_test`: `up`, compara esquema, `down` de tudo (só `pgmigrations` pode sobrar), `up` de novo e exige esquema idêntico. Nunca toca em outro banco.
- **Limitação:** o `down` da baseline não remove a extensão `uuid-ossp`; migration aplicada não se edita, então o teste a tolera.
- **Guia:** `05-engenharia-qualidade-devops.md` §2 (Rollback).

### #21 [tests] cobertura do backend e `thresholds` no front
**Labels:** tests · **Status:** `[~]` (parcial em 02/11/2026)
- **O que foi feito:** `thresholds` no Vitest do front (statements 75, branches 68, functions 70, lines 77), logo abaixo da cobertura atual (78/72/75/80); o CI já roda `test:coverage`.
- **Pendente:** cobertura do backend (`node:test` com `--experimental-test-coverage` passando pelo runner limitado).
- **Guia:** `05-engenharia-qualidade-devops.md` §5 (Codecov).

### #22 [tests] E2E com Playwright
**Labels:** tests · **Status:** `[adiado]`
- **Motivo do adiamento:** Requer decisão do usuário sobre instalação e custo de tempo/armazenamento de navegadores reais (Chromium/Firefox/WebKit) nos runners do CI.
- **Guia:** `05-engenharia-qualidade-devops.md` §5 (Playwright).

### #23 [tests] testes de autorização por recurso e carga no CI
**Labels:** tests, security · **Status:** `[x]` (IDOR concluído em 01/11/2026) / `[adiado]` (Carga no CI)
- **O que foi feito:** Suíte de autorização por recurso (IDOR/BOLA) implementada e validada em `backend/tests/integration/authorization.test.ts`. Cobre isolamento estrito entre Usuário A e Usuário B para todos os recursos da aplicação: refeições (`meals`), refeições salvas (`saved-meals`), alimentos favoritos (`favorites`), alimentos customizados (`custom foods`), medições corporais (`measurements`), metas nutricionais (`goals`) e bloqueio de usuários comuns em rotas administrativas (`admin RBAC`).
- **Parte adiada (Carga contínua no CI):** Requer definição de limites aceitáveis de tempo e concorrência para runners do GitHub Actions sem causar falso-positivos por estrangulamento de CPU.
- **Testes:** 13 testes de integração passando em `backend/tests/integration/authorization.test.ts`.

### #24 [devops] deploy: Dockerfile, ambientes e etapa no CI
**Labels:** devops · **Status:** `[~]` (parcial em 02/11/2026)
- **O que foi feito:** `Dockerfile` da API na raiz (node:24-slim, `npm start`), `.dockerignore`, passo `docker build` no CI. Build local verificado.
- **Pendente:** escolha do provedor, ambientes (staging/prod), passo de deploy e execução de migrations no deploy.
- **Guia:** `05-engenharia-qualidade-devops.md` §1.

### #25 [observability] rastreio de erros, métricas e alertas
**Labels:** observability · **Status:** `[~]` (backend pronto em 02/11/2026; falta o DSN)
- **Provedor:** Sentry, plano Developer (grátis e recorrente, ~5.000 erros/mês; confirmar em sentry.io/pricing). Não consta no `HOSPEDAGEM.md`.
- **O que foi feito:** `backend/src/config/sentry.ts` inicializa o SDK só com `SENTRY_DSN` e fora de `NODE_ENV=test`; `errorHandler` reporta erros 5xx. `beforeSend` remove corpo, cookies, cabeçalhos e usuário (dados de saúde e `cs_session` não saem da API). SDK fixado em `@sentry/node@10.78.0` (a 11.x traz dependência vulnerável).
- **Pendente:** (usuário) criar o projeto no Sentry e definir `SENTRY_DSN` no Render; alertas por e-mail no painel; erros do front (`@sentry/react`) e citar o Sentry na política de privacidade.
- **Guia:** `05-engenharia-qualidade-devops.md` §3.

### #26 [devops] backup do Postgres com teste de restauração
**Labels:** devops · **Status:** `[~]` (parcial em 02/11/2026)
- **O que foi feito:** `backend/scripts/backup-db.mjs` (`backup` com `pg_dump` e `verify`, que restaura num banco temporário `*_restore_test`, confere `users` e o remove). Não foi executado nesta sessão.
- **Pendente:** agendamento, envio ao storage (S3/R2) e rotina periódica do `verify`.
- **Guia:** `05-engenharia-qualidade-devops.md` §2.

### #27 [ux] página 404 própria
**Labels:** ux, seo · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Criada a página `frontend/src/pages/public/NotFoundPage.tsx` seguindo o design brutalista, com heading 404 expressivo, mensagem clara de orientação e botão de retorno para o início (`/`). A rota catch-all (`path: '*'`) em `frontend/src/router.tsx` foi atualizada para exibir o componente em vez de redirecionar silenciosamente.
- **Testes:** `frontend/src/tests/not_found.test.tsx` validando renderização e acessibilidade com React Testing Library.

### #28 [ux] auditar `prefers-reduced-motion`
**Labels:** ux, a11y · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Realizada auditoria completa de animações e transições na aplicação. O arquivo `frontend/src/styles/index.css` já implementa a regra global `@media (prefers-reduced-motion: reduce)` forçando `animation-duration: 0.01ms !important`, `transition-duration: 0.01ms !important` e `scroll-behavior: auto !important`. O módulo de gestos de swipe possui tratamento dedicado com teste garantindo transição instantânea sem arrasto. Relatório detalhado emitido em `docs/AUDITORIA_REDUCED_MOTION.md`.

### #29 [seo] meta OG/Twitter/canonical, `robots.txt`, `sitemap.xml`, `noindex`
**Labels:** seo · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Criado `frontend/public/robots.txt` bloqueando rastreamento de áreas privadas (`/admin`, `/diario`, `/evolucao`, `/metas`, `/configuracoes`, `/perfil`, `/api`) e liberando páginas públicas. Criado `frontend/public/sitemap.xml` com URLs públicas canônicas. Adicionadas tags `canonical`, `og:*` e `twitter:*` em `frontend/index.html`. Criado hook `frontend/src/hooks/useNoIndex.ts` integrado em `ProtectedRoute` e `AdminRoute` para injetar meta `noindex, nofollow` em rotas privadas.
- **Testes:** `frontend/src/tests/seo_noindex.test.tsx` cobrindo a injeção dinâmica de `noindex`.

### #30 [legal] consentimento específico e versionado para dados de saúde
**Labels:** legal, security, priority:high · **Status:** `[adiado]`
- **Motivo do adiamento:** Conforme explicitado na issue ("Decisão sobre usuários existentes com /grill-me. Revisão jurídica do texto"), envolve alinhamento com o usuário e revisão jurídica formal sobre o tratamento da base de usuários existente para dados de saúde (art. 11 da LGPD).
- **Guia:** `08-legal-lgpd-acessibilidade.md` §1 (Conformidade LGPD, Formulários na LGPD).

### #31 [legal] minimização dos campos de saúde
**Labels:** legal · **Status:** `[adiado]`
- **Levantamento (02/11/2026):** `docs/SPEC.md` RF-002 já define: sem `body_fat` usa Mifflin-St Jeor; `prefiro_nao_responder` usa a constante feminina; sem nível de atividade usa 1,2. **Não há regra documentada** para falta de peso, altura ou data de nascimento (os schemas de edição já os aceitam opcionais, o onboarding exige).
- **Motivo do adiamento:** Tornar opcionais campos corporais (peso, altura, data de nascimento, sexo) altera diretamente os cálculos matemáticos das fórmulas de TMB/GET (Mifflin-St Jeor / Katch-McArdle) e exige decisão de produto pelo usuário.
- **Guia:** `08-legal-lgpd-acessibilidade.md` §1 (Só dados necessários).

### #32 [legal] exclusão, retenção e plano de incidentes
**Labels:** legal · **Status:** `[adiado]`
- **Motivo do adiamento:** Requer aprovação jurídica para governança e política de privacidade (definição de prazos formais de retenção de backups/logs e plano oficial de resposta a incidentes com a ANPD).
- **Guia:** `08-legal-lgpd-acessibilidade.md` §1 e §2.

### #33 [a11y] skip link, landmarks, contraste WCAG AA e axe no CI
**Labels:** a11y, tests · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Adicionado link de acessibilidade "Pular para o conteúdo principal" (`sr-only focus:not-sr-only`) no topo de `frontend/src/components/layout/RootLayout.tsx` apontando para `#main-content`. O componente `frontend/src/navigation/SwipeMain.tsx` recebeu `id="main-content"` e `tabIndex={-1}` no elemento `<main>`. Razões de contraste AA validadas através dos 27 testes de contraste em `frontend/src/styles/tokens.contrast.test.ts`.
- **Testes:** `frontend/src/tests/skip_link.test.tsx` validando a renderização do skip link e seu destino no DOM.
