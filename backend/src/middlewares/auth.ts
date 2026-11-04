import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { readRequestToken } from '../utils/sessionCookie.js';
import { getUserAuthContext, type UserAuthContext } from '../models/auth.model.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/** Rejeita com 403 quando o Origin não está em CORS_ORIGIN (anti-abuso de rotas públicas que criam recursos). */
export function requireAllowedOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins.includes(origin)) {
    return res
      .status(403)
      .json({ success: false, message: 'Origem não permitida.', code: 'FORBIDDEN' });
  }
  next();
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  tokenVersion?: number;
  userRole?: 'user' | 'admin';
  mfaEnabled?: boolean;
  /** false quando a sessão foi aberta sem "lembrar de mim" (V-3). */
  sessionPersistent?: boolean;
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
export function requireAdmin(
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const userRole = (req as AuthenticatedRequest).userRole;
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Recurso restrito a administradores.',
      code: 'FORBIDDEN',
    });
  }
  // #7: admin precisa de MFA ativo; /users/me/mfa/* não passa por aqui, então ele consegue ativar.
  if (!(req as AuthenticatedRequest).mfaEnabled) {
    return res.status(403).json({
      success: false,
      message: 'Ative a verificação em duas etapas para acessar a área administrativa.',
      code: 'MFA_SETUP_REQUIRED',
    });
  }
  return next();
}

const tokenPayloadSchema = z.object({
  userId: z.string().min(1, 'Token inválido: userId ausente.'),
  // A8: claim obrigatório e inteiro não negativo.
  tv: z.number().int().nonnegative('Token inválido: tv ausente.'),
  p: z.boolean().optional(),
  jti: z.string().uuid(),
});

function rejectInvalidToken(res: Response) {
  return res.status(401).json({
    success: false,
    message: 'Token de autenticação inválido ou expirado.',
  });
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { token, fromCookie } = readRequestToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acesso negado. Token de autenticação não fornecido.',
    });
  }

  // CSRF: cookie vai sozinho no navegador, então mutações exigem Origin permitida (além de SameSite=Strict).
  if (fromCookie && !SAFE_METHODS.has(req.method)) {
    const origin = req.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) {
      return res
        .status(403)
        .json({ success: false, message: 'Origem não permitida.', code: 'FORBIDDEN' });
    }
  }

  let parsed: z.infer<typeof tokenPayloadSchema>;
  try {
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
    authContext = await getUserAuthContext(parsed.userId, parsed.jti);
  } catch (error) {
    // Falha de infraestrutura não deve ser mascarada como token inválido.
    return next(error);
  }

  // Usuário removido, sessões revogadas por troca de senha (A8) ou esta sessão encerrada no logout.
  if (authContext === null || authContext.token_version !== parsed.tv || authContext.revoked) {
    return rejectInvalidToken(res);
  }

  req.userId = parsed.userId;
  req.tokenVersion = authContext.token_version;
  req.userRole = authContext.role;
  req.mfaEnabled = authContext.mfa_enabled;
  req.sessionPersistent = parsed.p !== false;
  return next();
}
