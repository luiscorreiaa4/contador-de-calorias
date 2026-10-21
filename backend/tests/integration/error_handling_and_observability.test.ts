import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import type { Request } from 'express';
import { app } from '../../src/app.js';
import { requireUserId } from '../../src/middlewares/auth.js';
import { structuredLog } from '../../src/config/logger.js';

describe('Tratamento de Erros, Middlewares e Observabilidade (Lote 05)', () => {
  closeTestPool();

  it('deve retornar 404 com payload JSON padronizado para rotas inexistentes (A-017)', async () => {
    const res = await request(app).get('/api/rota-inexistente-xyz');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Rota não encontrada.');
  });

  it('deve retornar 400 sanitizado quando o body contiver JSON malformado (A-017)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ "email": "test@example.com", "password": invalid_json_syntax }');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'JSON inválido no corpo da requisição.');
  });

  it('deve sanitizar x-request-id malicioso ou inválido gerando novo UUID (A-058)', async () => {
    const invalidId = '<script>alert("xss")</script> and ' + 'a'.repeat(80);
    const res = await request(app).get('/health').set('X-Request-Id', invalidId);

    const receivedId = String(res.headers['x-request-id']);
    assert.notStrictEqual(receivedId, invalidId);
    assert.match(receivedId, /^[0-9a-f-]{36}$/);
  });

  it('deve preservar x-request-id seguro e válido (A-058)', async () => {
    const validId = 'client-req-abc-123_xyz';
    const res = await request(app).get('/health').set('X-Request-Id', validId);

    assert.strictEqual(res.headers['x-request-id'], validId);
  });

  it('requireUserId deve lançar erro 401 quando req.userId não existir (A-022)', () => {
    assert.throws(
      () => {
        requireUserId({} as Request);
      },
      (err: unknown) => {
        const error = err as Error & { statusCode?: number };
        return error.statusCode === 401 && error.message === 'Usuário não autenticado.';
      }
    );
  });

  it('structuredLog deve direcionar erros para console.error e avisos para console.warn (A-031)', () => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    const errorCaptured: string[] = [];
    const warnCaptured: string[] = [];
    const logCaptured: string[] = [];

    console.error = (...args: unknown[]) => errorCaptured.push(args.join(' '));
    console.warn = (...args: unknown[]) => warnCaptured.push(args.join(' '));
    console.log = (...args: unknown[]) => logCaptured.push(args.join(' '));

    try {
      structuredLog('error', 'teste_erro', { code: 500 });
      structuredLog('warn', 'teste_aviso', { code: 400 });
      structuredLog('info', 'teste_info', { code: 200 });
    } finally {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    }

    assert.strictEqual(errorCaptured.length, 1);
    assert.ok(errorCaptured[0].includes('"level":"error"'));
    assert.ok(errorCaptured[0].includes('"message":"teste_erro"'));

    assert.strictEqual(warnCaptured.length, 1);
    assert.ok(warnCaptured[0].includes('"level":"warn"'));
    assert.ok(warnCaptured[0].includes('"message":"teste_aviso"'));

    assert.strictEqual(logCaptured.length, 1);
    assert.ok(logCaptured[0].includes('"level":"info"'));
    assert.ok(logCaptured[0].includes('"message":"teste_info"'));
  });
});
