exports.up = (pgm) => {
  pgm.createTable('body_measurements', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    weight: { type: 'numeric(5,2)', notNull: true },
    body_fat: { type: 'numeric(5,2)' },
    measured_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    created_at: { type: 'timestamp with time zone', default: pgm.func('CURRENT_TIMESTAMP') },
  });

  pgm.createIndex('body_measurements', ['user_id', 'measured_at']);

  pgm.createTable('user_goals', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    effective_from: { type: 'date', notNull: true },
    calories: { type: 'numeric(6,2)', notNull: true },
    proteins: { type: 'numeric(6,2)', notNull: true },
    carbs: { type: 'numeric(6,2)', notNull: true },
    fats: { type: 'numeric(6,2)', notNull: true },
    mode: { type: 'varchar(20)', notNull: true, default: "'auto'" },
    created_at: { type: 'timestamp with time zone', default: pgm.func('CURRENT_TIMESTAMP') },
  });

  // Garante que só pode haver uma meta ativa por dia para o usuário
  pgm.addConstraint('user_goals', 'unique_user_goal_per_day', {
    unique: ['user_id', 'effective_from']
  });
};

exports.down = (pgm) => {
  pgm.dropTable('user_goals');
  pgm.dropTable('body_measurements');
};
