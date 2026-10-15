import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './database/pool.js';

const PORT = env.PORT;

export const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando com sucesso na porta ${PORT}`);
  console.log(`📡 URL base: http://localhost:${PORT}/api`);
});

export const gracefulShutdown = async (signal: string) => {
  console.log(`Recebido sinal ${signal}. Encerrando graciosamente...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('Pool de conexões do PostgreSQL encerrado com sucesso.');
    } catch (err) {
      console.error('Erro ao encerrar pool de conexões:', err);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

