import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pool } from '../../src/database/pool.js';

describe('Índices de Performance no Banco (PC-10 / PERF-002, PERF-005, ARCH-016)', () => {
  closeTestPool();

  it('deve existir o índice parcial idx_foods_active_name em foods', async () => {
    const res = await pool.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'foods' AND indexname = 'idx_foods_active_name'`
    );
    assert.strictEqual(res.rows.length, 1, 'Índice idx_foods_active_name deve existir');
  });

  it('deve existir o índice idx_meal_items_food_id em meal_items', async () => {
    const res = await pool.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'meal_items' AND indexname = 'idx_meal_items_food_id'`
    );
    assert.strictEqual(res.rows.length, 1, 'Índice idx_meal_items_food_id deve existir');
  });
});
