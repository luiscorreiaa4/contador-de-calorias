import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import { app } from '../../src/app.js';
import { requestLogger } from '../../src/middlewares/requestLogger.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';

// App mínimo com a mesma cadeia de erro do app real: lança um erro "do banco" cheio de detalhes.
const leakyError = Object.assign(
  new Error('relation "users" does not exist: SELECT * FROM users WHERE id = $1'),
  { stack: 'Error: boom\n    at query (C:\\app\\backend\\src\\models\\user.model.ts:42:7)' },
);
const crashApp = express();
crashApp.disable('x-powered-by');
crashApp.use(requestLogger);
crashApp.get('/boom', () => {
  throw leakyError;
});
crashApp.use(errorHandler);

const VERSION_LEAK = /express|node\.js|\bv?\d+\.\d+\.\d+\b/i;

describe('Caça a exposições (guia 03-seguranca-web, seção 1)', () => {
  closeTestPool();

  describe('handler global de erros', () => {
    it('500 devolve só mensagem genérica (+ X-Request-Id) e manda os detalhes ao log', async () => {
      const logged = mock.method(console, 'error', () => {});
      let res;
      try {
        res = await request(crashApp).get('/boom').set('X-Request-Id', 'req-exposure-1');
      } finally {
        logged.mock.restore();
      }

      assert.strictEqual(res.status, 500);
      assert.deepStrictEqual(res.body, { success: false, message: 'Erro interno no servidor.' });
      assert.strictEqual(res.headers['x-request-id'], 'req-exposure-1');
      assert.doesNotMatch(res.text, /SELECT|relation|stack|\.ts|C:\\|\bat /i);

      const logLine = logged.mock.calls.map((c) => String(c.arguments[0])).join('\n');
      assert.match(logLine, /req-exposure-1/);
      assert.match(logLine, /SELECT \* FROM users/);
      assert.match(logLine, /user\.model\.ts:42/);
    });
  });

  describe('headers de resposta', () => {
    for (const [name, target] of [
      ['app real (404)', () => request(app).get('/rota-inexistente')],
      ['app real (/health)', () => request(app).get('/health')],
      ['erro 500', () => request(crashApp).get('/boom')],
    ] as const) {
      it(`${name}: sem X-Powered-By, Server nem versão em header`, async () => {
        const logged = mock.method(console, 'error', () => {});
        let res;
        try {
          res = await target();
        } finally {
          logged.mock.restore();
        }

        assert.strictEqual(res.headers['x-powered-by'], undefined);
        assert.strictEqual(res.headers['server'], undefined);
        for (const [header, value] of Object.entries(res.headers)) {
          assert.doesNotMatch(String(value), VERSION_LEAK, `header ${header} revela versão`);
        }
      });
    }
  });

  describe('arquivos sensíveis', () => {
    for (const path of [
      '/.env',
      '/.env.example',
      '/backend/.env',
      '/.git/config',
      '/.git/HEAD',
      '/assets/index.js.map',
      '/src/app.ts',
      '/package.json',
      '/dump.sql',
      '/migrations/schema.sql',
      '/backup.zip',
      '/db.bak',
    ]) {
      it(`GET ${path} → 404 genérico, sem conteúdo de arquivo`, async () => {
        const res = await request(app).get(path);

        assert.strictEqual(res.status, 404);
        assert.match(String(res.headers['content-type']), /application\/json/);
        assert.deepStrictEqual(res.body, { success: false, message: 'Rota não encontrada.' });
      });
    }
  });
});
