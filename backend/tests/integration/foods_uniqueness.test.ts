import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pool } from '../../src/database/pool.js';
import { cleanupTestData } from '../helpers/db.js';

describe('Unicidade de nomes em foods (A-003 / BL-09 / ARCH-015)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-uniq-%');
  });

  it('devem existir os índices únicos parciais de catálogo e de alimentos personalizados', async () => {
    const res = await pool.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'foods' AND indexname IN ('idx_foods_catalog_unique_name', 'idx_foods_custom_user_unique_name')`
    );
    assert.strictEqual(res.rows.length, 2, 'Ambos os índices parciais devem existir');
  });

  it('deve rejeitar dois alimentos ativos do catálogo geral com o mesmo nome normalizado', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO foods (name, calories, proteins, carbs, fats, user_id) VALUES ('BL-09 Amostra Catalogo', 1, 1, 1, 1, NULL)`
      );
      await assert.rejects(
        () =>
          client.query(
            `INSERT INTO foods (name, calories, proteins, carbs, fats, user_id) VALUES ('bl-09 amostra catalogo', 2, 2, 2, 2, NULL)`
          ),
        /idx_foods_catalog_unique_name|duplicate key/
      );
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('deve rejeitar dois alimentos personalizados do MESMO usuário com mesmo nome normalizado', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query(
        `INSERT INTO users (name, email, password_hash) VALUES ('Tester 1', 'tester-uniq-1@example.com', 'hash123') RETURNING id`
      );
      const userId = userRes.rows[0].id;

      await client.query(
        `INSERT INTO foods (name, calories, proteins, carbs, fats, user_id) VALUES ('Meu Pão Caseiro', 100, 5, 20, 2, $1)`,
        [userId]
      );
      await assert.rejects(
        () =>
          client.query(
            `INSERT INTO foods (name, calories, proteins, carbs, fats, user_id) VALUES ('meu pao caseiro', 120, 6, 22, 3, $1)`,
            [userId]
          ),
        /idx_foods_custom_user_unique_name|duplicate key/
      );
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('deve permitir que USUÁRIOS DIFERENTES tenham alimentos personalizados com o mesmo nome (A-003)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const u1 = await client.query(
        `INSERT INTO users (name, email, password_hash) VALUES ('Tester A', 'tester-uniq-a@example.com', 'hash123') RETURNING id`
      );
      const u2 = await client.query(
        `INSERT INTO users (name, email, password_hash) VALUES ('Tester B', 'tester-uniq-b@example.com', 'hash123') RETURNING id`
      );

      // Usuário A cria "Bolo de Cenoura"
      await client.query(
        `INSERT INTO foods (name, calories, proteins, carbs, fats, user_id) VALUES ('Bolo de Cenoura', 250, 4, 35, 10, $1)`,
        [u1.rows[0].id]
      );

      // Usuário B também pode criar seu próprio "Bolo de Cenoura"
      const resB = await client.query(
        `INSERT INTO foods (name, calories, proteins, carbs, fats, user_id) VALUES ('Bolo de Cenoura', 280, 5, 40, 12, $1) RETURNING id`,
        [u2.rows[0].id]
      );
      assert.ok(resB.rows[0].id, 'Usuário B deve conseguir criar alimento com o mesmo nome de A');
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('deve permitir que um usuário crie alimento personalizado com mesmo nome de um item do catálogo geral', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const u = await client.query(
        `INSERT INTO users (name, email, password_hash) VALUES ('Tester C', 'tester-uniq-c@example.com', 'hash123') RETURNING id`
      );

      // Alimento no catálogo geral
      await client.query(
        `INSERT INTO foods (name, calories, proteins, carbs, fats, user_id) VALUES ('Arroz Integral Especial', 130, 3, 28, 1, NULL)`
      );

      // Usuário cria alimento personalizado com mesmo nome
      const res = await client.query(
        `INSERT INTO foods (name, calories, proteins, carbs, fats, user_id) VALUES ('Arroz Integral Especial', 140, 4, 30, 2, $1) RETURNING id`,
        [u.rows[0].id]
      );
      assert.ok(res.rows[0].id, 'Usuário deve conseguir criar alimento com mesmo nome de item do catálogo');
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
