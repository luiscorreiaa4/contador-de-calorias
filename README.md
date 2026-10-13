# 🍏 CalorieSync

O **CalorieSync** (Contador de Calorias) é uma aplicação web completa (Full-stack) projetada para auxiliar usuários a registrarem suas refeições diárias, calcularem sua Taxa Metabólica Basal (TMB), acompanharem o consumo de calorias e macronutrientes, e gerenciarem o histórico de sua dieta e saúde.

---

## 🚀 Tecnologias e Arquitetura

O projeto adota uma arquitetura monorepo unificada, mantendo separação estrita entre Frontend e Backend com tipagem estática e testes automatizados.

### 💻 Frontend (Interface do Usuário)
- **Framework:** React 19 + Vite
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS (Identidade Brutalista de alta performance com temas via CSS Variables)
- **Componentes:** Radix UI (`@radix-ui`) para acessibilidade nativa, modais semânticos e focus trap
- **Ícones:** Lucide React
- **Gráficos:** Recharts (histórico e distribuição de macros na página de estatísticas)
- **Data Fetching & Cache:** React Query (TanStack Query) v5
- **Testes:** Vitest + React Testing Library (RTL) + MSW (Mock Service Worker)

### ⚙️ Backend (API e Lógica de Negócios)
- **Ambiente:** Node.js 22+ com Express
- **Linguagem:** TypeScript (executado via `tsx` em desenvolvimento e build via `tsc`)
- **Autenticação:** JWT (JSON Web Tokens) com hashing de senhas via `bcrypt`
- **Validação de Dados:** Zod (obrigatório em todas as rotas e DTOs)
- **Arquitetura:** MVC + Service Layer (`Controllers` → `Services` → `Models` → `Routes`)
- **Testes:** Node Native Test Runner (`node:test` + `node:assert` + `supertest`) executado via `tsx --test`

### 🗄️ Banco de Dados
- **Motor:** PostgreSQL
- **Acesso:** Comunicação direta com driver `pg` (Pool com limite de conexões e timeout configurado; sem ORMs)
- **Migrações:** SQL puro gerenciado por `node-pg-migrate`
- **Pesquisa Avançada:** Busca por similaridade com `pg_trgm` e normalização com `unaccent`

---

## 📁 Estrutura do Projeto

```text
contador-de-calorias/
├── AGENTS.md                  # Regras globais de pareamento e agentes especialistas
├── README.md                  # Este documento
├── package.json               # Scripts de orquestração do monorepo
├── docs/                      # Documentação técnica e especificações
│   ├── ARCHITECTURE.md        # Diagrama ER, fluxo de dados e decisões técnicas
│   ├── SPEC.md                # Requisitos funcionais (RFs) e de negócio
│   ├── ROADMAP.md             # Planejamento das fases do projeto
│   ├── TESTING.md             # Guia de testes de backend e frontend
│   ├── TECH_DEBT.md           # Registro de débitos técnicos e segurança
│   ├── TASK_TEMPLATE.md       # Modelo de abertura de novas tarefas
│   ├── PERFORMANCE_BASELINE.md# Métricas de referência para otimizações
│   └── reviews/               # Auditorias e inventários de código/documentação
├── .agents/                   # Configurações de agentes e automação
│   ├── rules/                 # Regras obrigatórias (backend, react, style)
│   └── skills/                # Procedimentos reutilizáveis (middlewares, recursos, testes)
├── backend/                   # API Express + Node.js
│   ├── migrations/            # Migrações SQL versionadas (node-pg-migrate)
│   ├── scripts/               # Scripts operacionais (importação TACO, reset de banco)
│   ├── src/
│   │   ├── controllers/       # Camada HTTP (parse e resposta)
│   │   ├── middlewares/       # Auth JWT, Zod validate, errorHandler
│   │   ├── models/            # Queries diretas ao PostgreSQL
│   │   ├── routes/            # Endpoints da API REST
│   │   ├── schemas/           # Schemas de validação Zod
│   │   ├── services/          # Regras de negócio puras (cálculo TMB, metas)
│   │   └── types/             # Tipagens e DTOs compartilhados
│   └── tests/                 # Testes unitários e de integração (node:test)
└── frontend/                  # SPA em React 19 + Vite
    └── src/
        ├── components/        # Componentes UI (Radix, modais, formulários)
        ├── context/           # AuthContext (sessão e estado global do usuário)
        ├── pages/             # Páginas públicas e privadas (Dashboard, Stats, Perfil)
        ├── services/          # Cliente API centralizado (apiFetch) e React Query
        ├── styles/            # Design tokens e temas brutalistas (index.css)
        └── tests/             # Testes de componentes e integração (Vitest + MSW)
```

---

## 🎯 Status do Projeto (Roadmap)

- ✅ **Fase 0: Fundação e Qualidade**
  - Isolamento de banco de testes com fail-safe (`contador_calorias_test`).
  - Linter sem erros em todo o monorepo.
  - Segurança web com `helmet`, `express-rate-limit` e validação de ambiente com fail-fast via Zod.
  - Migrações versionadas com `node-pg-migrate`.
  - CI configurado com GitHub Actions (`.github/workflows/ci.yml`).
  - Suíte de testes do frontend com Vitest + RTL + MSW.
- ✅ **Fase 1: Cálculo Técnico e Metas Editáveis**
  - Motor de cálculo de TMB (Mifflin-St Jeor / Katch-McArdle) e Gasto Energético Total.
  - Histórico de medidas e composição corporal (`body_measurements`).
  - Controle de metas por data de vigência (`user_goals`).
- ✅ **Fase 2: Dashboard Enxuto + Página de Estatísticas**
  - Dashboard focado no dia corrente comparando consumo real com meta ativa.
  - Página de Estatísticas (`/estatisticas`) com histórico de 7 e 30 dias e agregações SQL via `LATERAL JOIN`.
- ✅ **Fase 3: Base de Alimentos em Escala**
  - Busca trigram com extensão `unaccent` e índice GIN no PostgreSQL.
  - Importação de catálogo da TACO via script idempotente (`backend/scripts/import-foods.ts`).
  - Catálogo principal somente-leitura para usuários comuns.
- ⏳ **Fase 4: Passe de Performance** *(Próxima)*
- ⏳ **Fase 5: Redesign e Tokens de CSS**

---

## 🛠️ Como Instalar e Rodar Localmente

### 1. Pré-requisitos
- **Node.js** (versão 20 ou superior; recomendado Node 22+)
- **PostgreSQL** (versão 14 ou superior)

### 2. Instalação de Dependências
No diretório raiz do projeto, instale as dependências de todos os workspaces:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 3. Configuração de Ambiente (`.env`)
Copie o arquivo de exemplo para `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Preencha com as credenciais do seu banco local:

```env
PORT=3001
NODE_ENV=development

# Configurações do PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_segura_aqui
DB_NAME=contador_calorias

DATABASE_URL=postgresql://postgres:sua_senha_segura_aqui@localhost:5432/contador_calorias
JWT_SECRET=preencha_com_32_caracteres_no_minimo_para_seguranca
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 4. Criação do Banco e Migrações
No seu PostgreSQL (via `psql` ou cliente gráfico), crie o banco de desenvolvimento e o de testes:

```sql
CREATE DATABASE contador_calorias;
CREATE DATABASE contador_calorias_test;
```

Em seguida, execute as migrações a partir da raiz:

```bash
npm run setup
```
*(Executa o `node-pg-migrate up` no backend, criando as 6 tabelas, funções `unaccent` e semeando os alimentos iniciais).*

### 5. Execução em Modo de Desenvolvimento
Inicie Frontend e Backend simultaneamente com um único comando:

```bash
npm run dev:all
```
- **Backend API:** `http://localhost:3001/api`
- **Frontend App:** `http://localhost:5173`

---

## 📜 Principais Comandos

Executados a partir da **raiz** do projeto:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev:all` | Inicia Backend e Frontend simultaneamente via `concurrently` |
| `npm run server` | Inicia apenas a API backend em modo watch (`tsx`) |
| `npm run dev` | Inicia apenas o frontend Vite |
| `npm run setup` | Aplica todas as migrações pendentes no PostgreSQL |
| `npm run test` | Executa os testes automatizados do backend em banco isolado (`_test`) |
| `npm --prefix frontend test` | Executa os testes do frontend via Vitest |
| `npm run lint` | Valida formatação e tipos com ESLint em todo o projeto |
| `npm run build` | Compila o frontend para produção (`dist/`) |

---

## 🛡️ Diretrizes e Regras do Código

As regras detalhadas do repositório estão formalizadas em:
- [AGENTS.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/AGENTS.md) — Regra principal de workspace e divisão de responsabilidades.
- [.agents/rules/backend-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/backend-rules.md) — Regras de arquitetura, isolamento e segurança no backend.
- [.agents/rules/react-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/react-rules.md) — Padrões do frontend, React Query e formulários.
- [.agents/rules/style-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/style-rules.md) — Identidade visual brutalista e acessibilidade (WCAG).
