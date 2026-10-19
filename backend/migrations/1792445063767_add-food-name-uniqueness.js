/**
 * Idempotência do seed de alimentos e unicidade de catálogo.
 *
 * Migração nova (D-13: migrações aplicadas são imutáveis). Ela:
 *   1. Desativa linhas duplicadas ativas que compartilham o mesmo nome
 *      normalizado (`f_unaccent(lower(name))`), preservando a linha mais
 *      antiga e priorizando a referenciada por `meal_items`.
 *   2. Cria índice único parcial sobre o nome normalizado, restrito a
 *      `active = true`, impedindo novas duplicatas no catálogo.
 *
 * Desativar (em vez de excluir) preserva as FKs históricas de `meal_items`
 * (`ON DELETE RESTRICT`).
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Garante a função imutável de normalização (definida em 1791390511650).
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
  pgm.sql(`
    CREATE OR REPLACE FUNCTION f_unaccent(text)
    RETURNS text AS
    $func$
    SELECT public.unaccent('public.unaccent', $1)
    $func$  LANGUAGE sql IMMUTABLE;
  `);

  // 1. Deduplicação: desativa duplicatas ativas por nome normalizado.
  pgm.sql(`
    WITH ref_counts AS (
      SELECT food_id, count(*) AS refs
      FROM meal_items
      GROUP BY food_id
    ),
    ranked AS (
      SELECT
        f.id,
        row_number() OVER (
          PARTITION BY f_unaccent(lower(f.name))
          ORDER BY COALESCE(rc.refs, 0) DESC, f.created_at ASC NULLS FIRST, f.id ASC
        ) AS rn
      FROM foods f
      LEFT JOIN ref_counts rc ON rc.food_id = f.id
      WHERE f.active = true
    )
    UPDATE foods
    SET active = false,
        updated_at = NOW()
    WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
  `);

  // 2. Índice único parcial: no máximo um alimento ativo por nome normalizado.
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_active_unique_name
      ON foods (f_unaccent(lower(name)))
      WHERE active = true;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_foods_active_unique_name;`);
  // As linhas desativadas durante a deduplicação não são reativadas
  // automaticamente (reativação seria uma decisão ambígua sobre dados).
};
