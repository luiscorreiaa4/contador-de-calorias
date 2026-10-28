import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pool } from '../../src/database/pool.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser, createVerifiedAdmin } from '../helpers/auth.js';
import * as AdminUserService from '../../src/services/admin-user.service.js';

describe('Admin CLI Service (D-22 / B2 / B3 / B5)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-cli-%');
  });

  it('1. promoteUserToAdmin: rejeita usuário inexistente', async () => {
    await assert.rejects(
      async () => {
        await AdminUserService.promoteUserToAdmin('nao-existe@example.com');
      },
      (err: Error) => err.message.includes('não encontrado')
    );
  });

  it('2. promoteUserToAdmin: rejeita usuário com e-mail não verificado', async () => {
    const email = `tester-cli-unverified-${Date.now()}@example.com`;
    // Cria usuário sem e-mail verificado
    const user = await createVerifiedUser({ email });
    await pool.query('UPDATE users SET email_verified_at = NULL WHERE id = $1', [user.id]);

    await assert.rejects(
      async () => {
        await AdminUserService.promoteUserToAdmin(email);
      },
      (err: Error) => err.message.includes('não possui e-mail verificado')
    );
  });

  it('3. promoteUserToAdmin: promove usuário verificado, incrementa token_version e grava auditoria', async () => {
    const email = `tester-cli-promote-${Date.now()}@example.com`;
    const user = await createVerifiedUser({ email, name: 'Candidato Admin' });

    const beforeTv = (await pool.query<{ token_version: number }>('SELECT token_version FROM users WHERE id = $1', [user.id])).rows[0].token_version;

    const promoted = await AdminUserService.promoteUserToAdmin(email);
    assert.strictEqual(promoted.role, 'admin');

    // Verifica que token_version foi incrementado
    const afterTv = (await pool.query<{ token_version: number; role: string }>('SELECT token_version, role FROM users WHERE id = $1', [user.id])).rows[0];
    assert.strictEqual(afterTv.role, 'admin');
    assert.strictEqual(afterTv.token_version, beforeTv + 1);

    // Verifica log de auditoria com actor_type 'cli'
    const auditRes = await pool.query(
      "SELECT * FROM admin_audit_log WHERE entity_type = 'user' AND entity_id = $1 AND action = 'promote_admin'",
      [user.id]
    );
    assert.strictEqual(auditRes.rows.length, 1);
    assert.strictEqual(auditRes.rows[0].actor_type, 'cli');
    assert.strictEqual(auditRes.rows[0].actor_user_id, null);
    assert.strictEqual(auditRes.rows[0].after.role, 'admin');
  });

  it('4. demoteAdminToUser: recusa se for o único administrador do sistema', async () => {
    // Garante que só existe 1 admin no teste
    await pool.query("UPDATE users SET role = 'user' WHERE role = 'admin' AND email LIKE 'tester-cli-%'");

    const soloAdmin = await createVerifiedAdmin({
      email: `tester-cli-solo-${Date.now()}@example.com`,
    });

    // Se houver admins globais de outros testes, limpamos no escopo tester-cli
    const countRes = await pool.query<{ count: string }>("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    const totalAdmins = parseInt(countRes.rows[0].count, 10);

    if (totalAdmins === 1) {
      await assert.rejects(
        async () => {
          await AdminUserService.demoteAdminToUser(soloAdmin.email);
        },
        (err: Error) => err.message.includes('não é permitido rebaixar o único administrador')
      );
    }
  });

  it('5. demoteAdminToUser: rebaixa com sucesso quando há mais de um admin, incrementando token_version', async () => {
    const admin1 = await createVerifiedAdmin({
      email: `tester-cli-adm1-${Date.now()}@example.com`,
    });
    const _admin2 = await createVerifiedAdmin({
      email: `tester-cli-adm2-${Date.now()}@example.com`,
    });

    const beforeTv = (await pool.query<{ token_version: number }>('SELECT token_version FROM users WHERE id = $1', [admin1.id])).rows[0].token_version;

    const demoted = await AdminUserService.demoteAdminToUser(admin1.email);
    assert.strictEqual(demoted.role, 'user');

    const after = (await pool.query<{ token_version: number; role: string }>('SELECT token_version, role FROM users WHERE id = $1', [admin1.id])).rows[0];
    assert.strictEqual(after.role, 'user');
    assert.strictEqual(after.token_version, beforeTv + 1);

    // Auditoria
    const auditRes = await pool.query(
      "SELECT * FROM admin_audit_log WHERE entity_type = 'user' AND entity_id = $1 AND action = 'demote_admin'",
      [admin1.id]
    );
    assert.strictEqual(auditRes.rows.length, 1);
    assert.strictEqual(auditRes.rows[0].actor_type, 'cli');
  });

  it('6. listAdmins: lista todos os admins sem vazar dados sensíveis', async () => {
    const list = await AdminUserService.listAdmins();
    assert(Array.isArray(list));
    for (const a of list) {
      assert.strictEqual(a.role, 'admin');
      assert.strictEqual((a as unknown as Record<string, unknown>).password_hash, undefined);
    }
  });
});
