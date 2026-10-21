import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Rate limiting de autenticação por IP + e-mail (BL-01 / SEC-006 / A-117)', () => {
  closeTestPool();

  it('não deve compartilhar o contador entre e-mails distintos vindos do mesmo IP abaixo do teto global', async () => {
    for (let i = 0; i < 12; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: `tester-ratelimit-distinto-${i}-${Date.now()}@example.com`,
          password: 'senhaInvalida1',
        });

      assert.notStrictEqual(
        res.status,
        429,
        `Requisição ${i + 1} não deveria ser limitada (e-mails distintos no mesmo IP)`
      );
    }
  });

  it('deve bloquear com 429 após 10 tentativas para o mesmo IP + e-mail', async () => {
    const email = `tester-ratelimit-bloqueio-${Date.now()}@example.com`;

    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post('/api/auth/login').send({ email, password: 'senhaInvalida1' });
      assert.notStrictEqual(res.status, 429, `Tentativa ${i + 1} não deveria ser limitada`);
    }

    const blocked = await request(app).post('/api/auth/login').send({ email, password: 'senhaInvalida1' });

    assert.strictEqual(blocked.status, 429);
    assert.strictEqual(blocked.body.success, false);
    assert.strictEqual(blocked.body.message, 'Muitas tentativas de login. Tente novamente após 15 minutos.');
  });

  it('deve bloquear com 429 por IP ao exceder o teto global de 30 tentativas, mesmo com e-mails distintos (A-117)', async () => {
    let blockedResponse: request.Response | null = null;
    for (let i = 0; i < 20; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: `tester-ratelimit-ip-global-${i}-${Date.now()}@example.com`,
          password: 'senhaInvalida1',
        });
      if (res.status === 429) {
        blockedResponse = res;
        break;
      }
    }

    assert.ok(blockedResponse, 'Deveria ter recebido status 429 ao ultrapassar o teto global por IP');
    assert.strictEqual(blockedResponse.status, 429);
    assert.strictEqual(blockedResponse.body.success, false);
    assert.strictEqual(
      blockedResponse.body.message,
      'Muitas tentativas de login originadas deste IP. Tente novamente após 15 minutos.'
    );
  });

  it('deve limitar verify-email a 10 tentativas por 15 minutos por IP (A9)', async () => {
    const email = `tester-ratelimit-verify-${Date.now()}@example.com`;

    for (let i = 0; i < 10; i += 1) {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ email, code: '123456' });
      assert.strictEqual(res.status, 400, `Tentativa ${i + 1} deveria ser processada`);
    }

    const blocked = await request(app)
      .post('/api/auth/verify-email')
      .send({ email, code: '123456' });
    assert.strictEqual(blocked.status, 429);
    assert.strictEqual(
      blocked.body.message,
      'Muitas tentativas de verificação. Tente novamente após 15 minutos.'
    );
  });

  it('deve limitar reset-password a 10 tentativas por hora por IP (A9)', async () => {
    const payload = { token: 'a'.repeat(43), password: 'senhaForte123' };

    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post('/api/auth/reset-password').send(payload);
      assert.strictEqual(res.status, 400, `Tentativa ${i + 1} deveria ser processada`);
    }

    const blocked = await request(app).post('/api/auth/reset-password').send(payload);
    assert.strictEqual(blocked.status, 429);
    assert.strictEqual(
      blocked.body.message,
      'Muitas tentativas de redefinição. Tente novamente após 1 hora.'
    );
  });
});

