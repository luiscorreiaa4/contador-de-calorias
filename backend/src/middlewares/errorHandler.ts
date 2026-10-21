import { Request, Response, NextFunction } from 'express';
import { structuredLog } from '../config/logger.js';

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
}

export function errorHandler(
  err: CustomError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  const statusCode = err.statusCode ?? err.status ?? 500;
  const message = statusCode === 500 ? 'Erro interno no servidor.' : err.message;

  if (statusCode === 500) {
    structuredLog('error', 'unhandled_server_error', { error: err.message });
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
}
