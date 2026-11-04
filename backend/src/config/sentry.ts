import * as Sentry from '@sentry/node';
import { env } from './env.js';

// #25 — rastreio de erros 5xx. Desligado sem SENTRY_DSN (dev e testes).
const enabled = Boolean(env.SENTRY_DSN) && env.NODE_ENV !== 'test';

if (enabled) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Dados de saúde e o cookie de sessão nunca saem da API: só stack e rota.
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.query_string;
      }
      delete event.user;
      return event;
    },
  });
}

export function reportServerError(err: unknown): void {
  if (enabled) Sentry.captureException(err);
}
