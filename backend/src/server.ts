// Dimensiona o threadpool do libuv antes de operações assíncronas (hash bcrypt).
import './config/threadpool.js';
import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './database/pool.js';
import { structuredLog } from './config/logger.js';

const PORT = env.PORT;

export const server = app.listen(PORT, () => {
  structuredLog('info', 'server_started', {
    port: PORT,
    baseUrl: `http://localhost:${PORT}/api`,
    uvThreadpoolSize: Number(process.env.UV_THREADPOOL_SIZE),
  });
});

export const gracefulShutdown = async (signal: string) => {
  structuredLog('info', 'shutdown_initiated', { signal });
  server.close(async () => {
    try {
      await pool.end();
      structuredLog('info', 'pool_closed');
    } catch (err) {
      structuredLog('error', 'pool_close_failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
