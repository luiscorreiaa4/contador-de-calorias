MODO AUTÔNOMO — CONFIRMAÇÃO DE E-MAIL (BL-12) + RECUPERAÇÃO DE SENHA (BL-05)
Projeto CalorieSync. ESCOPO: backend/, frontend/, docker-compose.yml, docs/, .agents/rules/,
AGENTS.md e backend/.env.example. NÃO implemente login social (BL-06) nem Cloudflare Turnstile.
Este prompt substitui o passo "propor plano e aguardar aprovação" do ROADMAP §1. Não peça
aprovação e não pare para perguntar. É IDEMPOTENTE: se docs/AUTH_EMAIL_PLAN.md existir, é uma
retomada; continue pelos itens não marcados.

DECISÕES JÁ TOMADAS (registre-as em docs/DECISOES.md como D-21, na Fase 1)
A1. HARD GATE no login: conta sem e-mail verificado NÃO recebe JWT. Nada de "sessão limitada".
A2. Verificação por CÓDIGO de 6 dígitos (crypto.randomInt), validade 15 min, máx. 5 tentativas
    por código (estourou = código invalidado), uso único, reenvio com cooldown de 60 s e teto de
    5 envios/hora por e-mail. Guardar só HMAC-SHA256(código, AUTH_TOKEN_PEPPER); comparação em
    tempo constante.
A3. Recuperação de senha por LINK: token = 32 bytes aleatórios (base64url), guardar só o SHA-256,
    validade 30 min, uso único; pedir novo token invalida os anteriores. O link usa FRAGMENTO:
    ${APP_BASE_URL}/redefinir-senha#token=...; o frontend lê o token do hash, limpa a URL com
    history.replaceState e envia por POST no corpo. Meta referrer = no-referrer no index.html.
A4. Sem enumeração de contas: register, forgot-password e resend-code retornam SEMPRE a mesma
    resposta (status, corpo e, na prática, mesmo tempo: o e-mail é enviado SEM await, depois do
    commit, com .catch que registra erro sem segredos).
    - Register com e-mail já VERIFICADO: não altera nada; envia ao dono um aviso "alguém tentou
      criar conta com seu e-mail".
    - Register com e-mail NÃO verificado: SOBRESCREVE nome e hash de senha daquela linha e envia
      novo código (respeitando os tetos de envio).
    - Forgot-password: só gera token para conta existente E verificada; caso contrário não envia
      nada (resposta idêntica).
A5. Login com senha correta e conta não verificada: 403 {code:"EMAIL_NOT_VERIFIED"} e dispara
    novo código (respeitando o cooldown). Senha errada ou usuário inexistente: resposta genérica
    já existente (mantenha o bcrypt "dummy" do PC-08 para igualar o tempo).
A6. Registro NÃO devolve mais sessão: retorna 202 genérico. A sessão (JWT) só é emitida em
    POST /api/auth/verify-email {email, code} (sucesso) ou no login normal de conta verificada.
A7. Reset bem-sucedido: atualiza o hash (bcrypt, política de senha do PC-08), marca o token como
    usado, incrementa users.token_version, tudo em UMA transação (padrão do PC-17); NÃO faz
    auto-login; envia e-mail de aviso "sua senha foi alterada".
A8. EMENDA À D-02: adicionar token_version agora. O JWT passa a levar o claim tv; o middleware de
    autenticação lê token_version do banco (SELECT por chave primária) e rejeita com 401 se
    o usuário não existir ou tv divergir (claim ausente = inválido). Se existir troca de senha
    autenticada (perfil), ela também incrementa token_version e devolve token novo. Refresh
    token/cookie HttpOnly continuam na Fase 8.
A9. Limites: por IP, use o express-rate-limit existente (rotas auth); por E-MAIL, conte linhas
    das tabelas de códigos/tokens por janela de tempo (stateless, vale com várias instâncias).
    Teto de pedidos de reset: 5/hora por e-mail; verify-email: 10 tentativas/15 min por IP;
    reset-password: 10/hora por IP. Chave do limitador isolada em UMA função (para o Turnstile
    encaixar depois).
A10. Mailer: interface Mailer { send({to, subject, text, html}) } com adaptadores: SmtpMailer
    (nodemailer; Mailpit em dev, SMTP do provedor em produção), MemoryMailer (testes: caixa de
    saída consultável) e escolha por env. Sem SDK de provedor. Proibido logar código, token ou
    URL de reset. E-mails: pt-BR, multipart (texto + HTML simples), sem imagens remotas e sem
    rastreamento de cliques/aberturas; o corpo do reset diz validade e "se não foi você, ignore".
A11. Normalização: e-mail com trim + minúsculas antes de qualquer consulta. Sem remoção de
    "+tag". Respostas de /api/auth/* com Cache-Control: no-store.
A12. Contas existentes ficam NÃO verificadas (sem grandfathering); precisarão verificar no login.

REGRAS GERAIS
- Siga AGENTS.md, .agents/rules/ e as skills de .agents/skills/.
- Migrações: só arquivos NOVOS (D-13), aplicar com npm run setup no Postgres do Docker (porta
  5433); nunca DROP/TRUNCATE. Liste cada migração no docs/AGENT_LOG.md. Antes de mexer em
  e-mail, confirme se existe índice único em lower(email); se não existir, verifique duplicatas
  e, havendo, PARE e reporte (não apague nada).
- Dependências novas permitidas: nodemailer e @types/nodemailer (somente backend). Nenhuma outra.
- Variáveis novas (validadas no Zod de ambiente existente e documentadas no backend/.env.example,
  SEM valores reais): APP_BASE_URL (https obrigatório em NODE_ENV=production), MAIL_FROM,
  MAIL_TRANSPORT (smtp|memory), MAIL_SMTP_HOST, MAIL_SMTP_PORT, MAIL_SMTP_USER, MAIL_SMTP_PASS,
  MAIL_SMTP_SECURE, AUTH_TOKEN_PEPPER (mín. 32 caracteres, distinto do JWT_SECRET). Falta de
  variável obrigatória = falha rápida com mensagem clara (sem fallback de credencial).
- Docker: acrescente o serviço mailpit (SMTP em 1025, UI em 8025) ao docker-compose.yml, sem
  alterar o serviço do Postgres. Em dev o .env.example aponta para ele.
- Testes: use os comandos oficiais do package.json/AGENTS.md (não invente tsx/npx soltos);
  encerramento do pool pelo helper de teste existente; limpeza do banco de testes só pela
  exceção da D-11 (e-mails com prefixo tester-). Tempo é controlado por expires_at gravado no
  banco de teste ou por relógio injetável; nunca sleep longo.
- Frontend: SOMENTE tokens de cor (npm --prefix frontend run check:colors = 0), react-router
  existente, TanStack Query/Zod/react-hook-form conforme o padrão já adotado. Nada de
  localStorage para e-mail ou código; o e-mail pendente vai no state do router, com fallback
  pedindo o e-mail de novo ao recarregar.
- Ao mudar o comportamento de cadastro, ajuste os testes afetados e docs/SPEC.md no mesmo commit.

VALIDAÇÃO (só estes; limite a saída, ex.: | Select-Object -Last 40)
- npm run test (backend) · npm --prefix frontend test -- --run · npm run lint · npm run build
- npm --prefix frontend run check:colors

FASE 0 — VERIFICAÇÃO E BRANCH
a) git status limpo (senão PARE). Registre a branch atual como BRANCH_BASE.
b) Rode a validação completa e registre a linha de base no docs/AGENT_LOG.md. Se não estiver
   100% verde, PARE e reporte.
c) git switch -c feat/auth-email (se já existir, apenas entre nela e retome). Única troca de
   branch permitida. Nunca push, merge ou rebase.

FASE 1 — DESCOBERTA E PLANO (somente leitura + docs)
Crie docs/AUTH_EMAIL_PLAN.md com a seção "Como é hoje", a partir do CÓDIGO REAL: rotas e
controllers de auth, user.service, middleware auth (como valida o JWT), esquema da tabela
users, índices de e-mail, schemas Zod, rate limiters, config de ambiente, telas
Login/Registro/Onboarding e o fluxo de pós-cadastro, onde o token é guardado no frontend,
política de senha. Depois "Como fica" (rotas, tabelas, telas, emails) e uma CHECKLIST de
arquivos (caminho | ação | status [ ]). Registre A1..A12 em docs/DECISOES.md como D-21 e marque
a emenda à D-02 e o atendimento da D-03 (BL-12 antes do BL-05). Commit: "docs: plano e
decisões D-21 (auth por e-mail)".

FASE 2 — INFRAESTRUTURA
a) Variáveis de ambiente + Zod + .env.example; serviço mailpit no docker-compose.
b) Módulo de e-mail: interface Mailer, SmtpMailer, MemoryMailer, escolha por env, templates em
   funções puras (código de verificação, reset, aviso de conta existente, senha alterada).
c) Utilitários de segurança puros e testados: gerar código (6 dígitos), HMAC do código,
   gerar token (32 bytes) e SHA-256, comparação em tempo constante, normalização de e-mail.
d) Migrações NOVAS: users.email_verified_at timestamptz NULL; users.token_version int NOT NULL
   DEFAULT 0; tabela email_verification_codes (id, user_id FK ON DELETE CASCADE, code_hash,
   expires_at, attempts int default 0, created_at, consumed_at); tabela password_reset_tokens
   (id, user_id FK ON DELETE CASCADE, token_hash UNIQUE, expires_at, used_at, created_at);
   índices por (user_id, created_at). O "down" pode ter DROP apenas dessas estruturas, nunca
   executado. Aplique no banco de dev.
Testes unitários dos utilitários e do MemoryMailer. Commit: "feat(auth): infraestrutura de
e-mail, utilitários de segurança e migrações".

FASE 3 — VERIFICAÇÃO DE E-MAIL (BL-12), backend
Endpoints, schemas Zod em arquivos puros (sem importar Express, por causa da D-17) e serviço:
POST /api/auth/register (A4, A6), POST /api/auth/verify-email, POST /api/auth/resend-code,
ajuste de POST /api/auth/login (A5) e do token (claim tv, A8) com o middleware lendo
token_version. Erros pelo padrão de erros centralizado já adotado (D-10), sem vazar detalhes.
Testes de integração: cadastro→código→verificação→sessão; login bloqueado sem verificação (403
com code); cadastro com e-mail verificado (resposta idêntica + e-mail de aviso, sem alterar
senha); cadastro sobre conta não verificada (sobrescreve e invalida o código antigo); código
errado 5 vezes invalida; código expirado; cooldown e teto de envios por e-mail; resposta
idêntica para e-mail inexistente (compare status e corpo); JWT sem tv ou com tv antigo = 401;
usuário removido = 401. Commit(s): "feat(auth): verificação de e-mail por código (BL-12 1/n)".

FASE 4 — RECUPERAÇÃO DE SENHA (BL-05), backend
POST /api/auth/forgot-password e POST /api/auth/reset-password (A3, A4, A7, A9). Troca de
senha autenticada, se existir, segue A8. Testes: resposta idêntica para e-mail inexistente,
existente e não verificado; token expirado; token reutilizado; token adulterado; dois pedidos
(o primeiro token deixa de valer); reset incrementa tv e um JWT antigo passa a dar 401; a
transação reverte se a atualização falhar (rollback); política de senha aplicada; conta não
verificada não recebe e-mail de reset; limites por e-mail e por IP; nenhum segredo nos logs
capturados. Commit(s): "feat(auth): recuperação de senha (BL-05 1/n)".

FASE 5 — FRONTEND
Telas: Cadastro (envia, mostra o aviso genérico e segue para o código), Verificar e-mail (campo
único numérico com autocomplete="one-time-code" e inputMode numeric, contagem do reenvio,
mensagens de erro genéricas, rótulos e foco acessíveis), Login tratando EMAIL_NOT_VERIFIED
(leva à tela de código), Esqueci a senha (aviso genérico igual para qualquer e-mail), Redefinir
senha (lê #token, limpa a URL, valida a senha com o mesmo schema do cadastro, autocomplete
new-password, mensagem clara para token inválido ou expirado com link para pedir outro).
Rotas públicas no roteador existente; tokens de cor; foco visível; sem texto que revele se o
e-mail existe. Tratamento do 401 por token_version no apiFetch (o 401 sincronizado do PC-06).
Testes (Vitest + RTL + MSW) para cada tela e para o redirecionamento do EMAIL_NOT_VERIFIED.
Commit(s): "feat(auth): telas de verificação e recuperação de senha (BL-05/12)".

FASE 6 — DOCUMENTAÇÃO OPERACIONAL
Crie docs/EMAIL_SETUP.md com o passo a passo para o HUMANO (o agente não consegue fazer):
comprar/usar um domínio e preferir um subdomínio de envio; criar conta no Resend; adicionar os
registros DNS de SPF, DKIM e DMARC (comece com DMARC p=none e depois endureça); desativar
rastreamento de cliques/aberturas no provedor; configurar MAIL_SMTP_* com os dados oficiais
(confira host, porta e usuário na documentação atual do provedor); testar a entregabilidade
antes de abrir ao público; limites do plano grátis (3.000 e-mails/mês, 100/dia). Atualize
docs/SPEC.md, docs/ARCHITECTURE.md, docs/TESTING.md, README (Mailpit na porta 8025),
AGENTS.md e .agents/rules (regras de auth e e-mail), docs/DECISOES.md, ROADMAP e BACKLOG
(BL-05 e BL-12 com o status de concluído do padrão do arquivo).

FASE 7 — AUDITORIA FINAL (com evidência no docs/AUTH_EMAIL_PLAN.md)
a) Validação completa verde (+ check:colors).
b) Greps de segunda via: nenhuma rota auth devolve JWT sem verificação; nenhum log com código,
   token, URL de reset ou senha; nenhuma mensagem diferente entre e-mail existente e inexistente
   nas rotas register/forgot/resend; todo token/código guardado só como hash; nenhum fallback de
   credencial; nenhum localStorage com e-mail ou código; Cache-Control: no-store nas rotas auth.
c) Confira, item a item, A1..A12 e marque cada um.
d) Itens pendentes: liste e NÃO declare sucesso.

LIMITES INEGOCIÁVEIS
- Nunca: git push, merge, rebase, reset --hard, clean, branch -D, stash drop/clear; nunca troque
  de branch além de feat/auth-email.
- Nunca: rm/rmdir/del/Remove-Item, npm install -g, DROP/TRUNCATE/DELETE em massa. Nunca rode
  scripts de reset de banco. Banco: só o Docker (porta 5433).
- Nunca imprima nem commite o conteúdo de backend/.env nem segredos.
- Commits pequenos e semânticos, com código, testes e docs juntos. Se falhar após 2 tentativas
  em um item, git stash push -u -m "falha <item>", registre no AGENT_LOG.md e siga adiante.
- Se der erro ou o contexto encerrar, o estado está em docs/AUTH_EMAIL_PLAN.md e no git log:
  uma nova janela com este mesmo prompt retoma.

AO TERMINAR, PARE e entregue: hashes dos commits; migrações para revisão; decisões do agente;
o que depende de ação humana (docs/EMAIL_SETUP.md); riscos residuais (ex.: e-mail enviado sem
fila, limitador por IP em memória, Turnstile pendente) e a lista de testes manuais.