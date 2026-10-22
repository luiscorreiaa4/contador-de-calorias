# Log de execução do agente (AGENT_LOG.md)

Registro cronológico de linhas de base, migrações e decisões operacionais.

---

## 2026-10-21 — Fase 0: linha de base (BL-12 + BL-05)

- Branch base: `fix/auditoria` (working tree limpo).
- Branch de trabalho: `feat/auth-email`.
- Postgres de desenvolvimento: Docker `caloriesync_postgres`, `127.0.0.1:5433`.
- Índice `users_email_lower_key` confirmado; consulta de duplicatas em `lower(email)`: 0.
- Validação executada antes de qualquer alteração:

| Comando | Resultado |
| --- | --- |
| `npm run test` | 204 testes, 0 falhas (22,6 s) |
| `npm --prefix frontend test -- --run` | 22 arquivos / 153 testes, 0 falhas |
| `npm run lint` | 0 erros (1 warning pré-existente de React Compiler em `OnboardingFlow.tsx`) |
| `npm run build` | sucesso |
| `npm --prefix frontend run check:colors` | 0 violações |

---

## Migrações criadas nesta entrega

> Preencher conforme aplicadas. Regra D-13: somente arquivos novos.

| Arquivo | Conteúdo | Aplicada em dev | Aplicada em test |
| --- | --- | --- | --- |
| `backend/migrations/1792800000000_auth-email-verification.js` | `users.email_verified_at`, `users.token_version`, `email_verification_codes`, `password_reset_tokens` e índices | [x] | [x] |
| `backend/migrations/1792900000000_add-admin-roles-and-audit.js` | `users.role`, `foods.source_ref`, `foods.admin_edited_at` e tabela `admin_audit_log` com índices | [x] | [x] |

---

## 2026-10-21 — Fase 1: plano e decisões

- Criado `docs/AUTH_EMAIL_PLAN.md` com inventário do código real, desenho-alvo e checklist.
- Criado `docs/DECISOES.md` consolidando D-02 (emendada), D-03, D-13, D-19 e D-21 (A1..A12).
- Nenhum código de aplicação alterado nesta fase.

---

## 2026-10-21 — Fases 2 a 4: backend BL-12 + BL-05

- Infraestrutura: env novas, Mailpit no Compose, `Mailer`/`SmtpMailer`/`MemoryMailer`, templates,
  utilitários de HMAC/SHA-256, migração aplicada em dev e test.
- Rotas movidas para `/api/auth/*`: `register` (202 sem sessão), `login` (403 `EMAIL_NOT_VERIFIED`),
  `verify-email`, `resend-code`, `forgot-password` e `reset-password`.
- JWT com `tv`; middleware consulta `users.token_version`; troca de senha/e-mail incrementa a versão.
- Testes: helper `createVerifiedUser`, suítes de BL-12, BL-05, middleware e limites.
- Validação parcial: `npm run test:strict` => 236 testes, 0 falhas; lint e `tsc --noEmit` verdes.
- Frontend, documentação final e auditoria seguem pendentes.

---

## 2026-10-21 — Fase 5: frontend (BL-12 + BL-05)

- Serviços: `frontend/src/services/auth.service.ts` cobre `register`, `login`, `verify-email`,
  `resend-code`, `forgot-password` e `reset-password`; `ApiError` passou a expor `status` e `code`,
  permitindo à UI reagir a `EMAIL_NOT_VERIFIED` sem comparar mensagens.
- Páginas públicas novas: `VerifyEmailPage`, `ForgotPasswordPage` e `ResetPasswordPage`, com
  `AuthPageShell` compartilhado. Rotas registradas fora de `PublicRoute`.
- Cadastro responde `202` e direciona para a verificação usando apenas state do router; login `403`
  encaminha e-mail e `rememberMe`; reenvio respeita cooldown de 60 s.
- Token de reset lido uma vez do fragmento `#token=...` e removido com `history.replaceState`;
  nenhum e-mail/código/token é gravado em `localStorage`/`sessionStorage`.
- `frontend/index.html` define `referrer: no-referrer`. Após reset bem-sucedido, a sessão local
  antiga é encerrada.
- MSW e suítes atualizadas: 25 arquivos / 175 testes, 0 falhas.

---

## 2026-10-21 — Fase 6: documentação

- Novo `docs/EMAIL_SETUP.md` (Mailpit, SMTP, DNS e variáveis).
- Atualizados `SPEC.md`, `ARCHITECTURE.md`, `TESTING.md`, `ROADMAP.md`, `README.md`, `AGENTS.md`
  e as regras em `.agents/rules/`.
- `docs/AUTH_EMAIL_PLAN.md`: checklist completo, evidências da §4 e tabela de auditoria A1–A12.

---

## 2026-10-21 — Fase 7: auditoria e correções

- A4: recadastro de conta não verificada invalida códigos antigos dentro da transação de overwrite,
  mesmo quando o cooldown suprime novo envio; teste de integração adicionado.
- `rememberMe` propagado do login `403` até a página de verificação.
- Página de reset encerra a sessão local após sucesso (teste dedicado).
- Testes manuais de navegador não executados; validação exclusivamente automatizada.
- Contas de desenvolvimento `teste@teste.com` e `test@example.com` marcadas como verificadas
  diretamente no banco de dev para preservar o fluxo documentado; comportamento A12 inalterado.

### Validação final

| Comando | Resultado |
| --- | --- |
| `npm run test:strict` | 237 testes / 48 suítes, 0 falhas (26,3 s) |
| `npm --prefix frontend test -- --run` | 175 testes / 25 arquivos, 0 falhas |
| `npm run lint` | 0 erros (1 warning pré-existente em `OnboardingFlow.tsx:73`) |
| `npm run build` | sucesso |
| `npm --prefix frontend run check:colors` | 0 violações |

---

## 2026-10-22 — Fase 0: Linha de Base (Painel Admin do Catálogo e Curadoria)

- Branch base: `feat/auth-email` (working tree limpo).
- Branch de trabalho: `feat/admin-catalogo`.
- Postgres de desenvolvimento: Docker `caloriesync_postgres`, `127.0.0.1:5433` (`contador_calorias`).
- Validação executada antes de qualquer alteração:

| Comando | Resultado |
| --- | --- |
| `npm run test:strict` | 241 testes / 48 suítes, 0 falhas (23,9 s) |
| `npm --prefix frontend test -- --run` | 177 testes / 25 arquivos, 0 falhas (12,8 s) |
| `npm run lint` | 0 erros (1 warning pré-existente em `OnboardingFlow.tsx:73`) |
| `npm run build` | sucesso (1,35 s) |
| `npm --prefix frontend run check:colors` | 0 violações |

---

## 2026-10-22 — Fase 1: Descoberta e Decisões D-22

- Criado `docs/ADMIN_PLAN.md` com inventário do código real (esquema de users e foods, snapshot imutável em `meal_items`, ausência de filtros por `active` no histórico, middleware de auth por `token_version`, navegação e importador).
- Registrada decisão vinculante **D-22** (B1 a B12) em `docs/DECISOES.md`.
- Constatações do código real:
  - `meal_items` persiste snapshot completo de calorias e macros; edição de alimentos no catálogo é livre para alimentos futuros sem desregular histórico retroativo (B6).
  - Catálogo em `contador_calorias`: 10 alimentos globais ativos, 0 inativos, 0 personalizados.
- Nenhum código de aplicação alterado nesta fase.

---

## 2026-10-22 — Fase 2: Banco e RBAC

- Criada e aplicada migração `1792900000000_add-admin-roles-and-audit.js`:
  - `users.role VARCHAR(20) NOT NULL DEFAULT 'user'` + `CHECK (role IN ('user', 'admin'))`.
  - `foods.source_ref VARCHAR(255) NULL` e `foods.admin_edited_at TIMESTAMPTZ NULL`.
  - Tabela `admin_audit_log` com índices em `created_at` e `(entity_type, entity_id)`.
  - Aplicada em dev (`contador_calorias`) e test (`contador_calorias_test`).
- Tipos `@caloriesync/shared`: adicionado `role` em `User`/`UserWithoutPassword`, e `source_ref`, `admin_edited_at`, `active` em `Food`.
- Backend:
  - `auth.model.ts`: adicionado `getUserAuthContext` consultando `role` e `token_version` por PK.
  - `auth.ts`: middleware `authenticate` carrega `req.userRole` e adicionado middleware `requireAdmin` (403 `FORBIDDEN`).
  - `user.model.ts`: `createUser`, `findUserById` e `updateUser` incluem `role`.
- Testes: `backend/tests/integration/admin_rbac.test.ts` (3/3 passando):
  - Papel padrão 'user';
  - Rejeição de valores inválidos pela constraint CHECK;
  - Rebaixamento de admin para user tem efeito imediato na requisição seguinte sem esperar expiração do JWT (B1).

