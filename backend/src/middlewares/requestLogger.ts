import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { structuredLog } from '../config/logger.js';

/**
 * Correlation ID e logging HTTP estruturado.
 * Reaproveita o `x-request-id` recebido (ou gera um) e devolve o mesmo valor
 * no header `X-Request-Id`, garantindo rastreabilidade fim-a-fim.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  const requestId =
    typeof incoming === 'string' && incoming.trim() !== '' ? incoming.trim() : randomUUID();

  res.setHeader('X-Request-Id', requestId);

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Math.round((Number(process.hrtime.bigint() - startedAt) / 1e6) * 100) / 100;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    structuredLog(level, 'http_request', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
}
