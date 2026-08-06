---
trigger: always_on
description: Sempre que criar, modificar ou interagir com o código do backend, APIs ou banco de dados
---

# Regras de Backend e Banco de Dados

## Estrutura de Arquivos e Isolamento
- **Diretório Unificado (`/backend`):** Todos os arquivos de lógica do servidor, rotas, modelos, controladores, serviços, scripts de banco de dados, arquivos de configuração e migrações DEVEM residir exclusivamente dentro do diretório `/backend`.
- Nenhum código do backend ou do banco de dados deve vazar para a raiz do projeto ou pasta de frontend.

## Arquitetura de Código (Node.js)
- **Padrão MVC + Camada de Serviço:**
  - `backend/src/controllers/`: apenas tradução de requisição/resposta HTTP (parse de input, chamada do service, formatação de resposta). Nunca coloque regra de negócio aqui.
  - `backend/src/services/`: toda a lógica de negócio, orquestração de regras e chamadas entre models.
  - `backend/src/models/`: consultas, esquemas e acesso direto ao banco de dados.
  - `backend/src/routes/`: definição das rotas, sem lógica.
  - `backend/src/middlewares/`: autenticação, autorização, tratamento de erros, rate limiting.
  - `backend/src/types/`: tipos, interfaces e DTOs compartilhados.
- **Uso de Bibliotecas Externas:**
  - Fique à vontade para instalar e utilizar pacotes do NPM que facilitem o desenvolvimento (ex: `express`, `pg`, `prisma`, `knex`, `zod`, `dotenv`, `cors`, `bcrypt` ou `argon2`, `jsonwebtoken`).

## Segurança
- **Segredos e variáveis de ambiente:**
  - Nunca commitar arquivos `.env`. Sempre versionar um `.env.example` com as chaves necessárias (sem valores reais).
  - Toda credencial (connection string do Postgres, JWT secret, chaves de API externas) DEVE vir de variáveis de ambiente, nunca hardcoded.
- **Validação de input:**
  - Toda rota que recebe dados do usuário (body, query, params) DEVE validar o input com `zod` (ou equivalente) antes de processar. Isso é obrigatório, não opcional — é a principal proteção contra SQL injection, payloads malformados e XSS refletido.
- **Autenticação e Autorização:**
  - Defina um padrão único para o projeto (ex: JWT em header `Authorization: Bearer`) e centralize a verificação em um middleware (`backend/src/middlewares/auth.ts`).
  - Rotas protegidas devem checar autorização (papel/permissão do usuário) além de autenticação, quando aplicável.
- **Senhas:**
  - Nunca armazenar senha em texto puro. Usar `bcrypt` ou `argon2` para hash antes de persistir.
- **Erros:**
  - Nunca expor stack trace, mensagens de erro do banco de dados ou detalhes internos na resposta ao cliente.
  - Padronizar toda resposta da API (sucesso ou erro) no formato: `{ "success": boolean, "data"?: any, "message"?: string }`. Ver detalhes de status codes em `create-backend-resource`.

## Regras Críticas de Segurança do Banco de Dados (PostgreSQL)
- **PROIBIDO EXCLUIR TABELAS SEM CONFIRMAÇÃO:**
  - NUNCA execute comandos como `DROP TABLE`, `DROP DATABASE`, `TRUNCATE` ou deleções em massa sem o consentimento explícito do usuário.
  - Antes de qualquer alteração destrutiva ou destruição de esquema no PostgreSQL:
    1. Apresente um plano detalhado de alteração ao usuário.
    2. Aguarde a confirmação direta antes de rodar o script ou migration.
- **Transações:**
  - Operações que envolvam múltiplas escritas relacionadas (ex: criar pedido + baixar estoque) DEVEM ser executadas dentro de uma transação (`BEGIN`/`COMMIT`/`ROLLBACK`) para garantir atomicidade.
- **Persistência e Schemas:**
  - Mantenha arquivos de migration ou scripts de inicialização SQL devidamente organizados em `backend/database/` ou `backend/prisma/`.

## Testes
- Cobrir services e models críticos com testes automatizados (Jest ou Vitest). Priorize regras de negócio e validações, não é necessário 100% de cobertura.
