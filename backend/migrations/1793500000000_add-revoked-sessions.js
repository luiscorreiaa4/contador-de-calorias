/**
 * Logout por sessão: guarda o `jti` do JWT encerrado até ele expirar. `token_version`
 * continua revogando todas as sessões (troca de senha, e-mail, MFA).
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS revoked_sessions (
      jti UUID PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS revoked_sessions_expires_at_idx ON revoked_sessions (expires_at);
  `);
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS revoked_sessions;`);
};
