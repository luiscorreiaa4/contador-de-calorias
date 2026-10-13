---
trigger: always_on
description: Regras obrigatórias e verificáveis para desenvolvimento de backend, banco de dados e APIs
---

# Regras de Backend e Banco de Dados

## 1. Estrutura de Arquivos e Isolamento
- **Diretório Unificado (`/backend`):** Todos os arquivos de lógica do servidor, rotas, modelos, controladores, serviços, scripts e migrações DEVEM residir exclusivamente dentro de `/backend`.
- É proibido vazar arquivos de backend para a raiz do repositório ou diretório do frontend.

## 2. Arquitetura em 4 Camadas (Node.js + Express)
- **`backend/src/routes/`:** Define apenas caminhos HTTP, métodos e associa middlewares (`validate`, `authenticate`). Não deve conter lógica de resposta ou regras.
- **`backend/src/controllers/`:** Camada exclusiva de tradução HTTP. Responsável por receber `req`, invocar o `service` correspondente e devolver a resposta formatada no padrão `{ success, data, message }`. É **proibido** colocar lógica de negócio ou queries de banco diretamente no controller.
- **`backend/src/services/`:** Lógica de negócio pura, cálculos matemáticos e orquestração de chamadas aos models. Não deve lidar com objetos `req` ou `res` do Express.
- **`backend/src/models/`:** Acesso direto ao PostgreSQL via driver nativo `pg.Pool`. Todas as queries SQL devem ser parametrizadas (`$1`, `$2`) para prevenir SQL Injection. É **terminantemente proibido** o uso de ORMs (Prisma, Sequelize, TypeORM).

## 3. Validação Estrita de Input (Zod na Rota)
- **Obrigatoriedade do Middleware:** Toda rota que recebe dados de entrada (seja via `body`, `query` ou `params`) DEVE aplicar o middleware `validate(schema)` diretamente na definição da rota antes do controller.
- **Proibição de `.parse()` no Controller:** É proibido instanciar esquemas Zod e executar `.parse()` manualmente dentro dos controllers. A validação deve interceptar e rejeitar com status `400` antes da entrada no controller.

## 4. Contrato de Resposta da API
- Toda resposta da API (sucesso ou erro) DEVE seguir estritamente a estrutura JSON:
  ```json
  {
    "success": boolean,
    "data"?: any,
    "message"?: string
  }
  ```
- **Códigos HTTP Padronizados:**
  - `200 OK`: Consulta ou atualização bem-sucedida.
  - `201 Created`: Criação bem-sucedida de recurso.
  - `400 Bad Request`: Payload inválido, falha de validação Zod ou regra de negócio impeditiva.
  - `401 Unauthorized`: Ausência de token JWT ou token expirado/inválido.
  - `403 Forbidden`: Usuário autenticado sem autorização para o recurso.
  - `404 Not Found`: Recurso inexistente.
  - `500 Internal Server Error`: Erro inesperado, tratado globalmente pelo `errorHandler` sem expor stack traces ou detalhes internos do PostgreSQL.

## 5. Segurança e Variáveis de Ambiente
- **Sem Segredos Hardcoded:** Nenhuma credencial (senhas, `DATABASE_URL`, `JWT_SECRET`, chaves de API) pode ser codificada em arquivos de código ou scripts (`package.json`). Todos os valores devem vir exclusivamente de `process.env`.
- **Fail-Fast via Zod:** Variáveis de ambiente são validadas na inicialização (`backend/src/config/env.ts`). Se alguma variável obrigatória faltar ou se `JWT_SECRET` tiver menos de 32 caracteres, o processo encerra imediatamente (`process.exit(1)`).
- **Senhas:** Nunca persistir senhas em texto puro. Utilizar `bcrypt` com hash seguro (fator de custo 10 em desenvolvimento/produção; custo 1 em ambiente de testes).

## 6. Integridade do Banco de Dados (PostgreSQL)
- **PROIBIDO Ações Destrutivas sem Consentimento:** É TERMINANTEMENTE PROIBIDO executar comandos como `DROP TABLE`, `DROP DATABASE`, `TRUNCATE` ou deleções em massa sem autorização prévia e explícita do usuário.
- **Transações Atômicas Obrigatórias:** Qualquer operação que realize mais de uma instrução de escrita (`INSERT`, `UPDATE`, `DELETE`) relacionada DEVE ser encapsulada em transação com `client = await pool.connect()`, `BEGIN`, `COMMIT` e `ROLLBACK` em bloco `try/finally` com `client.release()`.
- **Migrações Versionadas:** Mudanças estruturais de esquema devem ser registradas em arquivos de migração via `node-pg-migrate` em `backend/migrations/`.

## 7. Isolamento de Testes
- **Banco Exclusivo de Testes:** Testes automatizados do backend devem rodar exclusivamente contra o banco `contador_calorias_test`.
- **Trava de Segurança:** O pool de banco de dados (`backend/src/database/pool.ts`) aborta a execução (`process.exit(1)`) se `NODE_ENV === 'test'` e o nome do banco não terminar com o sufixo `_test`.
