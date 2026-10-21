import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';
import * as AuthService from '../../src/services/auth.service.js';
import { cleanupTestData } from '../helpers/db.js';
import {
  clearMailbox,
  createVerifiedUser,
  lastEmailTo,
  verificationCodeFor,
} from '../helpers/auth.js';

const PASSWORD = 'senhaForte123';

function registerPayload(email: string, name = 'Verificação Tester') {
  return { name, email, password: PASSWORD, acceptTerms: true as const };
}

describe('Confirmação de e-mail (BL-12 / D-21)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-verif-%');
  });

  it('cadastro responde 202 sem sessão, persiste termos e envia código (A4/A6)', async () => {
    const email = `tester-verif-register-${Date.now()}@example.com`;
    const response = await request(app).post('/api/auth/register').send(registerPayload(email));

    assert.strictEqual(response.status, 202);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data, undefined);
    assert.strictEqual(response.body.token, undefined);

    const row = await pool.query<{
      terms_accepted_at: Date | null;
      email_verified_at: Date | null;
    }>('SELECT terms_accepted_at, email_verified_at FROM users WHERE email = $1', [email]);
    assert.ok(row.rows[0]?.terms_accepted_at, 'termos devem ser persistidos');
    assert.strictEqual(row.rows[0]?.email_verified_at, null);

    const message = lastEmailTo(email);
    assert.ok(message, 'e-mail de verificação deve ser enviado');
    assert.match(message.subject, /confirme seu e-mail/i);
    assert.match(verificationCodeFor(email), /^\d{6}$/);
  });

  it('código errado conta tentativas e a 5ª falha invalida o código (A2)', async () => {
    const email = `tester-verif-attempts-${Date.now()}@example.com`;
    await AuthService.register(registerPayload(email));
    const correctCode = verificationCodeFor(email);
    const wrongCode = correctCode === '000000' ? '111111' : '000000';

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await assert.rejects(
        () => AuthService.verifyEmail({ email, code: wrongCode }),
        (error: { statusCode?: number; code?: string }) => {
          assert.strictEqual(error.statusCode, 400);
          assert.strictEqual(error.code, 'INVALID_VERIFICATION_CODE');
          return true;
        }
      );
    }

    const codeRow = await pool.query<{ attempts: number; consumed_at: Date | null }>(
      `SELECT attempts, consumed_at
         FROM email_verification_codes
        WHERE user_id = (SELECT id FROM users WHERE email = $1)
        ORDER BY created_at DESC
        LIMIT 1`,
      [email]
    );
    assert.strictEqual(Number(codeRow.rows[0]?.attempts), 5);
    assert.ok(codeRow.rows[0]?.consumed_at, '5ª falha deve consumir o código');

    await assert.rejects(
      () => AuthService.verifyEmail({ email, code: correctCode }),
      (error: { statusCode?: number; code?: string }) => {
        assert.strictEqual(error.statusCode, 400);
        assert.strictEqual(error.code, 'INVALID_VERIFICATION_CODE');
        return true;
      }
    );
  });

  it('código correto verifica a conta, emite JWT com tv e é de uso único (A2/A6)', async () => {
    const email = `tester-verif-success-${Date.now()}@example.com`;
    const response = await request(app).post('/api/auth/register').send(registerPayload(email));
    assert.strictEqual(response.status, 202);

    const code = verificationCodeFor(email);
    const verified = await request(app).post('/api/auth/verify-email').send({ email, code });

    assert.strictEqual(verified.status, 200);
    assert.strictEqual(verified.body.success, true);
    assert.ok(verified.body.data.token);
    assert.strictEqual(verified.body.data.user.email, email);
    assert.ok(verified.body.data.user.email_verified_at);

    await assert.rejects(
      () => AuthService.verifyEmail({ email, code }),
      (error: { statusCode?: number }) => {
        assert.strictEqual(error.statusCode, 400);
        return true;
      }
    );
  });

  it('login de conta não verificada retorna 403 com code e, após verificar, emite sessão (A1/A5)', async () => {
    const email = `tester-verif-login-${Date.now()}@example.com`;
    await AuthService.register(registerPayload(email));
    const code = verificationCodeFor(email);

    const blocked = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    assert.strictEqual(blocked.status, 403);
    assert.strictEqual(blocked.body.success, false);
    assert.strictEqual(blocked.body.code, 'EMAIL_NOT_VERIFIED');

    await AuthService.verifyEmail({ email, code });

    const login = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    assert.strictEqual(login.status, 200);
    assert.ok(login.body.data.token);
  });

  it('reenvio imediato respeita o cooldown de 60 s (A2/A4)', async () => {
    const email = `tester-verif-cooldown-${Date.now()}@example.com`;
    await AuthService.register(registerPayload(email));
    const firstCode = verificationCodeFor(email);

    clearMailbox();
    await request(app).post('/api/auth/resend-code').send({ email });
    assert.strictEqual(lastEmailTo(email), undefined, 'não deve enviar novo código dentro de 60 s');

    await pool.query(
      `UPDATE email_verification_codes
          SET created_at = CURRENT_TIMESTAMP - INTERVAL '61 seconds'
        WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
      [email]
    );

    await request(app).post('/api/auth/resend-code').send({ email });
    const secondCode = verificationCodeFor(email);
    assert.match(secondCode, /^\d{6}$/);
    assert.notStrictEqual(secondCode, firstCode, 'novo código deve ser emitido após o cooldown');
  });

  it('respeita o teto de 5 códigos por e-mail em uma hora (A2)', async () => {
    const email = `tester-verif-cap-${Date.now()}@example.com`;
    await AuthService.register(registerPayload(email));

    // 1 código do cadastro + 4 reenvios dentro da janela.
    for (let i = 0; i < 4; i += 1) {
      await pool.query(
        `UPDATE email_verification_codes
            SET created_at = CURRENT_TIMESTAMP - INTERVAL '61 seconds'
          WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
        [email]
      );
      await request(app).post('/api/auth/resend-code').send({ email });
    }

    const countBefore = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM email_verification_codes
        WHERE user_id = (SELECT id FROM users WHERE email = $1)
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'`,
      [email]
    );
    assert.strictEqual(Number(countBefore.rows[0]?.count), 5);

    clearMailbox();
    await pool.query(
      `UPDATE email_verification_codes
          SET created_at = CURRENT_TIMESTAMP - INTERVAL '61 seconds'
        WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
      [email]
    );
    await request(app).post('/api/auth/resend-code').send({ email });

    assert.strictEqual(lastEmailTo(email), undefined, '6º envio deve ser suprimido pelo teto');
    const countAfter = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM email_verification_codes
        WHERE user_id = (SELECT id FROM users WHERE email = $1)
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'`,
      [email]
    );
    assert.strictEqual(Number(countAfter.rows[0]?.count), 5);
  });

  it('register, resend e forgot não permitem enumerar contas (A4)', async () => {
    const existing = await createVerifiedUser({
      email: `tester-verif-existing-${Date.now()}@example.com`,
      password: PASSWORD,
    });
    const unknownEmail = `tester-verif-unknown-${Date.now()}@example.com`;

    const registerExisting = await request(app)
      .post('/api/auth/register')
      .send(registerPayload(existing.email));
    const registerUnknown = await request(app)
      .post('/api/auth/register')
      .send(registerPayload(unknownEmail));
    assert.strictEqual(registerExisting.status, 202);
    assert.strictEqual(registerUnknown.status, 202);
    assert.deepStrictEqual(registerExisting.body, registerUnknown.body);

    const forgotExisting = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: existing.email });
    const forgotUnknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: unknownEmail });
    assert.strictEqual(forgotExisting.status, 202);
    assert.strictEqual(forgotUnknown.status, 202);
    assert.deepStrictEqual(forgotExisting.body, forgotUnknown.body);

    const resendUnknown = await request(app)
      .post('/api/auth/resend-code')
      .send({ email: unknownEmail });
    assert.strictEqual(resendUnknown.status, 202);
    assert.deepStrictEqual(resendUnknown.body, forgotUnknown.body);
  });

  it('registro em e-mail já verificado não altera a conta e avisa o dono (A4)', async () => {
    const user = await createVerifiedUser({
      email: `tester-verif-owned-${Date.now()}@example.com`,
      password: PASSWORD,
    });
    clearMailbox();

    const response = await request(app)
      .post('/api/auth/register')
      .send(registerPayload(user.email, 'Invasor'));

    assert.strictEqual(response.status, 202);
    const row = await pool.query<{ name: string; email_verified_at: Date | null }>(
      'SELECT name, email_verified_at FROM users WHERE id = $1',
      [user.id]
    );
    assert.strictEqual(row.rows[0]?.name, user.name);
    assert.ok(row.rows[0]?.email_verified_at);

    const message = lastEmailTo(user.email);
    assert.ok(message);
    assert.match(message.subject, /tentativa de cadastro/i);
    assert.doesNotMatch(message.text, /\b\d{6}\b/, 'aviso não deve conter código');
  });

  it('troca de e-mail autenticada revoga sessão, exige nova verificação e reemite código (A8)', async () => {
    const user = await createVerifiedUser({
      email: `tester-verif-change-old-${Date.now()}@example.com`,
      password: PASSWORD,
    });
    const newEmail = `tester-verif-change-new-${Date.now()}@example.com`;

    const change = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ email: newEmail, currentPassword: PASSWORD });

    assert.strictEqual(change.status, 200);
    assert.strictEqual(change.body.data.email, newEmail);
    assert.strictEqual(change.body.data.email_verified_at, null);
    assert.ok(change.body.data.token, 'token novo deve ser devolvido após a troca');

    const oldSession = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${user.token}`);
    assert.strictEqual(oldSession.status, 401);

    const newSession = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${change.body.data.token}`);
    assert.strictEqual(newSession.status, 200);

    const code = verificationCodeFor(newEmail);
    await AuthService.verifyEmail({ email: newEmail, code });

    const login = await request(app).post('/api/auth/login').send({
      email: newEmail,
      password: PASSWORD,
    });
    assert.strictEqual(login.status, 200);
    assert.ok(login.body.data.token);
  });
});
