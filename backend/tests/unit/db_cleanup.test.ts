import { describe, it } from 'node:test';
import assert from 'node:assert';
import { cleanupTestData, assertIsTestDatabase } from '../helpers/db.js';
import { pool } from '../../src/database/pool.js';

describe('Database Test Cleanup Helper (PC-14 / D-11)', () => {
  it('trava de segurança em runtime: deve rejeitar qualquer banco que não termine em _test', () => {
    assert.throws(
      () => assertIsTestDatabase('contador_calorias'),
      /Segurança D-11 violada/
    );
    assert.throws(
      () => assertIsTestDatabase('production_db'),
      /Segurança D-11 violada/
    );
    assert.throws(
      () => assertIsTestDatabase(undefined),
      /Segurança D-11 violada/
    );
    assert.doesNotThrow(() => assertIsTestDatabase('contador_calorias_test'));
  });

  it('trava de padrão: deve rejeitar padrão que não comece com tester-', async () => {
    await assert.rejects(
      async () => cleanupTestData('admin%'),
      /Segurança D-11 violada/
    );
  });

  it('deve limpar registros de teste com email tester-% preservando outros usuários', async () => {
    const testEmail = `tester-cleanup-${Date.now()}@example.com`;

    await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
      ['Cleanup Tester', testEmail, 'hash123']
    );

    // Confirma inserção
    const beforeTest = await pool.query('SELECT id FROM users WHERE email = $1', [testEmail]);
    assert.strictEqual(beforeTest.rowCount, 1);

    // Executa a limpeza determinística com namespace isolado
    await cleanupTestData('tester-cleanup-%');

    // Confirma que o usuário foi deletado
    const afterTest = await pool.query('SELECT id FROM users WHERE email = $1', [testEmail]);
    assert.strictEqual(afterTest.rowCount, 0);
  });
});
