import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Rate limiting de autenticação por IP + e-mail (BL-01 / SEC-006)', () => {
  closeTestPool();

  it('não deve compartilhar o contador entre e-mails distintos vindos do mesmo IP', async () => {
    for (let i = 0; i < 12; i += 1) {
      const res = await request(app)
        .post('/api/users/login')
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
      const res = await request(app).post('/api/users/login').send({ email, password: 'senhaInvalida1' });
      assert.notStrictEqual(res.status, 429, `Tentativa ${i + 1} não deveria ser limitada`);
    }

    const blocked = await request(app).post('/api/users/login').send({ email, password: 'senhaInvalida1' });

    assert.strictEqual(blocked.status, 429);
    assert.strictEqual(blocked.body.success, false);
  });
});
