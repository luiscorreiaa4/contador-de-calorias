import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../../src/middlewares/auth.js';
import { env } from '../../src/config/env.js';

describe('Auth Middleware (authenticate)', () => {
  it('deve rejeitar token assinado com a chave fallback insegura "fallback_jwt_secret"', () => {
    const fakeToken = jwt.sign({ userId: 'user-123' }, 'fallback_jwt_secret');
    let statusReturned = 0;
    let jsonReturned: unknown = null;
    let nextCalled = false;

    const req = {
      headers: {
        authorization: `Bearer ${fakeToken}`,
      },
    } as unknown as AuthenticatedRequest;

    const res = {
      status(code: number) {
        statusReturned = code;
        return this;
      },
      json(data: unknown) {
        jsonReturned = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {
      nextCalled = true;
    };

    authenticate(req, res, next);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusReturned, 401);
    assert.deepStrictEqual(jsonReturned, {
      success: false,
      message: 'Token de autenticação inválido ou expirado.',
    });
  });

  it('deve autenticar com sucesso token assinado com env.JWT_SECRET', () => {
    const validToken = jwt.sign({ userId: 'valid-user-456' }, env.JWT_SECRET);
    let nextCalled = false;

    const req = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    } as unknown as AuthenticatedRequest;

    const res = {} as unknown as Response;

    const next = () => {
      nextCalled = true;
    };

    authenticate(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.userId, 'valid-user-456');
  });

  it('deve rejeitar requisição sem cabeçalho Authorization', () => {
    let statusReturned = 0;
    let jsonReturned: unknown = null;
    let nextCalled = false;

    const req = {
      headers: {},
    } as unknown as AuthenticatedRequest;

    const res = {
      status(code: number) {
        statusReturned = code;
        return this;
      },
      json(data: unknown) {
        jsonReturned = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {
      nextCalled = true;
    };

    authenticate(req, res, next);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusReturned, 401);
    assert.deepStrictEqual(jsonReturned, {
      success: false,
      message: 'Acesso negado. Token de autenticação não fornecido.',
    });
  });

  it('deve rejeitar token cujo payload não contenha userId válido (A-010)', () => {
    const invalidPayloadToken = jwt.sign({ foo: 'bar' }, env.JWT_SECRET);
    let statusReturned = 0;
    let jsonReturned: unknown = null;
    let nextCalled = false;

    const req = {
      headers: {
        authorization: `Bearer ${invalidPayloadToken}`,
      },
    } as unknown as AuthenticatedRequest;

    const res = {
      status(code: number) {
        statusReturned = code;
        return this;
      },
      json(data: unknown) {
        jsonReturned = data;
        return this;
      },
    } as unknown as Response;

    const next = () => {
      nextCalled = true;
    };

    authenticate(req, res, next);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusReturned, 401);
    assert.deepStrictEqual(jsonReturned, {
      success: false,
      message: 'Token de autenticação inválido ou expirado.',
    });
  });
});
