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
        sex VARCHAR(20),
        birth_date DATE,
        weight NUMERIC(5,2),
        height NUMERIC(5,2),
        body_fat NUMERIC(5,2),
        activity_level VARCHAR(50),
        daily_calories_goal NUMERIC(6,2) DEFAULT 2000,
        daily_proteins_goal NUMERIC(6,2) DEFAULT 100,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela "users" criada com sucesso!');

    // Criação da Tabela de Alimentos (foods)
    await clientApp.query(`
      CREATE TABLE IF NOT EXISTS foods (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        calories NUMERIC(8,2) NOT NULL,
        proteins NUMERIC(8,2) NOT NULL,
        carbs NUMERIC(8,2) NOT NULL,
        fats NUMERIC(8,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela "foods" criada com sucesso!');

    // Criação da Tabela de Refeições (meals)
    await clientApp.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        meal_time TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela "meals" criada com sucesso!');

    // Criação da Tabela de Itens da Refeição (meal_items)
    await clientApp.query(`
      CREATE TABLE IF NOT EXISTS meal_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
        quantity NUMERIC(8,2) NOT NULL,
        calories NUMERIC(8,2) NOT NULL,
        proteins NUMERIC(8,2) NOT NULL,
        carbs NUMERIC(8,2) NOT NULL,
        fats NUMERIC(8,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela "meal_items" criada com sucesso!');

    // Criação de Usuários Comuns de Teste
    const saltRounds = 10;

    // Usuário 1: Perder Peso
    const hashUser1 = await bcrypt.hash('1234', saltRounds);
    await clientApp.query(
      `INSERT INTO users (name, email, password_hash, sex, birth_date, daily_calories_goal, daily_proteins_goal)
       VALUES ($1, $2, $3, $4, $5, 2000, 100)`,
      ['teste', 'teste@teste.com', hashUser1, 'masculino', '1995-01-01']
    );

    // Criação de Alimentos Iniciais (Seed)
    console.log('🔄 Inserindo alimentos iniciais...');
    await clientApp.query(`
      INSERT INTO foods (name, calories, proteins, carbs, fats) VALUES
      ('Frango Grelhado (100g)', 165, 31, 0, 3.6),
      ('Arroz Branco Cozido (100g)', 130, 2.7, 28, 0.3),
      ('Feijão Carioca Cozido (100g)', 76, 4.8, 13.6, 0.5),
      ('Ovo Cozido (1 unidade - 50g)', 78, 6.3, 0.6, 5.3),
      ('Maçã (1 unidade média - 150g)', 95, 0.5, 25, 0.3),
      ('Banana Prata (1 unidade - 100g)', 89, 1.1, 23, 0.3),
      ('Pão Francês (1 unidade - 50g)', 150, 4.7, 29, 1.6),
      ('Leite Integral (200ml)', 120, 6.4, 10, 6),
      ('Aveia em Flocos (30g)', 118, 4.3, 20, 2.2),
      ('Manteiga (10g)', 72, 0.1, 0, 8.1);
    `);
    console.log('✅ Alimentos iniciais criados com sucesso!');

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
