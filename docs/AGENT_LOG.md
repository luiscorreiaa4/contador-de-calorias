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
