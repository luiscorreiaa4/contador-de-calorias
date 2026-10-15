import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';

// Rota de teste com payload de 2KB (> threshold de 1KB do compression)
app.get('/test-compression-payload', (_req, res) => {
  res.json({ data: 'X'.repeat(2048) });
});

test('Middleware de Compressão HTTP (PC-02 / PERF-008)', async (t) => {
  await t.test('deve responder com Content-Encoding gzip quando cliente suporta gzip e payload > 1KB', async () => {
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
