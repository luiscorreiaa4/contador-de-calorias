import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { normalizeEmail } from '../utils/authTokens.js';

interface KeyOptions {
  /** Quando false, usa apenas o IP (teto global). Padrão: inclui e-mail quando presente. */
  includeEmail?: boolean;
}

/**
 * Única função de chave dos limitadores de autenticação. O Turnstile (BL-06/futuro)
 * deve ser integrado aqui para valer em todas as rotas de uma vez (A9).
 */
export function authRateLimitKey(req: Request, options: KeyOptions = {}): string {
  const ip = ipKeyGenerator(req.ip ?? '');
  if (options.includeEmail === false) return ip;

  const rawEmail = (req.body as { email?: unknown } | undefined)?.email;
  const email = typeof rawEmail === 'string' ? normalizeEmail(rawEmail) : '';
  return email ? `${ip}:${email}` : ip;
}

interface AuthLimiterOptions {
  windowMs: number;
  max: number;
  message: string;
  includeEmail?: boolean;
}

export function createAuthRateLimiter(options: AuthLimiterOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => authRateLimitKey(req, { includeEmail: options.includeEmail }),
    message: { success: false, message: options.message },
  });
}
