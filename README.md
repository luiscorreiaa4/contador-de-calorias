<div align="center">

# CalorieSync

Contador de calorias full-stack que calcula metas de calorias e macros e registra refeições com a Tabela TACO. Projeto solo, feito para praticar produto de ponta a ponta: do esquema SQL ao deploy.

<a href="https://caloriesync-luiscorreia.netlify.app/"><img src="https://img.shields.io/badge/DEMO_AO_VIVO-c8ff00?style=for-the-badge&logoColor=000" alt="Abrir a demo" /></a>

<sub>Sem cadastro: o botão <b>Ver demonstração</b> cria uma conta de visitante que dura 2 horas.</sub>

<br /><br />

<img src="frontend/public/screenshots/diario-desktop.png" alt="Diário no desktop com calorias e macros do dia" width="760" />
&nbsp;
<img src="frontend/public/screenshots/diario-mobile.png" alt="Diário no celular" width="190" />

</div>

---

## O que este projeto demonstra

**Backend sem atalhos**
- API Express em 4 camadas (`routes → controllers → services → models`) com SQL parametrizado puro, **sem ORM**. Transações atômicas em toda escrita composta.
- Todo payload validado com Zod na rota; os schemas ficam em `shared/` e são os mesmos contratos usados pelo frontend.
- 19 migrações versionadas com `node-pg-migrate`, regra de imutabilidade das já aplicadas ([D-13](docs/DECISOES.md)) e teste de rollback no CI.

**Segurança tratada como requisito**
- Cadastro com confirmação de e-mail: códigos guardados só como HMAC-SHA256 com pepper, tokens de reset como SHA-256, respostas idênticas existindo ou não a conta (sem enumeração).
- JWT em cookie com `token_version` conferido no banco; MFA por TOTP; rate limiting, Helmet e CORS.
- Painel administrativo com RBAC que consulta o papel no banco a cada requisição (nunca por claim do JWT), trilha de auditoria gravada na mesma transação da escrita e desativação em vez de exclusão de alimentos.
- Avaliei Row Level Security, medi o custo e documentei por que não adotei agora e quando reavaliar ([docs/DB_ROLES.md](docs/DB_ROLES.md)).

**Frontend com cuidado de produto**
- React 19 + TanStack Query: todo dado de servidor passa por serviços tipados, com estados de carregamento, erro e vazio tratados.
- Mobile com navegação por swipe estilo pager (telas vivas e prefetch), PWA, tema claro/escuro e correções específicas de iOS (zoom, área segura, colar código).
- Design system próprio com tokens semânticos e uma guarda no lint que reprova cores literais.
- Acessibilidade: modais com focus trap via Radix, sem `alert`/`confirm` nativos.

**Engenharia e qualidade**
- Pipeline de CI que roda: audit de dependências, Gitleaks, typecheck, Prettier, detecção de código morto (knip), ESLint, testes com cobertura (backend com PostgreSQL real e frontend), rollback de migrações, smoke de carga, E2E com Playwright e build da imagem Docker.
- Teste de carga semanal agendado em workflow separado.
- Testes de backend rodam só em banco `*_test` (o pool aborta caso contrário) e uma guarda de lint garante que nenhum teste deixe conexão aberta.
- Decisões de arquitetura registradas como ADRs numerados em [docs/DECISOES.md](docs/DECISOES.md), com contexto e alternativas descartadas.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, Vite 8, TypeScript, React Router 7, TanStack Query 5, React Hook Form, Tailwind CSS, Radix UI, Recharts |
| Backend | Node.js 24, Express 4, TypeScript, `pg`, Zod, JWT, bcrypt, nodemailer |
| Banco | PostgreSQL 14+, `node-pg-migrate` |
| Testes | Node Test Runner + Supertest, Vitest + Testing Library + MSW, Playwright |
| Infra | GitHub Actions, Docker, Netlify (front), Render e Neon (API e banco) |

## O app

<div align="center">

<img src="frontend/public/screenshots/historico-mobile.png" alt="Gráfico de calorias por dia no histórico" width="230" />
&nbsp;
<img src="frontend/public/screenshots/metas-mobile.png" alt="Tela de metas com objetivo e nível de atividade" width="230" />

<sub><b>Histórico</b> · <b>Metas</b></sub>

</div>

Calcula TMB, TDEE e macros a partir de corpo, rotina e objetivo; busca alimentos da TACO ignorando acentos; copia refeições e dias anteriores; mostra evolução de calorias, macros, peso e gordura corporal; permite exportar os dados e excluir a conta (LGPD).

Próximos passos (login social, proteção antiautomação, refresh tokens) estão no [roadmap](docs/ROADMAP.md).

---

## Referência técnica

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
