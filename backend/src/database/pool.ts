import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const dbName = process.env.DB_NAME || 'contador_calorias';

if (process.env.NODE_ENV === 'test' && !dbName.endsWith('_test')) {
  console.error('❌ ERRO CRÍTICO: Testes estão tentando rodar num banco que não termina com "_test"!');
  console.error(`O banco atual é: ${dbName}`);
  console.error('Abortando processo para evitar deleção de dados de desenvolvimento/produção.');
  process.exit(1);
}

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: dbName,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Limite de 20 conexões simultâneas no pool
  idleTimeoutMillis: 30000, // Fecha conexões ociosas após 30 segundos
  connectionTimeoutMillis: 2000, // Retorna erro se demorar mais de 2s para conectar
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err);
});
