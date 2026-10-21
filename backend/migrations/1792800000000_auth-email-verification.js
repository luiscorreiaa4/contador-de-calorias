/**
 * BL-12 / BL-05 / D-21 — colunas de verificação e tabelas de códigos/tokens.
 * Migração nova (D-13). O `down` remove apenas o que esta migração criou.
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
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consumed_at TIMESTAMPTZ NULL
    );

    CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user_created
      ON email_verification_codes (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_created
      ON password_reset_tokens (user_id, created_at DESC);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_password_reset_tokens_user_created;
    DROP TABLE IF EXISTS password_reset_tokens;
    DROP INDEX IF EXISTS idx_email_verification_codes_user_created;
    DROP TABLE IF EXISTS email_verification_codes;
    ALTER TABLE users DROP COLUMN IF EXISTS token_version;
    ALTER TABLE users DROP COLUMN IF EXISTS email_verified_at;
  `);
};
