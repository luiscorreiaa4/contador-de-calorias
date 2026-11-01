# Backlog da auditoria

Origem: `docs/AUDITORIA.md` (itens ❌ e 🟡). Cada item abaixo tem o formato de uma issue: contexto, evidência, o que fazer, critério de aceite e link do guia. Os links apontam para `docs/guia-tech/`.

- **Status:** `[ ]` aberto · `[~]` em andamento · `[x]` feito (com a data e o commit/PR) · `[adiado]` adiado aguardando decisão/ação do usuário.
- **Prioridade:** `priority:high` = risco alto na auditoria.

---

## Índice

| # | Item | Labels | Status |
|---|---|---|---|
| 1 | [navegador] mover JWT para cookie HttpOnly e reduzir TTL da sessão | security, auth, priority:high | [adiado] |
| 2 | [navegador] unificar leitura do token em `apiFetch` | auth, quality | [x] 01/11/2026 |
| 3 | [navegador] CSP, HSTS e headers de segurança no host do front | security, devops | [adiado] |
| 4 | [auth] bloqueio ou atraso progressivo de login por conta | security, auth, priority:high | [adiado] |
| 5 | [auth] rate limit com store compartilhado, `TRUST_PROXY` e limiter por e-mail/global | security, auth, priority:high | [adiado] |
| 6 | [auth] captcha em register, login e forgot-password | security, auth | [adiado] |
| 7 | [auth] MFA (TOTP), ao menos para administradores | security, auth | [adiado] |
| 8 | [auth] `register` não sobrescreve credenciais de conta não verificada | security, auth | [x] 01/11/2026 |
| 9 | [autorização] role de banco com menor privilégio e role de migração | security, devops, priority:high | [adiado] |
| 10 | [autorização] avaliar RLS no Postgres | security | [adiado] |
| 11 | [entrada] min/max nos schemas numéricos, teto de `page` e `.strict()` | security, quality | [x] 01/11/2026 |
| 12 | [infra] mapear erros do `pg` e não expor `err.code`/`err.message` brutos | security | [x] 01/11/2026 |
| 13 | [infra] CORS: rejeitar `*` e `localhost` em produção | security | [x] 01/11/2026 |
| 14 | [infra] e-mail: proibir `memory` em produção, exigir TLS e timeouts | security, devops | [x] 01/11/2026 |
| 15 | [infra] criptografia em repouso para dados de saúde | security, legal | [adiado] |
| 16 | [infra] atualizar deps `high` e auditar backend/frontend no CI | security, devops, priority:high | [adiado] |
| 17 | [devops] fixar Docker/Actions por versão/SHA, `permissions` e handlers de processo | devops, security | [x] 01/11/2026 |
| 18 | [segredos] `sourcemap: false`, remover `/test-compression-payload`, exigir VAPID | security | [x] 01/11/2026 |
| 19 | [qualidade] formatter, commitlint/Husky e knip | quality | [adiado] |
| 20 | [qualidade] `down` utilizável em todas as migrations e teste de rollback | quality, devops | [adiado] |
| 21 | [tests] cobertura do backend e `thresholds` no front | tests | [adiado] |
| 22 | [tests] E2E com Playwright | tests | [adiado] |
| 23 | [tests] testes de autorização por recurso e carga no CI | tests, security | [x] 01/11/2026 (IDOR) / [adiado] (Carga CI) |
| 24 | [devops] deploy: Dockerfile, ambientes e etapa no CI | devops | [adiado] |
| 25 | [observability] rastreio de erros, métricas e alertas | observability | [adiado] |
| 26 | [devops] backup do Postgres com teste de restauração | devops | [adiado] |
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
**Labels:** security, auth, priority:high · **Status:** `[adiado]`
- **Motivo do adiamento:** Requer decisão prévia de arquitetura com o usuário (via `/grill-me`) sobre estratégia de CSRF (token sincronizado vs SameSite=Strict + validação de cabeçalho Origin), mecanismo de refresh tokens com rotação em banco, redução do TTL e compatibilidade de chamadas cross-origin no deploy.
- **Guia:** `03-seguranca-web.md` §2 (Armazenamento no navegador) e §3 (Expiração de sessão).

### #2 [navegador] unificar leitura do token em `apiFetch`
**Labels:** auth, quality · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Centralizada a leitura do token de autenticação no helper único exportado `getStoredAuthToken()` em `frontend/src/services/api.ts`. Esse helper busca o token sequencialmente em `localStorage` e `sessionStorage`. Atualizados `apiFetch`, `apiFetchWithMeta` e `AuthContext.tsx` para consumir exclusivamente esse helper.
- **Testes:** `frontend/src/tests/api.test.ts` validando o envio do header `Authorization: Bearer <token>` a partir de `sessionStorage`.

### #3 [navegador] CSP, HSTS e headers de segurança no host do front
**Labels:** security, devops · **Status:** `[adiado]`
- **Motivo do adiamento:** A definição de headers no host estático do frontend (Vercel, Netlify, Cloudflare Pages, S3/CloudFront) depende da infraestrutura de deploy do frontend (#24), que ainda não foi escolhida nem provisionada pelo usuário.
- **Guia:** `03-seguranca-web.md` §6 (HTTPS e domínio com certificado SSL).

### #4 [auth] bloqueio ou atraso progressivo de login por conta
**Labels:** security, auth, priority:high · **Status:** `[adiado]`
- **Motivo do adiamento:** Requer decisão de negócio do usuário sobre a política de lockout: número exato de tentativas consecutivas permitidas antes do bloqueio, duração do bloqueio (em minutos), envio de e-mail de alerta de segurança e regras de desbloqueio antecipado.
- **Guia:** `03-seguranca-web.md` §3 (Quantidade de tentativas de login).

### #5 [auth] rate limit com store compartilhado, `TRUST_PROXY` e limiter por e-mail/global
**Labels:** security, auth, priority:high · **Status:** `[adiado]`
- **Motivo do adiamento:** Depende de escolha de infraestrutura do usuário (provisionar instância de Redis compartilhado vs usar tabela no PostgreSQL para o store do express-rate-limit) e da topologia de proxy reverso no deploy (#24).
- **Guia:** `03-seguranca-web.md` §3 (Rate limit nos endpoints).

### #6 [auth] captcha em register, login e forgot-password
**Labels:** security, auth · **Status:** `[adiado]`
- **Motivo do adiamento:** Requer credenciais e chaves de API externas (Cloudflare Turnstile ou hCaptcha) criadas e fornecidas pelo usuário, além de alinhamento com o usuário se o desafio deve ser interativo ou invisível.
- **Guia:** `03-seguranca-web.md` §3 (Captchas).

### #7 [auth] MFA (TOTP), ao menos para administradores
**Labels:** security, auth · **Status:** `[adiado]`
- **Motivo do adiamento:** Requer decisão de design/produto com o usuário sobre o fluxo de ativação, biblioteca escolhida, geração e armazenamento seguro de códigos de recuperação (recovery codes), e política de obrigatoriedade para administradores.
- **Guia:** `03-seguranca-web.md` §3 (MFA).

### #8 [auth] `register` não sobrescreve credenciais de conta não verificada
**Labels:** security, auth · **Status:** `[x]` (Concluído em 01/11/2026)
- **O que foi feito:** Em `backend/src/services/auth.service.ts`, foi removida a sobrescrita de `name` e `password_hash` para contas pendentes de verificação. A função insegura `overwriteUnverifiedUser` em `backend/src/models/auth.model.ts` foi eliminada. Se o e-mail já existe e não está verificado, o sistema apenas emite e envia um novo código de verificação, respondendo o 202 genérico sem vazar a existência da conta.
- **Testes:** `backend/tests/integration/auth_email_verification.test.ts` comprovando que o segundo cadastro não altera o `password_hash` existente.

### #9 [autorização] role de banco com menor privilégio e role de migração
**Labels:** security, devops, priority:high · **Status:** `[adiado]`
- **Motivo do adiamento:** Requer provisionamento e gerenciamento pelo usuário de dois usuários/senhas de banco de dados separados no PostgreSQL da infraestrutura (`app_user` sem privilégios de DDL e `migration_user` com permissão de DDL).
- **Guia:** `03-seguranca-web.md` §4 (Princípio do menor privilégio).

### #10 [autorização] avaliar RLS no Postgres
**Labels:** security · **Status:** `[adiado]`
- **Motivo do adiamento:** Conforme explicitado no backlog ("decidir com /grill-me se vale RLS com SET LOCAL app.user_id"), exige discussão arquitetural prévia com o usuário quanto a complexidade operacional versus isolamento na camada de aplicação.
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
**Labels:** security, legal · **Status:** `[adiado]`
- **Motivo do adiamento:** Depende da confirmação da ativação de criptografia de disco no provedor de nuvem (AWS RDS, Supabase, etc.) e de decisão com o usuário via `/grill-me` sobre adoção de criptografia por coluna no banco (devido à perda de indexação e impacto em agregações estatísticas).
- **Guia:** `03-seguranca-web.md` §6 (Criptografia de dados sensíveis).

### #16 [infra] atualizar deps `high` e auditar backend/frontend no CI
**Labels:** security, devops, priority:high · **Status:** `[adiado]`
- **Motivo do adiamento:** Atualização de pacotes centrais com salto de major (ex: Zod v3 para v4, Vite, ou React) exige autorização e planejamento de migração pelo usuário para evitar quebra de contratos de runtime.
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
**Labels:** quality · **Status:** `[adiado]`
- **Motivo do adiamento:** A escolha do formatador de código (Prettier vs Biome), integração de hooks Git (Husky) e regras de commit dependem da preferência de tooling do usuário (conforme explicitamente assinalado: "decisão com /grill-me").
- **Guia:** `05-engenharia-qualidade-devops.md` §4.

### #20 [qualidade] `down` utilizável em todas as migrations e teste de rollback
**Labels:** quality, devops · **Status:** `[adiado]`
- **Motivo do adiamento:** Testes de rollback de migração executam `DROP TABLE`, operação estritamente proibida pelas regras de segurança da IA sem autorização explícita e prévia do usuário (Regra D-11 / AGENTS.md: "PROIBIDO Comandos Destrutivos de Banco: NUNCA execute DROP TABLE sem consentimento explícito prévio do usuário").
- **Guia:** `05-engenharia-qualidade-devops.md` §2 (Rollback).

### #21 [tests] cobertura do backend e `thresholds` no front
**Labels:** tests · **Status:** `[adiado]`
- **Motivo do adiamento:** A definição dos percentuais mínimos de corte (thresholds de cobertura para statements, branches, functions, lines) depende de alinhamento com o usuário para evitar bloqueios indevidos no CI.
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
**Labels:** devops · **Status:** `[adiado]`
- **Motivo do adiamento:** Depende da contratação e decisão do usuário sobre o provedor de nuvem para hospedagem do backend e frontend (ex: Railway, Render, Fly.io, AWS, Vercel).
- **Guia:** `05-engenharia-qualidade-devops.md` §1.

### #25 [observability] rastreio de erros, métricas e alertas
**Labels:** observability · **Status:** `[adiado]`
- **Motivo do adiamento:** Requer fornecimento de credenciais, chaves de API e DSNs de provedor de APM externo (Sentry, Datadog, etc.) pelo usuário.
- **Guia:** `05-engenharia-qualidade-devops.md` §3.

### #26 [devops] backup do Postgres com teste de restauração
**Labels:** devops · **Status:** `[adiado]`
- **Motivo do adiamento:** Depende de infraestrutura de storage em nuvem contratada (ex: AWS S3, Cloudflare R2) para arquivamento dos dumps do banco e do ambiente de produção (#24).
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
