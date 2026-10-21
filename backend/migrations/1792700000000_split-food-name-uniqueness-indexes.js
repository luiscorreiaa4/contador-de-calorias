/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // A-003: Substitui o índice único global por dois índices parciais separados:
  // 1. Catálogo geral (alimentos do sistema sem dono, user_id IS NULL): no máximo um alimento ativo por nome.
  // 2. Alimentos personalizados: unicidade por usuário (user_id + nome).
  pgm.sql(`
    DROP INDEX IF EXISTS idx_foods_active_unique_name;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_catalog_unique_name
      ON foods (f_unaccent(lower(name)))
      WHERE active = true AND user_id IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_custom_user_unique_name
      ON foods (user_id, f_unaccent(lower(name)))
      WHERE active = true AND user_id IS NOT NULL;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_foods_catalog_unique_name;
    DROP INDEX IF EXISTS idx_foods_custom_user_unique_name;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_active_unique_name
      ON foods (f_unaccent(lower(name)))
      WHERE active = true;
  `);
};
