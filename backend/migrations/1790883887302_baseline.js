/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

    CREATE TABLE IF NOT EXISTS meals (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      meal_time TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_meals_user_id_meal_time ON meals(user_id, meal_time DESC);

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
    
    CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_meal_items_meal_id;
    DROP TABLE IF EXISTS meal_items;
    
    DROP INDEX IF EXISTS idx_meals_user_id_meal_time;
    DROP TABLE IF EXISTS meals;
    
    DROP TABLE IF EXISTS foods;
    DROP TABLE IF EXISTS users;
  `);
};
