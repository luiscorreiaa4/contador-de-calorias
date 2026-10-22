import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getUserAuthContext, type UserAuthContext } from '../models/auth.model.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  tokenVersion?: number;
  userRole?: 'user' | 'admin';
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

/**
 * Garante que a requisição autenticada possui papel de administrador (D-22 / B1 / B11).
 * Rejeita com HTTP 403 e code 'FORBIDDEN' caso o papel no banco seja diferente de 'admin'.
 */
export function requireAdmin(req: Request | AuthenticatedRequest, res: Response, next: NextFunction) {
  const userRole = (req as AuthenticatedRequest).userRole;
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Recurso restrito a administradores.',
      code: 'FORBIDDEN',
    });
  }
  return next();
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

  let authContext: UserAuthContext | null;
  try {
    // B1: papel vem SEMPRE do banco a cada requisição
    authContext = await getUserAuthContext(parsed.userId);
  } catch (error) {
    // Falha de infraestrutura não deve ser mascarada como token inválido.
    return next(error);
  }

  // Usuário removido ou sessão revogada por troca de senha (A8).
  if (authContext === null || authContext.token_version !== parsed.tv) {
    return rejectInvalidToken(res);
  }

  req.userId = parsed.userId;
  req.tokenVersion = authContext.token_version;
  req.userRole = authContext.role;
  return next();
}

