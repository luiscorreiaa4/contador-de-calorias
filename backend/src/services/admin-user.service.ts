import { pool } from '../database/pool.js';
import * as AdminAuditModel from '../models/admin-audit.model.js';

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at?: Date;
}

/**
 * Promove um usuário existente a administrador via CLI (D-22 / B2 / B3).
 * Exige conta com e-mail verificado, incrementa token_version e grava auditoria (actor_type 'cli').
 */
export async function promoteUserToAdmin(email: string): Promise<AdminUserSummary> {
  const normalizedEmail = email.trim().toLowerCase();

  const userRes = await pool.query<{
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    email_verified_at: Date | null;
    token_version: number;
  }>(
    'SELECT id, name, email, role, email_verified_at, token_version FROM users WHERE lower(email) = lower($1)',
    [normalizedEmail]
  );

  if (userRes.rows.length === 0) {
    throw new Error(`Usuário não encontrado: ${normalizedEmail}`);
  }

  const user = userRes.rows[0];

  if (!user.email_verified_at) {
    throw new Error(
      `Operação recusada: o usuário ${normalizedEmail} não possui e-mail verificado. É necessário confirmar o e-mail antes de se tornar administrador.`
    );
  }

  if (user.role === 'admin') {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'admin',
    };
  }

  const client = await pool.connect();
  let finished = false;

  try {
    await client.query('BEGIN');

    const updateRes = await client.query<{
      id: string;
      name: string;
      email: string;
      role: 'admin';
    }>(
      `UPDATE users
       SET role = 'admin',
           token_version = token_version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name, email, role`,
      [user.id]
    );

    const updatedUser = updateRes.rows[0];

    await AdminAuditModel.recordAuditLog(client, {
      actor_user_id: null,
      actor_type: 'cli',
      action: 'promote_admin',
      entity_type: 'user',
      entity_id: user.id,
      before: { role: user.role, email: user.email },
      after: { role: 'admin', email: user.email },
    });

    await client.query('COMMIT');
    finished = true;

    return updatedUser;
  } catch (error) {
    if (!finished) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Rebaixa um administrador para usuário comum via CLI (D-22 / B3).
 * Recusa a operação caso este seja o único administrador existente no banco.
 * Incrementa token_version e grava auditoria (actor_type 'cli').
 */
export async function demoteAdminToUser(email: string): Promise<AdminUserSummary> {
  const normalizedEmail = email.trim().toLowerCase();

  const client = await pool.connect();
  let finished = false;

  try {
    await client.query('BEGIN');

    // Lock na tabela para checagem segura de concorrência
    const userRes = await client.query<{
      id: string;
      name: string;
      email: string;
      role: 'user' | 'admin';
    }>(
      'SELECT id, name, email, role FROM users WHERE lower(email) = lower($1) FOR UPDATE',
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      throw new Error(`Usuário não encontrado: ${normalizedEmail}`);
    }

    const user = userRes.rows[0];

    if (user.role !== 'admin') {
      throw new Error(`O usuário ${normalizedEmail} já não possui papel de administrador.`);
    }

    // Trava de segurança: demote recusa se deixaria ZERO admins
    const countRes = await client.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
    );
    const totalAdmins = parseInt(countRes.rows[0].count, 10);

    if (totalAdmins <= 1) {
      throw new Error(
        'Operação recusada: não é permitido rebaixar o único administrador do sistema. Deve haver ao menos um administrador ativo.'
      );
    }

    const updateRes = await client.query<{
      id: string;
      name: string;
      email: string;
      role: 'user';
    }>(
      `UPDATE users
       SET role = 'user',
           token_version = token_version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name, email, role`,
      [user.id]
    );

    const updatedUser = updateRes.rows[0];

    await AdminAuditModel.recordAuditLog(client, {
      actor_user_id: null,
      actor_type: 'cli',
      action: 'demote_admin',
      entity_type: 'user',
      entity_id: user.id,
      before: { role: 'admin', email: user.email },
      after: { role: 'user', email: user.email },
    });

    await client.query('COMMIT');
    finished = true;

    return updatedUser;
  } catch (error) {
    if (!finished) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Lista todos os administradores cadastrados (D-22 / B3).
 * Nunca imprime senhas ou hashes.
 */
export async function listAdmins(): Promise<AdminUserSummary[]> {
  const result = await pool.query<AdminUserSummary>(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE role = 'admin'
     ORDER BY created_at ASC`
  );
  return result.rows;
}
