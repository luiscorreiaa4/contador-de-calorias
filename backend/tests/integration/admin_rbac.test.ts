import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser, createVerifiedAdmin } from '../helpers/auth.js';

describe('RBAC & Role-based Authorization (D-22 / B1 / B11)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-rbac-%');
  });

  it('1. Todo usuário criado deve ter role padrão "user"', async () => {
    const user = await createVerifiedUser({
      name: 'Usuário Comum',
      email: `tester-rbac-default-${Date.now()}@example.com`,
    });

    assert.strictEqual(user.role, 'user', 'O papel retornado pelo helper/banco deve ser "user"');

    const res = await pool.query<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [user.id]
    );
    assert.strictEqual(res.rows[0].role, 'user', 'A coluna role no Postgres deve ser "user"');

    // Valida que o payload de GET /api/users/me inclui role
    const profileRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${user.token}`);

    assert.strictEqual(profileRes.status, 200);
    assert.strictEqual(profileRes.body.data.role, 'user');
  });

  it('2. Constraint CHECK users_role_check deve rejeitar papéis inválidos', async () => {
    const user = await createVerifiedUser({
      email: `tester-rbac-check-${Date.now()}@example.com`,
    });

    await assert.rejects(
      async () => {
        await pool.query("UPDATE users SET role = 'superadmin' WHERE id = $1", [user.id]);
      },
      (err: unknown) => {
        const pgErr = err as { code?: string; constraint?: string };
        return pgErr.code === '23514' && pgErr.constraint === 'users_role_check';
      },
      'Deveria lançar violação de check constraint para role inválido'
    );
  });

  it('3. Rebaixamento de admin para user vale imediatamente na requisição seguinte sem esperar expiração do JWT (B1)', async () => {
    const admin = await createVerifiedAdmin({
      name: 'Admin Teste',
      email: `tester-rbac-demote-${Date.now()}@example.com`,
    });

    assert.strictEqual(admin.role, 'admin');

    // Montamos uma rota temporária ou testamos o middleware requireAdmin
    // Criamos uma requisição para a rota de perfil e confirmamos que retorna role = 'admin'
    const adminProfile = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${admin.token}`);

    assert.strictEqual(adminProfile.status, 200);
    assert.strictEqual(adminProfile.body.data.role, 'admin');

    // Rebaixamos o admin direto no banco (sem alterar token_version e sem reemitir token)
    await pool.query("UPDATE users SET role = 'user' WHERE id = $1", [admin.id]);

    // O token JWT continua com o mesmo tv, mas na requisição seguinte o middleware consulta role do banco
    const demotedProfile = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${admin.token}`);

    assert.strictEqual(demotedProfile.status, 200);
    assert.strictEqual(demotedProfile.body.data.role, 'user', 'Na requisição seguinte o role deve ser "user"');
  });
});
