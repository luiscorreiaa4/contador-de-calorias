import { Request, Response, NextFunction } from 'express';
import { structuredLog } from '../config/logger.js';
import { reportServerError } from '../config/sentry.js';
import type { AuthenticatedRequest } from './auth.js';

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
  type?: string;
  code?: string;
}

const ALLOWED_BUSINESS_CODES = new Set([
  'EMAIL_NOT_VERIFIED',
  'INVALID_VERIFICATION_CODE',
  'INVALID_RESET_TOKEN',
  'USER_NOT_FOUND',
  'FORBIDDEN',
  'MFA_REQUIRED',
  'MFA_SETUP_REQUIRED',
  'CAPTCHA_FAILED',
  'DEMO_UNAVAILABLE',
]);

interface PgMappedError {
  statusCode: number;
  message: string;
}

const PG_ERROR_MAP: Record<string, PgMappedError> = {
  '22003': { statusCode: 400, message: 'Valor numérico fora dos limites permitidos.' },
  '22P02': { statusCode: 400, message: 'Dado em formato inválido.' },
  '23505': { statusCode: 409, message: 'Registro já existente.' },
  '23503': { statusCode: 400, message: 'Recurso relacionado não encontrado.' },
  '23514': { statusCode: 400, message: 'Os dados fornecidos violam as restrições permitidas.' },
};

export function errorHandler(err: CustomError, req: Request, res: Response, _next: NextFunction) {
  // Trata erros de sintaxe JSON do body-parser (A-017)
  if (
    (err instanceof SyntaxError && err.status === 400 && 'body' in err) ||
    err.type === 'entity.parse.failed'
  ) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido no corpo da requisição.',
    });
  }

  // Mapeamento defensivo de erros PostgreSQL conhecidos (#12)
  if (typeof err.code === 'string' && PG_ERROR_MAP[err.code]) {
    const mapped = PG_ERROR_MAP[err.code];
    return res.status(mapped.statusCode).json({
      success: false,
      message: mapped.message,
    });
  }

  const statusCode = err.statusCode ?? err.status ?? 500;
  const message =
    statusCode >= 500 ? 'Erro interno no servidor.' : err.message || 'Erro na requisição.';
  const requestId = (req as AuthenticatedRequest).requestId ?? req.headers['x-request-id'];

  if (statusCode >= 500) {
    reportServerError(err);
    structuredLog('error', 'unhandled_server_error', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      error: err.message,
      stack: err.stack,
    });
  }

  const responsePayload: { success: false; message: string; code?: string } = {
    success: false,
    message,
  };

  // Só códigos de negócio estáveis chegam ao cliente (#12 / backend-rules.md)
  if (err.code && ALLOWED_BUSINESS_CODES.has(err.code)) {
    responsePayload.code = err.code;
  }

  return res.status(statusCode).json(responsePayload);
}
