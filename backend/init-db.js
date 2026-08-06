import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente de backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbName = process.env.DB_NAME || 'contador_calorias';

const setupDatabase = async () => {
  console.log('🔄 Iniciando setup do Banco de Dados PostgreSQL...');

  // 1. Conexão como admin ao banco nativo 'postgres' para (re)criar a base de dados
  const clientAdmin = new Client({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    port: dbPort,
    database: 'postgres',
  });

  try {
    await clientAdmin.connect();
    console.log('✅ Conectado ao PostgreSQL com sucesso.');

    // Derruba conexões ativas na base de dados do projeto
    await clientAdmin.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbName}'
      AND pid <> pg_backend_pid();
    `);

    // Recria a base de dados
    await clientAdmin.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await clientAdmin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Banco de dados "${dbName}" criado com sucesso!`);
  } catch (err) {
    console.error('❌ Erro durante o reset da base de dados:', err.message);
    process.exit(1);
  } finally {
    await clientAdmin.end();
  }

  // 2. Conexão com o novo banco de dados criado para aplicar tabelas e cadastrar usuários comuns
  const clientApp = new Client({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    port: dbPort,
    database: dbName,
  });

  try {
    await clientApp.connect();

    // Habilita extensão UUID no Postgres
    await clientApp.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Criação da Tabela de Usuários Comuns (sem painel administrativo)
    await clientApp.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        goal VARCHAR(50) NOT NULL DEFAULT 'perder_peso',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela "users" criada com sucesso!');

    // Criação de Usuários Comuns de Teste
    const saltRounds = 10;

    // Usuário 1: Perder Peso
    const hashUser1 = await bcrypt.hash('1234', saltRounds);
    await clientApp.query(
      `INSERT INTO users (name, email, password_hash, goal)
       VALUES ($1, $2, $3, $4)`,
      ['teste', 'teste@teste.com', hashUser1, 'perder_peso']
    );

    console.log('\n🎉 Setup do Banco de Dados Concluído com Sucesso!');
    console.log('--------------------------------------------------');
    console.log('🔑 Usuários Padrão para Teste:');
    console.log('   1. Usuário Teste : teste@teste.com        | Senha: 1234');
    console.log('--------------------------------------------------\n');
  } catch (err) {
    console.error('❌ Erro na criação das tabelas/usuários:', err.message);
  } finally {
    await clientApp.end();
  }
};

setupDatabase();
