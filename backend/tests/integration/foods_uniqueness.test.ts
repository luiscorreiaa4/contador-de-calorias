import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pool } from '../../src/database/pool.js';

describe('Unicidade de nomes em foods (BL-09 / ARCH-015)', () => {
  closeTestPool();

  it('deve existir o índice único parcial idx_foods_active_unique_name', async () => {
    const res = await pool.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'foods' AND indexname = 'idx_foods_active_unique_name'`
    );
    assert.strictEqual(res.rows.length, 1, 'Índice idx_foods_active_unique_name deve existir');
  });

  it('deve rejeitar dois alimentos ativos com o mesmo nome normalizado', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO foods (name, calories, proteins, carbs, fats) VALUES ('BL-09 Amostra Única', 1, 1, 1, 1)`
      );
      await assert.rejects(
        () =>
          client.query(
            `INSERT INTO foods (name, calories, proteins, carbs, fats) VALUES ('bl-09 amostra unica', 2, 2, 2, 2)`
          ),
        /idx_foods_active_unique_name|duplicate key/
      );
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('deve permitir nomes iguais quando apenas um dos alimentos está ativo', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO foods (name, calories, proteins, carbs, fats, active) VALUES ('BL-09 Par Inativo', 1, 1, 1, 1, false)`
      );
      // Apenas um está ativo, então não há violação do índice parcial.
      await client.query(
        `INSERT INTO foods (name, calories, proteins, carbs, fats, active) VALUES ('BL-09 Par Inativo', 1, 1, 1, 1, true)`
      );
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
