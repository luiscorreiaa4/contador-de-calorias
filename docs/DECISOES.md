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

---

## D-22 — Painel administrativo do catálogo global e ferramentas de curadoria

Aprovada pelo prompt de execução autônoma. Especificação vinculante para RBAC de catálogo, integridade e ferramentas de curadoria.

### B1 — Papel sempre do banco
O papel do usuário vem SEMPRE do banco de dados: o middleware de autenticação consulta `role` (e `token_version`) por chave primária a cada requisição. Nunca autoriza por claim do JWT. O papel chega ao frontend pelo payload do usuário (`/auth/login`, `/users/me`), unicamente para controle de interface.

### B2 — Criação estrita de administradores
É proibido criar conta admin em migrações, seeds ou variáveis de ambiente. Sem `ADMIN_EMAIL` e sem `ADMIN_DEFAULT_PASSWORD`. O primeiro admin é criado por fluxo natural: cadastro normal, e-mail verificado, e promoção soberana no servidor via CLI: `npm run admin:promote <email>`.

### B3 — Escopo estrito ao catálogo global
O administrador gerencia apenas o catálogo global (`foods` com `user_id IS NULL`). Nenhum endpoint admin lê refeições, perfil, metas ou listagem de usuários. Gestão de administradores ocorre exclusivamente via CLI (`promote`, `demote`, `list`).

### B4 — Sem exclusão física de alimentos
Alimentos nunca são apagados do banco de dados: apenas ativados ou desativados (`active = true | false`). Não existe rota HTTP de `DELETE` de alimentos.

### B5 — Auditoria atômica obrigatória
Toda escrita administrativa (API e CLI) grava na tabela `admin_audit_log` dentro da **mesma transação**: `actor_user_id` (nulo para CLI), `actor_type` (`'user' | 'cli'`), `action`, `entity_type`, `entity_id`, `before` (jsonb), `after` (jsonb), `created_at`. Não existem rotas de edição ou exclusão do log.

### B6 — Integridade do histórico
Refeições antigas não são recalculadas nem corrompidas quando um alimento é editado ou desativado. Constatou-se na Fase 1 que a tabela `meal_items` persiste um snapshot imutável dos macronutrientes e calorias. A edição dos campos nutricionais no catálogo é livre para alimentos futuros sem desregular registros retroativos. Consultas de histórico e estatísticas nunca filtram por `active`.

### B7 — Barreira contra novos lançamentos com alimentos inativos
Qualquer tentativa de criar item novo de refeição com alimento desativado é rejeitada com status **422** e mensagem contextual explicativa. Na edição de refeição (`PUT /api/meals/:id`), itens pré-existentes com alimentos inativos são preservados.

### B8 — Política de cache do catálogo
O catálogo público possui cabeçalho de cache HTTP `Cache-Control: private, max-age=300` (D-07). A desativação de um alimento pode levar até 5 minutos para sumir das buscas de quem já consultou recentemente. A política é mantida sem alterações.

### B9 — Fidelidade nutricional e fontes obrigatórias
É proibido inventar dados nutricionais. Todo alimento oficial novo exige `source` e `source_ref` auditáveis (ex.: "TACO 4ª ed., código X", "rótulo do produto Y", "IBGE medidas referidas"). Sem fonte, a inserção é rejeitada. O agente não escreve listas arbitrariamente: entrega modelo vazio e ferramentas de curadoria.

### B10 — Proteção do importador contra sobreposição
A importação automatizada (ex.: `backend/scripts/import-foods.ts`) nunca reativa alimentos desativados nem sobrescreve alimentos curados ou editados manualmente (identificados pelo marcador `admin_edited_at IS NOT NULL`).

### B11 — Guarda no roteador administrativo
Todas as rotas sob `/api/admin/*` são protegidas por guarda no roteador raiz: `router.use(authenticate, requireAdmin)`. Requisições não autenticadas recebem 401; usuários comuns autenticados recebem 403 com código `FORBIDDEN`.

### B12 — Whitelist estrita de campos e validação por 100 g
Campos permitidos na escrita são rigorosamente filtrados por schemas Zod dedicados. `source`, `user_id` e `active` na criação são controlados pelo servidor. Paginação com limite máximo 100, busca textual com escape de caracteres especiais do ILIKE (`%`, `_`, `\`). Validação dura de valores por 100 g: valores não negativos, kcal ≤ 900, cada macro ≤ 100 g, P+C+G ≤ 100,5 g. Divergência calórica (> 25%) emite alertas (*warnings*) na resposta sem bloquear o salvamento.

