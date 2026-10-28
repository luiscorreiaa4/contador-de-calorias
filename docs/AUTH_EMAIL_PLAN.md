# Plano — Confirmação de e-mail (BL-12) e recuperação de senha (BL-05)

Documento de execução idempotente. Se este arquivo existir com itens não marcados, retome
por eles. Estado também está no `git log` (`feat/auth-email`).

---

## 1. Como é hoje (levantado do código real)

### 1.1 Rotas e controllers

| Rota | Comportamento atual |
| --- | --- |
| `POST /api/users/register` | `registerLimiter` (20/15 min por IP) + `registerUserSchema`. Cria a conta, faz `bcrypt.hash` e devolve **201** com `{ user, token }`. E-mail duplicado devolve **409** com mensagem específica. |
| `POST /api/users/login` | `loginIpLimiter` (30/15 min por IP) + `loginLimiter` (10/15 min por IP+e-mail) + `loginUserSchema`. Devolve **200** com `{ user, token }`; credencial inválida devolve **401** genérico e executa `bcrypt.compare` contra um hash "dummy" (PC-08). |
| `GET /api/users/me` | `authenticate` + controller. |
| `PUT /api/users/me` | `authenticate` + `sensitiveActionLimiter`; troca de senha autenticada usa `bcrypt` e devolve apenas o usuário. |
| Demais rotas de perfil, metas, medidas | `authenticate`. |

Controllers: `backend/src/controllers/user.controller.ts`. Serviço: `backend/src/services/user.service.ts`
(`register`, `login`, `updateProfile`, `deleteAccount`, etc.). Model: `backend/src/models/user.model.ts`
(SQL puro com `pool.query`).

### 1.2 JWT e middleware

- `generateToken(userId)` em `user.service.ts` assina `{ userId }` com `JWT_SECRET`, HS256, `JWT_EXPIRES_IN` (padrão `7d`).
- `authenticate` (`backend/src/middlewares/auth.ts`) valida o header `Bearer`, verifica a assinatura/expiração e exige `userId` via Zod. **Não consulta o banco** e não há revogação.
- `requireUserId` lança 401 se o middleware não populou `req.userId`.

### 1.3 Banco de dados

Tabela `users` (baseline + migrações):
`id uuid PK`, `name`, `email varchar(255) UNIQUE`, `password_hash`, `goal`, `sex`, `birth_date`,
`weight`, `height`, `body_fat`, `activity_level`, `daily_calories_goal`, `daily_proteins_goal`,
`onboarding_completed`, `created_at`, `updated_at`, `terms_accepted_at`.

Índices confirmados no Postgres de desenvolvimento (porta 5433):
- `users_pkey` (id)
- `users_email_key` (`email`)
- `users_email_lower_key` (`lower(email)`) — **índice único existe** (migração `1792600000000_add-users-email-lower-index.js`).
- Consulta de duplicatas em `lower(email)` na dev: **0 linhas**. Nada foi apagado.

Não existem tabelas de códigos de verificação nem de tokens de reset. Não existe
`email_verified_at` nem `token_version`.

### 1.4 Schemas Zod e política de senha

- `shared/src/schemas/user.schema.ts`: `registerUserSchema` (name 2..100, `emailSchema`
  trim+lowercase, `strongPasswordSchema`, `acceptTerms: true`), `loginUserSchema`,
  `updateUserSchema`, `deleteUserSchema`, `completeOnboardingSchema`.
- `strongPasswordSchema`: 8..72 caracteres, ao menos uma letra e um número.
- E-mail é normalizado (`trim` + `toLowerCase`) no schema compartilhado e novamente no model.
- Validação HTTP pelo middleware `validate` (400 com mensagens de issues).

### 1.5 Rate limiting

`backend/src/routes/user.routes.ts`: `registerLimiter` (20/15 min/IP), `loginLimiter`
(10/15 min/IP+e-mail, chave `${ip}:${email}`), `loginIpLimiter` (30/15 min/IP) e
`sensitiveActionLimiter` (15/15 min/IP+usuário). Usa `express-rate-limit` v8 com
`ipKeyGenerator`. `TRUST_PROXY` é validado por `parseTrustProxy`.

### 1.6 Configuração de ambiente

`backend/src/config/env.ts` valida com Zod e faz `process.exit(1)` em falha. Hoje exige
`DB_*`, `JWT_SECRET` (mín. 32) e opcionais `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `DB_SSL_CA`,
`VAPID_*`, `TRUST_PROXY`.

### 1.7 Frontend

- Rotas públicas: `/login` e `/cadastro` (`frontend/src/router.tsx`), ambas renderizam
  `LoginPage` → `AuthCard` → `LoginForm`/`RegisterForm`.
- `PublicRoute` redireciona usuário autenticado para `/onboarding` (se não concluiu) ou `/`.
- `ProtectedRoute` exige `isAuthenticated` e onboarding concluído.
- Sessão: `AuthContext` guarda `auth_token` e `user_session` em `localStorage` (lembrar-me)
  ou `sessionStorage`. `apiFetch` (`frontend/src/services/api.ts`) injeta o Bearer e, em 401,
  limpa o storage e dispara `auth:unauthorized`.
- Pós-cadastro atual: `RegisterForm` chama `setAuthSession(response.user, response.token)`;
  `AuthCard` navega para `/`; `ProtectedRoute` leva ao `/onboarding`.
- "Esqueci minha senha" é um link inerte que exibe aviso de indisponibilidade.
- Testes: Vitest + RTL + MSW (`frontend/src/mocks/handlers.ts`), `LoginForm.test.tsx`,
  `RegisterForm.test.tsx`, `LoginPage.test.tsx`, `router.test.tsx`.
- Design: tokens semânticos (`check:colors`), `rounded-none`, foco visível.

---

## 2. Como fica

### 2.1 Decisões

Aprovadas pelo prompt e registradas em `docs/DECISOES.md` como **D-21** (A1..A12):
hard gate no login, código de 6 dígitos com HMAC, reset por link com fragmento,
respostas sem enumeração, sem sessão no cadastro, `token_version` (emenda à D-02),
limites por IP e por e-mail, Mailer plugável (SMTP/Memory), normalização e `Cache-Control: no-store`,
contas existentes não verificadas.

### 2.2 Rotas novas

| Rota | Sucesso | Efeito |
| --- | --- | --- |
| `POST /api/auth/register` | **202** genérico, sem JWT | Cria conta não verificada ou sobrescreve conta não verificada; envia código (se os tetos permitirem). Conta verificada: não altera nada e envia aviso ao dono. |
| `POST /api/auth/verify-email` | **200** `{ user, token }` | Valida código (HMAC, 15 min, 5 tentativas, uso único), marca `email_verified_at` e emite JWT com `tv`. |
| `POST /api/auth/resend-code` | **202** genérico | Reenvia código se a conta existir, não estiver verificada e os limites permitirem. |
| `POST /api/auth/login` | **200** `{ user, token }` | Só para conta verificada. Senha correta + não verificada: **403** `{ code: "EMAIL_NOT_VERIFIED" }` e dispara código (respeitando cooldown). |
| `POST /api/auth/forgot-password` | **202** genérico | Gera token de reset só para conta existente e verificada; invalida tokens anteriores. |
| `POST /api/auth/reset-password` | **200** genérico, sem sessão | Atualiza senha + `token_version` + marca token usado em uma transação; envia aviso. |

Respostas de `/api/auth/*`: `Cache-Control: no-store`.

### 2.3 Tabelas novas/alteradas (migrações novas, D-13)

- `users.email_verified_at timestamptz NULL`
- `users.token_version integer NOT NULL DEFAULT 0`
- `email_verification_codes(id uuid PK, user_id uuid FK ON DELETE CASCADE, code_hash text,
  expires_at timestamptz, attempts int NOT NULL DEFAULT 0, created_at timestamptz,
  consumed_at timestamptz NULL)` + índice `(user_id, created_at DESC)`.
- `password_reset_tokens(id uuid PK, user_id uuid FK ON DELETE CASCADE, token_hash text UNIQUE,
  expires_at timestamptz, used_at timestamptz NULL, created_at timestamptz)` +
  índice `(user_id, created_at DESC)`.

### 2.4 E-mails (pt-BR, multipart texto + HTML simples)

1. Código de verificação (validade 15 min).
2. Link de redefinição (validade 30 min; "se não foi você, ignore").
3. Aviso "alguém tentou criar conta com seu e-mail" (conta já verificada).
4. Aviso "sua senha foi alterada".

Sem imagens remotas, sem pixel, sem rastreamento. Proibido logar código/token/URL.

### 2.5 Telas novas/alteradas

- `/cadastro`: após 202 genérico, segue para `/verificar-email` com o e-mail no `state` do router
  (nunca em `localStorage`).
- `/verificar-email`: campo único numérico (`autocomplete="one-time-code"`,
  `inputMode="numeric"`), contagem de 60 s para reenvio, fallback para digitar o e-mail ao recarregar.
- `/login`: trata `EMAIL_NOT_VERIFIED` e leva à tela de código; link real para `/esqueci-senha`.
- `/esqueci-senha`: aviso genérico idêntico para qualquer e-mail.
- `/redefinir-senha`: lê `#token=...`, limpa a URL com `history.replaceState`, valida a senha com
  o schema do cadastro, `autocomplete="new-password"`, mensagem clara para link inválido/expirado.
- `apiFetch`: propaga `code`/`status` em `ApiError`; 401 continua limpando a sessão
  (inclui `token_version` divergente).

### 2.6 Infraestrutura

- Docker Compose: serviço `mailpit` (SMTP 1025, UI 8025), sem alterar o Postgres.
- Mailer: `Mailer` + `SmtpMailer` (nodemailer) + `MemoryMailer` (testes), escolha por env.
- Variáveis: `APP_BASE_URL`, `MAIL_FROM`, `MAIL_TRANSPORT`, `MAIL_SMTP_HOST`,
  `MAIL_SMTP_PORT`, `MAIL_SMTP_USER`, `MAIL_SMTP_PASS`, `MAIL_SMTP_SECURE`,
  `AUTH_TOKEN_PEPPER` (mín. 32, diferente de `JWT_SECRET`).
- Utilitários puros: código de 6 dígitos (`crypto.randomInt`), HMAC-SHA256, token de 32 bytes
  base64url, SHA-256, comparação em tempo constante, normalização de e-mail.

---

## 3. Checklist de arquivos

| Caminho | Ação | Status |
| --- | --- | --- |
| `docs/AUTH_EMAIL_PLAN.md` | criar plano | [x] |
| `docs/DECISOES.md` | criar e registrar D-21 (+ emenda D-02, D-03) | [x] |
| `docs/AGENT_LOG.md` | criar linha de base e migrações | [x] |
| `backend/.env.example` | documentar variáveis novas | [x] |
| `backend/src/config/env.ts` | validar variáveis novas | [x] |
| `docker-compose.yml` | serviço mailpit | [x] |
| `backend/src/mail/mailer.ts` | interface + SMTP + Memory + fábrica | [x] |
| `backend/src/mail/templates.ts` | 4 templates puros pt-BR | [x] |
| `backend/src/utils/authTokens.ts` | utilitários de segurança | [x] |
| `backend/src/models/auth.model.ts` | SQL de códigos/tokens/versão | [x] |
| `backend/src/services/auth.service.ts` | fluxos BL-12/BL-05 | [x] |
| `backend/src/controllers/auth.controller.ts` | tradução HTTP | [x] |
| `backend/src/routes/auth.routes.ts` | rotas + limitadores | [x] |
| `backend/src/middlewares/authRateLimit.ts` | chave única de limitador | [x] |
| `backend/src/middlewares/auth.ts` | claim `tv` + consulta `token_version` | [x] |
| `backend/src/routes/user.routes.ts` | remover register/login | [x] |
| `backend/src/services/user.service.ts` | `token_version` na troca autenticada | [x] |
| `shared/src/schemas/user.schema.ts` | schemas de verificação/reset | [x] |
| `shared/src/types/user.types.ts` | `tv`, `email_verified_at`, `token_version` | [x] |
| `backend/migrations/*_auth-email-verification.js` | colunas + tabelas | [x] |
| `backend/tests/helpers/auth.ts` | criar usuário verificado para testes | [x] |
| `backend/tests/unit/authTokens.test.ts` | utilitários | [x] |
| `backend/tests/unit/mailer.test.ts` | MemoryMailer/templates | [x] |
| `backend/tests/integration/auth_email_verification.test.ts` | BL-12 | [x] |
| `backend/tests/integration/auth_password_reset.test.ts` | BL-05 | [x] |
| `backend/tests/unit/auth.middleware.test.ts` | `tv` e usuário removido | [x] |
| `frontend/src/pages/public/VerifyEmailPage.tsx` | tela de código | [x] |
| `frontend/src/pages/public/ForgotPasswordPage.tsx` | pedido genérico | [x] |
| `frontend/src/pages/public/ResetPasswordPage.tsx` | link com fragmento | [x] |
| `frontend/src/components/auth/LoginForm.tsx` | 403 e link de reset | [x] |
| `frontend/src/components/auth/RegisterForm.tsx` | 202 e navegação | [x] |
| `frontend/src/services/auth.service.ts` | endpoints `/auth` | [x] |
| `frontend/src/services/api.ts` | `ApiError` | [x] |
| `frontend/src/context/AuthContext.tsx` | token novo após troca de senha | [x] |
| `frontend/src/router.tsx` | rotas públicas | [x] |
| `frontend/index.html` | `referrer: no-referrer` | [x] |
| `frontend/src/**/__tests__` | testes das telas | [x] |
| `docs/EMAIL_SETUP.md` | passo a passo humano (Resend/DNS) | [x] |
| `docs/SPEC.md` / `ARCHITECTURE.md` / `TESTING.md` | atualizar contratos | [x] |
| `README.md` / `AGENTS.md` / `.agents/rules` | Mailpit e regras | [x] |
| `docs/ROADMAP.md` | marcar BL-12/BL-05 | [x] |

---

## 4. Evidências de validação

Execução final em **2026-10-21**, a partir da raiz do monorepo. Todas as suítes rodaram
contra o banco isolado `contador_calorias_test` (nome terminado em `_test`).

| Comando | Resultado |
| --- | --- |
| `npm run test:strict` | **237 testes / 48 suítes, 237 passaram, 0 falharam** (26,3 s); pool encerrado sem handles pendentes. |
| `npm --prefix frontend test -- --run` | **25 arquivos / 175 testes, 0 falhas** (22,1 s). |
| `npm run lint` | **0 erros**; 1 warning pré-existente de React Compiler em `OnboardingFlow.tsx:73` (`watch()`), sem relação com esta entrega. |
| `npm run build` | `tsc -b && vite build` concluído com sucesso (2.578 módulos). |
| `npm --prefix frontend run check:colors` | **0 violações** de tokens semânticos. |
| `npm run test:backend:file tests/integration/auth_email_verification.test.ts` | 10/10 testes (inclui sobrescrita de conta não verificada e invalidação do código anterior). |
| `npm run test:backend:file tests/integration/user.routes.test.ts` | 20/20 testes (cadastro 202, hard gate 403, verificação e perfil). |
| `npm run test:frontend:file src/pages/public/ResetPasswordPage.test.tsx` | 6/6 testes (token no fragmento, limpeza da URL, logout local após reset). |
| `npm run test:frontend:file src/components/auth/LoginForm.test.tsx` | 6/6 testes (403 `EMAIL_NOT_VERIFIED` preservando a escolha de "lembrar-me"). |

### 4.1 Migrações e dados de desenvolvimento

- `1792800000000_auth-email-verification.js` aplicada em **dev** e **test**; nenhuma migração
  anterior foi editada (D-13).
- As duas contas de teste documentadas em `AGENTS.md` (`teste@teste.com` e
  `test@example.com`) foram marcadas como verificadas **manualmente apenas no banco de
  desenvolvimento**, para preservar o fluxo de inspeção de navegador já documentado. Isso não
  altera a regra A12: contas reais anteriores à migração permanecem não verificadas e passam
  pelo hard gate no próximo login.

### 4.2 Auditoria A1–A12

| Item | Evidência |
| --- | --- |
| A1 | `auth.service.login` responde 403 `EMAIL_NOT_VERIFIED` antes de assinar JWT; teste de integração dedicado. |
| A2 | Código `randomInt` de 6 dígitos, HMAC-SHA256, TTL 15 min, 5 tentativas, uso único, cooldown 60 s e teto 5/h nas tabelas; testes de tentativas, cooldown e teto. |
| A3 | Token de 32 bytes base64url, SHA-256 no banco, TTL 30 min, uso único e link com fragmento; teste de reset e limpeza da URL no frontend. |
| A4 | `register`/`resend-code`/`forgot-password` com resposta 202 idêntica; e-mail assíncrono após commit; novo cadastro não verificado invalida códigos anteriores. |
| A5 | Login não verificado dispara código respeitando limites e retorna 403 com `code`. |
| A6 | Cadastro 202 sem `data`/JWT; sessão somente em `verify-email` ou login verificado. |
| A7 | Reset atualiza hash, consome token e incrementa `token_version` na mesma transação; sem auto-login e com e-mail de aviso após commit. |
| A8 | JWT com `tv`; middleware consulta `token_version`; troca autenticada de senha/e-mail revoga sessões e devolve token novo. |
| A9 | Limitadores por IP nas rotas e tetos por e-mail nas tabelas; chave centralizada em `authRateLimitKey`. |
| A10 | `Mailer` + `SmtpMailer` + `MemoryMailer`, escolha por env; templates pt-BR sem rastreamento e sem segredos em logs. |
| A11 | Normalização `trim` + minúsculas e `Cache-Control: no-store` em todo `/api/auth/*`. |
| A12 | Migração não preenche `email_verified_at`; contas legadas continuam sujeitas ao 403 até verificarem. |

### 4.3 Fora de escopo / pendências conscientes

- Login social (OAuth2) e Turnstile continuam no roadmap (Fase 6).
- Cookies `HttpOnly` + refresh tokens continuam previstos para a Fase 8 (D-02).
- Inspeção visual no navegador não foi executada; a validação desta entrega é automatizada,
  conforme a regra de evitar browser para alterações simples.

