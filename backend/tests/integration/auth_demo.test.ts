import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

describe('blockGuestUser (conta de visitante somente leitura)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-guest-%');
  });

  it('bloqueia alteração de perfil do visitante e não bloqueia usuário comum', async () => {
    const guest = await createVerifiedUser({ email: `tester-guest-${Date.now()}@example.com` });
    const common = await createVerifiedUser({ email: `tester-guest-common-${Date.now()}@example.com` });
    await pool.query('UPDATE users SET is_guest = true WHERE id = $1', [guest.id]);

    const blocked = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${guest.token}`)
      .send({ name: 'Outro' });
    assert.strictEqual(blocked.status, 403);
    assert.strictEqual(blocked.body.code, 'DEMO_READ_ONLY');

    const allowed = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${common.token}`)
      .send({ name: 'Outro' });
    assert.notStrictEqual(allowed.body.code, 'DEMO_READ_ONLY');
  });
});
