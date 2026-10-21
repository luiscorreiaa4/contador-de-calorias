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
  // BL-19: Alimentos favoritos por usuário
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS user_favorite_foods (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, food_id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_favorite_foods_user ON user_favorite_foods(user_id);
  `);

  // BL-20: Refeições salvas e combos reutilizáveis
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS saved_meals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_saved_meals_user ON saved_meals(user_id);

    CREATE TABLE IF NOT EXISTS saved_meal_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      saved_meal_id UUID NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
      food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
      quantity NUMERIC(10,2) NOT NULL,
      unit VARCHAR(20) NOT NULL DEFAULT 'g',
      display_amount NUMERIC(10,2) NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_saved_meal_items_saved_meal ON saved_meal_items(saved_meal_id);
  `);

  // BL-22: Cadastro de alimentos personalizados pelo próprio usuário
  pgm.sql(`
    ALTER TABLE foods ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_foods_user_id ON foods(user_id) WHERE user_id IS NOT NULL;
  `);

  // BL-27: Notificações push na web
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      keys JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, endpoint)
    );
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS push_subscriptions;
    DROP INDEX IF EXISTS idx_foods_user_id;
    ALTER TABLE foods DROP COLUMN IF EXISTS user_id;
    DROP TABLE IF EXISTS saved_meal_items;
    DROP TABLE IF EXISTS saved_meals;
    DROP TABLE IF EXISTS user_favorite_foods;
  `);
};
