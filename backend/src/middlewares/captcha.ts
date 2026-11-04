import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { structuredLog } from '../config/logger.js';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Cloudflare Turnstile (#6). Sem `secret` o captcha fica desligado (dev/teste).
 * Com `secret`, falha fechada: token ausente, inválido ou erro de rede respondem 400.
 */
export function createCaptchaMiddleware(secret: string | undefined = env.CAPTCHA_SECRET_KEY) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!secret) return next();

    const token = (req.body as { captcha_token?: unknown } | undefined)?.captcha_token;
    let ok = false;
    if (typeof token === 'string' && token) {
      try {
        const response = await fetch(VERIFY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret, response: token, remoteip: req.ip }),
          signal: AbortSignal.timeout(5000),
        });
        ok = ((await response.json()) as { success?: boolean }).success === true;
      } catch (error) {
        structuredLog('error', 'captcha_verify_failed', {
          error: error instanceof Error ? error.message : 'unknown_error',
        });
      }
    }

    if (!ok) {
      res.status(400).json({
        success: false,
        message: 'Falha na verificação de segurança. Recarregue a página e tente novamente.',
        code: 'CAPTCHA_FAILED',
      });
      return;
    }
    next();
  };
}
