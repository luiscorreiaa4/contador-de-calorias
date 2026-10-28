---
name: create-backend-resource
description: "Padroniza a criação de novos recursos/módulos no backend Node.js (model, service, controller, routes)."
---

# Fluxo de Criação de Recursos Backend

Sempre que for solicitado criar um novo recurso/módulo no backend (ex: usuários, produtos, autenticação), siga a estrutura abaixo.

## 1. Mapeamento de Caminhos
Contratos compartilhados ficam no pacote `shared/` e o restante dentro de `/backend`, em TypeScript:
- Types/DTO: `/shared/src/types/[recurso].types.ts` (contrato consumido também pelo frontend)
- Schema de validação: `/shared/src/schemas/[recurso].schema.ts` (zod puro; sem imports de Express)
- Model: `/backend/src/models/[recurso].model.ts` (queries do PostgreSQL, sem regra de negócio)
- Service: `/backend/src/services/[recurso].service.ts` (regras de negócio, orquestra o model)
- Controller: `/backend/src/controllers/[recurso].controller.ts` (tradução HTTP: chama o service e formata resposta)
- Routes: `/backend/src/routes/[recurso].routes.ts` (endpoints da API, aplica middleware de validação/auth)

> Contratos e schemas são importados por alias `@caloriesync/shared` (barrel) a partir do backend e do frontend. Cálculos puros reutilizáveis devem ir para `shared/src/nutrition/` e ser importados pelo subpath `@caloriesync/shared/nutrition` no frontend (evita arrastar Zod ao bundle). Novos recursos exportam o schema/DTO no barrel `shared/src/index.ts`.

## 2. Padronização de Respostas e Status Codes
Todas as respostas da API devem retornar JSON padronizado:
```typescript
{ success: boolean, data?: unknown, message?: string, code?: string }
```
`code` é opcional e só carrega códigos de negócio estáveis (ex.: `EMAIL_NOT_VERIFIED`).
- **200 OK:** Leitura (GET) ou Atualização (PUT/PATCH) bem-sucedida.
- **201 Created:** Criação (POST) de um novo recurso com sucesso.
- **400 Bad Request:** Dados de entrada inválidos (falha na validação zod).
- **401/403:** Sem autenticação / sem permissão.
- **404 Not Found:** Recurso não encontrado no banco.
- **500 Internal Server Error:** Erros inesperados no servidor (nunca expor detalhes internos/stack trace na resposta).

## 3. Validação de Entrada (obrigatório)
Toda rota que recebe dados do usuário deve validar com zod antes de chegar ao controller.

```typescript
// /shared/src/schemas/example.schema.ts
import { z } from 'zod';

export const createExampleSchema = z.object({
  name: z.string().min(1, "O campo 'name' é obrigatório."),
});

export type CreateExampleDTO = z.infer<typeof createExampleSchema>;
```

## 4. Modelo de Types
```typescript
// /shared/src/types/example.types.ts
export interface Example {
  id: string;
  name: string;
  createdAt: Date;
}
```

## 5. Modelo de Model
```typescript
// /backend/src/models/example.model.ts
import { pool } from '../database/pool.js';
import type { Example } from '@caloriesync/shared';

export async function createItem(name: string): Promise<Example> {
  const result = await pool.query<Example>(
    'INSERT INTO examples (name) VALUES ($1) RETURNING *',
    [name]
  );
  return result.rows[0];
}

export async function findById(id: string): Promise<Example | null> {
  const result = await pool.query<Example>('SELECT * FROM examples WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}
```

## 6. Modelo de Service
```typescript
// /backend/src/services/example.service.ts
import * as ExampleModel from '../models/example.model.js';
import type { CreateExampleDTO } from '@caloriesync/shared';

export async function create(data: CreateExampleDTO) {
  // regra de negócio (ex: checar duplicidade, aplicar transação) fica aqui
  return ExampleModel.createItem(data.name);
}

export async function getById(id: string) {
  const item = await ExampleModel.findById(id);
  if (!item) {
    const error: Error & { statusCode?: number } = new Error('Recurso não encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return item;
}
```

## 7. Modelo de Controller
Controllers só traduzem HTTP: usam `asyncHandler` (erros vão ao `errorHandler` global, sem `try/catch` nem `any`) e `requireUserId` para recursos do usuário.
```typescript
// /backend/src/controllers/example.controller.ts
import { Request, Response } from 'express';
import { requireUserId } from '../middlewares/auth.js';
import * as ExampleService from '../services/example.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const newItem = await ExampleService.create(userId, req.body);
  return res.status(201).json({ success: true, message: 'Criado com sucesso!', data: newItem });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const item = await ExampleService.getById(userId, req.params.id as string);
  return res.status(200).json({ success: true, data: item });
});
```

## 8. Modelo de Routes
```typescript
// /backend/src/routes/example.routes.ts
import { Router } from 'express';
import * as ExampleController from '../controllers/example.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { createExampleSchema, uuidParamSchema } from '@caloriesync/shared';

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: createExampleSchema }), ExampleController.create);
router.get('/:id', validate({ params: uuidParamSchema }), ExampleController.getOne);

export default router;
```

## 9. CRUD Completo
Ao criar um recurso, gere as operações que o requisito pede (`create`, `getOne`, `list`, `update`, `remove`) replicando o padrão service → controller → routes. **Exceção:** alimentos do catálogo global nunca têm `DELETE`; use desativação (`active = false`). Recursos administrativos ficam sob `/api/admin/*` com `authenticate, requireAdmin` no roteador raiz e auditoria na mesma transação (ver `backend-rules.md` §8). Mudança de esquema exige NOVA migração (D-13).

## 10. Checklist antes de finalizar
- [ ] Todos os arquivos em `.ts`, sem `any`; imports locais com extensão `.js`.
- [ ] Rota registrada em `app.ts` (há teste de unicidade de registro de roteadores).
- [ ] Controller com `asyncHandler`; queries parametrizadas no model.
- [ ] Schema zod cobrindo todos os campos de entrada.
- [ ] Regra de negócio no service, nunca no controller.
- [ ] Se a operação envolver múltiplas escritas relacionadas, usar transação no model/service.
- [ ] Testes correspondentes criados (ver skill `backend-testing-guide`).
