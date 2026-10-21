import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

// Converte tipos NUMERIC (OID 1700) do PostgreSQL para float (JavaScript number)
pg.types.setTypeParser(1700, (val: string) => (val === null ? null : parseFloat(val)));

const dbName = env.DB_NAME;

if (process.env.NODE_ENV === 'test' && !dbName.endsWith('_test')) {
  console.error('❌ ERRO CRÍTICO: Testes estão tentando rodar num banco que não termina com "_test"!');
  console.error(`O banco atual é: ${dbName}`);
  console.error('Abortando processo para evitar deleção de dados de desenvolvimento/produção.');
  process.exit(1);
}

export function getSslConfig() {
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }
  return {
    rejectUnauthorized: true,
    ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {}),
  };
}

export const pool = new Pool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: dbName,
  ssl: getSslConfig(),
  max: 20, // Limite de 20 conexões simultâneas no pool
  idleTimeoutMillis: 30000, // Fecha conexões ociosas após 30 segundos
  connectionTimeoutMillis: 2000, // Retorna erro se demorar mais de 2s para conectar
  allowExitOnIdle: env.NODE_ENV === 'test' && process.env.TEST_STRICT !== '1',
  statement_timeout: 10000, // Aborta queries com mais de 10s (PERF-006)
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err);
});
