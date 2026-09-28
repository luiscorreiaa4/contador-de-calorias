import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'contador_calorias',
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL para migração.');

    // 1. Adiciona novas colunas na tabela foods se não existirem
    console.log('🔄 Atualizando colunas na tabela foods...');
    await client.query(`
      ALTER TABLE foods
      ADD COLUMN IF NOT EXISTS base_unit VARCHAR(10) NOT NULL DEFAULT 'g',
      ADD COLUMN IF NOT EXISTS serving_weight NUMERIC(8,2) NOT NULL DEFAULT 100,
      ADD COLUMN IF NOT EXISTS unit_name VARCHAR(50) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS unit_weight NUMERIC(8,2) DEFAULT NULL;
    `);

    // 2. Adiciona novas colunas na tabela meal_items se não existirem
    console.log('🔄 Atualizando colunas na tabela meal_items...');
    await client.query(`
      ALTER TABLE meal_items
      ADD COLUMN IF NOT EXISTS unit VARCHAR(10) NOT NULL DEFAULT 'g',
      ADD COLUMN IF NOT EXISTS display_amount NUMERIC(8,2) DEFAULT NULL;
    `);

    // 3. Atualiza os alimentos padrão existentes para a base de 100g / 100ml
    console.log('🔄 Padronizando alimentos existentes para base 100g/100ml...');
    
    // Frango Grelhado
    await client.query(`
      UPDATE foods 
      SET name = 'Frango Grelhado', base_unit = 'g', serving_weight = 100, calories = 165, proteins = 31, carbs = 0, fats = 3.6, unit_name = NULL, unit_weight = NULL
      WHERE name LIKE '%Frango Grelhado%';
    `);

    // Arroz Branco Cozido
    await client.query(`
      UPDATE foods 
      SET name = 'Arroz Branco Cozido', base_unit = 'g', serving_weight = 100, calories = 130, proteins = 2.7, carbs = 28, fats = 0.3, unit_name = NULL, unit_weight = NULL
      WHERE name LIKE '%Arroz Branco%';
    `);

    // Feijão Carioca Cozido
    await client.query(`
      UPDATE foods 
      SET name = 'Feijão Carioca Cozido', base_unit = 'g', serving_weight = 100, calories = 76, proteins = 4.8, carbs = 13.6, fats = 0.5, unit_name = NULL, unit_weight = NULL
      WHERE name LIKE '%Feijão Carioca%';
    `);

    // Ovo Cozido (1 unidade = 50g -> 100g = 156 kcal)
    await client.query(`
      UPDATE foods 
      SET name = 'Ovo Cozido', base_unit = 'g', serving_weight = 100, calories = 156, proteins = 12.6, carbs = 1.2, fats = 10.6, unit_name = 'unidade', unit_weight = 50
      WHERE name LIKE '%Ovo Cozido%';
    `);

    // Maçã (1 unidade média = 150g -> 100g = 63.3 kcal)
    await client.query(`
      UPDATE foods 
      SET name = 'Maçã', base_unit = 'g', serving_weight = 100, calories = 63.3, proteins = 0.3, carbs = 16.7, fats = 0.2, unit_name = 'unidade', unit_weight = 150
      WHERE name LIKE '%Maçã%';
    `);

    // Banana Prata (1 unidade = 100g -> 100g = 89 kcal)
    await client.query(`
      UPDATE foods 
      SET name = 'Banana Prata', base_unit = 'g', serving_weight = 100, calories = 89, proteins = 1.1, carbs = 23, fats = 0.3, unit_name = 'unidade', unit_weight = 100
      WHERE name LIKE '%Banana Prata%';
    `);

    // Pão Francês (1 unidade = 50g -> 100g = 300 kcal)
    await client.query(`
      UPDATE foods 
      SET name = 'Pão Francês', base_unit = 'g', serving_weight = 100, calories = 300, proteins = 9.4, carbs = 58, fats = 3.2, unit_name = 'unidade', unit_weight = 50
      WHERE name LIKE '%Pão Francês%';
    `);

    // Leite Integral (Líquido: base 100ml -> 60 kcal, 1 copo = 200ml)
    await client.query(`
      UPDATE foods 
      SET name = 'Leite Integral', base_unit = 'ml', serving_weight = 100, calories = 60, proteins = 3.2, carbs = 5, fats = 3, unit_name = 'copo', unit_weight = 200
      WHERE name LIKE '%Leite Integral%';
    `);

    // Aveia em Flocos (30g = 118 kcal -> 100g = 393.3 kcal)
    await client.query(`
      UPDATE foods 
      SET name = 'Aveia em Flocos', base_unit = 'g', serving_weight = 100, calories = 393.3, proteins = 14.3, carbs = 66.7, fats = 7.3, unit_name = 'colher de sopa', unit_weight = 15
      WHERE name LIKE '%Aveia em Flocos%';
    `);

    // Manteiga (10g = 72 kcal -> 100g = 720 kcal)
    await client.query(`
      UPDATE foods 
      SET name = 'Manteiga', base_unit = 'g', serving_weight = 100, calories = 720, proteins = 1, carbs = 0, fats = 81, unit_name = 'colher de chá', unit_weight = 5
      WHERE name LIKE '%Manteiga%';
    `);

    // Atualiza itens de refeição já existentes caso existam
    await client.query(`
      UPDATE meal_items SET unit = 'g' WHERE unit IS NULL;
    `);

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await client.end();
  }
}

migrate();
