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
  // Índice B-Tree parcial para ordenação e paginação padrão no catálogo de alimentos (PERF-002)
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_foods_active_name ON foods (name ASC) WHERE active = true;
  `);

  // Índice de chave estrangeira em meal_items(food_id) (PERF-005, ARCH-016)
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_meal_items_food_id ON meal_items (food_id);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_foods_active_name;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_meal_items_food_id;`);
};
