import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';
import { totpAt } from '../../src/utils/totp.js';

const PASSWORD = 'senhaForte123';

describe('MFA TOTP (#7)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-mfa-%');
  });

  it('gera o vetor de teste da RFC 6238 (t=59 s)', () => {
    assert.strictEqual(totpAt('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000), '287082');
  });

  it('exige código no login após ativar, aceita TOTP e recuperação de uso único e permite desativar', async () => {
    const user = await createVerifiedUser({
      email: `tester-mfa-${Date.now()}@example.com`,
      password: PASSWORD,
    });
    const login = (extra: object = {}) =>
      request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: PASSWORD, ...extra });

    const session = await login();
    assert.strictEqual(session.status, 200);
    const auth = { Authorization: `Bearer ${session.body.data?.token ?? session.body.token}` };

    const setup = await request(app).post('/api/users/me/mfa/setup').set(auth);
    assert.strictEqual(setup.status, 200);
    const secret: string = setup.body.data.secret;

    const bad = await request(app)
      .post('/api/users/me/mfa/enable')
      .set(auth)
      .send({ code: '000000' });
    assert.strictEqual(bad.status, 400);

    const enableCode = totpAt(secret, Date.now());
    const enabled = await request(app)
      .post('/api/users/me/mfa/enable')
      .set(auth)
      .send({ code: enableCode });
    assert.strictEqual(enabled.status, 200);
    const recovery: string[] = enabled.body.data.recovery_codes;
    assert.strictEqual(recovery.length, 8);
    // V-2: ativar o MFA derruba as sessões anteriores.
    assert.strictEqual((await request(app).get('/api/users/me').set(auth)).status, 401);

    const missing = await login();
    assert.strictEqual(missing.status, 401);
    assert.strictEqual(missing.body.code, 'MFA_REQUIRED');

    assert.strictEqual((await login({ mfa_code: '000000' })).status, 401);

    // V-4: o passo usado na ativação não vale de novo; o próximo (deriva +1) vale uma vez só.
    assert.strictEqual((await login({ mfa_code: enableCode })).status, 401);
    const nextCode = totpAt(secret, Date.now() + 30_000);
    const ok = await login({ mfa_code: nextCode });
    assert.strictEqual(ok.status, 200);
    assert.strictEqual(JSON.stringify(ok.body).includes('mfa_secret_enc'), false);
    assert.strictEqual((await login({ mfa_code: nextCode })).status, 401);

    const viaRecovery = await login({ mfa_code: recovery[0] });
    assert.strictEqual(viaRecovery.status, 200);
    assert.strictEqual((await login({ mfa_code: recovery[0] })).status, 401);

    const current = { Authorization: `Bearer ${viaRecovery.body.data.token}` };
    const off = await request(app)
      .post('/api/users/me/mfa/disable')
      .set(current)
      .send({ code: recovery[1] });
    assert.strictEqual(off.status, 200);
    // V-2: desativar também derruba as sessões anteriores, e a resposta traz o cookie novo.
    assert.match(String(off.headers['set-cookie']), /cs_session=/);
    assert.strictEqual((await request(app).get('/api/users/me').set(current)).status, 401);
    assert.strictEqual((await login()).status, 200);
  });
});
