import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser, lastEmailTo, clearMailbox } from '../helpers/auth.js';

const PASSWORD = 'senhaForte123';
const NEW_PASSWORD = 'novaSenhaForte456';

function resetTokenFor(email: string): string {
  const message = lastEmailTo(email);
  assert.ok(message, `e-mail de redefinição não encontrado para ${email}`);
  assert.match(message.subject, /redefina sua senha/i);
  const match = message.text.match(/#token=([A-Za-z0-9_-]+)/);
  assert.ok(match, 'link de redefinição deve conter o token no fragmento');
  return match[1];
}

describe('Recuperação de senha (BL-05 / D-21)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-reset-%');
  });

  it('forgot-password de conta verificada envia link e persiste apenas o hash (A3)', async () => {
    const user = await createVerifiedUser({
      email: `tester-reset-link-${Date.now()}@example.com`,
      password: PASSWORD,
    });
    clearMailbox();

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: user.email });

    assert.strictEqual(response.status, 202);
    assert.strictEqual(response.body.success, true);

    const token = resetTokenFor(user.email);
    assert.ok(token.length >= 32);
    assert.doesNotMatch(token, /[^A-Za-z0-9_-]/);

    const row = await pool.query<{
      token_hash: string;
      expires_at: Date;
      used_at: Date | null;
    }>(
      `SELECT token_hash, expires_at, used_at
         FROM password_reset_tokens
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [user.id]
    );
    assert.ok(row.rows[0]);
    assert.strictEqual(row.rows[0].token_hash.length, 64);
    assert.notStrictEqual(row.rows[0].token_hash, token, 'token puro não pode ser persistido');
    assert.strictEqual(row.rows[0].used_at, null);

    const ttlMinutes = (new Date(row.rows[0].expires_at).getTime() - Date.now()) / 60000;
    assert.ok(ttlMinutes > 28 && ttlMinutes <= 30, `validade deve ser ~30 min (recebido: ${ttlMinutes})`);
  });

  it('forgot-password de conta inexistente ou não verificada responde igual e não envia e-mail (A4/A9)', async () => {
    const unverifiedEmail = `tester-reset-unverified-${Date.now()}@example.com`;
    await request(app).post('/api/auth/register').send({
      name: 'Reset Não Verificado',
      email: unverifiedEmail,
      password: PASSWORD,
      acceptTerms: true,
    });
    clearMailbox();

    const unverified = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: unverifiedEmail });
    const unknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: `tester-reset-unknown-${Date.now()}@example.com` });

    assert.strictEqual(unverified.status, 202);
    assert.strictEqual(unknown.status, 202);
    assert.deepStrictEqual(unverified.body, unknown.body);
    assert.strictEqual(lastEmailTo(unverifiedEmail), undefined);
  });

  it('reset-password troca a senha, incrementa token_version e consome o token (A3/A7/A8)', async () => {
    const user = await createVerifiedUser({
      email: `tester-reset-success-${Date.now()}@example.com`,
      password: PASSWORD,
    });
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const token = resetTokenFor(user.email);

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: NEW_PASSWORD });

    assert.strictEqual(reset.status, 200);
    assert.strictEqual(reset.body.success, true);
    assert.strictEqual(reset.body.data, undefined, 'reset não deve fazer auto-login');

    const row = await pool.query<{
      password_hash: string;
      token_version: number;
      used_at: Date | null;
    }>(
      `SELECT u.password_hash, u.token_version, t.used_at
         FROM users u
         JOIN password_reset_tokens t ON t.user_id = u.id
        WHERE u.id = $1
        ORDER BY t.created_at DESC
        LIMIT 1`,
      [user.id]
    );
    assert.ok(await bcrypt.compare(NEW_PASSWORD, row.rows[0].password_hash));
    assert.strictEqual(Number(row.rows[0].token_version), 1);
    assert.ok(row.rows[0].used_at);

    const oldSession = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${user.token}`);
    assert.strictEqual(oldSession.status, 401, 'sessão anterior deve ser revogada');

    const reuse = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'outraSenhaForte789' });
    assert.strictEqual(reuse.status, 400);
    assert.strictEqual(reuse.body.code, 'INVALID_RESET_TOKEN');

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD });
    assert.strictEqual(oldLogin.status, 401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: NEW_PASSWORD });
    assert.strictEqual(newLogin.status, 200);
    assert.ok(newLogin.body.data.token);

    const notice = lastEmailTo(user.email);
    assert.ok(notice);
    assert.match(notice.subject, /sua senha foi alterada/i);
  });

  it('novo pedido invalida o token anterior (A3)', async () => {
    const user = await createVerifiedUser({
      email: `tester-reset-invalidate-${Date.now()}@example.com`,
      password: PASSWORD,
    });

    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const firstToken = resetTokenFor(user.email);

    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const secondToken = resetTokenFor(user.email);

    const firstAttempt = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: firstToken, password: NEW_PASSWORD });
    assert.strictEqual(firstAttempt.status, 400);

    const secondAttempt = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: secondToken, password: NEW_PASSWORD });
    assert.strictEqual(secondAttempt.status, 200);
  });

  it('token expirado é rejeitado (A3)', async () => {
    const user = await createVerifiedUser({
      email: `tester-reset-expired-${Date.now()}@example.com`,
      password: PASSWORD,
    });
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const token = resetTokenFor(user.email);

    await pool.query(
      `UPDATE password_reset_tokens
          SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 minute'
        WHERE user_id = $1`,
      [user.id]
    );

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: NEW_PASSWORD });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.code, 'INVALID_RESET_TOKEN');
  });

  it('respeita o teto de 5 pedidos de reset por e-mail em uma hora (A9)', async () => {
    const user = await createVerifiedUser({
      email: `tester-reset-cap-${Date.now()}@example.com`,
      password: PASSWORD,
    });

    for (let i = 0; i < 5; i += 1) {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email });
      assert.strictEqual(response.status, 202);
    }

    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM password_reset_tokens
        WHERE user_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'`,
      [user.id]
    );
    assert.strictEqual(Number(count.rows[0]?.count), 5);

    clearMailbox();
    const sixth = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: user.email });
    assert.strictEqual(sixth.status, 202);
    assert.strictEqual(lastEmailTo(user.email), undefined, '6º pedido não deve enviar e-mail');
  });
});
