import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

const PASSWORD = 'senhaForte123';

describe('Bloqueio de login por conta (#4)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-lockout-%');
  });

  it('bloqueia após 5 falhas e recusa até a senha correta, sem revelar o bloqueio', async () => {
    const user = await createVerifiedUser({
      email: `tester-lockout-${Date.now()}@example.com`,
      password: PASSWORD,
    });
    const login = (password: string) =>
      request(app).post('/api/auth/login').send({ email: user.email, password });

    for (let i = 0; i < 5; i++) assert.strictEqual((await login('errada123')).status, 401);

    const locked = await login(PASSWORD);
    assert.strictEqual(locked.status, 401);
    assert.strictEqual(locked.body.message, 'E-mail ou senha incorretos.');
  });

  it('login correto zera o contador de falhas', async () => {
    const user = await createVerifiedUser({
      email: `tester-lockout-ok-${Date.now()}@example.com`,
      password: PASSWORD,
    });
    const login = (password: string) =>
      request(app).post('/api/auth/login').send({ email: user.email, password });

    for (let i = 0; i < 4; i++) await login('errada123');
    assert.strictEqual((await login(PASSWORD)).status, 200);
    for (let i = 0; i < 4; i++) await login('errada123');
    assert.strictEqual((await login(PASSWORD)).status, 200);
  });
});
