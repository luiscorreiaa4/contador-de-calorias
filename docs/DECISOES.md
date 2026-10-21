# Decisões de arquitetura e produto (DECISOES.md)

Registro consolidado das decisões que afetam código, banco e operação. Cada decisão tem
identificador estável (`D-xx`) e não deve ser reescrita: mudanças viram emendas explícitas.

> Este arquivo foi consolidado a partir das referências vivas em `docs/`, `README.md` e no
> código. As decisões abaixo são as citadas pelo repositório até a entrada da D-21.

---

## D-02 — Sessão JWT stateless no cliente

O backend emite JWT HS256 com `userId`. O frontend guarda o token em `localStorage`
("lembrar-me") ou `sessionStorage`. A autorização é feita pelo middleware `authenticate`.

**Emenda D-21/A8:** o JWT passa a carregar também o claim `tv` (`token_version`). O middleware
consulta `users.token_version` por chave primária e rejeita com 401 quando o usuário não existe
ou quando `tv` está ausente/divergente. Refresh token e cookie `HttpOnly` continuam previstos
para a Fase 8.

---

## D-03 — Ordem de entrega da autenticação

A confirmação de e-mail (BL-12) é pré-requisito da recuperação de senha (BL-05). Não faz sentido
permitir reset para contas que ainda não comprovaram posse do e-mail.

**Atendimento:** a D-21 implementa BL-12 (Fase 3) antes de BL-05 (Fase 4). A recuperação só
gera token para contas com `email_verified_at` preenchido.

---

## D-13 — Migrações aplicadas são imutáveis

Nunca editar uma migração já aplicada. Correções e novas estruturas usam arquivos novos com
timestamp maior, em ESM (`export const up/down`). Ver `docs/MIGRATIONS.md`.

**Atendimento na D-21:** as alterações de e-mail/senha entram em migração nova; nenhuma migração
existente foi modificada.

---

## D-19 — SSL e proxy reverso

Conexão SSL estrita com o Postgres usa `DB_SSL_CA`; `TRUST_PROXY` aceita número de saltos ou
`false` (nunca `true`), para que o rate limiting por IP não seja burlado por header forjado.

---

## D-21 — Confirmação de e-mail (BL-12) e recuperação de senha (BL-05)

Aprovada em bloco pelo prompt de execução autônoma. Vale como especificação vinculante.

### A1 — Hard gate no login
Conta sem `email_verified_at` **não recebe JWT**. Não existe "sessão limitada". O login com senha
correta e conta não verificada responde **403** com `code: "EMAIL_NOT_VERIFIED"` e dispara um novo
código respeitando o cooldown (A5). Senha errada ou usuário inexistente mantém a resposta genérica
401 e o `bcrypt` "dummy" do PC-08.

### A2 — Verificação por código
Código de 6 dígitos gerado com `crypto.randomInt`, validade de 15 minutos, máximo de 5 tentativas
por código (a 5ª falha invalida o código), uso único, reenvio com cooldown de 60 s e teto de
5 envios por hora por e-mail. Persistência apenas de `HMAC-SHA256(código, AUTH_TOKEN_PEPPER)`;
comparação em tempo constante. Um novo código invalida os anteriores.

### A3 — Recuperação por link
Token de 32 bytes aleatórios em base64url; persistência apenas do SHA-256; validade de 30 min;
uso único. Novo pedido invalida tokens anteriores. Link no formato
`${APP_BASE_URL}/redefinir-senha#token=...` (fragmento nunca vai ao servidor). O frontend lê,
limpa a URL com `history.replaceState` e envia o token no corpo do POST. `index.html` declara
`referrer: no-referrer`.

### A4 — Sem enumeração de contas
`register`, `forgot-password` e `resend-code` devolvem sempre a mesma resposta (status, corpo e,
na prática, tempo): o e-mail é enviado sem `await` após o commit, com `.catch` que registra o erro
sem segredos.

- Cadastro com e-mail **verificado**: não altera nada e envia ao dono o aviso "alguém tentou criar
  conta com seu e-mail".
- Cadastro com e-mail **não verificado**: sobrescreve nome e hash de senha daquela linha, invalida
  códigos anteriores e envia novo código (respeitando os tetos).
- `forgot-password`: só gera token para conta existente **e** verificada; caso contrário não envia
  nada e a resposta é idêntica.

### A5 — Login de conta não verificada
Senha correta + conta não verificada: **403** `{ code: "EMAIL_NOT_VERIFIED" }` e novo código
(respeitando o cooldown). Senha errada/usuário inexistente: resposta genérica existente, com o
`bcrypt` "dummy" do PC-08 para equalizar o tempo.

### A6 — Cadastro sem sessão
`POST /api/auth/register` responde **202** genérico, sem JWT. A sessão só é emitida em
`POST /api/auth/verify-email` (sucesso) ou no login de conta verificada.

### A7 — Reset transacional
Reset bem-sucedido atualiza o hash (bcrypt + política do PC-08), marca o token como usado e
incrementa `users.token_version` na **mesma transação** (padrão PC-17). Não faz auto-login.
Envia o aviso "sua senha foi alterada" após o commit.

### A8 — `token_version` (emenda à D-02)
JWT carrega `tv`. O middleware lê `token_version` do banco por chave primária e rejeita com 401
se o usuário não existir ou o valor divergir; claim ausente é inválido. Troca de senha autenticada
no perfil também incrementa `token_version` e devolve token novo. Troca de e-mail autenticada
incrementa `token_version`, zera `email_verified_at` e emite novo código de verificação para o
endereço novo; a sessão devolvida usa a nova versão.

### A9 — Limites
Por IP, `express-rate-limit` (rotas de auth); por e-mail, contagem de linhas nas tabelas de
códigos/tokens por janela, sem estado em memória (vale com várias instâncias). Tetos: reset
5/hora por e-mail; `verify-email` 10 tentativas/15 min por IP; `reset-password` 10/hora por IP.
A chave do limitador fica isolada em uma única função, pronta para o Turnstile.

### A10 — Mailer
Interface `Mailer { send({ to, subject, text, html }) }`, com `SmtpMailer` (nodemailer; Mailpit em
dev e SMTP do provedor em produção), `MemoryMailer` (caixa consultável em testes) e escolha por
env. Sem SDK de provedor. Proibido logar código, token, URL de reset ou senha. E-mails em pt-BR,
multipart, HTML simples, sem imagens remotas e sem rastreamento; o reset informa a validade e
"se não foi você, ignore".

### A11 — Normalização e cache
E-mail com `trim` + minúsculas antes de qualquer consulta; sem remover `+tag`. Todas as respostas
de `/api/auth/*` levam `Cache-Control: no-store`.

### A12 — Contas existentes
Contas anteriores à migração ficam **não verificadas** (sem grandfathering). No próximo login com
senha correta recebem 403 e um código para confirmar o e-mail.
