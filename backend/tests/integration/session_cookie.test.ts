import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

const origin = env.CORS_ORIGIN.split(',')[0].trim();

describe('Sessão por cookie HttpOnly (#1)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-cookie-%');
  });

  it('login emite cookie HttpOnly SameSite=Strict e ele autentica sem Authorization', async () => {
    const user = await createVerifiedUser({ email: `tester-cookie-${Date.now()}@example.com` });
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    assert.strictEqual(login.status, 200);

    const setCookie = (login.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('cs_session='));
    assert.ok(setCookie, 'cookie cs_session ausente');
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Strict/i);

    const cookie = setCookie.split(';')[0];
    const me = await request(app).get('/api/users/me').set('Cookie', cookie);
    assert.strictEqual(me.status, 200);

    // CSRF: mutação via cookie sem Origin permitida é rejeitada; com Origin passa da guarda.
    const noOrigin = await request(app).put('/api/users/me').set('Cookie', cookie).send({});
    assert.strictEqual(noOrigin.status, 403);
    const evil = await request(app).put('/api/users/me').set('Cookie', cookie).set('Origin', 'https://evil.example').send({});
    assert.strictEqual(evil.status, 403);
    const ok = await request(app).put('/api/users/me').set('Cookie', cookie).set('Origin', origin).send({});
    assert.notStrictEqual(ok.status, 403);
  });

  it('logout limpa o cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    assert.strictEqual(res.status, 200);
    const cleared = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('cs_session=;'));
    assert.ok(cleared);
  });
});
