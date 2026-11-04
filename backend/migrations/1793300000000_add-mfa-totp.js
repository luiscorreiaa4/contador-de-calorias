/**
 * MFA TOTP (#7): segredo cifrado, data de ativação e hashes dos códigos de recuperação.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret_enc TEXT NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled_at TIMESTAMPTZ NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_recovery_hashes TEXT[] NOT NULL DEFAULT '{}';
  `);
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS mfa_recovery_hashes;
    ALTER TABLE users DROP COLUMN IF EXISTS mfa_enabled_at;
    ALTER TABLE users DROP COLUMN IF EXISTS mfa_secret_enc;
  `);
};
