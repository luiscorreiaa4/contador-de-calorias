import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getTokenVersion } from '../models/auth.model.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  tokenVersion?: number;
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
  // A8: claim obrigatório e inteiro não negativo.
  tv: z.number().int().nonnegative('Token inválido: tv ausente.'),
});

function rejectInvalidToken(res: Response) {
  return res.status(401).json({
    success: false,
    message: 'Token de autenticação inválido ou expirado.',
  });
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acesso negado. Token de autenticação não fornecido.',
    });
  }

  let parsed: { userId: string; tv: number };
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    const result = tokenPayloadSchema.safeParse(decoded);
    if (!result.success) {
      return rejectInvalidToken(res);
    }
    parsed = result.data;
  } catch {
    return rejectInvalidToken(res);
  }

  let currentTokenVersion: number | null;
  try {
    currentTokenVersion = await getTokenVersion(parsed.userId);
  } catch (error) {
    // Falha de infraestrutura não deve ser mascarada como token inválido.
    return next(error);
  }

  // Usuário removido ou sessão revogada por troca de senha (A8).
  if (currentTokenVersion === null || currentTokenVersion !== parsed.tv) {
    return rejectInvalidToken(res);
  }

  req.userId = parsed.userId;
  req.tokenVersion = currentTokenVersion;
  return next();
}
