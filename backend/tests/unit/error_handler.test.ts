import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import type { Request, Response } from 'express';

interface MockResponse {
  statusCode: number;
  body: Record<string, unknown> | null;
  status: (code: number) => MockResponse;
  json: (payload: Record<string, unknown>) => MockResponse;
}

function mockRes() {
  const res: MockResponse = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: Record<string, unknown>) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & MockResponse;
}

describe('errorHandler Security and PG Mapping (#12)', () => {
  closeTestPool();

  const mockReq = {
    method: 'POST',
    originalUrl: '/api/test',
    id: 'req-123',
    headers: {},
  } as unknown as Request;

  const mockNext = () => {};

  it('mantém mensagem e code de erro de negócio 5xx (DEMO_UNAVAILABLE) sem mascarar', () => {
    const err = Object.assign(new Error('Demonstração indisponível no momento.'), {
      statusCode: 503,
      code: 'DEMO_UNAVAILABLE',
    });
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body?.message, 'Demonstração indisponível no momento.');
    assert.strictEqual(res.body?.code, 'DEMO_UNAVAILABLE');
  });

  it('continua mascarando 500 sem code de negócio', () => {
    const res = mockRes();
    errorHandler(new Error('segredo interno'), mockReq, res, mockNext);
    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(res.body?.message, 'Erro interno no servidor.');
  });

  it('deve mapear erro de violação de unicidade (23505) para 409', () => {
    const pgError = Object.assign(
      new Error('duplicate key value violates unique constraint "users_email_key"'),
      {
        code: '23505',
      },
    );
    const res = mockRes();

    errorHandler(pgError, mockReq, res, mockNext);

    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(res.body?.success, false);
    assert.strictEqual(res.body?.message, 'Registro já existente.');
    assert.strictEqual(res.body?.code, undefined);
  });

  it('deve mapear erro de valor numérico fora de alcance (22003) para 400 sem vazar SQLSTATE', () => {
    const pgError = Object.assign(new Error('numeric field overflow'), {
      code: '22003',
    });
    const res = mockRes();

    errorHandler(pgError, mockReq, res, mockNext);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body?.success, false);
    assert.strictEqual(res.body?.message, 'Valor numérico fora dos limites permitidos.');
    assert.strictEqual(res.body?.code, undefined);
  });

  it('deve mapear erro de sintaxe de tipo de dado inválido (22P02) para 400', () => {
    const pgError = Object.assign(new Error('invalid input syntax for type uuid: "not-a-uuid"'), {
      code: '22P02',
    });
    const res = mockRes();

    errorHandler(pgError, mockReq, res, mockNext);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body?.success, false);
    assert.strictEqual(res.body?.message, 'Dado em formato inválido.');
  });

  it('deve propagar apenas códigos de negócio estáveis permitidos', () => {
    const businessErr = Object.assign(new Error('Acesso negado'), {
      statusCode: 403,
      code: 'FORBIDDEN',
    });
    const res = mockRes();

    errorHandler(businessErr, mockReq, res, mockNext);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body?.code, 'FORBIDDEN');
  });

  it('não deve repassar código de erro de driver ou desconhecido', () => {
    const driverErr = Object.assign(new Error('Driver failure'), {
      statusCode: 400,
      code: 'ERR_PG_INTERNAL_SOCKET_DEAD',
    });
    const res = mockRes();

    errorHandler(driverErr, mockReq, res, mockNext);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body?.code, undefined);
  });
});
