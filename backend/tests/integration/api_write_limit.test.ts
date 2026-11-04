import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('limite geral de escritas por IP em /api', () => {
  closeTestPool();

  it('responde 429 após 300 escritas e não limita leituras', async () => {
    for (let i = 0; i < 300; i++) {
      const res = await request(app).post('/api/rota-inexistente');
      assert.strictEqual(res.status, 404);
    }
    const blocked = await request(app).post('/api/rota-inexistente');
    assert.strictEqual(blocked.status, 429);
    assert.strictEqual(blocked.body.success, false);

    const read = await request(app).get('/api/rota-inexistente');
    assert.strictEqual(read.status, 404);
  });
});
