import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';
import { cleanupTestData } from '../helpers/db.js';
import { clearMailbox, createVerifiedUser, lastEmailTo } from '../helpers/auth.js';
import * as GuestModel from '../../src/models/guest.model.js';
import { createGuestSession } from '../../src/services/guest.service.js';
import { getSaoPauloDateString } from '../../src/utils/date.js';

const ORIGIN = 'http://localhost:5173';

interface DemoBody {
  data: { token: string; user: Record<string, unknown> & { id: string } };
}

async function startDemo(): Promise<DemoBody['data']> {
  const res = await request(app).post('/api/auth/demo').set('Origin', ORIGIN);
  assert.strictEqual(res.status, 200);
  return (res.body as DemoBody).data;
}

const dayOffset = (days: number): string =>
  getSaoPauloDateString(new Date(Date.now() - days * 24 * 3600 * 1000));

describe('POST /api/auth/demo (visitante temporário)', () => {
  closeTestPool(async () => {
    await GuestModel.deleteExpiredGuests(0, 10_000);
    await cleanupTestData('tester-guest-%');
  });

  it('rejeita /demo sem Origin ou com Origin não permitida (403)', async () => {
    const none = await request(app).post('/api/auth/demo');
    assert.strictEqual(none.status, 403);
    const evil = await request(app).post('/api/auth/demo').set('Origin', 'https://evil.example');
    assert.strictEqual(evil.status, 403);
    assert.strictEqual(evil.body.code, 'FORBIDDEN');
  });

  it('forgot-password de visitante responde 202 e não envia e-mail', async () => {
    const g = await startDemo();
    const { rows } = await pool.query<{ email: string }>('SELECT email FROM users WHERE id = $1', [
      g.user.id,
    ]);
    clearMailbox();
    const res = await request(app).post('/api/auth/forgot-password').send({ email: rows[0].email });
    assert.strictEqual(res.status, 202);
    assert.strictEqual(lastEmailTo(rows[0].email), undefined);
  });

  it('cria um visitante novo por clique, com metas e refeições', async () => {
    const a = await startDemo();
    const b = await startDemo();
    assert.notStrictEqual(a.user.id, b.user.id);
    assert.strictEqual(a.user.onboarding_completed, true);
    assert.ok(Number(a.user.daily_calories_goal) > 0);
    assert.ok(!('password_hash' in a.user));
    assert.ok(!('mfa_secret_enc' in a.user));

    // Ontem sempre tem as 3 refeições (hoje depende do horário atual).
    const res = await request(app)
      .get(`/api/meals/today?date=${dayOffset(1)}`)
      .set('Authorization', `Bearer ${a.token}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.length, 3);
  });

  it('bloqueia senha, e-mail, MFA e exclusão do visitante, mas permite registrar refeição', async () => {
    const g = await startDemo();
    const auth = { Authorization: `Bearer ${g.token}` };

    for (const r of [
      request(app).put('/api/users/me').set(auth).send({ name: 'Outro' }),
      request(app).delete('/api/users/me').set(auth).send({ password: 'x' }),
      request(app).post('/api/users/me/mfa/setup').set(auth).send({}),
    ]) {
      const res = await r;
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.code, 'DEMO_READ_ONLY');
    }

    const { rows } = await pool.query<{ id: string }>(
      'SELECT id FROM foods WHERE user_id IS NULL AND active LIMIT 1',
    );
    const meal = await request(app)
      .post('/api/meals')
      .set(auth)
      .send({
        name: 'Lanche',
        mealTime: new Date(Date.now() - 60_000).toISOString(),
        items: [{ foodId: rows[0].id, quantity: 100 }],
      });
    assert.strictEqual(meal.status, 201);
  });

  it('apaga visitantes com mais de 24h, inclusive com alimento próprio em refeição', async () => {
    const old = await startDemo();
    const auth = { Authorization: `Bearer ${old.token}` };
    const food = await request(app)
      .post('/api/foods/custom')
      .set(auth)
      .send({ name: 'Alimento do visitante', calories: 100, proteins: 5, carbs: 10, fats: 2 });
    assert.strictEqual(food.status, 201);
    const meal = await request(app)
      .post('/api/meals')
      .set(auth)
      .send({
        name: 'Com alimento próprio',
        mealTime: new Date(Date.now() - 60_000).toISOString(),
        items: [{ foodId: food.body.data.id, quantity: 100 }],
      });
    assert.strictEqual(meal.status, 201);

    await pool.query("UPDATE users SET created_at = now() - interval '25 hours' WHERE id = $1", [
      old.user.id,
    ]);
    await startDemo();

    const left = await pool.query('SELECT 1 FROM users WHERE id = $1', [old.user.id]);
    assert.strictEqual(left.rowCount, 0);
  });

  it('responde 503 quando o teto de visitantes é atingido', async () => {
    await assert.rejects(
      () => createGuestSession({ maxActive: 0 }),
      (e: Error & { statusCode?: number; code?: string }) =>
        e.statusCode === 503 && e.code === 'DEMO_UNAVAILABLE',
    );
  });

  it('cliques simultâneos não passam do teto (trava no banco)', async () => {
    const active = await pool.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM users WHERE is_guest',
    );
    const oneSlotLeft = Number(active.rows[0].count) + 1;

    // Outro clique segura a trava e ocupa a última vaga antes de confirmar.
    const other = await pool.connect();
    try {
      await other.query('BEGIN');
      await other.query('SELECT pg_advisory_xact_lock(hashtext($1))', [GuestModel.GUEST_SIGNUP_LOCK]);
      await other.query(
        `INSERT INTO users (name, email, password_hash, terms_accepted_at, email_verified_at, is_guest)
         VALUES ('Visitante', $1, 'x', now(), now(), true)`,
        [`demo-race-a-${Date.now()}@visitante.invalid`],
      );
      const pending = GuestModel.createGuestUserWithinCap(
        `demo-race-b-${Date.now()}@visitante.invalid`,
        'x',
        oneSlotLeft,
      );
      await new Promise((r) => setTimeout(r, 200));
      await other.query('COMMIT');
      assert.strictEqual(await pending, null);
    } finally {
      other.release();
    }
  });

  it('cria a conta mesmo sem alimentos do seed no catálogo', async () => {
    const found = await GuestModel.findGlobalFoodIdsByNames(['__inexistente__']);
    assert.strictEqual(found.size, 0);
    const session = await createGuestSession({ seedFoodNames: [] });
    assert.ok(session.token);
    assert.strictEqual(session.user.onboarding_completed, true);
  });

  it('não bloqueia alteração de perfil de usuário comum', async () => {
    const common = await createVerifiedUser({ email: `tester-guest-common-${Date.now()}@example.com` });
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${common.token}`)
      .send({ name: 'Outro' });
    assert.strictEqual(res.status, 200);
  });
});
