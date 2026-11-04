<div align="center">

# 🔥 CalorieSync

### Saiba quanto comer e registre o que comeu.

Contador de calorias **gratuito** que calcula sua meta diária de calorias e macros a partir do seu corpo e da sua rotina, com alimentos brasileiros da **Tabela TACO**.

<a href="https://caloriesync-luiscorreia.netlify.app/"><img src="https://img.shields.io/badge/ABRIR_O_APP-c8ff00?style=for-the-badge&logoColor=000" alt="Abrir o CalorieSync" /></a>
&nbsp;
<a href="https://caloriesync-luiscorreia.netlify.app/"><img src="https://img.shields.io/badge/%F0%9F%91%81_VER_DEMONSTRA%C3%87%C3%83O-000000?style=for-the-badge" alt="Ver demonstração sem cadastro" /></a>

<sub>Sem cadastro: clique em <b>Ver demonstração</b> na página inicial e explore uma conta de visitante por 2 horas.</sub>

<br /><br />

<img src="docs/img/landing-desktop.png" alt="Página inicial do CalorieSync no desktop" width="760" />
&nbsp;
<img src="docs/img/landing-mobile.png" alt="Página inicial do CalorieSync no celular" width="190" />

</div>

---

## Por que o CalorieSync

- 🎯 **Meta pronta em minutos.** Informe peso, altura, idade, rotina e objetivo; o app calcula TMB, TDEE e as calorias, proteínas, carboidratos e gorduras do dia. Dá para ajustar à mão quando quiser.
- 🍚 **Comida de verdade, do Brasil.** Busque na Tabela TACO sem se preocupar com acentos ou maiúsculas e lance café, almoço, jantar e lanches em gramas.
- ⚡ **Registro rápido.** Copie refeições ou o dia anterior, use recentes, favoritos e combos salvos.
- 📈 **Evolução à vista.** Gráficos de 7 e 30 dias para calorias e macros, além de peso e gordura corporal.
- 📱 **Instala como app.** PWA com tema claro e escuro, funciona no celular e avisa quando você está offline.
- 🔒 **Seus dados são seus.** Confirmação de e-mail, MFA, exportação dos dados e exclusão da conta a qualquer momento.

## Como funciona

| 1. Conte sobre você | 2. Registre o que comeu | 3. Veja a evolução |
| --- | --- | --- |
| Corpo, rotina e objetivo viram uma meta diária de calorias e macros. | Alimentos da TACO em gramas, refeição por refeição. | Semana, mês, peso e medidas: saiba se está dentro da meta. |

## Por dentro do app

<div align="center">

<img src="frontend/public/screenshots/diario-desktop.png" alt="Diário no desktop com calorias e macros do dia" width="860" />

<br /><br />

<img src="frontend/public/screenshots/diario-mobile.png" alt="Diário no celular com o botão Nova refeição" width="230" />
&nbsp;
<img src="frontend/public/screenshots/historico-mobile.png" alt="Gráfico de calorias por dia no histórico" width="230" />
&nbsp;
<img src="frontend/public/screenshots/metas-mobile.png" alt="Tela de metas com objetivo e nível de atividade" width="230" />

<sub><b>Diário</b> · <b>Histórico</b> · <b>Metas</b></sub>

</div>

## Feito com

React 19 · Vite 8 · TypeScript · Tailwind CSS · Radix UI · TanStack Query · Node.js 24 · Express · PostgreSQL · Zod

<details>
<summary><b>Stack completa</b></summary>

| Camada | Tecnologias principais |
| --- | --- |
| Frontend | React 19, Vite 8, TypeScript 6 e React Router 7 |
| Interface | Tailwind CSS 3, Radix UI, Recharts e Lucide React |
| Dados e formulários | TanStack Query 5, React Hook Form e Zod 3 |
| Backend | Node.js 24, Express 4 e TypeScript 5, com execução via `tsx` |
| Autenticação e proteção HTTP | JWT com `token_version`, bcrypt, verificação de e-mail por código, reset por link, Helmet, CORS e rate limiting |
| E-mail transacional | SMTP via `nodemailer` (Mailpit em desenvolvimento) e caixa em memória nos testes |
| Banco de dados | PostgreSQL 14+, driver `pg` e migrações com `node-pg-migrate` |
| Testes | Node Test Runner e Supertest no backend; Vitest, Testing Library e MSW no frontend |

</details>

O projeto segue em evolução: login social, proteção antiautomação nas rotas públicas e refresh tokens estão no [roadmap](docs/ROADMAP.md).

---

## 🛠️ Para desenvolvedores

### Executar localmente

#### Pré-requisitos

- Node.js 24 e npm instalados. O ambiente registrado na documentação utiliza Node.js `24.14.0` e npm `11.9.0`.
- PostgreSQL 14 ou superior, instalado localmente ou executado com Docker Compose.
- Docker com suporte a Compose, caso escolha a opção de banco em container.

Execute os comandos abaixo na raiz do repositório.

#### 1. Instalar dependências

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
npm --prefix shared install
```

#### 2. Configurar o ambiente

Crie `backend/.env` a partir de `backend/.env.example`.

No PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

No Linux ou macOS:

```bash
cp backend/.env.example backend/.env
```

Ajuste as credenciais e a porta para corresponder ao seu PostgreSQL. Exemplo de configuração para desenvolvimento:

```dotenv
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=substitua_pela_senha_local
DB_NAME=contador_calorias

DATABASE_URL=postgresql://postgres:substitua_pela_senha_local@localhost:5432/contador_calorias

JWT_SECRET=substitua_por_uma_chave_aleatoria_de_pelo_menos_32_caracteres
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173

APP_BASE_URL=http://localhost:5173
MAIL_FROM="CalorieSync <no-reply@caloriesync.local>"
MAIL_TRANSPORT=smtp
MAIL_SMTP_HOST=localhost
MAIL_SMTP_PORT=1025
MAIL_SMTP_SECURE=false
AUTH_TOKEN_PEPPER=substitua_por_outra_chave_aleatoria_de_pelo_menos_32_caracteres
```

Substitua os valores de exemplo antes de iniciar a API. Mantenha `DATABASE_URL` coerente com os campos `DB_*`; `JWT_SECRET` e `AUTH_TOKEN_PEPPER` precisam ter pelo menos 32 caracteres e ser diferentes entre si.

#### 3. Preparar o banco de dados

**Com Docker Compose**

Com o Docker em execução, inicie o PostgreSQL e o Mailpit:

```bash
npm run docker:up
```

A configuração documentada utiliza volume persistente e cria também o banco de testes. O Mailpit captura os e-mails de confirmação e recuperação em `http://localhost:8025` (SMTP em `localhost:1025`). Se a porta `5432` já estiver ocupada, defina `DB_PORT=5433` em `backend/.env` antes de iniciar o container e ajuste a porta em `DATABASE_URL`.

Para encerrar o container:

```bash
npm run docker:down
```

**Com PostgreSQL local**

Crie os bancos de desenvolvimento e testes pelo cliente PostgreSQL de sua preferência:

```sql
CREATE DATABASE contador_calorias;
CREATE DATABASE contador_calorias_test;
```

#### 4. Aplicar as migrações

```bash
npm run setup
```

O comando aplica as migrações versionadas do backend, incluindo o esquema, os índices e os dados iniciais do catálogo. Consulte o [guia de migrações](docs/MIGRATIONS.md) para as convenções de manutenção do banco.

#### 5. Iniciar a aplicação

```bash
npm run dev:all
```

| Serviço | Endereço local |
| --- | --- |
| Frontend | [localhost:5173](http://localhost:5173) |
| API | [localhost:3001/api](http://localhost:3001/api) |
| Mailpit (e-mails de teste) | [localhost:8025](http://localhost:8025) |

### Configuração de ambiente

As variáveis do backend ficam em `backend/.env`. Os campos de conexão devem ser preenchidos explicitamente; os valores mostrados na instalação são exemplos de configuração local.

| Variável | Finalidade |
| --- | --- |
| `PORT` | Porta da API; configuração local: `3001` |
| `NODE_ENV` | Ambiente de execução: `development`, `production` ou `test` |
| `DB_HOST` | Host do PostgreSQL; obrigatório |
| `DB_PORT` | Porta do PostgreSQL; obrigatória |
| `DB_USER` | Usuário do PostgreSQL; obrigatório |
| `DB_PASSWORD` | Senha do PostgreSQL; obrigatória |
| `DB_NAME` | Nome do banco; em desenvolvimento, `contador_calorias` |
| `DATABASE_URL` | URL de conexão utilizada pelas migrações |
| `JWT_SECRET` | Chave de assinatura de sessão; obrigatória, com no mínimo 32 caracteres |
| `JWT_EXPIRES_IN` | Validade configurável do token (ex: `1d`; também define a validade do cookie `cs_session`), aplicada na geração da sessão JWT |
| `CORS_ORIGIN` | Origem autorizada para o frontend; localmente, `http://localhost:5173` |
| `APP_BASE_URL` | URL pública do frontend usada no link de redefinição de senha; HTTPS em produção |
| `MAIL_FROM` | Remetente dos e-mails transacionais, com domínio verificado no provedor |
| `MAIL_TRANSPORT` | `smtp` para envio real ou `memory` para caixa em memória; testes forçam `memory` |
| `MAIL_SMTP_HOST` | Host SMTP; em desenvolvimento, `localhost` (Mailpit) |
| `MAIL_SMTP_PORT` | Porta SMTP; Mailpit em `1025`; provedores normalmente usam `587` ou `465` |
| `MAIL_SMTP_USER` / `MAIL_SMTP_PASS` | Credenciais SMTP do provedor; vazias no Mailpit local |
| `MAIL_SMTP_SECURE` | `true` para TLS direto (porta 465) ou `false` com STARTTLS (porta 587) |
| `AUTH_TOKEN_PEPPER` | Pepper HMAC dos códigos de verificação; mínimo 32 caracteres e diferente de `JWT_SECRET` |
| `DB_SSL_CA` | Certificado de autoridade certificadora para conexões SSL, quando necessário |
| `TRUST_PROXY` | Número de saltos de proxy confiáveis em ambientes com proxy reverso |

As decisões de SSL e proxy estão descritas em [decisões de arquitetura, D-19](docs/DECISOES.md). O envio de e-mail em produção (Gmail do projeto via Google Apps Script) está no [plano de hospedagem](docs/HOSPEDAGEM.md).

### Comandos de desenvolvimento

Todos os comandos desta tabela são executados na raiz do repositório.

| Comando | Finalidade |
| --- | --- |
| `npm run dev:all` | Iniciar frontend e backend em paralelo |
| `npm run dev` | Iniciar apenas o frontend |
| `npm run server` | Iniciar apenas a API em modo watch |
| `npm run setup` | Aplicar as migrações do banco |
| `npm run docker:up` | Iniciar o PostgreSQL com Docker Compose |
| `npm run docker:down` | Encerrar o container do PostgreSQL |
| `npm run lint` | Executar ESLint, a verificação de higiene dos testes e a guarda de cores |
| `npm --prefix frontend run check:colors` | Verificar o uso dos tokens semânticos de cor |
| `npm run build` | Verificar a tipagem e gerar o bundle de produção do frontend |

### Testes

Os testes de backend utilizam exclusivamente o banco `contador_calorias_test`. Configure as credenciais em `backend/.env`; o runner fixa `NODE_ENV=test`, `DB_NAME=contador_calorias_test` e `TZ=America/Sao_Paulo`.

| Comando | Finalidade |
| --- | --- |
| `npm test` | Executar a suíte de backend |
| `npm run test:strict` | Executar o backend sem encerramento forçado, expondo conexões que permaneçam abertas |
| `npm run test:file -- tests/integration/meal_items_batch.test.ts` | Executar um arquivo de backend em modo estrito |
| `npm run test:frontend` | Executar a suíte de frontend |
| `npm run test:frontend:file src/components/meals/NewMealModal.test.tsx` | Executar um arquivo de frontend |
| `npm --prefix frontend run test:coverage` | Gerar o relatório de cobertura do frontend |

Utilize os scripts oficiais, que fixam o diretório de execução e limitam a duração dos processos a 300 segundos por padrão. O limite pode ser ajustado com `TEST_PROCESS_TIMEOUT_MS`. O modo `test:strict` integra a verificação final do backend.

O [guia de testes](docs/TESTING.md) descreve o isolamento do banco, o encerramento de conexões e as convenções das suítes.

### Organização do projeto

```text
backend/       API Express, regras de negócio, acesso SQL e testes
frontend/      Aplicação React, páginas, componentes e testes de interface
shared/        Schemas Zod, contratos e cálculos compartilhados
docs/          Especificações, arquitetura, planejamento e guias
docker/        Recursos de infraestrutura para desenvolvimento
.agents/       Regras e instruções de trabalho no projeto
.github/       Configuração de integração contínua
```

O backend segue o fluxo `routes → controllers → services → models`, com SQL parametrizado via `pg`. O frontend consome a API por serviços integrados ao TanStack Query. O pacote `shared/` centraliza contratos e cálculos, consumidos por aliases TypeScript/Vite, sem npm workspaces.

#### Navegação

| Área | Páginas principais |
| --- | --- |
| Diário | Resumo e registro do dia (`/app`), diário por data (`/app/diario/:date`) |
| Histórico | Alimentação (`/app/historico/alimentacao`) e corpo (`/app/historico/corpo`) |
| Metas | Objetivo e rotina (`/app/metas/rotina`), calorias e macros (`/app/metas/diarias`) |
| Perfil | Dados pessoais (`/app/perfil`) |
| Configurações | Notificações, segurança e privacidade (`/app/configuracoes/...`) |
| Administração | Catálogo global de alimentos (`/admin/alimentos`, exclusivo para administradores) |
| Autenticação pública | Login (`/login`), cadastro (`/cadastro`), verificação de e-mail (`/verificar-email`), recuperação (`/esqueci-senha`) e redefinição (`/redefinir-senha`) |

O [guia de navegação](docs/UX_NAVIGATION.md) detalha as responsabilidades das telas e os redirecionamentos de URLs anteriores.

### Documentação

| Documento | Conteúdo |
| --- | --- |
| [Especificação](docs/SPEC.md) | Requisitos funcionais, regras nutricionais e contratos de API |
| [Arquitetura](docs/ARCHITECTURE.md) | Camadas, modelo de dados e decisões técnicas |
| [Navegação](docs/UX_NAVIGATION.md) | Organização das áreas e responsabilidades das páginas |
| [Migrações](docs/MIGRATIONS.md) | Versionamento e manutenção do esquema de banco |
| [Testes](docs/TESTING.md) | Comandos, convenções e estratégia de testes |
| [Identidade visual](docs/CORES.md) | Paleta, tokens semânticos e critérios de contraste |
| [Roadmap](docs/ROADMAP.md) | Fases de desenvolvimento e marcos do produto |
| [Decisões](docs/DECISOES.md) | Decisões de arquitetura e produto (D-xx) |
| [Administração](docs/ADMIN.md) | RBAC, CLI de administradores, auditoria e curadoria do catálogo |
| [Papéis de banco](docs/DB_ROLES.md) | Papéis do PostgreSQL e RLS |
| [Hospedagem](docs/HOSPEDAGEM.md) | Deploy gratuito (Netlify, Render, Neon) e atualização do site |
| [Incidentes](docs/INCIDENTES.md) | Plano de resposta a incidentes com dados pessoais (LGPD) |

Os documentos acima também estão consolidados em um arquivo único, em [PDF](docs/export/CalorieSync-Documentacao.pdf) e [Word](docs/export/CalorieSync-Documentacao.docx). Esse arquivo é uma cópia gerada em 04/11/2026; quando houver divergência, valem os `.md`.

Relatórios de auditoria e revisões antigas foram removidos; o histórico deles está no `git log`.
