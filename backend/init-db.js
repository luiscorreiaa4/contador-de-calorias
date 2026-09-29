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
        base_unit VARCHAR(10) NOT NULL DEFAULT 'g',
        serving_weight NUMERIC(8,2) NOT NULL DEFAULT 100,
        unit_name VARCHAR(50) DEFAULT NULL,
        unit_weight NUMERIC(8,2) DEFAULT NULL,
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
    
    // Otimização: Índice composto para acelerar a busca de refeições por usuário e data
    await clientApp.query(`
      CREATE INDEX IF NOT EXISTS idx_meals_user_id_meal_time ON meals(user_id, meal_time DESC);
    `);
    console.log('✅ Tabela "meals" e índices criados com sucesso!');

    // Criação da Tabela de Itens da Refeição (meal_items)
    await clientApp.query(`
      CREATE TABLE IF NOT EXISTS meal_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
        food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
        quantity NUMERIC(8,2) NOT NULL,
        unit VARCHAR(10) NOT NULL DEFAULT 'g',
        display_amount NUMERIC(8,2) DEFAULT NULL,
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

    // Criação de Alimentos Iniciais (Seed padronizado por 100g / 100ml)
    console.log('🔄 Inserindo alimentos iniciais...');
    await clientApp.query(`
      INSERT INTO foods (name, calories, proteins, carbs, fats, base_unit, serving_weight, unit_name, unit_weight) VALUES
      ('Frango Grelhado', 165, 31, 0, 3.6, 'g', 100, NULL, NULL),
      ('Arroz Branco Cozido', 130, 2.7, 28, 0.3, 'g', 100, NULL, NULL),
      ('Feijão Carioca Cozido', 76, 4.8, 13.6, 0.5, 'g', 100, NULL, NULL),
      ('Ovo Cozido', 156, 12.6, 1.2, 10.6, 'g', 100, 'unidade', 50),
      ('Maçã', 63.3, 0.3, 16.7, 0.2, 'g', 100, 'unidade', 150),
      ('Banana Prata', 89, 1.1, 23, 0.3, 'g', 100, 'unidade', 100),
      ('Pão Francês', 300, 9.4, 58, 3.2, 'g', 100, 'unidade', 50),
      ('Leite Integral', 60, 3.2, 5, 3, 'ml', 100, NULL, NULL),
      ('Aveia em Flocos', 393.3, 14.3, 66.7, 7.3, 'g', 100, NULL, NULL),
      ('Manteiga', 720, 1, 0, 81, 'g', 100, NULL, NULL);
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
