import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Middleware de Compressão HTTP (PC-02 / PERF-008)', () => {
  closeTestPool();

  it('deve responder com Content-Encoding gzip quando cliente suporta gzip e payload > 1KB', async () => {
    const res = await request(app)
      .get('/test-compression-payload')
      .set('Accept-Encoding', 'gzip');

    assert.strictEqual(
      res.headers['content-encoding'],
      'gzip',
      'Esperado cabeçalho Content-Encoding: gzip na resposta'
    );
  });
});
