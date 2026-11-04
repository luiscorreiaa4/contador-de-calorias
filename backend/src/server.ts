// Dimensiona o threadpool do libuv antes de operações assíncronas (hash bcrypt).
import { registerProcessHandlers } from './config/processHandlers.js';
import { UV_THREADPOOL_SIZE } from './config/threadpool.js';
import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './database/pool.js';
import { structuredLog } from './config/logger.js';
import * as GuestService from './services/guest.service.js';
import { deleteExpiredRateLimits } from './middlewares/pgRateLimitStore.js';

const PORT = env.PORT;

export const server = app.listen(PORT, () => {
  structuredLog('info', 'server_started', {
    port: PORT,
    baseUrl: `http://localhost:${PORT}/api`,
    uvThreadpoolSize: UV_THREADPOOL_SIZE,
  });
});

// Sem isto, visitantes vencidos só seriam apagados no próximo clique em "demo" e rate_limits cresceria sem fim.
setInterval(
  () => {
    GuestService.cleanupExpiredGuests().catch((err) =>
      structuredLog('error', 'guest_cleanup_failed', {
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    deleteExpiredRateLimits().catch((err) =>
      structuredLog('error', 'rate_limit_cleanup_failed', {
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  },
  60 * 60 * 1000,
).unref();

let isShuttingDown = false;

export const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  structuredLog('info', 'shutdown_initiated', { signal });

  const forceTimeout = setTimeout(() => {
    structuredLog('error', 'shutdown_timeout_forced', { signal, timeoutMs: 10000 });
    process.exit(1);
  }, 10000);
  forceTimeout.unref();

  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }

  server.close(async () => {
    try {
      await pool.end();
      structuredLog('info', 'pool_closed');
    } catch (err) {
      structuredLog('error', 'pool_close_failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      clearTimeout(forceTimeout);
      process.exit(0);
    }
  });
};

registerProcessHandlers(gracefulShutdown);
