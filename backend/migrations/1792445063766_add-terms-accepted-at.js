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
  // Consentimento explícito: registra o instante em que o
  // titular aceitou os Termos de Uso e a Política de Privacidade no cadastro.
  pgm.sql(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE NULL;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS terms_accepted_at;
  `);
};
