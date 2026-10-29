/**
 * Adiciona coluna gerada nome_normalizado e índices para paginação,
 * busca rápida unaccent/trgm e ordenação no catálogo de alimentos.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS unaccent;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    CREATE OR REPLACE FUNCTION f_unaccent(text)
    RETURNS text AS
    $func$
    SELECT public.unaccent('public.unaccent', $1)
    $func$ LANGUAGE sql IMMUTABLE;

    ALTER TABLE foods ADD COLUMN IF NOT EXISTS nome_normalizado text
      GENERATED ALWAYS AS (f_unaccent(lower(name))) STORED;

    CREATE INDEX IF NOT EXISTS idx_foods_nome_norm_trgm
      ON foods USING GIN (nome_normalizado gin_trgm_ops);

    CREATE INDEX IF NOT EXISTS idx_foods_nome_norm_id
      ON foods (nome_normalizado, id);

    CREATE INDEX IF NOT EXISTS idx_foods_active
      ON foods (active);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_foods_active;
    DROP INDEX IF EXISTS idx_foods_nome_norm_id;
    DROP INDEX IF EXISTS idx_foods_nome_norm_trgm;
    ALTER TABLE foods DROP COLUMN IF EXISTS nome_normalizado;
  `);
};

