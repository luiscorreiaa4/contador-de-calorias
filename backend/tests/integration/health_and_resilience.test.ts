import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';

describe('Resiliência de Infraestrutura (PC-11)', () => {
  closeTestPool();

  it('pool deve ter statement_timeout configurado para 10000ms', () => {
    // In node-postgres, options are stored in pool.options
    const options = (pool as unknown as { options?: { statement_timeout?: number } }).options;
    assert.strictEqual(
      options?.statement_timeout,
      10000,
      'statement_timeout deve ser de 10000ms (10 segundos)'
    );
  });

  it('GET /health deve retornar { success: true, data: { status: "healthy", database: "connected" } }', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'healthy');
    assert.strictEqual(res.body.data.database, 'connected');
  });

  it('GET /health deve retornar status 503 quando a sonda do banco falhar', async () => {
    const originalQuery = pool.query;
    try {
      (pool as unknown as { query: () => Promise<never> }).query = () => Promise.reject(new Error('Connection failure'));
      const res = await request(app).get('/health');
      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Database disconnected');
    } finally {
      pool.query = originalQuery;
    }
  });
});
