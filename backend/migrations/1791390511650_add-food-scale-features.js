/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Extensions
  pgm.createExtension('pg_trgm', { ifNotExists: true });
  pgm.createExtension('unaccent', { ifNotExists: true });

  // Immutable unaccent function wrapper
  pgm.sql(`
    CREATE OR REPLACE FUNCTION f_unaccent(text)
    RETURNS text AS
    $func$
    SELECT public.unaccent('public.unaccent', $1)
    $func$  LANGUAGE sql IMMUTABLE;
  `);

  // Add columns
  pgm.addColumns('foods', {
    source: { type: 'varchar(50)', notNull: false },
    external_id: { type: 'varchar(100)', notNull: false },
    active: { type: 'boolean', notNull: true, default: true }
  });

  // Constraints
  pgm.addConstraint('foods', 'foods_source_external_id_key', {
    unique: ['source', 'external_id']
  });

  // GIN Index for similarity search
  pgm.sql(`
    CREATE INDEX idx_foods_name_trgm ON foods USING GIN (f_unaccent(name) gin_trgm_ops);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_foods_name_trgm;`);
  
  pgm.dropConstraint('foods', 'foods_source_external_id_key');
  
  pgm.dropColumns('foods', ['source', 'external_id', 'active']);
  
  pgm.sql(`DROP FUNCTION IF EXISTS f_unaccent(text);`);
  
  pgm.dropExtension('unaccent', { ifExists: true });
  pgm.dropExtension('pg_trgm', { ifExists: true });
};
