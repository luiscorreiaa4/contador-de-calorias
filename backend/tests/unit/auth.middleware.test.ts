import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../../src/middlewares/auth.js';
import { env } from '../../src/config/env.js';
import { signAuthToken } from '../../src/utils/jwt.js';
import * as UserModel from '../../src/models/user.model.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

interface ResponseState {
  status: number;
  body: unknown;
}

function createResponse(): { res: Response; state: ResponseState } {
  const state: ResponseState = { status: 0, body: null };
  const res = {
    status(code: number) {
      state.status = code;
      return this;
    },
    json(data: unknown) {
      state.body = data;
      return this;
    },
  } as unknown as Response;
  return { res, state };
}

async function callAuthenticate(token?: string) {
  const req = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as unknown as AuthenticatedRequest;
  const { res, state } = createResponse();
  let nextError: unknown;
  let nextCalled = false;

  await authenticate(req, res, (error?: unknown) => {
    nextCalled = true;
    nextError = error;
  });

  return { req, state, nextCalled, nextError };
}

describe('Auth Middleware (authenticate)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-mw-%');
  });

  it('deve rejeitar token assinado com a chave fallback insegura "fallback_jwt_secret"', async () => {
    const fakeToken = jwt.sign({ userId: 'user-123', tv: 0 }, 'fallback_jwt_secret');
    const { state, nextCalled } = await callAuthenticate(fakeToken);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(state.status, 401);
    assert.deepStrictEqual(state.body, {
      success: false,
      message: 'Token de autenticação inválido ou expirado.',
    });
  });

  it('deve autenticar com sucesso token com tv correspondente ao banco', async () => {
    const user = await createVerifiedUser({
      email: `tester-mw-valid-${Date.now()}@example.com`,
    });
    const { req, nextCalled, nextError } = await callAuthenticate(user.token);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(nextError, undefined);
    assert.strictEqual(req.userId, user.id);
    assert.strictEqual(req.tokenVersion, 0);
  });

  it('deve rejeitar requisição sem cabeçalho Authorization', async () => {
    const { state, nextCalled } = await callAuthenticate();

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(state.status, 401);
    assert.deepStrictEqual(state.body, {
      success: false,
      message: 'Acesso negado. Token de autenticação não fornecido.',
    });
  });

  it('deve rejeitar token cujo payload não contenha userId válido (A-010)', async () => {
    const invalidPayloadToken = jwt.sign({ foo: 'bar' }, env.JWT_SECRET);
    const { state, nextCalled } = await callAuthenticate(invalidPayloadToken);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(state.status, 401);
    assert.deepStrictEqual(state.body, {
      success: false,
      message: 'Token de autenticação inválido ou expirado.',
    });
  });

  it('deve rejeitar token sem o claim tv (A8)', async () => {
    const user = await createVerifiedUser({
      email: `tester-mw-notv-${Date.now()}@example.com`,
    });
    const tokenWithoutTv = jwt.sign({ userId: user.id }, env.JWT_SECRET);
    const { state, nextCalled } = await callAuthenticate(tokenWithoutTv);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(state.status, 401);
  });

  it('deve rejeitar token com tv divergente do banco (A8)', async () => {
    const user = await createVerifiedUser({
      email: `tester-mw-tv-${Date.now()}@example.com`,
    });
    const staleToken = signAuthToken(user.id, 99);
    const { state, nextCalled } = await callAuthenticate(staleToken);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(state.status, 401);
  });

  it('deve rejeitar token de usuário removido (A8)', async () => {
    const user = await createVerifiedUser({
      email: `tester-mw-removed-${Date.now()}@example.com`,
    });
    await UserModel.deleteUser(user.id);

    const { state, nextCalled } = await callAuthenticate(user.token);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(state.status, 401);
  });
});
