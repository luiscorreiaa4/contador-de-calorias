import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  requestId?: string;
}

/**
 * Garante em tempo de execução e compilação que a requisição possui um `userId` válido (A-022).
 * Lança erro HTTP 401 caso o middleware `authenticate` não tenha sido aplicado ou o token seja inválido.
 */
export function requireUserId(req: Request | AuthenticatedRequest): string {
  const userId = (req as AuthenticatedRequest).userId;
  if (!userId || typeof userId !== 'string') {
    const error = new Error('Usuário não autenticado.');
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }
  return userId;
}

const tokenPayloadSchema = z.object({
  userId: z.string().min(1, 'Token inválido: userId ausente.'),
});

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acesso negado. Token de autenticação não fornecido.',
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    const parsed = tokenPayloadSchema.safeParse(decoded);
    if (!parsed.success) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação inválido ou expirado.',
      });
    }

    req.userId = parsed.data.userId;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticação inválido ou expirado.',
    });
  }
}
