import * as AuthModel from '../models/auth.model.js';
import * as UserModel from '../models/user.model.js';
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  otpauthUrl,
  verifyTotp,
} from '../utils/totp.js';

interface MfaServiceError extends Error {
  statusCode?: number;
}

function fail(message: string, statusCode: number): never {
  const error: MfaServiceError = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

/** Valida TOTP ou código de recuperação (este é consumido). Usado no login e no disable. */
export async function verifyMfaCode(userId: string, code: string): Promise<boolean> {
  const state = await AuthModel.getMfaState(userId);
  if (!state?.mfa_enabled_at || !state.mfa_secret_enc) return false;
  if (/^\d{6}$/.test(code)) return verifyTotp(decryptSecret(state.mfa_secret_enc), code);
  return AuthModel.consumeRecoveryCode(userId, hashRecoveryCode(code));
}

export async function setupMfa(userId: string): Promise<{ secret: string; otpauth_url: string }> {
  const user = await UserModel.findUserById(userId);
  if (!user) fail('Usuário não encontrado.', 404);
  const secret = generateTotpSecret();
  if (!(await AuthModel.savePendingMfaSecret(userId, encryptSecret(secret)))) {
    fail('MFA já está ativo.', 400);
  }
  return { secret, otpauth_url: otpauthUrl(user.email, secret) };
}

/** Confirma o primeiro código, ativa o MFA e devolve os códigos de recuperação (exibidos uma vez). */
export async function enableMfa(userId: string, code: string): Promise<string[]> {
  const state = await AuthModel.getMfaState(userId);
  if (!state?.mfa_secret_enc || state.mfa_enabled_at) fail('Inicie a configuração do MFA primeiro.', 400);
  if (!verifyTotp(decryptSecret(state.mfa_secret_enc), code)) fail('Código inválido.', 400);
  const codes = generateRecoveryCodes();
  await AuthModel.enableMfa(userId, codes.map(hashRecoveryCode));
  return codes;
}

export async function disableMfa(userId: string, code: string): Promise<void> {
  if (!(await verifyMfaCode(userId, code))) fail('Código inválido.', 400);
  await AuthModel.disableMfa(userId);
}
