/**
 * Visitantes temporários: `is_guest` marca contas criadas pelo botão "Ver demonstração",
 * apagadas depois por limpeza (apenas linhas com is_guest = true).
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false;
    CREATE INDEX IF NOT EXISTS users_guest_created_at_idx ON users (created_at) WHERE is_guest;
  `);
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS users_guest_created_at_idx;
    ALTER TABLE users DROP COLUMN IF EXISTS is_guest;
  `);
};
