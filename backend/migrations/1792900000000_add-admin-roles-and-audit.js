/**
 * D-22 — Papéis de usuário (RBAC), auditoria administrativa e rastreamento de curadoria.
 * Migração nova (D-13). Sem seed e sem índice em role.
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
    -- B1: Coluna de papel com trava estrita de valores válidos
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
      ) THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
      END IF;
    END $$;

    -- B9 / B10: Rastreamento de fonte e marcador de curadoria protegida
    ALTER TABLE foods ADD COLUMN IF NOT EXISTS source_ref VARCHAR(255) NULL;
    ALTER TABLE foods ADD COLUMN IF NOT EXISTS admin_edited_at TIMESTAMPTZ NULL;

    -- B5: Tabela de auditoria atômica para operações administrativas
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      actor_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
      actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('user', 'cli')),
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(100) NOT NULL,
      before JSONB NULL,
      after JSONB NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
      ON admin_audit_log (created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity
      ON admin_audit_log (entity_type, entity_id);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_admin_audit_log_entity;
    DROP INDEX IF EXISTS idx_admin_audit_log_created_at;
    DROP TABLE IF EXISTS admin_audit_log;

    ALTER TABLE foods DROP COLUMN IF EXISTS admin_edited_at;
    ALTER TABLE foods DROP COLUMN IF EXISTS source_ref;

    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users DROP COLUMN IF EXISTS role;
  `);
};
