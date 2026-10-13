# 🍏 CalorieSync

O **CalorieSync** é uma aplicação web full-stack para acompanhamento nutricional diário. Permite aos usuários registrar refeições, pesquisar alimentos por similaridade fonética/ortográfica, calcular automaticamente metas calóricas e de macronutrientes com base na Taxa Metabólica Basal (TMB), e visualizar a evolução do consumo através de gráficos e estatísticas.

---

## 🛠️ Stack Tecnológica [CONFIRMADO]

### Frontend
- **Framework:** React 19.0.0 com Vite 6.0.5
- **Linguagem:** TypeScript 5.6.3
- **Estilização:** Tailwind CSS 3.4.17 (identidade brutalista com suporte a temas claro/escuro via CSS Variables)
- **Componentes & Acessibilidade:** Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-slider`, `@radix-ui/react-label`, etc.)
- **Gerenciamento de Estado de Servidor:** TanStack Query (React Query) v5.62.8
- **Gráficos:** Recharts 2.15.0
- **Ícones:** Lucide React 0.468.0
- **Validação de Formulários:** Zod 3.24.1

### Backend
- **Ambiente:** Node.js v24.14.0 (mínimo v20+ suportado) com Express 4.21.2
- **Linguagem:** TypeScript 5.7.2 (executado diretamente via `tsx` 4.19.2 em desenvolvimento)
- **Autenticação:** JSON Web Tokens (`jsonwebtoken` 9.0.2) e hashing com `bcrypt` 5.1.1
- **Validação de Entrada:** Zod 3.24.1 em 100% das rotas e DTOs
- **Segurança Web:** `helmet` 8.0.0, `cors` 2.8.5 e `express-rate-limit` 7.5.0
- **Banco de Dados:** Driver PostgreSQL nativo `pg` 8.13.1 (sem ORMs)
- **Migrações:** `node-pg-migrate` 7.8.0

---

## 📋 Pré-requisitos [CONFIRMADO]

Antes de iniciar, certifique-se de possuir instalado em sua máquina:
- **Node.js:** Versão 20 ou superior (versão utilizada e verificada no ambiente: `v24.14.0`).
- **npm:** Versão 10 ou superior (versão verificada: `11.9.0`).
- **PostgreSQL:** Versão 14 ou superior em execução local (porta padrão `5432`).

---

## 🚀 Instalação Passo a Passo [CONFIRMADO]

### 1. Clonar o Repositório e Instalar Dependências
No diretório raiz do projeto, instale as dependências da raiz e dos submódulos:

```bash
# Dependências de orquestração da raiz (concurrently, eslint)
npm install

# Dependências da API backend
npm --prefix backend install

# Dependências da SPA frontend
npm --prefix frontend install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo para criar o `.env` do backend:

```bash
# No Windows PowerShell:
copy backend\.env.example backend\.env

# No Linux / macOS:
cp backend/.env.example backend/.env
```

Abra `backend/.env` e configure suas credenciais locais do PostgreSQL:

```env
PORT=3001
NODE_ENV=development

# Configurações do PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_do_postgres_aqui
DB_NAME=contador_calorias

DATABASE_URL=postgresql://postgres:sua_senha_do_postgres_aqui@localhost:5432/contador_calorias
JWT_SECRET=coloque_uma_chave_secreta_com_mais_de_32_caracteres_aqui
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

> **Atenção:** A variável `JWT_SECRET` é validada pelo Zod no início da API e **deve** conter pelo menos 32 caracteres.

### 3. Criar os Bancos de Dados no PostgreSQL
Acesse seu cliente PostgreSQL (`psql` ou pgAdmin/DBeaver) e crie o banco de dados principal e o de testes:

```sql
CREATE DATABASE contador_calorias;
CREATE DATABASE contador_calorias_test;
```

### 4. Executar as Migrações
Execute o comando de configuração na raiz para aplicar o esquema completo (6 tabelas, índices GIN de busca por similaridade e sementes de alimentos):

```bash
npm run setup
```

### 5. Iniciar a Aplicação
Inicie tanto a API backend quanto a aplicação frontend com um único comando:

```bash
npm run dev:all
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)

---

## ⚙️ Variáveis de Ambiente Detalhadas [CONFIRMADO]

As variáveis de ambiente do backend residem em `backend/.env`:

| Variável | Padrão | Obrigatória? | Descrição |
| :--- | :--- | :--- | :--- |
| `PORT` | `3001` | Não | Porta TCP em que o Express escuta as requisições HTTP |
| `NODE_ENV` | `development` | Não | Ambiente de execução (`development`, `production`, `test`) |
| `DB_HOST` | `localhost` | Sim | Endereço do host do servidor PostgreSQL |
| `DB_PORT` | `5432` | Não | Porta de rede do PostgreSQL |
| `DB_USER` | `postgres` | Sim | Usuário com permissões no PostgreSQL |
| `DB_PASSWORD` | - | Sim | Senha do usuário do banco |
| `DB_NAME` | `contador_calorias` | Sim | Nome da base de dados de desenvolvimento |
| `DATABASE_URL` | - | Não | Connection string completa (utilizada pelo `node-pg-migrate`) |
| `JWT_SECRET` | - | Sim | Chave de assinatura dos tokens JWT (mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | `7d` | Não | Período de expiração do token de sessão |
| `CORS_ORIGIN` | `http://localhost:5173` | Não | Origem autorizada no middleware de CORS |

---

## 📜 Scripts do Repositório [CONFIRMADO]

Comandos disponíveis a partir da **raiz**:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev:all` | Roda Frontend (`:5173`) e Backend (`:3001`) em paralelo via `concurrently` |
| `npm run server` | Roda somente o backend em modo watch (`tsx watch src/server.ts`) |
| `npm run dev` | Roda somente o servidor de desenvolvimento do Vite |
| `npm run setup` | Aplica todas as migrações SQL no banco (`node-pg-migrate up`) |
| `npm run test` | Roda os 37 testes automatizados do backend em banco isolado (`_test`) |
| `npm --prefix frontend test` | Roda a suíte de testes de componentes do frontend via Vitest |
| `npm run lint` | Valida as regras de ESLint em todo o repositório |
| `npm run build` | Compila a versão de produção do frontend (`tsc -b && vite build`) |

---

## 📚 Mais Informações

Para aprofundamento na arquitetura do sistema e decisões técnicas:
- [docs/ARCHITECTURE.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ARCHITECTURE.md) — Camadas, diagrama ER completo e decisões de banco.
- [docs/SPEC.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/SPEC.md) — Requisitos funcionais e regras matemáticas de cálculo de TMB e metas.
- [docs/TESTING.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/TESTING.md) — Guia detalhado de testes automatizados e suítes existentes.
- [docs/ROADMAP.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ROADMAP.md) — Registro de fases concluídas e planejadas.
