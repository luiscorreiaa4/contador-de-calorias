# Configuração de e-mail transacional (BL-12 / BL-05)

Guia operacional para confirmação de e-mail e recuperação de senha. O código usa apenas SMTP
genérico (`nodemailer`), sem SDK de provedor. Em desenvolvimento, o **Mailpit** captura todas as
mensagens; em produção, aponte as variáveis para o SMTP do provedor escolhido (Resend, SendGrid,
Amazon SES, Postmark etc.).

---

## 1. Como o envio funciona

1. `backend/src/mail/mailer.ts` escolhe a implementação por `MAIL_TRANSPORT`:
   - `smtp`: `SmtpMailer` via `nodemailer`.
   - `memory`: `MemoryMailer`, caixa em memória usada pelos testes.
   - `http`: `HttpMailer`, `POST` JSON `{ secret, to, subject, text, html }` para `MAIL_HTTP_URL`
     (Web App do Google Apps Script; veja a seção 3.4).
   - `NODE_ENV=test` força `MemoryMailer`, independentemente de `MAIL_TRANSPORT`.
2. Os fluxos de cadastro, reenvio, login não verificado e recuperação **enviam sem `await`** depois
   do commit. A resposta HTTP nunca depende do provedor de e-mail.
3. Falhas de entrega são registradas como `auth_email_delivery_failed`, sem código, token, URL de
   reset ou senha.
4. Nenhum código ou token é gravado em texto puro:
   - Código de verificação: HMAC-SHA256 com `AUTH_TOKEN_PEPPER`.
   - Token de reset: SHA-256.

---

## 2. Desenvolvimento local com Mailpit

O `docker-compose.yml` sobe o PostgreSQL e o Mailpit:

```bash
npm run docker:up
```

| Serviço | Endereço |
| --- | --- |
| SMTP | `localhost:1025` (sem autenticação) |
| Interface web | http://localhost:8025 |

Configuração correspondente em `backend/.env`:

```dotenv
APP_BASE_URL=http://localhost:5173
MAIL_FROM="CalorieSync <no-reply@caloriesync.local>"
MAIL_TRANSPORT=smtp
MAIL_SMTP_HOST=localhost
MAIL_SMTP_PORT=1025
MAIL_SMTP_USER=
MAIL_SMTP_PASS=
MAIL_SMTP_SECURE=false
```

Depois:

```bash
npm run dev:all
```

Fluxo de teste manual:

1. Abra http://localhost:5173/cadastro e crie uma conta. A resposta é `202` genérica e **não** abre
   sessão.
2. Abra http://localhost:8025 e localize a mensagem com o código de 6 dígitos.
3. Informe o código em `/verificar-email`. O login é liberado e a sessão é criada.
4. Saia e use "Esqueci minha senha". O Mailpit recebe o link
   `http://localhost:5173/redefinir-senha#token=...`.
5. Abra o link, defina a nova senha e entre novamente. O token é de uso único e expira em 30 min.

Para trabalhar sem SMTP, use `MAIL_TRANSPORT=memory`. A caixa é interna ao processo e não tem
interface visual; os testes a consultam pelo helper `lastEmailTo`.

---

## 3. Produção com provedor SMTP (exemplo: Resend)

### 3.1 Preparar o domínio

1. Crie a conta no provedor e adicione o domínio remetente (ex.: `caloriesync.app`).
2. No painel do provedor, copie os registros DNS exibidos:
   - **SPF** (`TXT` no domínio ou subdomínio de envio).
   - **DKIM** (um ou mais `TXT`/`CNAME`, conforme o provedor).
   - **DMARC** (`TXT` em `_dmarc`, começando com `v=DMARC1; p=none;` e um endereço de relatórios).
3. Aguarde a propagação e confirme a verificação no painel. Sem DKIM/SPF alinhados, mensagens
   transacionais tendem a cair em spam ou serem rejeitadas.
4. Use um remetente do domínio verificado, por exemplo
   `MAIL_FROM="CalorieSync <no-reply@caloriesync.app>"`. Nunca use um endereço pessoal.

> Os valores exatos de SPF/DKIM variam por provedor e por região. Use sempre os registros exibidos
> no painel do seu provedor; os exemplos acima não substituem essa verificação.

### 3.2 Credenciais SMTP

No provedor, gere uma credencial SMTP e configure o backend por variáveis de ambiente (nunca no
Git):

```dotenv
NODE_ENV=production
APP_BASE_URL=https://app.caloriesync.app
MAIL_FROM="CalorieSync <no-reply@caloriesync.app>"
MAIL_TRANSPORT=smtp
MAIL_SMTP_HOST=smtp.resend.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=resend
MAIL_SMTP_PASS=<credencial-smtp-do-provedor>
MAIL_SMTP_SECURE=false
AUTH_TOKEN_PEPPER=<32+ bytes aleatórios, diferente de JWT_SECRET>
```

Observações:

- Porta `587` normalmente usa STARTTLS (`MAIL_SMTP_SECURE=false`). Porta `465` usa TLS direto
  (`MAIL_SMTP_SECURE=true`). Confirme no provedor.
- `APP_BASE_URL` deve ser a URL pública **HTTPS** do frontend. Ela compõe o link de reset.
- Gere o pepper com:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `AUTH_TOKEN_PEPPER` deve ter no mínimo 32 caracteres e ser **diferente** de `JWT_SECRET`. A
  validação de ambiente falha na inicialização se essa regra for violada.
- Guarde as credenciais no gerenciador de segredos do ambiente. Não commit `backend/.env`.

### 3.3 Timeouts e Segurança TLS em Produção (#14)

Para prevenir vazamento de conexões ou travamento de sockets ociosos no servidor, o transporte SMTP aplica os seguintes limites no `nodemailer`:

- **`connectionTimeout`:** `10000` (10 segundos para estabelecer handshake de rede).
- **`greetingTimeout`:** `10000` (10 segundos para receber a saudação SMTP do servidor).
- **`socketTimeout`:** `15000` (15 segundos para transmissão de dados antes de encerrar o socket ocioso).
- **`requireTLS`:** Forçado em `true` em ambiente de produção (`NODE_ENV=production`) quando `MAIL_SMTP_SECURE=false` (portas 587/25 com STARTTLS), garantindo canal seguro obrigatório.
- **Proibição de `memory`:** A inicialização do backend encerra imediatamente (`fail-fast`) se `MAIL_TRANSPORT=memory` for configurado com `NODE_ENV=production`.

### 3.3 Outros provedores

| Provedor | Host SMTP usual | Usuário |
| --- | --- | --- |
| Resend | `smtp.resend.com` | `resend` |
| SendGrid | `smtp.sendgrid.net` | `apikey` |
| Amazon SES | endpoint da região (ex.: `email-smtp.us-east-1.amazonaws.com`) | credencial SMTP IAM |
| Postmark | `smtp.postmarkapp.com` | token do servidor |

Confirme portas, usuário e política de TLS no painel do provedor.

### 3.4 Envio por HTTPS (Google Apps Script, `MAIL_TRANSPORT=http`)

Usado em hospedagem que bloqueia SMTP (Render grátis). O passo a passo do script está em
[HOSPEDAGEM.md, passo 5](HOSPEDAGEM.md).

```env
MAIL_TRANSPORT=http
MAIL_HTTP_URL=https://script.google.com/macros/s/<ID>/exec
MAIL_HTTP_SECRET=<mesmo valor da propriedade MAIL_SECRET do script>
```

- **Validação no boot:** `MAIL_HTTP_URL` e `MAIL_HTTP_SECRET` são obrigatórias com `http`. Em
  produção a URL precisa ser `https` e não pode ser `localhost`/`127.0.0.1`. O segredo exige no
  mínimo 32 caracteres e é recusado se parecer placeholder.
- **Segredo no corpo:** o Apps Script não lê headers, então o segredo vai no JSON.
- **Redirect:** o `/exec` responde `302` para `script.googleusercontent.com`; o `fetch` segue o
  redirect (o `POST` vira `GET`, que é o esperado).
- **Sucesso:** só quando a resposta final é `2xx` com JSON `{ "ok": true }`. HTML, `ok:false`,
  status diferente de `2xx` e JSON inválido viram erro; o timeout é de 10 s.
- **Logs:** as mensagens de erro são fixas (`mail_http_timeout`, `mail_http_request_failed`,
  `mail_http_status_<n>`, `mail_http_invalid_response`, `mail_http_rejected`) e nunca trazem URL,
  segredo, destinatário, código ou link.

---

## 4. Segurança e operação

- **Nunca logue** código de verificação, token de reset, URL de reset ou senha. Os logs de falha
  têm apenas o nome do evento e a mensagem do erro.
- **Não armazene** código/token no `localStorage`. O e-mail de verificação fica no state do router
  e o token de reset no fragmento da URL, removido com `history.replaceState`.
- **Rate limits:** 5 envios de código por hora por e-mail, cooldown de 60 s, 5 resets por hora por
  e-mail, 10 tentativas de verificação por 15 min por IP e 10 resets por hora por IP.
- **Rotação do pepper:** invalida códigos de verificação pendentes. Tokens de reset usam SHA-256 e
  não são afetados, mas podem ser invalidados solicitando um novo link.
- **Bounces e reclamações:** acompanhe no painel do provedor. O produto não faz retentativa
  automática; uma falha de entrega é apenas registrada.
- **Cache:** todas as respostas de `/api/auth/*` levam `Cache-Control: no-store`.
- **Enumeração:** cadastro, reenvio e recuperação respondem sempre a mesma mensagem genérica,
  exista ou não a conta. Não altere esse comportamento em telas ou mensagens de erro.

---

## 5. Diagnóstico rápido

| Sintoma | Verifique |
| --- | --- |
| Nenhum e-mail no Mailpit | `MAIL_TRANSPORT=smtp`, `MAIL_SMTP_HOST=localhost`, `MAIL_SMTP_PORT=1025`, container `caloriesync_mailpit` ativo |
| E-mail em spam em produção | SPF, DKIM e DMARC verificados; `MAIL_FROM` usa domínio verificado |
| Login retorna 403 `EMAIL_NOT_VERIFIED` | Conta ainda não confirmou o e-mail; abra `/verificar-email` e use o código mais recente |
| Código recusado | Expirou (15 min), já foi usado, atingiu 5 tentativas ou um código mais novo foi emitido |
| Link de reset inválido | Expirou (30 min), já foi usado ou um novo pedido invalidou o anterior |
| `APP_BASE_URL` errada | O link do e-mail aponta para o host configurado; em produção use HTTPS |
| Backend não inicia | `AUTH_TOKEN_PEPPER` ausente/curto ou igual a `JWT_SECRET`; `MAIL_FROM` inválido; `MAIL_HTTP_URL`/`MAIL_HTTP_SECRET` ausentes ou inválidos com `MAIL_TRANSPORT=http` |
| `auth_email_delivery_failed` com `mail_http_rejected` | `MAIL_HTTP_SECRET` diferente do `MAIL_SECRET` do script |
| `auth_email_delivery_failed` com `mail_http_invalid_response` | Script implantado sem acesso "Qualquer pessoa" (o Google devolve página HTML de login) |

---

## 6. Validação automatizada

```bash
npm run test:strict
npm --prefix frontend test -- --run
npm run lint
npm run build
npm --prefix frontend run check:colors
```

As suítes de BL-12/BL-05 usam `MemoryMailer` e o banco `contador_calorias_test`. Elas cobrem
código expirado, tentativas, reenvio, cooldown, reset de uso único, revogação por `token_version` e
respostas sem enumeração.
