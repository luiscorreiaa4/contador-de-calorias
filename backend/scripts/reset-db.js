import { pool } from '../src/database/pool.js';

async function resetDb() {
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

resetDb();
