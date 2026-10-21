# CalorieSync

Aplicação web para acompanhamento nutricional, registro de refeições e análise da evolução alimentar e corporal. Reúne diário por data, metas de calorias e macronutrientes, catálogo de alimentos e gráficos de histórico em uma interface responsiva com temas claro e escuro.

## Funcionalidades

- **Diário alimentar:** registro, edição e exclusão de refeições, navegação por datas e lançamentos retroativos.
- **Organização de refeições:** cópia de refeições ou do dia anterior, alimentos recentes e favoritos, refeições salvas e combos reutilizáveis.
- **Catálogo de alimentos:** busca sem distinção de acentos ou maiúsculas, ordenação por similaridade e cadastro de alimentos personalizados.
- **Metas nutricionais:** cálculo automático a partir dos dados corporais, objetivo e atividade física, com opção de ajuste manual e histórico de vigência.
- **Evolução:** gráficos de consumo alimentar em períodos de 7 e 30 dias e acompanhamento de peso e gordura corporal.
- **Conta e privacidade:** confirmação de e-mail no cadastro, recuperação de senha por link, gestão de perfil, alteração de senha, exportação de dados e exclusão da conta.
- **Experiência web:** recursos de PWA, cache de assets e navegação, indicação de conexão offline e infraestrutura de suporte a notificações push.

O projeto está em desenvolvimento. Login social, proteção antiautomação nas rotas públicas e revogação de sessão com refresh tokens permanecem pendentes na documentação. O [roadmap](docs/ROADMAP.md) e a [especificação](docs/SPEC.md) detalham os requisitos que orientam os próximos passos.

## Tecnologias

| Camada | Tecnologias principais |
| --- | --- |
| Frontend | React 19, Vite 8, TypeScript 6 e React Router 7 (`react-router` v7 puro, sem pacotes legados) |
| Interface | Tailwind CSS 3, Radix UI, Recharts e Lucide React |
| Dados e formulários | TanStack Query 5, React Hook Form e Zod 3 |
| Backend | Node.js 24, Express 4 e TypeScript 5, com execução via `tsx` |
| Autenticação e proteção HTTP | JWT com `token_version`, bcrypt, verificação de e-mail por código, reset por link, Helmet, CORS e rate limiting |
| E-mail transacional | SMTP via `nodemailer` (Mailpit em desenvolvimento) e caixa em memória nos testes |
| Banco de dados | PostgreSQL 14+, driver `pg` e migrações com `node-pg-migrate` |
| Testes | Node Test Runner e Supertest no backend; Vitest, Testing Library e MSW no frontend |

## Executar localmente

### Pré-requisitos

- Node.js 24 e npm instalados. O ambiente registrado na documentação utiliza Node.js `24.14.0` e npm `11.9.0`.
- PostgreSQL 14 ou superior, instalado localmente ou executado com Docker Compose.
- Docker com suporte a Compose, caso escolha a opção de banco em container.

Execute os comandos abaixo na raiz do repositório.

### 1. Instalar dependências

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
npm --prefix shared install
```

### 2. Configurar o ambiente

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
JWT_EXPIRES_IN=7d
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

### 3. Preparar o banco de dados

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

### 4. Aplicar as migrações

```bash
npm run setup
```

O comando aplica as migrações versionadas do backend, incluindo o esquema, os índices e os dados iniciais do catálogo. Consulte o [guia de migrações](docs/MIGRATIONS.md) para as convenções de manutenção do banco.

### 5. Iniciar a aplicação

```bash
npm run dev:all
```

| Serviço | Endereço local |
| --- | --- |
| Frontend | [localhost:5173](http://localhost:5173) |
| API | [localhost:3001/api](http://localhost:3001/api) |
| Mailpit (e-mails de teste) | [localhost:8025](http://localhost:8025) |

## Configuração de ambiente

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
| `JWT_EXPIRES_IN` | Validade configurável do token (ex: `7d`), aplicada na geração da sessão JWT |
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

As decisões de SSL e proxy estão descritas em [decisões de arquitetura, D-19](docs/DECISOES.md). O passo a passo de Mailpit, DNS/SPF/DKIM/DMARC e provedores SMTP está em [configuração de e-mail](docs/EMAIL_SETUP.md).

## Comandos de desenvolvimento

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

## Testes

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

O [guia de testes](docs/TESTING.md) descreve o isolamento do banco, o encerramento de conexões e as convenções das suítes. Resultados de auditorias anteriores estão no [relatório de higiene dos testes](docs/TEST_HYGIENE_REPORT.md).

## Organização do projeto

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

### Navegação

| Área | Páginas principais |
| --- | --- |
| Dashboard | Resumo e registro do dia (`/`), diário por data (`/diario/:date`) |
| Evolução | Alimentação (`/evolucao/alimentacao`) e corpo (`/evolucao/corpo`) |
| Metas | Objetivo e rotina (`/metas/rotina`), calorias e macros (`/metas/diarias`) |
| Perfil | Dados pessoais (`/perfil`) |
| Configurações | Notificações, segurança e privacidade (`/configuracoes/...`) |
| Autenticação pública | Login (`/login`), cadastro (`/cadastro`), verificação de e-mail (`/verificar-email`), recuperação (`/esqueci-senha`) e redefinição (`/redefinir-senha`) |

O [guia de navegação](docs/UX_NAVIGATION.md) detalha as responsabilidades das telas e os redirecionamentos de URLs anteriores.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [Especificação](docs/SPEC.md) | Requisitos funcionais, regras nutricionais e contratos de API |
| [Arquitetura](docs/ARCHITECTURE.md) | Camadas, modelo de dados e decisões técnicas |
| [Navegação](docs/UX_NAVIGATION.md) | Organização das áreas e responsabilidades das páginas |
| [Migrações](docs/MIGRATIONS.md) | Versionamento e manutenção do esquema de banco |
| [Testes](docs/TESTING.md) | Comandos, convenções e estratégia de testes |
| [E-mail transacional](docs/EMAIL_SETUP.md) | Mailpit local, SMTP em produção, DNS e diagnóstico |
| [Identidade visual](docs/CORES.md) | Paleta, tokens semânticos e critérios de contraste |
| [Roadmap](docs/ROADMAP.md) | Fases de desenvolvimento e marcos do produto |
| [Decisões](docs/DECISOES.md) | Decisões de arquitetura e produto (D-xx) |
| [Performance](docs/PERFORMANCE_BASELINE.md) | Medições e referências de desempenho |

Relatórios de revisão estão em `docs/reviews/`; registros históricos ficam em `docs/archive/`.
