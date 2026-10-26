---
name: backend-middlewares
description: "Define os middlewares padrão de validação (zod) e autenticação/autorização (JWT + papel no banco) reutilizados por todas as rotas do backend."
---

# Middlewares Padrão do Backend

Use estes middlewares em toda rota nova. Eles centralizam validação, autenticação e tratamento de erro (ver `create-backend-resource`). **A fonte da verdade é o código em `backend/src/middlewares/`; leia-o antes de alterar.**

## 1. Localização
- `backend/src/middlewares/validate.ts` — `validate(schema | { body, query, params })`
- `backend/src/middlewares/auth.ts` — `authenticate`, `requireAdmin`, `requireUserId`, `AuthenticatedRequest`
- `backend/src/middlewares/errorHandler.ts` — handler global
- `backend/src/middlewares/authRateLimit.ts` — rate limit de `/api/auth/*`
- `backend/src/middlewares/requestLogger.ts` — log estruturado com correlation ID
- `backend/src/utils/asyncHandler.ts` — repassa rejeições de controllers assíncronos ao `errorHandler`

## 2. `validate` (Zod)
Aceita um schema de body ou um objeto particionado. Falha = `400` com `{ success: false, message }` antes de chegar ao controller. Nunca use `.parse()` no controller.

```typescript
router.get('/', validate({ query: listFoodsQuerySchema }), FoodController.list);
router.put('/:id', validate({ params: idParamsSchema, body: updateSchema }), Controller.update);
router.post('/', validate(createSchema), Controller.create);
```

Schemas vivem em `shared/src/schemas/` e são importados de `@caloriesync/shared`.

## 3. `authenticate` (JWT + banco)
- Exige `Authorization: Bearer <jwt>` (HS256) com claims `userId` e `tv`.
- Consulta `getUserAuthContext(userId)` **por PK a cada requisição**; compara `tv` com `users.token_version` (sessão revogada por troca de senha ⇒ 401) e preenche `req.userId`, `req.tokenVersion` e `req.userRole` (vindo do banco).
- Sem token ou token inválido = `401`. Falha de infraestrutura vai para `next(error)` (não vira 401).
- No controller use `requireUserId(req)` para obter o `userId` tipado.

## 4. `requireAdmin` (RBAC)
- Autoriza por `req.userRole === 'admin'`, que `authenticate` leu do banco. **Nunca autorize por claims do JWT.**
- Rejeita com `403` e `code: 'FORBIDDEN'`.
- Aplique no roteador raiz: `router.use(authenticate, requireAdmin)` em `admin.routes.ts`. Sem token = 401; usuário comum = 403.

## 5. `errorHandler` e `asyncHandler`
- Controllers assíncronos usam `asyncHandler(async (req, res) => { ... })`; erros de negócio lançam `Error` com `statusCode` (e `code` opcional para códigos estáveis como `EMAIL_NOT_VERIFIED`).
- O `errorHandler` (registrado por último em `app.ts`) responde `{ success: false, message, code? }`; em `500` esconde detalhes e registra via `structuredLog`.

## 6. Uso na Rota
```typescript
import { Router } from 'express';
import * as ExampleController from '../controllers/example.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { createExampleSchema } from '@caloriesync/shared';

const router = Router();

router.post('/', authenticate, validate(createExampleSchema), ExampleController.create);

export default router;
```

## 7. Checklist antes de finalizar
- [ ] Toda rota com body/query/params usa `validate(...)`.
- [ ] Toda rota protegida usa `authenticate`; rotas administrativas ficam sob `/api/admin/*` com `authenticate, requireAdmin` no roteador raiz.
- [ ] Papel nunca é lido de claims do JWT.
- [ ] Segredos (`JWT_SECRET`, `AUTH_TOKEN_PEPPER`) só via `env` validado; nada hardcoded (ver `backend-rules.md`).
- [ ] Controllers usam `asyncHandler` e `requireUserId`; sem `try/catch` repetido nem `any`.
- [ ] `errorHandler` continua como último middleware em `app.ts`.
