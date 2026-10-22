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
    "message"?: string,
    "code"?: string
  }
  ```
- `code` é opcional e só deve carregar códigos de negócio estáveis (ex.: `EMAIL_NOT_VERIFIED`, `INVALID_VERIFICATION_CODE`, `INVALID_RESET_TOKEN`, `USER_NOT_FOUND`). Nunca exponha detalhes internos ou stack traces.
- **Códigos HTTP Padronizados:**
  - `200 OK`: Consulta ou atualização bem-sucedida.
  - `201 Created`: Criação bem-sucedida de recurso.
  - `202 Accepted`: Resposta genérica de autenticação por e-mail (`register`, `resend-code`, `forgot-password`), sem sessão.
  - `400 Bad Request`: Payload inválido, falha de validação Zod ou regra de negócio impeditiva.
  - `401 Unauthorized`: Ausência de token JWT ou token expirado/inválido.
  - `403 Forbidden`: Usuário autenticado sem autorização para o recurso **ou** credencial válida com e-mail ainda não confirmado (`EMAIL_NOT_VERIFIED`).
  - `404 Not Found`: Recurso inexistente.
  - `500 Internal Server Error`: Erro inesperado, tratado globalmente pelo `errorHandler` sem expor stack traces ou detalhes internos do PostgreSQL.

## 5. Segurança e Variáveis de Ambiente
- **Sem Segredos Hardcoded:** Nenhuma credencial (senhas, `DATABASE_URL`, `JWT_SECRET`, chaves de API) pode ser codificada em arquivos de código ou scripts (`package.json`). Todos os valores devem vir exclusivamente de `process.env`.
- **Fail-Fast via Zod:** Variáveis de ambiente são validadas na inicialização (`backend/src/config/env.ts`). Se alguma variável obrigatória faltar ou se `JWT_SECRET` tiver menos de 32 caracteres, o processo encerra imediatamente (`process.exit(1)`). `AUTH_TOKEN_PEPPER` também exige mínimo de 32 caracteres e deve ser diferente de `JWT_SECRET`; `NODE_ENV=production` exige `APP_BASE_URL` HTTPS.
- **Senhas:** Nunca persistir senhas em texto puro. Utilizar `bcrypt` com hash seguro (fator de custo 10 em desenvolvimento/produção; custo 1 em ambiente de testes).
- **Segredos de Autenticação por E-mail:** Códigos são persistidos apenas como HMAC-SHA256 com `AUTH_TOKEN_PEPPER`; tokens de reset, apenas como SHA-256. É **proibido** logar código, token, URL de reset ou senha. O envio usa a interface `Mailer` (`SmtpMailer`/`MemoryMailer`), nunca SDK de provedor.
- **Rotas de Autenticação:** `/api/auth/*` deve manter `Cache-Control: no-store`, validação Zod por rota e respostas genéricas em `register`/`resend-code`/`forgot-password` (sem enumeração). O login só emite JWT para conta com `email_verified_at` preenchido; o JWT carrega `tv` e o middleware compara com `users.token_version`.

## 6. Integridade do Banco de Dados (PostgreSQL)
- **PROIBIDO Ações Destrutivas sem Consentimento:** É TERMINANTEMENTE PROIBIDO executar comandos como `DROP TABLE`, `DROP DATABASE`, `TRUNCATE` ou deleções em massa sem autorização prévia e explícita do usuário.
- **Transações Atômicas Obrigatórias:** Qualquer operação que realize mais de uma instrução de escrita (`INSERT`, `UPDATE`, `DELETE`) relacionada DEVE ser encapsulada em transação com `client = await pool.connect()`, `BEGIN`, `COMMIT` e `ROLLBACK` em bloco `try/finally` com `client.release()`.
- **Migrações Versionadas:** Mudanças estruturais de esquema devem ser registradas em arquivos de migração via `node-pg-migrate` em `backend/migrations/`.

## 7. Isolamento de Testes
- **Banco Exclusivo de Testes:** Testes automatizados do backend devem rodar exclusivamente contra o banco `contador_calorias_test`.
- **Trava de Segurança:** O pool de banco de dados (`backend/src/database/pool.ts`) aborta a execução (`process.exit(1)`) se `NODE_ENV === 'test'` e o nome do banco não terminar com o sufixo `_test`.
- **Fechamento Mandatório de Conexões (`pool.end`):** Todo arquivo que importe pool/app ou os alcance por imports transitivos registra `closeTestPool()` de `backend/tests/helpers/lifecycle.ts` antes dos testes. Passe a limpeza como callback; o helper fecha o pool em `finally`. A guarda AST integrada ao lint verifica o registro.
- **Estrutura Obrigatória com `describe` e `it`:** Use `describe`/`it` e registre o encerramento antes de qualquer asserção. AssertionError não ignora automaticamente hooks registrados; código após uma falha pode não registrar o hook.
- **Execução Limitada:** Use `npm test`, `npm run test:strict` e `npm run test:file -- tests/...test.ts`. Proibido `tsx --test`/`npx` avulsos. O teto global de 300 s (`TEST_PROCESS_TIMEOUT_MS`) encerra a árvore; strict sem force-exit é obrigatório na verificação final e no CI.
- **Execução Isolada de Testes:** Para executar um único arquivo de teste no backend, use sempre `npm run test:backend:file <caminho>` a partir da raiz.
- **Autenticação por E-mail nos Testes:** Use o helper `backend/tests/helpers/auth.ts` (`createVerifiedUser`, `markEmailVerified`, `lastEmailTo`, `verificationCodeFor`, `clearMailbox`). O `MemoryMailer` é forçado em `NODE_ENV=test`; nunca dependa de SMTP real. Limpe a caixa entre cenários que verificam envio.

## 8. Rotas Administrativas e RBAC (D-22 / B1 a B12)
- **Isolamento de Rota:** Todas as rotas administrativas DEVEM residir exclusivamente sob `/api/admin/*`.
- **Guard no Roteador Inteiro (B11):** O roteador administrativo principal deve aplicar `router.use(authenticate, requireAdmin)` no nível do roteador raiz (`admin.routes.ts`). É proibido expor endpoints administrativos sem essa guarda.
- **Autorização Dinâmica por PK (B1):** O middleware consulta `role` e `token_version` por chave primária no PostgreSQL a cada requisição. É expressamente proibido autorizar por claims de JWT.
- **Códigos de Resposta Padronizados:** Requisição sem autenticação = `401 Unauthorized`; usuário autenticado sem papel admin (`role !== 'admin'`) = `403 Forbidden`.
- **Trilha de Auditoria Obrigatória (B5):** Toda operação de escrita administrativa DEVE gravar na tabela `admin_audit_log` dentro da MESMA transação atômica (`actor_type: 'user' | 'cli'`). Não criar rotas de edição ou exclusão de logs.
- **Proibição de Deleção de Alimentos (B4):** Não criar rotas `DELETE` para alimentos do catálogo global; utilizar exclusivamente alternância de status ativo/inativo (`active = false`).

