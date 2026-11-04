# Plano de hospedagem gratuita do CalorieSync

Guia para quem nunca fez um deploy. Objetivo: colocar o site no ar **de graça**, de forma **confiável** e **simples**, para usar no portfólio, e saber como atualizá-lo depois.

> Os planos gratuitos mudam. Os números abaixo foram conferidos em 02/11/2026; antes de cada cadastro, abra o link da seção "Fontes" e confirme os limites.

---

## 1. O que é "hospedar" (em 2 minutos)

Hoje o site só funciona no seu computador (`localhost`). Hospedar é colocar as mesmas peças em computadores de outras empresas, ligados 24h e acessíveis por um endereço público (`https://...`).

O CalorieSync tem **3 peças**, e cada uma vai para um lugar:

| Peça | O que é | Onde fica no projeto | Onde hospedar (grátis) |
|---|---|---|---|
| **Site (front)** | Arquivos HTML/JS/CSS que rodam no navegador (React + Vite) | `frontend/` | **Netlify** |
| **API (back)** | Programa Node.js/Express que aplica as regras e fala com o banco | `backend/` (+ `shared/`) | **Render** |
| **Banco** | PostgreSQL com usuários, refeições, catálogo de alimentos | migrations em `backend/migrations/` | **Neon** |

Além delas, o cadastro envia e-mails (código de verificação, redefinir senha), então precisamos de um **serviço de e-mail**: o seu próprio **Gmail**, acionado por um **Google Apps Script** (grátis, sem domínio). Também obrigatório e grátis: **Cloudflare Turnstile** (captcha; a API não sobe em produção sem ele). Opcional: **UptimeRobot** (mantém a API acordada).

```
Navegador ──► Netlify (site + proxy /api) ──► Render (API) ──► Neon (Postgres)
                                                  └──► Google Apps Script ──► Gmail (e-mails, via HTTPS)
```

### Por que essa combinação
- **Netlify**: o front já tem `frontend/public/_headers` (CSP, HSTS), formato que o Netlify lê. Plano grátis sem prazo de validade.
- **Render**: roda o `Dockerfile` da API que já existe na raiz. Plano grátis sem cartão.
- **Neon**: Postgres grátis **sem prazo de validade** (o Postgres grátis do Render **expira em 30 dias** e é apagado, por isso não usamos). Suporta as extensões `pg_trgm`, `unaccent` e `uuid-ossp` que o projeto usa.
- **Gmail + Apps Script**: grátis e sem domínio. O e-mail sai dos servidores do próprio Google, então chega na caixa de entrada, e a API fala com ele por HTTPS, que o Render grátis permite (o Render grátis **bloqueia SMTP** desde set/2025, por isso Brevo/SMTP não funcionaria lá).

### A regra que obriga a usar o Netlify como "proxy"
A sessão do usuário fica num cookie `cs_session` com `SameSite=Strict` (issue #1 em `docs/ISSUES.md`). Esse cookie **só é enviado se o site e a API parecerem o mesmo endereço**. Se o site estiver em `x.netlify.app` e a API em `y.onrender.com`, o login não funciona.

Solução sem mexer na lógica: o Netlify repassa tudo que começa com `/api/` para a API no Render. Para o navegador, tudo é `x.netlify.app`. Isso exige dois pequenos arquivos de configuração (passo 6).

---

## 2. Limites reais do plano grátis (leia antes)

| Serviço | Limite | Efeito para você |
|---|---|---|
| **Render (API)** | Dorme após 15 min sem acesso; acordar leva até ~1 min. 750 horas/mês grátis. Sem disco persistente. | A **primeira visita** depois de um tempo parado fica lenta. Veja a mitigação no passo 9. |
| **Neon (banco)** | Sem prazo; ~0,5 a 1 GB por projeto (confira); o computador do banco "hiberna" e acorda sozinho. | Basta para o projeto; o primeiro acesso após hibernar demora um pouco. |
| **Netlify (site)** | Plano grátis com limite mensal de banda e builds. | Sobra para portfólio. |
| **Render (API), e-mail** | Bloqueia saída SMTP (portas 25, 465, 587) no plano grátis. | Por isso o e-mail sai por HTTPS (Apps Script), não por SMTP. |
| **Gmail via Apps Script** | ~100 destinatários/dia (conta Gmail comum). | Sobra para portfólio: cada cadastro gasta 1 e-mail (2 se pedir reenvio). |

Quem for avaliar seu portfólio pode pegar a API "dormindo". Coloque no README do projeto: *"A API gratuita pode levar ~1 min para acordar na primeira visita."*

**Domínio próprio é opcional e pago** (~R$ 40/ano). Neste plano usamos os endereços grátis `*.netlify.app` e `*.onrender.com`, e o e-mail sai de um Gmail, sem domínio.

---

## 3. Antes de começar (uma vez só)

1. Conta no **GitHub** com o repositório do projeto (já existe: `luiscorreiaa4/contador-de-calorias`). Tudo é publicado a partir dele.
2. Crie contas gratuitas, entrando com o GitHub quando houver a opção: [Netlify](https://www.netlify.com), [Render](https://render.com), [Neon](https://neon.com), [Cloudflare](https://dash.cloudflare.com) (Turnstile) e [UptimeRobot](https://uptimerobot.com).
3. Instale na sua máquina o **cliente `psql`** (vem com o instalador do PostgreSQL; marque só "Command Line Tools"). Ele serve para rodar scripts SQL no Neon. Alternativa: usar o editor SQL do painel do Neon.
4. Abra um **bloco de notas seguro** (ou gerenciador de senhas) para guardar senhas e chaves. **Nunca** coloque segredos em arquivos commitados nem em chat.

### Segredos que você vai gerar
Gere cada valor abaixo no terminal (cada um diferente):
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- `JWT_SECRET` (mínimo 32 caracteres)
- `AUTH_TOKEN_PEPPER` (mínimo 32 caracteres, **diferente** do `JWT_SECRET`; a API recusa iniciar se forem iguais)
- Chaves de notificação push (VAPID): `npx web-push generate-vapid-keys` → `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` (sem elas, `GET /api/push/public-key` responde 503 e o botão de notificações não funciona; não há chave padrão)
- Senhas dos dois papéis de banco (`app_user` e `migration_user`), geradas do mesmo jeito

> **Nunca copie os valores do `backend/.env.example`.** A API recusa iniciar se `JWT_SECRET` ou `AUTH_TOKEN_PEPPER` contiverem `preencha`, `sua_senha`, `changeme`, `placeholder`, `example` ou `exemplo` (esses textos estão no repositório público; quem os conhecesse poderia forjar sessões, inclusive de admin). Use sempre o comando acima.

---

## 4. Passo a passo

A ordem importa, porque cada serviço precisa do endereço do outro.

### Passo 1 · Reservar o nome do site no Netlify
1. No Netlify: **Add new site → Import an existing project → GitHub** e escolha o repositório.
2. **Não** publique ainda (ou deixe falhar). Em **Site configuration → Change site name**, escolha algo como `caloriesync-seunome`. O endereço será `https://caloriesync-seunome.netlify.app`.
3. Anote esse endereço. Vamos chamá-lo de **`URL_SITE`**.

### Passo 2 · Criar o banco no Neon
1. No Neon: **Create project**, nome `caloriesync`, versão do Postgres 16, região mais próxima do Render (ex.: `us-east`).
2. Na tela do projeto, clique em **Connect** e copie a **connection string** (formato `postgresql://usuario:senha@host/neondb?sslmode=require`). Chame-a de **`URL_ADMIN`**; ela tem poder total, **não** vai para a API.
3. As extensões `uuid-ossp`, `unaccent` e `pg_trgm` são criadas pelas migrations; o Neon permite isso.

### Passo 3 · Criar as tabelas e os dados (migrations)
As migrations criam tabelas e já carregam o catálogo de alimentos. Rode **do seu computador**, apontando para o Neon:
```powershell
$env:DATABASE_URL="<URL_ADMIN>"
npm run setup
```
Resultado esperado: lista de migrations aplicadas sem erro. Confira no painel do Neon (aba **Tables**) se `users`, `foods`, `meals` etc. existem.
Feche o terminal depois (ou rode `Remove-Item Env:DATABASE_URL`) para não deixar a URL na sessão.

### Passo 4 · Separar os papéis de banco (conclui o item #9)
Em vez de a API usar o usuário todo-poderoso, ela usa `app_user`, que só lê e grava dados (sem criar/apagar tabelas, sem editar o log de auditoria). Quem altera o esquema é o `migration_user`.

1. Rode o script do repositório como administrador, **depois** das migrations (ele precisa que `admin_audit_log` já exista):
   ```powershell
   psql "<URL_ADMIN>" -v ON_ERROR_STOP=1 `
     -v app_password="'<senha_app>'" -v migration_password="'<senha_migracao>'" `
     -v dbname=neondb -f backend/scripts/provision-db-roles.sql
   ```
   (`dbname` é o nome do banco que aparece na connection string, normalmente `neondb`.)
2. Passe a posse das tabelas ao `migration_user`:
   ```sql
   REASSIGN OWNED BY <usuario_da_URL_ADMIN> TO migration_user;
   ```
   Se o Neon recusar, use `GRANT <usuario_da_URL_ADMIN> TO migration_user;`.
3. Monte as duas URLs que serão usadas depois (troque o host pelo da sua string do Neon):
   - **`URL_MIGRACAO`** = `postgresql://migration_user:<senha_migracao>@<host>/neondb?sslmode=require`
   - API: `DB_HOST=<host>`, `DB_PORT=5432`, `DB_USER=app_user`, `DB_PASSWORD=<senha_app>`, `DB_NAME=neondb`
4. **Teste** (esperado: dois `permission denied` e uma contagem):
   ```powershell
   psql "postgresql://app_user:<senha_app>@<host>/neondb?sslmode=require" -c "CREATE TABLE x(i int);"
   psql "postgresql://app_user:<senha_app>@<host>/neondb?sslmode=require" -c "UPDATE admin_audit_log SET actor_type='x';"
   psql "postgresql://app_user:<senha_app>@<host>/neondb?sslmode=require" -c "SELECT count(*) FROM users;"
   ```
5. Dali em diante, **todas** as migrations futuras usam `URL_MIGRACAO`, nunca a URL de admin.

> Dev e testes locais continuam com o usuário `postgres` do Docker. O script só é para o banco hospedado.
> Backup (opcional, pois o banco está vazio agora): `backend/scripts/backup-db.mjs`.

### Passo 5 · Configurar o e-mail (Gmail + Google Apps Script, grátis)

O cadastro só termina com o código de 6 dígitos enviado por e-mail, e "Esqueci minha senha" depende do link enviado por e-mail. Se o e-mail não chegar, ninguém consegue usar o site.

**Por que este caminho:**
- **O Render grátis bloqueia SMTP** (portas 25, 465 e 587) desde setembro de 2025. Qualquer serviço via SMTP (Brevo, Gmail SMTP, SendGrid) fica sem resposta lá; só HTTPS passa.
- **Um Gmail como remetente só chega na caixa de entrada se o envio sair do próprio Google.** Enviado por um terceiro (ex.: Brevo com remetente `@gmail.com`), falha na checagem DMARC e vai para o spam.
- O **Google Apps Script** resolve as duas coisas de graça: é um pequeno programa na sua conta Google com um endereço HTTPS. A API manda o e-mail para esse endereço e o script envia pelo seu Gmail. Limite de ~100 destinatários/dia.

> ⚠️ **Mudança de código pendente:** hoje a API só sabe enviar por SMTP (`backend/src/mail/mailer.ts`). Antes do deploy é preciso um adaptador novo, `MAIL_TRANSPORT=http`, que faz `POST` de `{ secret, to, subject, text, html }` para `MAIL_HTTP_URL`, com `MAIL_HTTP_URL`/`MAIL_HTTP_SECRET` validadas em `backend/src/config/env.ts`. Em desenvolvimento nada muda: o Mailpit continua com `MAIL_TRANSPORT=smtp`.

#### 5.1 Conta Gmail do projeto
1. Crie um Gmail só para o projeto (ex.: `caloriesync.app@gmail.com`). É o remetente que os usuários verão, e assim o seu e-mail pessoal fica de fora.
2. Ative a **verificação em duas etapas** nessa conta, porque o script terá permissão para enviar e-mails por ela.

#### 5.2 Criar o script
1. Logado nessa conta, abra [script.google.com](https://script.google.com) → **Novo projeto** e dê o nome `CalorieSync Mailer`.
2. Apague o conteúdo de `Código.gs` e cole:
   ```js
   function doPost(e) {
     const secret = PropertiesService.getScriptProperties().getProperty('MAIL_SECRET');
     let body;
     try { body = JSON.parse(e.postData.contents); } catch (err) { return reply(false); }
     if (!secret || body.secret !== secret) return reply(false);
     MailApp.sendEmail({ to: body.to, subject: body.subject, body: body.text, htmlBody: body.html, name: 'CalorieSync' });
     return reply(true);
   }
   function reply(ok) {
     return ContentService.createTextOutput(JSON.stringify({ ok: ok })).setMimeType(ContentService.MimeType.JSON);
   }
   ```
3. Gere um segredo com o mesmo comando da seção 3 (`randomBytes(32)`). Em **Configurações do projeto (engrenagem) → Propriedades do script → Adicionar propriedade**, crie `MAIL_SECRET` com esse valor. O segredo fica fora do código.
4. **Implantar → Nova implantação →** tipo **App da Web**. "Executar como": **Eu**. "Quem pode acessar": **Qualquer pessoa** (quem não tem o segredo recebe `{"ok":false}` e nada é enviado). Clique em **Implantar**.
5. O Google pede autorização. Como o app é seu e não verificado, aparece "O Google não verificou este app": clique em **Avançado → Acessar CalorieSync Mailer (não seguro) → Permitir**. É esperado; a permissão é só para enviar e-mail como você.
6. Copie a **URL do app da Web** (termina em `/exec`). Ela e o segredo vão no Render no passo 7 (`MAIL_HTTP_URL` e `MAIL_HTTP_SECRET`). Guarde os dois no bloco de notas seguro.

> Mudou o script depois? **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão**, e a URL continua a mesma. Uma "Nova implantação" gera outra URL.

#### 5.3 Testar depois do deploy (passo 11)
1. Cadastre uma conta com outro Gmail e outra com um Outlook/Hotmail. O código deve chegar em até 1 min, **na caixa de entrada**, vindo do Gmail do projeto.
2. Teste "Esqueci minha senha": o link precisa começar com o seu `URL_SITE` em `https://` (vem de `APP_BASE_URL`) e abrir a tela de nova senha.
3. Se não chegar:
   - **Logs do Render**: falhas aparecem como `auth_email_delivery_failed`, sem dados sensíveis.
   - **Execuções** do Apps Script (menu à esquerda): cada pedido aparece ali, com o erro se houver (ex.: cota diária estourada).
   - Pasta **Enviados** do Gmail do projeto: mostra o que de fato saiu.

> **Se um dia passar de ~100 e-mails/dia:** aí vale um domínio próprio com um provedor transacional por API HTTPS (ex.: Brevo, Resend). O adaptador `http` só muda de destino. Para portfólio, não precisa.

### Passo 6 · Dois arquivos de configuração no front (pequena mudança de código)
Esta é a única alteração de código necessária. Crie na pasta `frontend/`:

**`frontend/netlify.toml`**
```toml
[build]
  base = "frontend"
  command = "npm ci && npm run build"
  publish = "dist"

# O front fala com "/api"; o Netlify repassa para a API no Render.
[[redirects]]
  from = "/api/*"
  to = "https://<NOME_DA_API>.onrender.com/api/:splat"
  status = 200
  force = true

# SPA: qualquer outra rota abre a casca vazia spa.html (React Router).
# "/", "/termos", "/privacidade" e "/seguranca" já existem como HTML pré-renderizado e têm prioridade.
[[redirects]]
  from = "/*"
  to = "/spa.html"
  status = 200
```

E, no painel do Netlify (**Site configuration → Environment variables**), defina:
- `VITE_API_URL` = `/api` (relativo, para o cookie valer)
- `VITE_CAPTCHA_SITE_KEY` = site key do Turnstile (passo 7a)

**Trocar o endereço provisório do site (SEO).** As páginas públicas usam `https://app.caloriesync.com`, um domínio que **não existe**. Antes do primeiro deploy, troque por `URL_SITE` (sem barra final) nestes 4 arquivos e faça commit:
- `frontend/src/seo/pages.ts` (constante `SITE_URL`: gera canonical, Open Graph, Twitter Card e JSON-LD)
- `frontend/public/robots.txt` (linha `Sitemap:`)
- `frontend/public/sitemap.xml`
- `frontend/public/llms.txt`

Confira que não sobrou nenhum com `git grep app.caloriesync.com`. Se o endereço continuar errado, o Google e as redes sociais apontam para um site inexistente.

**Confirmar o texto "gratuito".** A landing (FAQ) e o JSON-LD (`offers` com preço 0 em `frontend/src/seo/pages.ts`) dizem que o CalorieSync é gratuito. Se um dia houver plano pago, ajuste os dois.

Pontos de atenção que eu **não verifiquei** e você deve testar no final:
- **Páginas pré-renderizadas:** o build gera `dist/index.html` (landing), `dist/termos/index.html`, `dist/privacidade/index.html` e `dist/seguranca/index.html` com o conteúdo já no HTML, e `dist/spa.html` (casca vazia) para o resto. O Netlify deveria servir `/termos` a partir de `termos/index.html` antes de aplicar o redirect `/*`; isso só foi simulado localmente. Teste no passo 11.
- O `npm ci` do front precisa enxergar o pacote `shared/` (`@caloriesync/shared`). Se o build falhar por isso, troque `base`/`command` para rodar da raiz: `command = "npm ci && npm --prefix shared ci && npm run build"` com `base = "."` e `publish = "frontend/dist"`.
- Netlify pode cortar respostas de proxy lentas (~26 s). Com a API dormindo, a primeira chamada pode dar erro 502/504; recarregar resolve (o passo 9 evita).

### Passo 7a · Criar o captcha (Cloudflare Turnstile), antes da API
Em produção a API **exige** `CAPTCHA_SECRET_KEY` e não sobe sem ela (proteção de cadastro, login e "esqueci a senha" contra robôs).
1. Cloudflare → **Turnstile → Add widget**, domínio = o de `URL_SITE` (ex.: `caloriesync-seunome.netlify.app`), modo **Managed** (invisível na maioria das visitas).
2. Anote a **Secret key** (vai para `CAPTCHA_SECRET_KEY` no Render, passo 7) e a **Site key** (vai para `VITE_CAPTCHA_SITE_KEY` no Netlify, passo 6).
3. As duas precisam ser do **mesmo widget**. Se o domínio do site mudar, edite o widget.
4. **Não** use as chaves de teste da Cloudflare (`1x0000…AA`) em produção: elas sempre aprovam.

### Passo 7 · Publicar a API no Render
1. No Render: **New → Web Service → conecte o GitHub → escolha o repositório**.
2. Configure:
   - **Language/Runtime:** Docker (usa o `Dockerfile` da raiz)
   - **Branch:** `main`
   - **Instance Type:** Free
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** Yes (publica sozinho a cada push em `main`)
3. Em **Environment**, adicione as variáveis (cole os valores; marque como segredo o que for senha):

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` (**obrigatória**: sem ela a API não sobe; antes, a ausência ligava o modo desenvolvimento e desligava cookie `Secure`, TLS do banco e as travas de CORS/e-mail) |
| `PORT` | `3001` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | do Neon (passo 4) |
| `DB_USER` / `DB_PASSWORD` | `app_user` / `<senha_app>` |
| `DATABASE_URL` | pode usar a URL do `app_user`; a API não migra em runtime |
| `JWT_SECRET` | gerado no passo "Segredos" (nunca o valor do `.env.example`) |
| `JWT_EXPIRES_IN` | `1d` |
| `AUTH_TOKEN_PEPPER` | gerado (diferente do JWT) |
| `CORS_ORIGIN` | `URL_SITE` (ex.: `https://caloriesync-seunome.netlify.app`, **sem barra final, https obrigatório**) |
| `APP_BASE_URL` | o mesmo `URL_SITE` |
| `TRUST_PROXY` | `1` (a API está atrás do proxy do Render; ver nota abaixo) |
| `MAIL_TRANSPORT` | `http` (passo 5; `smtp` não funciona no Render grátis e `memory` é proibido em produção) |
| `MAIL_FROM` | `CalorieSync <caloriesync.app@gmail.com>` (o Gmail do projeto) |
| `MAIL_HTTP_URL` | URL `/exec` do Apps Script (passo 5.2) |
| `MAIL_HTTP_SECRET` | o `MAIL_SECRET` do script (passo 5.2) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | geradas no passo "Segredos" (sem a pública, push responde 503) |
| `CAPTCHA_SECRET_KEY` | secret do Turnstile (passo 7a); **obrigatória** em produção |

   A API valida tudo ao iniciar e **se recusa a subir** com valor faltando ou inseguro; a mensagem aparece em **Logs**. Em produção ela recusa, entre outros: `NODE_ENV` ausente, segredo placeholder, `JWT_SECRET` igual ao pepper, `CAPTCHA_SECRET_KEY` vazia, `MAIL_TRANSPORT=memory`, SMTP sem usuário/senha, `CORS_ORIGIN`/`APP_BASE_URL` sem `https` ou com `localhost`.
   O `Dockerfile` já define `NODE_ENV=production`, mas declare a variável no Render mesmo assim: se um dia a API rodar fora dessa imagem, ela continua protegida.
4. Clique em **Create Web Service**. Quando ficar "Live", anote o endereço (`https://<NOME_DA_API>.onrender.com`) e abra `/health`: deve responder `healthy`.
5. Volte ao `netlify.toml` e troque `<NOME_DA_API>` pelo nome real. Faça commit e push para `main`.

> **Nota `TRUST_PROXY`:** o limite de tentativas de login usa o IP do visitante. Com Netlify → Render há mais de um salto e o IP real pode não chegar à API; o efeito pior é que muitos visitantes pareçam o mesmo IP e dividam o limite. Para portfólio é aceitável. Teste errando a senha 5 vezes: a conta deve bloquear, e outro usuário não deve ser afetado.

### Passo 8 · Conferir o captcha
O widget foi criado no passo 7a. Depois do deploy do site (passo 9), confira:
1. `VITE_CAPTCHA_SITE_KEY` está no Netlify e o deploy foi feito **depois** de defini-la (variáveis `VITE_*` entram no build; mudar exige novo deploy).
2. Cadastro e login funcionam. Se aparecer "Falha na verificação de segurança" (`CAPTCHA_FAILED`), a site key e a secret não são do mesmo widget, ou o domínio do widget não é o do site.

### Passo 9 · Publicar o site e manter a API acordada
1. No Netlify, com o `netlify.toml` já no GitHub, rode **Deploys → Trigger deploy**. Ao terminar, abra `URL_SITE`.
2. **UptimeRobot** → New monitor → HTTP(s) → URL `https://<NOME_DA_API>.onrender.com/health` → intervalo 5 min. Isso impede a API de dormir. 750 h/mês cobrem um serviço rodando 24h (31 dias = 744 h), então é seguro com **uma** API.

### Passo 10 · Criar sua conta de administrador
O projeto proíbe criar admin por seed ou variável de ambiente. O caminho é:
1. No site, **cadastre-se normalmente** e confirme o e-mail com o código recebido.
2. No seu computador, aponte para o banco hospedado com as credenciais do **`app_user`** e promova a conta:
   ```powershell
   $env:NODE_ENV="production"
   $env:DB_HOST="<host>"; $env:DB_PORT="5432"; $env:DB_NAME="neondb"
   $env:DB_USER="app_user"; $env:DB_PASSWORD="<senha_app>"
   # Demais variáveis obrigatórias da API (JWT_SECRET, AUTH_TOKEN_PEPPER, CORS_ORIGIN, APP_BASE_URL, MAIL_*, CAPTCHA_SECRET_KEY): mesmos valores do Render.
   npm run admin:promote -- seu@email.com --yes
   ```
   Se a validação de ambiente reclamar de alguma variável, copie-a do Render.
3. Admin exige **MFA**: entre em Configurações → Segurança e ative antes de usar `/admin`.
4. Limpe as variáveis da sessão ao terminar.

### Passo 11 · Checklist de "está funcionando?"
- [ ] `https://<API>.onrender.com/health` responde `healthy`
- [ ] Abrir `URL_SITE` carrega a landing e a rota `/login` (atualize a página com F5 em `/login` para testar o fallback)
- [ ] Logado, F5 em `/app/historico` abre o app (fallback `spa.html`); `/historico` sem o prefixo redireciona para `/app/historico/...`
- [ ] **Exibir código-fonte** (Ctrl+U) de `/`, `/termos`, `/privacidade` e `/seguranca` mostra o texto da página dentro de `<div id="root">`, o `<title>` próprio e o `<link rel="canonical">` com `URL_SITE` (se vier `<div id="root"></div>` vazio, o Netlify serviu `spa.html` no lugar do HTML pré-renderizado)
- [ ] F12 → Console em `/` e `/termos` sem erro do React (`#418` = hidratação divergente)
- [ ] `URL_SITE/robots.txt`, `URL_SITE/sitemap.xml`, `URL_SITE/llms.txt` e `URL_SITE/og-image.png` abrem e citam `URL_SITE`, não `app.caloriesync.com`
- [ ] Prévia do link em redes sociais mostra a imagem 1200×630: teste no [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) e no [Teste de pesquisa aprimorada do Google](https://search.google.com/test/rich-results) (deve achar `SoftwareApplication` e `FAQPage` em `/`)
- [ ] O PWA instalado abre em `/app`
- [ ] Cadastro envia e-mail **na caixa de entrada** (Gmail e Outlook) e o código verifica (passo 5.3)
- [ ] "Esqueci minha senha" envia o link com `https://` + `URL_SITE` e a nova senha funciona
- [ ] Cadastro/login passam pelo captcha sem erro `CAPTCHA_FAILED`
- [ ] Logs do Render, no início, sem "Configuração de Ambiente Inválida"
- [ ] Login **sem** "lembrar de mim": o cookie `cs_session` aparece como "Session" em F12 → Application → Cookies; **com** a opção marcada, tem data de expiração (1 dia)
- [ ] Ativar notificações em Configurações funciona (se der erro, faltam as chaves VAPID no Render)
- [ ] Login mantém a sessão ao recarregar (se não manter, o proxy `/api` ou `VITE_API_URL=/api` está errado)
- [ ] Registrar uma refeição e buscar um alimento funciona
- [ ] No navegador (F12 → Application → Cookies) existe `cs_session` com `HttpOnly` e `Secure`
- [ ] Logs do Render sem `permission denied`
- [ ] Conta admin com MFA acessa `/admin`

### Se algo falhar
| Sintoma | Causa provável |
|---|---|
| API não sobe, log com "Configuração de Ambiente Inválida" | Variável faltando/inválida (CORS com barra, `APP_BASE_URL` sem https, pepper igual ao JWT). O log diz qual: `NODE_ENV é obrigatório`, `... parece um placeholder` (gere um segredo novo), `CAPTCHA_SECRET_KEY é obrigatório em produção` (passo 7a) |
| `CAPTCHA_FAILED` no cadastro/login | Site key (Netlify) e secret (Render) de widgets diferentes, domínio do widget errado, ou `VITE_CAPTCHA_SITE_KEY` definida depois do último deploy |
| Notificações: "Chave pública VAPID não configurada" (503) | Faltam `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` no Render |
| Login com MFA sempre falha após um deploy | Migration nova (ex.: `mfa_last_counter`) não aplicada no Neon; rode a seção "Mudança que altera o banco" |
| Login funciona e ao recarregar volta deslogado | Site chamando a API direto (sem proxy) ou `VITE_API_URL` errado: o cookie `SameSite=Strict` não é enviado |
| Erro 403 `FORBIDDEN` em POST/PUT | `CORS_ORIGIN` diferente do endereço real do site |
| `permission denied for table ...` | Script de papéis não rodou depois de uma migration nova, ou migração rodou com outro dono |
| 502/504 na primeira visita | API dormindo (use o UptimeRobot) |
| Não chega e-mail, log `auth_email_delivery_failed` com timeout | `MAIL_TRANSPORT=smtp` no Render (SMTP bloqueado no grátis); use `http` |
| Não chega e-mail, script responde `{"ok":false}` | `MAIL_HTTP_SECRET` diferente do `MAIL_SECRET` do script |
| Não chega e-mail, erro em **Execuções** do Apps Script | Cota diária (~100) estourada, ou o script foi editado sem publicar uma **Nova versão** |
| Resposta é uma página de login do Google em vez de JSON | Implantação com acesso diferente de **Qualquer pessoa**, ou URL de teste (`/dev`) em vez de `/exec` |
| Link de redefinir senha abre `localhost` ou dá erro | `APP_BASE_URL` no Render diferente do `URL_SITE` |
| `/termos` abre vazio no código-fonte ou mostra a landing | Redirect `/*` com `force = true` ou apontando para `/index.html`: deve ser `/spa.html` sem `force` |
| Prévia em rede social sem imagem ou com link errado | `SITE_URL` ainda com `app.caloriesync.com` (veja o passo 6) ou cache antigo da rede social (use o Sharing Debugger para recarregar) |

---

## 5. Como atualizar o site depois (corrigir erros e criar features)

Depois do deploy, **o GitHub é a fonte da verdade**: publicar = enviar código para a branch `main`. Netlify e Render observam o repositório e republicam sozinhos.

### Fluxo do dia a dia
1. **Crie uma branch** a partir de `main`: `git switch -c feat/nome-da-mudanca` (ou `fix/...`).
2. **Desenvolva e teste localmente** (Docker + `npm run dev:all`). Antes de subir:
   ```powershell
   npm run lint
   npm run test:strict
   npm --prefix frontend test
   npm run build
   ```
3. **Commit** no padrão do projeto (commitlint): `feat(diario): adicionar X`, `fix(auth): corrigir Y`.
4. **Abra um Pull Request** para `main`. O GitHub Actions (`.github/workflows/ci.yml`) roda auditoria, lint, testes e build. Só faça merge com o CI verde.
5. **Merge em `main`** → Render publica a API nova e Netlify publica o site novo (alguns minutos). Acompanhe em **Deploys** (Netlify) e **Events/Logs** (Render).
6. **Verifique em produção** com o checklist do passo 11 (os itens que a mudança tocou).

### Mudança que altera o banco (migration)
O deploy do código **não** roda migrations; você roda:
1. Crie a migration em `backend/migrations/` e teste local.
2. **Antes do merge** (ou imediatamente antes de a API nova subir), aplique no Neon com o papel de migração:
   ```powershell
   $env:DATABASE_URL="<URL_MIGRACAO>"
   npm run setup
   ```
3. Faça a migration **compatível com o código antigo** (adicionar coluna/tabela, sem remover nem renomear de uma vez). Assim a API antiga continua funcionando durante o deploy. Remoções ficam para uma migration posterior.
4. Como as tabelas novas pertencem ao `migration_user`, elas recebem as permissões do `app_user` automaticamente (configurado pelo script de papéis). Se aparecer `permission denied`, rode o script de papéis de novo.
5. Migrations já aplicadas **não se editam**: crie uma nova (veja `docs/MIGRATIONS.md`).

### Variáveis novas ou segredos
Adicione primeiro no Render/Netlify, depois faça o merge. Segredos nunca entram no Git.

### Erro urgente (hotfix)
1. Branch `fix/...` a partir de `main`, correção mínima, PR, CI verde, merge.
2. Se o site quebrou e você precisa voltar **agora**: Netlify → **Deploys →** versão anterior → **Publish deploy**; Render → **Events → Rollback** (ou reverter o commit no GitHub: `git revert <hash>` e push). Rollback **não** desfaz migrations.

### Rotina de manutenção
- Olhe os **logs do Render** quando alguém reportar erro.
- Responda ao Dependabot/`npm audit`. O que importa para o site no ar é `npm audit --omit=dev` (hoje limpo); os avisos aceitos são só de ferramentas de dev (`minimatch@10` via `archunit`/`eslint`: um override global quebra o `archunit`; atualize quando eles aceitarem `minimatch@11`).
- Faça `backup-db.mjs` de vez em quando, pois o plano grátis do Neon tem retenção limitada de histórico.
- Se mudar o endereço do site, atualize `CORS_ORIGIN`, `APP_BASE_URL`, o widget do Turnstile, o `netlify.toml` e os 4 arquivos de SEO do passo 6 (`SITE_URL`, `robots.txt`, `sitemap.xml`, `llms.txt`).
- Criou uma página pública nova que deve aparecer no Google? Adicione-a em `PUBLIC_PAGES` (`frontend/src/seo/pages.ts`) para ser pré-renderizada, e no `sitemap.xml` e no `llms.txt`.

---

## 6. Pendências e riscos (honestidade)

- **Itens do `ISSUES.md` ligados a este plano:** #9 (papéis, concluído no passo 4), #24 (deploy: este plano vira o "provedor escolhido"), #26 (backup agendado) e #25 (monitoramento de erros) seguem pendentes.
- **Não testado:** nada deste plano foi executado ainda; `netlify.toml` e os limites de proxy/IP precisam do seu teste real.
- **CSP:** `frontend/public/_headers` usa `connect-src 'self' https:`; com o proxy `/api` pode restringir só a `'self'` depois.
- **Dados de saúde (LGPD):** os itens #15, #30, #31 e #32 do backlog (criptografia em repouso, consentimento específico, minimização, retenção) estão adiados. Para um portfólio com dados fictícios, tudo bem; **não divulgue o site como serviço real para dados de saúde de terceiros** sem tratar isso.
- **SEO (pré-renderização):**
  - O domínio `app.caloriesync.com` dos arquivos de SEO é provisório e precisa ser trocado (passo 6).
  - O texto "gratuito" (landing e JSON-LD) precisa ser confirmado se o modelo do produto mudar.
  - Ao navegar dentro do app (sem recarregar), o `<title>` da aba não muda; ele só vem certo no carregamento direto, que é o que buscadores e redes sociais leem.
  - O `FAQPage` do JSON-LD fica só na landing, porque o Google exige que as perguntas estejam visíveis na página.
  - A Search Console do Google (enviar o `sitemap.xml`) só faz sentido com o site no ar; com `*.netlify.app` funciona, mas um domínio próprio rankeia e é lembrado melhor.
- **Testes instáveis:** em uma de três execuções, 2 testes de `frontend/src/tests/router.test.tsx` falharam por timeout ao carregar páginas lazy. Se o CI falhar só neles, rode de novo; se repetir, aumente o timeout do `findByRole`.
- **Disponibilidade:** plano grátis não tem SLA. É adequado a portfólio, não a produto com clientes.
- **Alternativa de menor complexidade** (se travar no proxy): hospedar front e API **juntos** no Render, com o Express servindo o `frontend/dist`. Isso exige mudar o backend (hoje ele não serve arquivos estáticos) e foge deste plano.

---

## 7. Arquitetura resumida (para você explicar em entrevista)

- Monorepo: `frontend/` (React 19, Vite, TanStack Query, Tailwind), `backend/` (Express + TypeScript, 4 camadas `routes → controllers → services → models`, SQL puro com `pg`, sem ORM), `shared/` (schemas Zod e tipos compartilhados).
- Segurança: JWT em cookie HttpOnly `SameSite=Strict`, verificação de e-mail, bloqueio de conta, rate limit em Postgres, captcha opcional, MFA (TOTP) obrigatório para admins, RBAC com papel lido do banco a cada requisição, CORS estrito e papéis de banco com menor privilégio.
- Qualidade: testes (backend com `node:test`, front com Vitest/RTL/MSW), CI no GitHub Actions, commitlint/Husky, Dockerfile.
- Mais detalhes: `docs/ARCHITECTURE.md`, `docs/DECISOES.md`, `docs/DB_ROLES.md`, `docs/EMAIL_SETUP.md`, `docs/ADMIN.md`, `docs/MIGRATIONS.md` e o grafo em `.ua/knowledge-graph.json`.

---

## Fontes consultadas (02/11/2026)
- [Render: Deploy for Free](https://render.com/docs/free) (spin-down de 15 min, 750 h, sem disco, Postgres grátis expira em 30 dias)
- [Render: Postgres grátis expira em 30 dias](https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90)
- [Neon: limites do plano grátis](https://neon.com/faqs/free-plan-limits-and-quotas) e [anúncio de 1 GB por projeto](https://neon.com/blog/neon-free-plan-1-gb-per-project)
- [Render: plano grátis bloqueia saída SMTP (25, 465, 587) desde 26/09/2025](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports)
- [Apps Script: Web Apps](https://developers.google.com/apps-script/guides/web), [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app) e [cotas](https://developers.google.com/apps-script/guides/services/quotas)
- [Brevo: domínios gratuitos (gmail.com) não podem ser autenticados](https://help.brevo.com/hc/en-us/articles/17286219877778)
- [Netlify: rewrites e proxies](https://docs.netlify.com/routing/redirects/rewrites-proxies/)
