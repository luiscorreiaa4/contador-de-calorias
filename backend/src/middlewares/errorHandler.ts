import { Request, Response, NextFunction } from 'express';
import { structuredLog } from '../config/logger.js';
import type { AuthenticatedRequest } from './auth.js';

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
  type?: string;
}

export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
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

  const statusCode = err.statusCode ?? err.status ?? 500;
  const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message || 'Erro interno no servidor.');
  const requestId = (req as AuthenticatedRequest).requestId ?? req.headers['x-request-id'];

  if (statusCode >= 500) {
    structuredLog('error', 'unhandled_server_error', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      error: err.message,
      stack: err.stack,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
}
