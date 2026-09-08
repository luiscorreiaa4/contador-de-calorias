# 🍏 Contador de Calorias

O **Contador de Calorias** é uma aplicação web completa (Full-stack) projetada para auxiliar usuários a registrarem suas refeições diárias, acompanharem a ingestão de calorias e macros, e manterem o controle sobre sua dieta e saúde.

---

## 🚀 Tecnologias e Arquitetura

O projeto adota uma arquitetura moderna separada entre Frontend e Backend, mantendo alta tipagem, modularidade e padrões rigorosos.

### 💻 Frontend (Interface do Usuário)
- **Framework:** React 19 + Vite
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS (com suporte robusto a Dark Mode)
- **Componentes:** Radix UI (`@radix-ui`) e validações de interface com `clsx` + `tailwind-merge` + `cva`.
- **Ícones:** Lucide React
- **Data Fetching & Cache:** React Query (TanStack Query) v5
- **Roteamento & Validação:** Zod (integrado com formulários)

### ⚙️ Backend (API e Lógica de Negócios)
- **Ambiente:** Node.js + Express
- **Linguagem:** TypeScript (executado via `tsx`)
- **Autenticação:** JWT (JSON Web Tokens) e Hashing de senhas com `bcrypt`
- **Validação de Dados:** Zod (obrigatório para todos os inputs de rotas)
- **Arquitetura:** MVC + Services Layers (`Controllers` → `Services` → `Models` → `Routes`)

### 🗄️ Banco de Dados
- **Motor:** PostgreSQL
- **Acesso:** Comunicação direta com driver `pg` via consultas preparadas e models tipados.

---

## 📁 Estrutura do Projeto

O repositório está organizado num formato Monorepo (Workspace unificado) para facilitar o desenvolvimento:

```text
contador-de-calorias/
├── backend/                # API Express + Node.js
│   ├── database/           # Scripts SQL e migrações
│   ├── src/
│   │   ├── controllers/    # Camada HTTP (req/res)
│   │   ├── middlewares/    # Autenticação e tratamento de erros
│   │   ├── models/         # Acesso direto ao PostgreSQL
│   │   ├── routes/         # Definição dos endpoints
│   │   ├── schemas/        # Schemas Zod para validação
│   │   └── services/       # Regras de negócio e orquestração
│   └── package.json
├── frontend/               # SPA em React + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis (UI)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Páginas/Rotas
│   │   └── services/       # Cliente HTTP (Axios/Fetch configurado)
│   └── package.json
└── package.json            # Package.json da raiz (orquestração)
```

---

## 🛠️ Como Instalar e Rodar Localmente

Siga o passo a passo abaixo para rodar o projeto na sua máquina.

### 1. Pré-requisitos
- **Node.js** (versão 20 ou superior)
- **PostgreSQL** rodando localmente ou remotamente.

### 2. Clonar e Instalar Dependências
No diretório raiz do projeto, instale as dependências de todos os workspaces (raiz, backend e frontend):

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 3. Configuração de Ambiente (.env)
Crie o arquivo `.env` dentro da pasta `backend/` usando o exemplo disponibilizado no repositório (se houver `.env.example`).
Você precisará preencher as credenciais de banco de dados e segredos:

```env
# Exemplo (backend/.env)
PORT=3000
DATABASE_URL=postgres://usuario:senha@localhost:5432/contador_de_calorias
JWT_SECRET=seu_segredo_super_seguro_aqui
```

### 4. Configuração do Banco de Dados
Com o PostgreSQL rodando e as credenciais configuradas no `.env`, execute o script de inicialização para criar as tabelas necessárias:

```bash
npm run setup
```
*(Este comando roda o script `backend/init-db.js`, construindo o esquema inicial do banco.)*

### 5. Iniciar o Servidor de Desenvolvimento
O projeto contém um script utilitário na raiz que inicia o Frontend e o Backend **simultaneamente** usando `concurrently`.

```bash
npm run dev:all
```
- **Backend:** Ficará disponível geralmente em `http://localhost:3000`
- **Frontend:** Ficará disponível no endereço gerado pelo Vite (normalmente `http://localhost:5173`)

---

## 📜 Principais Comandos (Scripts)

Esses comandos devem ser executados na **raiz** do projeto:

- `npm run dev:all` - Roda Backend e Frontend simultaneamente em modo dev (Hot Reload).
- `npm run setup` - Inicializa as tabelas do banco de dados (Cuidado: não destrutivo se configurado corretamente, mas verifique os scripts).
- `npm run lint` - Roda o ESLint no projeto.
- `npm run server` - Inicia exclusivamente o Backend em modo desenvolvimento.
- `npm run dev` - Inicia exclusivamente o Frontend em modo desenvolvimento.

---

## 🛡️ Padrões e Regras do Código (Guidelines)

Este projeto possui regras estritas de arquitetura descritas no diretório `.agents/rules/`. Destaques:

1. **Backend sem hardcoding:** Nenhum segredo ou credencial de BD solto no código. Use `.env`.
2. **Validação Zod:** Obrigatória para toda e qualquer rota backend e formulários críticos do frontend.
3. **Sem exclusão arbitrária:** Nenhuma tabela do Postgres (ex: `DROP TABLE`) deve ser deletada via código ou script não homologado sem aprovação.
4. **Data Fetching Frontend:** Proibido uso de `fetch` manual com `useEffect` soltos; utilize **React Query** para manter cache, estados de *loading*, *error* e sincronia corretos.
5. **Componentização UI:** Privilegiar Radix e Tailwind. Acessibilidade (WCAG) tem peso forte (suporte de teclado em modais, focus trap, etc).
