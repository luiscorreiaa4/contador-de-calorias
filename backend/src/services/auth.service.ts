import bcrypt from 'bcrypt';
import type { PoolClient } from 'pg';
import { pool } from '../database/pool.js';
import { env } from '../config/env.js';
import { structuredLog } from '../config/logger.js';
import * as UserModel from '../models/user.model.js';
import * as AuthModel from '../models/auth.model.js';
import { signAuthToken } from '../utils/jwt.js';
import {
  MAX_RESET_REQUESTS_PER_HOUR,
  MAX_VERIFICATION_ATTEMPTS,
  MAX_VERIFICATION_SENDS_PER_HOUR,
  PASSWORD_RESET_TTL_MS,
  RESEND_COOLDOWN_MS,
  VERIFICATION_CODE_TTL_MS,
  generateResetToken,
  generateVerificationCode,
  hashResetToken,
  hashVerificationCode,
  normalizeEmail,
  safeCompareHex,
} from '../utils/authTokens.js';
import { getMailer } from '../mail/mailer.js';
import {
  existingAccountEmail,
  passwordChangedEmail,
  passwordResetEmail,
  verificationCodeEmail,
  type EmailTemplate,
} from '../mail/templates.js';
import type {
  AuthResponse,
  LoginUserDTO,
  RegisterUserDTO,
  ResendVerificationCodeDTO,
  ResetPasswordDTO,
  User,
  UserWithoutPassword,
  VerifyEmailDTO,
  ForgotPasswordDTO,
} from '@caloriesync/shared';

interface AuthServiceError extends Error {
  statusCode?: number;
  code?: string;
}

function fail(message: string, statusCode: number, code?: string): never {
  const error: AuthServiceError = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  throw error;
}

function saltRounds(): number {
  return process.env.NODE_ENV === 'test' ? 1 : 10;
}

function withoutPassword(user: User): UserWithoutPassword {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// Hash bcrypt estático para mitigar timing attacks na enumeração de usuários (PC-08 / SEC-005)
const DUMMY_HASH = '$2b$10$7EqJtq98hPqEX7fNZaFWoO9m5N9fKqy4i4U0p1W6eG5q7Xv6eJ8mK';

/** Envia sem await, depois do commit. Falhas são registradas sem segredos (A4/A10). */
function sendMailInBackground(to: string, template: EmailTemplate): void {
  void getMailer()
    .send({ to, subject: template.subject, text: template.text, html: template.html })
    .catch((error: unknown) => {
      structuredLog('error', 'auth_email_delivery_failed', {
        error: error instanceof Error ? error.message : 'unknown_error',
      });
    });
}

interface VerificationTarget {
  id: string;
  name: string;
  email: string;
}

/**
 * Emite novo código se o cooldown e o teto por e-mail permitirem.
 * Retorna false quando o envio foi suprimido pelos limites.
 */
async function issueVerificationCode(user: VerificationTarget): Promise<boolean> {
  const now = new Date();
  const latest = await AuthModel.findLatestVerificationCode(user.id);
  if (latest && now.getTime() - new Date(latest.created_at).getTime() < RESEND_COOLDOWN_MS) {
    return false;
  }

  const windowStart = new Date(now.getTime() - 60 * 60 * 1000);
  const sentInWindow = await AuthModel.countVerificationCodesSince(user.id, windowStart);
  if (sentInWindow >= MAX_VERIFICATION_SENDS_PER_HOUR) {
    return false;
  }

  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(code);
  const expiresAt = new Date(now.getTime() + VERIFICATION_CODE_TTL_MS);

  const client = await pool.connect();
  let finished = false;
  try {
    await client.query('BEGIN');
    await AuthModel.invalidateVerificationCodes(user.id, client);
    await AuthModel.insertVerificationCode(user.id, codeHash, expiresAt, client);
    await client.query('COMMIT');
    finished = true;
  } catch (error) {
    if (!finished) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  sendMailInBackground(user.email, verificationCodeEmail(code, user.name));
  return true;
}

async function overwriteAndIssueCode(user: User, name: string, passwordHash: string): Promise<void> {
  const client = await pool.connect();
  let updated: boolean | undefined;
  let finished = false;
  try {
    await client.query('BEGIN');
    updated = await AuthModel.overwriteUnverifiedUser(user.id, name, passwordHash, client);
    await client.query('COMMIT');
    finished = true;
  } catch (error) {
    if (!finished) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  if (updated) {
    await issueVerificationCode({ id: user.id, name: name.trim(), email: user.email });
  }
}

/**
 * POST /api/auth/register (A4/A6): resposta sempre genérica (202), sem sessão.
 */
export async function register(data: RegisterUserDTO): Promise<void> {
  const email = normalizeEmail(data.email);
  const passwordHash = await bcrypt.hash(data.password, saltRounds());
  const existing = await UserModel.findUserByEmail(email);

  if (existing) {
    if (existing.email_verified_at) {
      // Não altera nada; avisa o dono da conta já verificada.
      sendMailInBackground(existing.email, existingAccountEmail(existing.name));
      return;
    }

    await overwriteAndIssueCode(existing, data.name, passwordHash);
    return;
  }

  try {
    const created = await UserModel.createUser(data.name, email, passwordHash, new Date());
    await issueVerificationCode({ id: created.id, name: created.name, email: created.email });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    // Corrida de cadastro: não revela nada e mantém a resposta genérica.
    if (pgError?.code !== '23505') throw error;
  }
}

/**
 * POST /api/auth/login (A1/A5/A8): só conta verificada recebe JWT.
 */
export async function login(data: LoginUserDTO): Promise<AuthResponse> {
  const email = normalizeEmail(data.email);
  const user = await UserModel.findUserByEmail(email);

  if (!user) {
    // Mantém o custo do bcrypt para não revelar existência da conta (PC-08).
    await bcrypt.compare(data.password, DUMMY_HASH);
    fail('E-mail ou senha incorretos.', 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
  if (!isPasswordValid) {
    fail('E-mail ou senha incorretos.', 401);
  }

  if (!user.email_verified_at) {
    void issueVerificationCode(user).catch((error: unknown) => {
      structuredLog('error', 'auth_verification_email_failed', {
        error: error instanceof Error ? error.message : 'unknown_error',
      });
    });
    fail('Confirme seu e-mail para entrar.', 403, 'EMAIL_NOT_VERIFIED');
  }

  return {
    user: withoutPassword(user),
    token: signAuthToken(user.id, Number(user.token_version)),
  };
}

/** Reemite código para conta ainda não verificada (ex.: após troca de e-mail). */
export async function sendVerificationCodeForUser(userId: string): Promise<boolean> {
  const user = await UserModel.findFullUserById(userId);
  if (!user || user.email_verified_at) return false;
  return issueVerificationCode(user);
}

/**
 * POST /api/auth/verify-email (A2/A6): valida o código, marca o e-mail e emite sessão.
 */
export async function verifyEmail(data: VerifyEmailDTO): Promise<AuthResponse> {
  const email = normalizeEmail(data.email);
  const user = await UserModel.findUserByEmail(email);
  if (!user) {
    fail('Código inválido ou expirado.', 400, 'INVALID_VERIFICATION_CODE');
  }

  const client = await pool.connect();
  let finished = false;
  try {
    await client.query('BEGIN');
    const codeRow = await AuthModel.findActiveVerificationCodeForUpdate(user.id, client);

    if (
      !codeRow ||
      new Date(codeRow.expires_at).getTime() <= Date.now() ||
      Number(codeRow.attempts) >= MAX_VERIFICATION_ATTEMPTS
    ) {
      await client.query('ROLLBACK');
      finished = true;
      fail('Código inválido ou expirado.', 400, 'INVALID_VERIFICATION_CODE');
    }

    const matches = safeCompareHex(hashVerificationCode(data.code), codeRow.code_hash);
    if (!matches) {
      await AuthModel.incrementVerificationAttempts(codeRow.id, client);
      await client.query('COMMIT');
      finished = true;
      fail('Código inválido ou expirado.', 400, 'INVALID_VERIFICATION_CODE');
    }

    await AuthModel.consumeVerificationCode(codeRow.id, client);
    await AuthModel.markEmailVerified(user.id, client);
    await client.query('COMMIT');
    finished = true;
  } catch (error) {
    if (!finished) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const verifiedUser = await UserModel.findFullUserById(user.id);
  if (!verifiedUser) {
    fail('Código inválido ou expirado.', 400, 'INVALID_VERIFICATION_CODE');
  }

  return {
    user: withoutPassword(verifiedUser),
    token: signAuthToken(verifiedUser.id, Number(verifiedUser.token_version)),
  };
}

/**
 * POST /api/auth/resend-code (A2/A4): resposta genérica independente da existência da conta.
 */
export async function resendCode(data: ResendVerificationCodeDTO): Promise<void> {
  const user = await UserModel.findUserByEmail(normalizeEmail(data.email));
  if (!user || user.email_verified_at) return;

  await issueVerificationCode(user);
}

/**
 * POST /api/auth/forgot-password (A3/A4/A9): só conta existente e verificada recebe link.
 */
export async function forgotPassword(data: ForgotPasswordDTO): Promise<void> {
  const user = await UserModel.findUserByEmail(normalizeEmail(data.email));
  if (!user || !user.email_verified_at) return;

  const windowStart = new Date(Date.now() - 60 * 60 * 1000);
  const requestsInWindow = await AuthModel.countPasswordResetTokensSince(user.id, windowStart);
  if (requestsInWindow >= MAX_RESET_REQUESTS_PER_HOUR) return;

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  const client = await pool.connect();
  let finished = false;
  try {
    await client.query('BEGIN');
    await AuthModel.invalidatePasswordResetTokens(user.id, client);
    await AuthModel.insertPasswordResetToken(user.id, tokenHash, expiresAt, client);
    await client.query('COMMIT');
    finished = true;
  } catch (error) {
    if (!finished) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const resetUrl = `${env.APP_BASE_URL}/redefinir-senha#token=${token}`;
  sendMailInBackground(user.email, passwordResetEmail(resetUrl, user.name));
}

/**
 * POST /api/auth/reset-password (A3/A7/A8): transação única, sem auto-login.
 */
export async function resetPassword(data: ResetPasswordDTO): Promise<void> {
  const tokenHash = hashResetToken(data.token);
  const passwordHash = await bcrypt.hash(data.password, saltRounds());

  const client: PoolClient = await pool.connect();
  let finished = false;
  let resetUserId: string | undefined;
  try {
    await client.query('BEGIN');
    const tokenRow = await AuthModel.findActivePasswordResetTokenForUpdate(tokenHash, client);
    if (!tokenRow) {
      await client.query('ROLLBACK');
      finished = true;
      fail('Link inválido ou expirado.', 400, 'INVALID_RESET_TOKEN');
    }

    resetUserId = tokenRow.user_id;
    await AuthModel.updatePasswordAndIncrementTokenVersion(tokenRow.user_id, passwordHash, client);
    await AuthModel.consumePasswordResetToken(tokenRow.id, client);
    await client.query('COMMIT');
    finished = true;
  } catch (error) {
    if (!finished) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  if (resetUserId) {
    const user = await UserModel.findFullUserById(resetUserId);
    if (user) {
      sendMailInBackground(user.email, passwordChangedEmail(user.name));
    }
  }
}
