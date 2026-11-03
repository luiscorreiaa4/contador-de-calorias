import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { normalizeEmail } from '../utils/authTokens.js';
import { PgRateLimitStore } from './pgRateLimitStore.js';

interface KeyOptions {
  /** Quando false, usa apenas o IP (teto global). Padrão: inclui e-mail quando presente. */
  includeEmail?: boolean;
  /** Chave só pelo e-mail (ignora o IP): limita ataque distribuído a uma conta. */
  emailOnly?: boolean;
}

/**
 * Única função de chave dos limitadores de autenticação. O Turnstile (BL-06/futuro)
 * deve ser integrado aqui para valer em todas as rotas de uma vez (A9).
 */
function authRateLimitKey(req: Request, options: KeyOptions = {}): string {
  const ip = ipKeyGenerator(req.ip ?? '');
  if (options.includeEmail === false && !options.emailOnly) return ip;

  const rawEmail = (req.body as { email?: unknown } | undefined)?.email;
  const email = typeof rawEmail === 'string' ? normalizeEmail(rawEmail) : '';
  if (options.emailOnly) return email ? `email:${email}` : ip;
  return email ? `${ip}:${email}` : ip;
}

interface AuthLimiterOptions {
  windowMs: number;
  max: number;
  message: string;
  includeEmail?: boolean;
  emailOnly?: boolean;
  /** Prefixo único da rota no store compartilhado. */
  name: string;
}

export function createAuthRateLimiter(options: AuthLimiterOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: process.env.NODE_ENV === 'test' ? undefined : new PgRateLimitStore(options.name),
    keyGenerator: (req: Request) =>
      authRateLimitKey(req, { includeEmail: options.includeEmail, emailOnly: options.emailOnly }),
    message: { success: false, message: options.message },
  });
}
