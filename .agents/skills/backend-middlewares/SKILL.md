---
name: backend-middlewares
description: "Define os middlewares padrão de validação (zod) e autenticação/autorização (JWT) reutilizados por todas as rotas do backend."
---

# Middlewares Padrão do Backend

Use estes middlewares em toda rota nova. Eles centralizam validação de input e autenticação, evitando reimplementação em cada recurso (ver `create-backend-resource`).

## 1. Localização
- `/backend/src/middlewares/validate.ts`
- `/backend/src/middlewares/auth.ts`
- `/backend/src/middlewares/errorHandler.ts`

## 2. Middleware de Validação (zod)
```typescript
// /backend/src/middlewares/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues.map(i => i.message).join(', '),
      });
    }
    req.body = result.data;
    next();
  };
}
```

## 3. Middleware de Autenticação (JWT)
```typescript
// /backend/src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado.' });
  }
}
```

## 4. Middleware de Autorização (por papel/role, opcional)
```typescript
// /backend/src/middlewares/authorize.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest & { userRole?: string }, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ success: false, message: 'Acesso não autorizado.' });
    }
    next();
  };
}
```

## 5. Error Handler Global
```typescript
// /backend/src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? 'Erro interno no servidor.' : err.message;
  return res.status(statusCode).json({ success: false, message });
}
```
Registrar por último em `app.ts`, após todas as rotas.

## 6. Uso na Rota
```typescript
// /backend/src/routes/example.routes.ts
import { Router } from 'express';
import * as ExampleController from '../controllers/example.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { createExampleSchema } from '../schemas/example.schema';

const router = Router();

router.post('/', authenticate, validate(createExampleSchema), ExampleController.create);

export default router;
```

## 7. Checklist antes de finalizar
- [ ] Toda rota que recebe body usa `validate(schema)`.
- [ ] Toda rota protegida usa `authenticate` (e `authorize` quando houver papéis distintos).
- [ ] `JWT_SECRET` vem de variável de ambiente, nunca hardcoded (ver `backend-rules.md`).
- [ ] `errorHandler` registrado como último middleware em `app.ts`.
