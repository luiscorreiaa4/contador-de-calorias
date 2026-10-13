# Revisão de Segurança da Aplicação (CalorieSync)

**Arquivo:** `docs/reviews/security.md`  
**Data da Auditoria:** 13 de Outubro de 2026  
**Modo:** SOMENTE LEITURA (Análise Estática e Determinística)  
**Escopo Auditado:** Backend (`/backend`), Frontend (`/frontend`), Banco de Dados / Migrações (`/backend/migrations`), Scripts (`/backend/scripts`), Histórico Git e Pipeline de CI (`.github/workflows/ci.yml`).

---

## Sumário Executivo de Riscos

| Severidade | Quantidade | Principais Frentes Afetadas |
| :--- | :---: | :--- |
| **Crítica** | 4 | Vazamento de credenciais no histórico do Git, bypass de verificação SSL em produção, fallback hardcoded inseguro em chave JWT, vulnerabilidade crítica de spoofing de IP em dependência de rede (`proxy-addr`). |
| **Alta** | 7 | Exposição de erros internos do PostgreSQL em respostas HTTP 500, DoS por falta de limites em esquemas Zod (teto de itens e payloads), middleware de validação ausente em parâmetros/query, ausência de revogação/invalidação de tokens em troca de senha, risco de DoS/spoofing no rate limiter. |
| **Média** | 6 | Enumeração de usuários via registro e timing attack no login, ausência de política de complexidade de senha, caracteres curinga do `ILIKE` sem escape, dados sensíveis de saúde em `localStorage`, scripts destrutivos de banco sem travas de ambiente. |
| **Baixa** | 4 | Links de privacidade/termos decorativos e ausência de consentimento explícito (LGPD), inexistência de exportação de dados, rotas montadas em duplicidade no Express, ausência de scanners de segurança no CI. |

---

## 1. Autenticação e Gestão de Sessão

### [SEC-001] Segredo JWT com Fallback Inseguro Hardcoded
- **Arquivo:Linha:** [`backend/src/middlewares/auth.ts:19`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/middlewares/auth.ts#L19) e [`backend/src/services/user.service.ts:235`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L235)
- **Severidade:** **Crítica**
- **O que está errado:** Tanto a assinatura quanto a validação de tokens JWT realizam leitura direta de `process.env.JWT_SECRET` com um operador de fallback:
  ```ts
  const secret = process.env.JWT_SECRET || 'fallback_jwt_secret';
  ```
  Isso ignora a validação estrita do módulo central [`backend/src/config/env.ts`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/config/env.ts) (que exige `min(32)` caracteres). Além disso, `'fallback_jwt_secret'` possui apenas 19 caracteres e é de conhecimento público no código.
- **Cenário concreto de impacto:** Caso o servidor execute em qualquer contexto onde `process.env.JWT_SECRET` esteja nulo ou indefinido, qualquer atacante pode assinar tokens arbitrários usando `'fallback_jwt_secret'`, assumindo a identidade de qualquer `userId` (inclusive administradores ou outros usuários).
- **Como verificar/reproduzir:**
  Inspecione a linha 19 de `backend/src/middlewares/auth.ts` e a linha 235 de `backend/src/services/user.service.ts`. Note que `env.JWT_SECRET` não é importado nesses arquivos.
- **Correção sugerida:** Importar exclusivamente `env` de `../config/env.js` e remover qualquer fallback:
  ```ts
  import { env } from '../config/env.js';
  // ...
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as { userId: string };
  ```
- **Esforço:** P

---

### [SEC-002] Credenciais do Banco e Chave JWT Expostas no Histórico do Git
- **Arquivo:Linha:** Commit `24d1ce659ca50440a0ef7c3be44adeddf63bde15:backend/.env`
- **Severidade:** **Crítica**
- **O que está errado:** O arquivo `backend/.env` foi commitado no histórico do Git no commit inicial `24d1ce65` contendo:
  ```env
  DATABASE_URL=postgresql://postgres:1234@localhost:5432/contador_calorias
  JWT_SECRET=super_secret_jwt_key_contador_calorias_2026
  ```
  Embora o arquivo tenha sido removido do rastreamento no commit `de5bd5f`, o segredo permanece eternamente legível no histórico do repositório.
- **Cenário concreto de impacto:** Qualquer pessoa ou ferramenta com acesso de leitura ao repositório Git pode extrair `super_secret_jwt_key_contador_calorias_2026` e forjar tokens JWT válidos se essa chave estiver em uso em algum ambiente de homologação ou produção.
- **Como verificar/reproduzir:**
  Execute no terminal:
  ```bash
  git show 24d1ce659ca50440a0ef7c3be44adeddf63bde15:backend/.env
  ```
- **Correção sugerida:**
  1. Revogar/rotacionar imediatamente qualquer `JWT_SECRET` e senhas de banco que tenham sido baseadas nesses valores.
  2. Executar `git-filter-repo` ou BFG Repo-Cleaner para expurgar o arquivo `backend/.env` do histórico do repositório.
- **Esforço:** P

---

### [SEC-003] Ausência de Revogação de Tokens JWT (Logout Apenas Client-Side e Troca de Senha)
- **Arquivo:Linha:** [`backend/src/services/user.service.ts:160-177`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L160-L177) e [`frontend/src/context/AuthContext.tsx:34-39`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/context/AuthContext.tsx#L34-L39)
- **Severidade:** **Alta**
- **O que está errado:** Os tokens JWT são 100% stateless e possuem prazo de 7 dias (`expiresIn: '7d'`). O logout ocorre exclusivamente no navegador apagando o `localStorage`. O backend não possui endpoint de logout, não mantém blacklist, nem controla `token_version` na tabela `users`. Quando o usuário altera sua senha em `updateProfile`, os tokens emitidos anteriormente permanecem válidos.
- **Cenário concreto de impacto:** Se o dispositivo de um usuário for roubado ou o token for interceptado em uma rede desprotegida, alterar a senha ou clicar em "Sair" NÃO revoga o acesso do invasor. O invasor continuará acessando a conta e os dados de saúde da vítima até a expiração total de 7 dias.
- **Como verificar/reproduzir:**
  1. Faça login e guarde o `token_A`.
  2. Altere a senha da conta via `PUT /api/users/me`.
  3. Envie uma requisição `GET /api/users/me` utilizando o `token_A` no header `Authorization: Bearer <token_A>`. O backend aceitará a requisição com status 200.
- **Correção sugerida:** Adicionar uma coluna `token_version INT DEFAULT 1` na tabela `users`. Incluir `tokenVersion` no payload do JWT e checar no middleware de autenticação se a versão do token coincide com a versão atual do banco. Incrementar `token_version` ao alterar senha ou solicitar encerramento de sessões.
- **Esforço:** M

---

### [SEC-004] Política de Senhas Fraca e Falta de Teto Máximo (Truncamento Silencioso no Bcrypt)
- **Arquivo:Linha:** [`backend/src/schemas/user.schema.ts:6`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/schemas/user.schema.ts#L6) e [`backend/src/schemas/user.schema.ts:25`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/schemas/user.schema.ts#L25)
- **Severidade:** **Média**
- **O que está errado:**
  1. A validação exige apenas `z.string().min(6)`. Não há regras de complexidade nem verificação contra dicionários de senhas comuns (ex: `123456`, `qwerty` são aceitas).
  2. Não há limite máximo `.max(72)`. O algoritmo `bcrypt` trunca senhas silenciosamente no 72º byte. Senhas com 100 caracteres têm os bytes após o 72 ignorados, criando senhas equivalentes. Além disso, strings gigantescas submetidas a hashing causam alto consumo de CPU.
- **Cenário concreto de impacto:** Contas de usuários protegidas por senhas triviais são facilmente comprometidas via ataques de dicionário e força bruta.
- **Como verificar/reproduzir:**
  Cadastre um usuário enviando `password: "123456"`. A API responderá `201 Created` sem objeções.
- **Correção sugerida:** Elevar o mínimo para pelo menos 8 ou 10 caracteres, fixar teto de 72 bytes e exigir pelo menos uma letra e um número:
  ```ts
  password: z.string().min(8, 'Mínimo de 8 caracteres.').max(72, 'Máximo de 72 caracteres.')
  ```
- **Esforço:** P

---

### [SEC-005] Enumeração de Usuários (Mensagens Explícitas e Timing Attack)
- **Arquivo:Linha:** [`backend/src/services/user.service.ts:14-18`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L14-L18) e [`backend/src/services/user.service.ts:39-43`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L39-L43)
- **Severidade:** **Média**
- **O que está errado:**
  1. Em `register`, se o e-mail existir, a API retorna `400 Bad Request` com `'Este e-mail já está cadastrado.'`.
  2. Em `login`, quando o e-mail não existe no banco, a função lança erro imediato sem chamar `bcrypt.compare`. Quando o e-mail existe mas a senha está errada, executa `bcrypt.compare` (que demora ~70-100ms no custo 10).
- **Cenário concreto de impacto:** Um atacante pode enviar listas de e-mails para descobrir quem possui cadastro no aplicativo (tanto via erro do registro quanto via análise de latência no login).
- **Como verificar/reproduzir:**
  1. Envie `POST /api/users/register` com e-mail já cadastrado; observe a resposta explícita.
  2. Meça o tempo de resposta de `POST /api/users/login` com e-mail inexistente (~5ms) versus e-mail existente com senha errada (~90ms).
- **Correção sugerida:** No registro, responder de forma uniforme ou enviar e-mail de notificação. No login, executar um `bcrypt.compare` "dummy" contra um hash fictício pré-calculado quando o usuário não for encontrado para manter a latência constante.
- **Esforço:** P

---

### [SEC-006] Rate Limiting com Risco de DoS Coletivo ou Bypass por Spoofing de IP
- **Arquivo:Linha:** [`backend/src/routes/user.routes.ts:10-14`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/user.routes.ts#L10-L14) e [`backend/src/app.ts:8-18`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/app.ts#L8-L18)
- **Severidade:** **Alta**
- **O que está errado:** O `authLimiter` é configurado com `max: 10` a cada 15 minutos em `/login` e `/register`, baseado unicamente no `req.ip`. No entanto, em `app.ts` **não há** configuração de `app.set('trust proxy', ...)`.
- **Cenário concreto de impacto:**
  - Se a aplicação estiver atrás de um proxy reverso (Nginx, AWS ALB, Cloudflare), todas as requisições chegam com o IP do proxy, fazendo com que 10 tentativas esgotem o limite para **todos os usuários da plataforma** simultaneamente (Denial of Service).
  - Se configurado incorretamente com `trust proxy: true`, headers como `X-Forwarded-For` podem ser forjados para burlar o limite indefinidamente.
- **Como verificar/reproduzir:**
  Inspecione `app.ts` e verifique a ausência da diretiva `trust proxy`.
- **Correção sugerida:** Configurar explicitamente `app.set('trust proxy', 1)` quando operando atrás de proxy conhecido e combinar rate limit por IP + e-mail no login.
- **Esforço:** P

---

## 2. Autorização e Controle de Acesso (IDOR)

### [SEC-007] Avaliação de IDOR e Isolamento Multitenant
- **Status:** **APROVADO com ressalva**
- **Arquivos Inspecionados:**
  - [`backend/src/models/meal.model.ts:70,115,145,212`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/meal.model.ts)
  - [`backend/src/models/history.model.ts:37,55,71`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/history.model.ts)
  - [`backend/src/models/user.model.ts:128,137`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/user.model.ts)
- **Análise Técnica:**
  - `DELETE FROM meals WHERE id = $1 AND user_id = $2`: Garante que um usuário não pode deletar refeições de terceiros.
  - `UPDATE meals SET ... WHERE id = $3 AND user_id = $4`: Garante que um usuário não pode atualizar refeições de terceiros.
  - `findMealsByUserAndDate`: Filtra explicitamente por `m.user_id = $1`.
  - `getPeriodStats`: Filtra explicitamente por `m.user_id = $1`.
  - `user_goals` e `body_measurements`: As inserções e buscas recebem `userId` diretamente de `req.userId` extraído do JWT verificado.
  - `DELETE /api/users/me`: Além de usar `req.userId`, exige confirmação da senha atual.
- **Ressalva / Brecha Encontrada:** Em `PUT /api/meals/:id` e `DELETE /api/meals/:id`, o parâmetro `:id` da rota **não é validado como UUID** na entrada (ver SEC-012). Caso um UUID inexistente seja enviado, a operação falha com 404 (correto), mas se uma string arbitrária for enviada, dispara exceção 500 do banco de dados vazando detalhes (ver SEC-011).

---

### [SEC-008] Execução Ilimitada de Onboarding e Inserções Espúrias em Medições Corporais
- **Arquivo:Linha:** [`backend/src/services/user.service.ts:72-124`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L72-L124) e [`backend/src/routes/user.routes.ts:20`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/user.routes.ts#L20)
- **Severidade:** **Média**
- **O que está errado:** A rota `PUT /api/users/me/onboarding` não valida se `user.onboarding_completed` já é `true`. Toda chamada ao endpoint recalcula metas e insere incondicionalmente um novo registro em `body_measurements` com `new Date()`.
- **Cenário concreto de impacto:** Um usuário autenticado mal-intencionado pode disparar requisições contínuas contra `/api/users/me/onboarding`, inflando a tabela `body_measurements` com milhões de registros redundantes, exaurindo armazenamento e degradando consultas de histórico.
- **Como verificar/reproduzir:**
  Após concluir o onboarding normalmente, execute repetidamente `PUT /api/users/me/onboarding` com token válido. A cada chamada um novo registro de biometria é persistido.
- **Correção sugerida:** Bloquear a chamada caso `user.onboarding_completed === true` ou condicionar inserção em `body_measurements` apenas caso o peso/gordura tenham mudado em relação à última medição.
- **Esforço:** P

---

## 3. Injeção e Manipulação de Dados

### [SEC-009] Parâmetros de Busca de Alimentos sem Sanitização de Curingas SQL (`ILIKE`) e sem Teto de Tamanho
- **Arquivo:Linha:** [`backend/src/models/food.model.ts:11-18`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/food.model.ts#L11-L18) e [`backend/src/controllers/food.controller.ts:11-15`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/food.controller.ts#L11-L15)
- **Severidade:** **Alta**
- **O que está errado:**
  1. Em `food.model.ts`, a busca concatena `%` diretamente com a entrada do usuário: `const searchPattern = '%' + query + '%'`. Os caracteres especiais `%` e `_` não sofrem escape.
  2. O schema Zod em `food.controller.ts` define `search: z.string().optional()` sem `.max()`.
  3. A query executa o operador de similaridade trigram: `ORDER BY f_unaccent(name) <-> f_unaccent($2) ASC`.
- **Cenário concreto de impacto:**
  - Ao submeter strings com dezenas de milhares de caracteres no parâmetro `search`, o PostgreSQL é forçado a calcular operações de similaridade trigram pesadas sobre strings gigantescas em todo o catálogo de alimentos, travando a CPU do banco de dados (Algorithmic Complexity Attack / DoS).
- **Como verificar/reproduzir:**
  Envie requisição autenticada: `GET /api/foods?search=____________________` ou `GET /api/foods?search=<string de 50.000 caracteres>`.
- **Correção sugerida:**
  1. No Zod: `search: z.string().max(100).optional()`.
  2. Escapar `%` e `_` antes de montar `searchPattern`:
     ```ts
     const sanitized = query.replace(/[%_]/g, '\\$&');
     const searchPattern = `%${sanitized}%`;
     ```
- **Esforço:** P

---

### [SEC-010] Script de Reset de Banco Destrutivo sem Verificação de Ambiente
- **Arquivo:Linha:** [`backend/scripts/reset-db.js:6`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/scripts/reset-db.js#L6)
- **Severidade:** **Alta**
- **O que está errado:** O script executa incondicionalmente:
  ```js
  await pool.query('DROP SCHEMA public CASCADE;');
  await pool.query('CREATE SCHEMA public;');
  ```
  Ele não possui qualquer trava que impeça sua execução contra o banco de produção (`NODE_ENV === 'production'`) ou banco de desenvolvimento que não termine com `_test`.
- **Cenário concreto de impacto:** Uma execução acidental de comando em ambiente de produção (por exemplo, um deploy mal configurado ou comando de pipeline) destrói todo o esquema e todos os dados de usuários de forma irreversível e instantânea.
- **Como verificar/reproduzir:**
  Abra `backend/scripts/reset-db.js` e comprove a ausência de checagens de `NODE_ENV`.
- **Correção sugerida:** Inserir trava de segurança obrigatória:
  ```js
  if (process.env.NODE_ENV === 'production' || !process.env.DB_NAME?.endsWith('_test')) {
    console.error('❌ Proibido rodar reset-db fora do ambiente isolado de testes!');
    process.exit(1);
  }
  ```
- **Esforço:** P

---

## 4. Validação e Tratamento de Erros

### [SEC-011] Vazamento de Erros Internos do PostgreSQL em Respostas HTTP 500
- **Arquivo:Linha:**
  - [`backend/src/controllers/meal.controller.ts:16-19,30-33,43-46,56-59,71-74`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/meal.controller.ts#L16-L19)
  - [`backend/src/controllers/user.controller.ts:20-24,38-42,58-62,79-83`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/user.controller.ts#L20-L24)
  - [`backend/src/controllers/food.controller.ts:33-35`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/food.controller.ts#L33-L35)
- **Severidade:** **Alta**
- **O que está errado:** Todos os controllers interceptam erros em blocos `try/catch` locais e retornam:
  ```ts
  const statusCode = err.statusCode ?? 500;
  return res.status(statusCode).json({ success: false, message: err.message ?? 'Erro interno no servidor.' });
  ```
  Isso faz com que o middleware global [`errorHandler.ts`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/middlewares/errorHandler.ts) (que mascara mensagens 500) nunca seja acionado. Quando o driver `pg` lança uma exceção (erro de sintaxe, UUID inválido, violação de chave, falha de conexão), a propriedade nativa `err.message` da biblioteca é exposta diretamente no JSON de resposta.
- **Cenário concreto de impacto:** Um usuário que envie um ID inválido ou force um erro no banco recebe detalhes de colunas, nomes de tabelas, sintaxes SQL internas e diagnósticos de infraestrutura.
- **Como verificar/reproduzir:**
  Envie `DELETE /api/meals/abc-nao-eh-uuid` com token válido. O backend responde com HTTP 500 e payload:
  ```json
  {
    "success": false,
    "message": "invalid input syntax for type uuid: \"abc-nao-eh-uuid\""
  }
  ```
- **Correção sugerida:** Delegar erros inesperados para `next(error)` ou retornar mensagem genérica sempre que `statusCode === 500`:
  ```ts
  const message = statusCode === 500 ? 'Erro interno no servidor.' : err.message;
  ```
- **Esforço:** P

---

### [SEC-012] Middleware `validate.ts` Limitado a `req.body` e Rotas sem Validação de `query` e `params`
- **Arquivo:Linha:** [`backend/src/middlewares/validate.ts:6-14`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/middlewares/validate.ts#L6-L14), [`backend/src/routes/meal.routes.ts:12-15`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/meal.routes.ts#L12-L15), [`backend/src/routes/food.routes.ts:10`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/food.routes.ts#L10)
- **Severidade:** **Alta**
- **O que está errado:**
  1. O middleware de validação Zod central avalia rigidamente apenas `req.body`:
     ```ts
     const result = schema.safeParse(req.body);
     ```
     Ele não suporta validar `req.params` nem `req.query`.
  2. Como consequência:
     - `GET /api/meals/today`: Parâmetro `date` não possui validação Zod. Enviar `?date=2026-10-10&date=2026-10-11` (HPP) quebra a rota com `TypeError: dateStr.match is not a function`.
     - `GET /api/meals/stats`: Parâmetros `period` e `date` não possuem middleware Zod.
     - `PUT /api/meals/:id` e `DELETE /api/meals/:id`: O `:id` não é validado contra `z.string().uuid()`.
     - `GET /api/foods`: Rota sem middleware `validate`, forçando o controller a executar `.parse(req.query)` manualmente (violando regra de arquitetura).
- **Cenário concreto de impacto:** Quebra de rotas com 500 por tipo inesperado em query params e chamadas com IDs mal formatados atingindo o PostgreSQL diretamente.
- **Como verificar/reproduzir:**
  Execute `GET /api/meals/today?date=2026-10-10&date=2026-10-11` autenticado. Observe a falha com status 500.
- **Correção sugerida:** Evoluir `validate.ts` para suportar validação opcional de `body`, `query` e `params`:
  ```ts
  export function validate(schemas: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) { ... }
  ```
- **Esforço:** M

---

### [SEC-013] Ausência de Teto Máximo em Itens de Refeição e Campos de Texto (Risco de DoS)
- **Arquivo:Linha:** [`backend/src/schemas/meal.schema.ts:4-13`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/schemas/meal.schema.ts#L4-L13) e [`backend/src/schemas/user.schema.ts:4,15`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/schemas/user.schema.ts#L4)
- **Severidade:** **Alta**
- **O que está errado:**
  1. `items: z.array(...).min(1)` não possui `.max()`.
  2. `createMealWithItems` executa uma iteração com um `INSERT INTO meal_items` individual por item dentro de uma transação aberta do PostgreSQL.
  3. `name` em `createMealSchema` e `registerUserSchema` não possui limite máximo de caracteres.
  4. `quantity` em `createMealSchema` não possui `.max()`. Valores muito altos (ex: `1e9`) excedem o limite da coluna `NUMERIC(8,2)` do PostgreSQL, resultando em estouro de precisão.
- **Cenário concreto de impacto:** Um usuário mal-intencionado pode submeter uma refeição com 50.000 itens ou um nome de 10 megabytes. O servidor abre uma transação, tenta rodar 50.000 queries sequenciais no banco, trava o pool de conexões e satura a memória do processo Node.js.
- **Como verificar/reproduzir:**
  Envie um array de itens com 10.000 elementos em `POST /api/meals`. O servidor despende recursos desproporcionais inserindo linha a linha no banco.
- **Correção sugerida:** Limitar o array a um valor razoável para consumo humano (ex: `.max(50)`) e definir `.max(100)` para nomes:
  ```ts
  name: z.string().min(1).max(100),
  items: z.array(...).min(1).max(50),
  quantity: z.number().positive().max(10000)
  ```
- **Esforço:** P

---

## 5. Configuração e Infraestrutura de Backend

### [SEC-014] Desativação de Validação de Certificado SSL do Banco em Produção
- **Arquivo:Linha:** [`backend/src/database/pool.ts:23`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/database/pool.ts#L23)
- **Severidade:** **Crítica**
- **O que está errado:** A configuração do pool de conexões do PostgreSQL define:
  ```ts
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  ```
- **Cenário concreto de impacto:** Ao definir `rejectUnauthorized: false`, a verificação da cadeia de certificados TLS é completamente desabilitada. Qualquer atacante posicionado na rede entre o servidor Node.js e a instância gerenciada do PostgreSQL (por exemplo, em uma VPC compartilhada, proxy ou provedor em nuvem) pode interceptar, ler e adulterar todo o tráfego do banco (senhas de usuários, hashes, dados de saúde e biometria) através de um ataque Man-in-the-Middle (MITM).
- **Como verificar/reproduzir:**
  Inspecione a linha 23 de `backend/src/database/pool.ts`.
- **Correção sugerida:** Em produção, fornecer o certificado raiz (`ca`) ou exigir validação estrita do certificado do provedor (ex: AWS RDS, Supabase, Neon) com `{ rejectUnauthorized: true }`.
- **Esforço:** P

---

### [SEC-015] Ausência de Limite Explícito no Parser JSON (`express.json()`)
- **Arquivo:Linha:** [`backend/src/app.ts:18`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/app.ts#L18)
- **Severidade:** **Média**
- **O que está errado:** `app.use(express.json())` é invocado sem o parâmetro `limit`. O padrão do Express é 100kb. Embora não seja ilimitado, em APIs que processam dados nutricionais textuais, requisições de 100kb em massa podem consumir CPU de parsing desnecessária. Mais importante: não há tratamento do erro `entity.too.large` emitido pelo middleware.
- **Cenário concreto de impacto:** Falha sem tratamento amigável de erro ao exceder tamanho do payload.
- **Correção sugerida:** Definir teto explícito adequado às necessidades da API:
  ```ts
  app.use(express.json({ limit: '50kb' }));
  ```
- **Esforço:** P

---

### [SEC-016] Dependências Vulneráveis no Backend e Ferramentas de Build
- **Arquivo:Linha:** [`backend/package.json`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/package.json) e [`package.json`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/package.json)
- **Severidade:** **Crítica**
- **O que está errado:** O comando determinístico `npm audit --json` detectou:
  1. **`proxy-addr` (CRÍTICA)** no backend: Vulnerável a IP spoofing via IPv4-mapped IPv6 trust subnet ([GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h), CVSS 9.1). Essa biblioteca é usada diretamente pelo Express para resolver `req.ip` e headers de proxy.
  2. **`tar` (CRÍTICA / ALTA)** no backend: Múltiplas vulnerabilidades de Arbitrary File Creation/Overwrite via Symlink/Hardlink Traversal e DoS por descompressão infinita ([GHSA-34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v), [GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw)).
  3. **`shell-quote` / `concurrently` (CRÍTICA)** no root: Injeção de comando via quebra de linha ([GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv), CVSS 8.1).
- **Cenário concreto de impacto:** Burlar limites de IP configurados em middlewares e spoofar endereços de clientes em logs de auditoria através da falha do `proxy-addr`.
- **Como verificar/reproduzir:**
  Execute `npm audit --prefix backend` e `npm audit` na raiz.
- **Correção sugerida:** Executar atualização de dependências e fixação de versões seguras via `npm update` / overrides.
- **Esforço:** M

---

### [SEC-017] Registro Duplicado de Rotas no `server.ts`
- **Arquivo:Linha:** [`backend/src/server.ts:9-11`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/server.ts#L9-L11) e [`backend/src/app.ts:24-26`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/app.ts#L24-L26)
- **Severidade:** **Baixa**
- **O que está errado:** O arquivo `backend/src/app.ts` registra todas as rotas da aplicação nas linhas 24 a 26:
  ```ts
  app.use('/api/users', userRoutes);
  app.use('/api/foods', foodRoutes);
  app.use('/api/meals', mealRoutes);
  ```
  E logo em seguida, [`backend/src/server.ts`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/server.ts) importa `app` e registra as três rotas **novamente** antes do `app.listen()`.
- **Cenário concreto de impacto:** Registros duplicados na pilha de roteamento do Express, causando execução duplicada de middlewares se montados em sub-roteadores e confusão na ordem de resolução de erros.
- **Como verificar/reproduzir:**
  Compare as linhas 24-26 de `app.ts` com as linhas 9-11 de `server.ts`.
- **Correção sugerida:** Remover as linhas 9 a 11 de `backend/src/server.ts`.
- **Esforço:** P

---

## 6. Frontend e Segurança no Cliente

### [SEC-018] Armazenamento de Dados de Saúde e Tokens em `localStorage`
- **Arquivo:Linha:** [`frontend/src/context/AuthContext.tsx:25-26`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/context/AuthContext.tsx#L25-L26) e [`frontend/src/services/api.ts:10`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/services/api.ts#L10)
- **Severidade:** **Alta**
- **O que está errado:** O `AuthContext` grava no `localStorage` do navegador:
  1. `auth_token`: O JWT completo de autenticação.
  2. `user_session`: O objeto completo `UserProfile`, que inclui: **peso, altura, percentual de gordura corporal, sexo, data de nascimento, metas calóricas diárias e nível de atividade**.
- **Cenário concreto de impacto:** Qualquer script malicioso injetado (via dependência comprometida do npm, extensão de navegador maliciosa ou futuro vetor XSS) pode acessar `window.localStorage` e exfiltrar todos os dados biométricos, sensíveis e credenciais de sessão do usuário.
- **Como verificar/reproduzir:**
  Abra a aplicação no navegador, faça login e execute no console DevTools:
  ```js
  console.log(localStorage.getItem('user_session'));
  console.log(localStorage.getItem('auth_token'));
  ```
- **Correção sugerida:**
  1. Migrar autenticação para cookies com as flags `HttpOnly; Secure; SameSite=Lax`, tornando o token inacessível a JavaScript.
  2. Não persistir dados de biometria de longo prazo em storage persistente de scripts; mantê-los no estado em memória do React (TanStack Query cache).
- **Esforço:** M

---

### [SEC-019] Ausência de Content Security Policy (CSP) na SPA
- **Arquivo:Linha:** [`frontend/index.html:1-18`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/index.html#L1-L18)
- **Severidade:** **Média**
- **O que está errado:** Não há meta tag `<meta http-equiv="Content-Security-Policy" ...>` no HTML nem cabeçalhos CSP configurados para o frontend servido.
- **Cenário concreto de impacto:** Em caso de eventual injeção de script ou pacote vulnerável, não há restrições de domínios para conexão remota ou carregamento de scripts externos.
- **Como verificar/reproduzir:**
  Inspecione `frontend/index.html`.
- **Correção sugerida:** Adicionar cabeçalho ou meta tag CSP restringindo origens permitidas de scripts, conexões de API e estilos.
- **Esforço:** P

---

## 7. Privacidade e Conformidade com a LGPD

O CalorieSync trata ativamente dados de **saúde e biometria** (peso, altura, percentual de gordura corporal, histórico de consumo calórico e macronutrientes, histórico de pesagens), classificados como **dados pessoais sensíveis** pela LGPD (Lei nº 13.709/2018, Art. 5º, II).

### [SEC-020] Ausência de Consentimento Informado e Termos Legais Inertes
- **Arquivo:Linha:** [`frontend/src/components/ui/footer-section.tsx:54-76`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ui/footer-section.tsx#L54-L76) e [`frontend/src/components/auth/RegisterForm.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/auth/RegisterForm.tsx)
- **Severidade:** **Média**
- **O que está errado:**
  1. O cadastro e o onboarding não apresentam nenhum checkbox ou termo de consentimento explícito e em destaque para o tratamento de dados de saúde (exigência do Art. 11 da LGPD).
  2. Os links no rodapé da página para "Privacidade", "Termos de Uso" e "Segurança" são links mortos com manipuladores `onClick={(e) => e.preventDefault()}`:
     ```tsx
     <a href="#privacidade" onClick={(e) => e.preventDefault()}>Privacidade</a>
     ```
  3. Não há Política de Privacidade disponível para consulta do usuário sobre retenção, base legal e compartilhamento de dados.
- **Cenário concreto de impacto:** Não conformidade com o Artigo 11 e Artigo 9º da LGPD, sujeitando a plataforma a questionamentos regulatórios por coletar dados sensíveis sem base legal formalizada.
- **Como verificar/reproduzir:**
  Clique nos links "Privacidade" ou "Termos de Uso" no rodapé da aplicação. Note que nenhuma ação é executada.
- **Correção sugerida:** Implementar uma página real de Política de Privacidade e exigir opt-in explícito no formulário de cadastro.
- **Esforço:** M

---

### [SEC-021] Ausência de Mecanismo de Portabilidade / Exportação de Dados (Art. 18, V)
- **Arquivo:Linha:** Toda a API (`backend/src/routes/user.routes.ts`)
- **Severidade:** **Baixa**
- **O que está errado:** A aplicação não oferece nenhum endpoint ou funcionalidade para exportar o histórico de refeições, metas e medições corporais em formato interoperável (JSON ou CSV).
- **Cenário concreto de impacto:** Não atendimento pleno ao direito de portabilidade dos dados previsto no Art. 18, inciso V da LGPD.
- **Como verificar/reproduzir:**
  Verifique a lista de rotas em `user.routes.ts` e `meal.routes.ts`. Não existe rota `GET /api/users/me/export` ou similar.
- **Correção sugerida:** Criar um endpoint `GET /api/users/me/export` autenticado que gere um dump estruturado (JSON ou CSV) de todos os dados do titular.
- **Esforço:** M

---

### [SEC-022] Avaliação da Exclusão de Conta (Direito à Eliminação - Art. 18, VI)
- **Status:** **CONFORME / ADEQUADO**
- **Arquivos Inspecionados:**
  - [`backend/src/controllers/user.controller.ts:108-127`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/user.controller.ts#L108-L127)
  - [`backend/src/services/user.service.ts:210-232`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L210-L232)
  - [`backend/migrations/`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/migrations/)
- **Análise Técnica:** O endpoint `DELETE /api/users/me` exige confirmação de senha do usuário. O modelo executa `DELETE FROM users WHERE id = $1`. Como as tabelas `meals`, `body_measurements` e `user_goals` possuem foreign keys com `ON DELETE CASCADE` apontando para `users(id)`, e `meal_items` possui `ON DELETE CASCADE` apontando para `meals(id)`, a remoção física é completa e atômica no PostgreSQL. O frontend também limpa a sessão imediatamente.
- **Recomendação de melhoria:** Definir e documentar política de descarte automático para contas inativas há mais de X anos (princípio da necessidade/retenção).

---

## 8. Integração Contínua e Ferramentas (CI/CD)

### [SEC-023] Ausência de Verificação de Vulnerabilidades e Scanners de Segurança no Pipeline de CI
- **Arquivo:Linha:** [`.github/workflows/ci.yml:48-71`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.github/workflows/ci.yml#L48-L71)
- **Severidade:** **Média**
- **O que está errado:** O pipeline de CI executa apenas linting, testes com banco e build. Não há nenhum passo de:
  1. `npm audit` para bloquear PRs que introduzam bibliotecas com CVEs críticas.
  2. Scanner estático de vulnerabilidades (ex: Semgrep, CodeQL, SonarQube).
  3. Scanner de segredos commitados (ex: Gitleaks ou Trufflehog).
- **Cenário concreto de impacto:** Dependências comprometidas ou commits contendo chaves privadas, tokens ou `.env` são integrados à branch `main` sem qualquer alerta automatizado prévio.
- **Como verificar/reproduzir:**
  Abra `.github/workflows/ci.yml`. Note a ausência de etapas de auditoria de dependências ou análise SAST.
- **Correção sugerida:** Adicionar no workflow do GitHub Actions:
  ```yaml
  - name: Security Audit
    run: |
      npm audit --audit-level=high
      npm --prefix backend audit --audit-level=high
      npm --prefix frontend audit --audit-level=high
  - name: Gitleaks Secret Scan
    uses: gitleaks/gitleaks-action@v2
  ```
- **Esforço:** P

---

## Matriz Consolidada de Ação e Priorização

| ID | Arquivo:Linha | Severidade | Categoria | Esforço |
| :--- | :--- | :---: | :--- | :---: |
| **SEC-001** | `backend/src/middlewares/auth.ts:19` | **Crítica** | Autenticação | P |
| **SEC-002** | `commit 24d1ce65:backend/.env` | **Crítica** | Gestão de Segredos | P |
| **SEC-014** | `backend/src/database/pool.ts:23` | **Crítica** | Infra / Rede | P |
| **SEC-016** | `backend/package.json` | **Crítica** | Dependências | M |
| **SEC-003** | `backend/src/services/user.service.ts:160` | **Alta** | Autenticação | M |
| **SEC-006** | `backend/src/routes/user.routes.ts:10` | **Alta** | Rate Limiting | P |
| **SEC-009** | `backend/src/models/food.model.ts:11` | **Alta** | Injeção / DoS | P |
| **SEC-010** | `backend/scripts/reset-db.js:6` | **Alta** | Integridade / Banco | P |
| **SEC-011** | `backend/src/controllers/meal.controller.ts:18` | **Alta** | Vazamento de Dados | P |
| **SEC-012** | `backend/src/middlewares/validate.ts:6` | **Alta** | Validação de Entrada | M |
| **SEC-013** | `backend/src/schemas/meal.schema.ts:6` | **Alta** | DoS / Limites | P |
| **SEC-018** | `frontend/src/context/AuthContext.tsx:25` | **Alta** | Frontend / Storage | M |
| **SEC-004** | `backend/src/schemas/user.schema.ts:6` | **Média** | Política de Senha | P |
| **SEC-005** | `backend/src/services/user.service.ts:14` | **Média** | Enumeração de Usuários | P |
| **SEC-008** | `backend/src/services/user.service.ts:72` | **Média** | Integridade de Negócio | P |
| **SEC-015** | `backend/src/app.ts:18` | **Média** | Configuração HTTP | P |
| **SEC-019** | `frontend/index.html:1` | **Média** | Segurança no Cliente | P |
| **SEC-020** | `frontend/src/components/ui/footer-section.tsx:54` | **Média** | LGPD / Privacidade | M |
| **SEC-023** | `.github/workflows/ci.yml:48` | **Média** | CI/CD / Automação | P |
| **SEC-017** | `backend/src/server.ts:9` | **Baixa** | Qualidade / Roteamento | P |
| **SEC-021** | `backend/src/routes/user.routes.ts:1` | **Baixa** | LGPD / Portabilidade | M |
