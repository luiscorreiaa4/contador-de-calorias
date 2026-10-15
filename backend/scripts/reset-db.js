import { fileURLToPath } from 'node:url';
import { pool } from '../src/database/pool.js';

export function validateEnvironment(env = process.env) {
  if (env.NODE_ENV !== 'test' || !env.DB_NAME?.endsWith('_test')) {
    const errorMsg = '❌ Proibido rodar reset-db fora do ambiente isolado de testes (_test com NODE_ENV=test)!';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export async function resetDb() {
  validateEnvironment();
  try {
    console.log('⚠️ Resetando o schema public do banco de dados...');
    await pool.query('DROP SCHEMA public CASCADE;');
    await pool.query('CREATE SCHEMA public;');
    await pool.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('✅ Schema public recriado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao resetar o banco:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const isDirectCall = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectCall) {
  resetDb();
}
