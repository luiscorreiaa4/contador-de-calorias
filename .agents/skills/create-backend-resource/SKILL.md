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
{ success: boolean, data?: unknown, message?: string }
```
- **200 OK:** Leitura (GET) ou Atualização (PUT/PATCH) bem-sucedida.
- **201 Created:** Criação (POST) de um novo recurso com sucesso.
- **400 Bad Request:** Dados de entrada inválidos (falha na validação zod).
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
import { pool } from '../database/pool';
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
import * as ExampleModel from '../models/example.model';
import type { CreateExampleDTO } from '@caloriesync/shared';

export async function create(data: CreateExampleDTO) {
  // regra de negócio (ex: checar duplicidade, aplicar transação) fica aqui
  return ExampleModel.createItem(data.name);
}

export async function getById(id: string) {
  const item = await ExampleModel.findById(id);
  if (!item) {
    const error = new Error('Recurso não encontrado.');
    (error as any).statusCode = 404;
    throw error;
  }
  return item;
}
```

## 7. Modelo de Controller
```typescript
// /backend/src/controllers/example.controller.ts
import { Request, Response } from 'express';
import * as ExampleService from '../services/example.service';

export async function create(req: Request, res: Response) {
  try {
    const newItem = await ExampleService.create(req.body);
    return res.status(201).json({ success: true, message: 'Criado com sucesso!', data: newItem });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const item = await ExampleService.getById(req.params.id);
    return res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    return res.status(statusCode).json({ success: false, message: error.message ?? 'Erro interno no servidor.' });
  }
}
```

## 8. Modelo de Routes
```typescript
// /backend/src/routes/example.routes.ts
import { Router } from 'express';
import * as ExampleController from '../controllers/example.controller';
import { validate } from '../middlewares/validate';
import { createExampleSchema } from '@caloriesync/shared';

const router = Router();

router.post('/', validate(createExampleSchema), ExampleController.create);
router.get('/:id', ExampleController.getOne);

export default router;
```

## 9. CRUD Completo
Ao criar um recurso, gere o conjunto completo de operações (não apenas `create`): `create`, `getOne`, `list`, `update`, `delete` — replicando o mesmo padrão de service → controller → routes para cada uma.

## 10. Checklist antes de finalizar
- [ ] Todos os arquivos em `.ts`, sem `any` implícito.
- [ ] Schema zod cobrindo todos os campos de entrada.
- [ ] Regra de negócio no service, nunca no controller.
- [ ] Se a operação envolver múltiplas escritas relacionadas, usar transação no model/service.
- [ ] Testes correspondentes criados (ver skill `backend-testing-guide`).
