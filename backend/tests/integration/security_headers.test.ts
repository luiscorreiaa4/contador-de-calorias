import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Content Security Policy rigorosa (BL-07 / SEC-019)', () => {
  closeTestPool();

  it('deve enviar CSP restritiva em todas as respostas', async () => {
    const res = await request(app).get('/health');
    const csp = String(res.headers['content-security-policy'] ?? '');

    assert.ok(csp.length > 0, 'Esperado cabeçalho Content-Security-Policy');
    assert.match(csp, /default-src 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /base-uri 'none'/);
    assert.doesNotMatch(csp, /unsafe-inline/);
    assert.doesNotMatch(csp, /unsafe-eval/);
  });

  it('deve reforçar proteção contra sniffing de conteúdo e vazamento de referrer', async () => {
    const res = await request(app).get('/health');

    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(res.headers['referrer-policy'], 'no-referrer');
  });
});
