import type { PoolClient } from 'pg';
import { pool } from '../database/pool.js';
import { MAX_VERIFICATION_ATTEMPTS } from '../utils/authTokens.js';

type Db = Pick<PoolClient, 'query'>;

function db(client?: PoolClient): Db {
  return client ?? pool;
}

export interface VerificationCodeRow {
  id: string;
  user_id: string;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  created_at: Date;
  consumed_at: Date | null;
}

export interface PasswordResetRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

/**
 * Invalida todos os códigos ainda ativos do usuário (novo código torna os anteriores inúteis).
 */
export async function invalidateVerificationCodes(userId: string, client?: PoolClient): Promise<void> {
  await db(client).query(
    `UPDATE email_verification_codes
        SET consumed_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND consumed_at IS NULL`,
    [userId]
  );
}

export async function insertVerificationCode(
  userId: string,
  codeHash: string,
  expiresAt: Date,
  client?: PoolClient
): Promise<VerificationCodeRow> {
  const result = await db(client).query<VerificationCodeRow>(
    `INSERT INTO email_verification_codes (user_id, code_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, code_hash, expires_at, attempts, created_at, consumed_at`,
    [userId, codeHash, expiresAt]
  );
  return result.rows[0];
}

/** Código ativo mais recente, com lock para validação transacional. */
export async function findActiveVerificationCodeForUpdate(
  userId: string,
  client: PoolClient
): Promise<VerificationCodeRow | null> {
  const result = await client.query<VerificationCodeRow>(
    `SELECT id, user_id, code_hash, expires_at, attempts, created_at, consumed_at
       FROM email_verification_codes
      WHERE user_id = $1 AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function incrementVerificationAttempts(
  codeId: string,
  client: PoolClient
): Promise<number> {
  const result = await client.query<{ attempts: number }>(
    `UPDATE email_verification_codes
        SET attempts = attempts + 1,
            consumed_at = CASE WHEN attempts + 1 >= $2 THEN CURRENT_TIMESTAMP ELSE consumed_at END
      WHERE id = $1
      RETURNING attempts`,
    [codeId, MAX_VERIFICATION_ATTEMPTS]
  );
  return Number(result.rows[0]?.attempts ?? 0);
}

export async function consumeVerificationCode(codeId: string, client: PoolClient): Promise<void> {
  await client.query(
    `UPDATE email_verification_codes
        SET consumed_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND consumed_at IS NULL`,
    [codeId]
  );
}

export async function findLatestVerificationCode(userId: string): Promise<VerificationCodeRow | null> {
  const result = await pool.query<VerificationCodeRow>(
    `SELECT id, user_id, code_hash, expires_at, attempts, created_at, consumed_at
       FROM email_verification_codes
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function countVerificationCodesSince(userId: string, since: Date): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM email_verification_codes
      WHERE user_id = $1 AND created_at >= $2`,
    [userId, since]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function invalidatePasswordResetTokens(userId: string, client?: PoolClient): Promise<void> {
  await db(client).query(
    `UPDATE password_reset_tokens
        SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );
}

export async function insertPasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  client?: PoolClient
): Promise<PasswordResetRow> {
  const result = await db(client).query<PasswordResetRow>(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token_hash, expires_at, used_at, created_at`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

export async function countPasswordResetTokensSince(userId: string, since: Date): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM password_reset_tokens
      WHERE user_id = $1 AND created_at >= $2`,
    [userId, since]
  );
  return Number(result.rows[0]?.count ?? 0);
}

/** Token de reset válido (não usado e não expirado), com lock transacional. */
export async function findActivePasswordResetTokenForUpdate(
  tokenHash: string,
  client: PoolClient
): Promise<PasswordResetRow | null> {
  const result = await client.query<PasswordResetRow>(
    `SELECT id, user_id, token_hash, expires_at, used_at, created_at
       FROM password_reset_tokens
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
      FOR UPDATE`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function consumePasswordResetToken(tokenId: string, client: PoolClient): Promise<void> {
  await client.query(
    `UPDATE password_reset_tokens
        SET used_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND used_at IS NULL`,
    [tokenId]
  );
}

export async function markEmailVerified(userId: string, client?: PoolClient): Promise<void> {
  await db(client).query(
    `UPDATE users
        SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
    [userId]
  );
}

/**
 * Atualiza o hash e incrementa `token_version` atomicamente, devolvendo a nova versão.
 */
export async function updatePasswordAndIncrementTokenVersion(
  userId: string,
  passwordHash: string,
  client: PoolClient
): Promise<number> {
  const result = await client.query<{ token_version: number }>(
    `UPDATE users
        SET password_hash = $2,
            token_version = token_version + 1,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING token_version`,
    [userId, passwordHash]
  );
  return Number(result.rows[0]?.token_version ?? 0);
}

export async function incrementTokenVersion(userId: string, client: PoolClient): Promise<number> {
  const result = await client.query<{ token_version: number }>(
    `UPDATE users
        SET token_version = token_version + 1,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING token_version`,
    [userId]
  );
  return Number(result.rows[0]?.token_version ?? 0);
}

export interface UserAuthContext {
  token_version: number;
  role: 'user' | 'admin';
}

export async function getUserAuthContext(userId: string): Promise<UserAuthContext | null> {
  const result = await pool.query<{ token_version: number; role: 'user' | 'admin' }>(
    'SELECT token_version, role FROM users WHERE id = $1',
    [userId]
  );
  if (!result.rows[0]) return null;
  return {
    token_version: Number(result.rows[0].token_version),
    role: result.rows[0].role,
  };
}

export async function getTokenVersion(userId: string): Promise<number | null> {
  const ctx = await getUserAuthContext(userId);
  return ctx ? ctx.token_version : null;
}

/**
 * Sobrescreve nome/hash de uma conta ainda não verificada. Retorna false se a conta
 * tiver sido verificada concorrentemente.
 */
export async function overwriteUnverifiedUser(
  userId: string,
  name: string,
  passwordHash: string,
  client?: PoolClient
): Promise<boolean> {
  const result = await db(client).query(
    `UPDATE users
        SET name = $2,
            password_hash = $3,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND email_verified_at IS NULL`,
    [userId, name.trim(), passwordHash]
  );
  return (result.rowCount ?? 0) > 0;
}
