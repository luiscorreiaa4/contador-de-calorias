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
  pgm.sql(`
    INSERT INTO foods (name, calories, proteins, carbs, fats, base_unit, serving_weight, unit_name, unit_weight) VALUES
    ('Frango Grelhado', 165, 31, 0, 3.6, 'g', 100, NULL, NULL),
    ('Arroz Branco Cozido', 130, 2.7, 28, 0.3, 'g', 100, NULL, NULL),
    ('Feijão Carioca Cozido', 76, 4.8, 13.6, 0.5, 'g', 100, NULL, NULL),
    ('Ovo Cozido', 156, 12.6, 1.2, 10.6, 'g', 100, 'unidade', 50),
    ('Maçã', 63.3, 0.3, 16.7, 0.2, 'g', 100, 'unidade', 150),
    ('Banana Prata', 89, 1.1, 23, 0.3, 'g', 100, 'unidade', 100),
    ('Pão Francês', 300, 9.4, 58, 3.2, 'g', 100, 'unidade', 50),
    ('Leite Integral', 60, 3.2, 5, 3, 'ml', 100, NULL, NULL),
    ('Aveia em Flocos', 393.3, 14.3, 66.7, 7.3, 'g', 100, NULL, NULL),
    ('Manteiga', 720, 1, 0, 81, 'g', 100, NULL, NULL)
    ON CONFLICT DO NOTHING;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM foods WHERE name IN (
      'Frango Grelhado', 'Arroz Branco Cozido', 'Feijão Carioca Cozido', 'Ovo Cozido',
      'Maçã', 'Banana Prata', 'Pão Francês', 'Leite Integral', 'Aveia em Flocos', 'Manteiga'
    );
  `);
};
