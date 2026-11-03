import * as AuthModel from '../models/auth.model.js';
import * as UserModel from '../models/user.model.js';
import { signAuthToken } from '../utils/jwt.js';
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  matchTotpCounter,
  otpauthUrl,
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
  if (/^\d{6}$/.test(code)) {
    const counter = matchTotpCounter(decryptSecret(state.mfa_secret_enc), code);
    // V-4: cada passo TOTP vale uma vez só.
    return counter !== null && AuthModel.claimTotpCounter(userId, counter);
  }
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

/**
 * Confirma o primeiro código, ativa o MFA e devolve os códigos de recuperação (exibidos uma vez)
 * e um token novo: as outras sessões caem (V-2).
 */
export async function enableMfa(
  userId: string,
  code: string,
  persistentSession = true,
): Promise<{ recoveryCodes: string[]; token: string }> {
  const state = await AuthModel.getMfaState(userId);
  if (!state?.mfa_secret_enc || state.mfa_enabled_at)
    fail('Inicie a configuração do MFA primeiro.', 400);
  const counter = matchTotpCounter(decryptSecret(state.mfa_secret_enc), code);
  if (counter === null) fail('Código inválido.', 400);
  const codes = generateRecoveryCodes();
  const tokenVersion = await AuthModel.enableMfa(userId, codes.map(hashRecoveryCode), counter);
  return { recoveryCodes: codes, token: signAuthToken(userId, tokenVersion, persistentSession) };
}

/** Desativa o MFA; as outras sessões caem e a atual recebe token novo (V-2). */
export async function disableMfa(
  userId: string,
  code: string,
  persistentSession = true,
): Promise<{ token: string }> {
  if (!(await verifyMfaCode(userId, code))) fail('Código inválido.', 400);
  const tokenVersion = await AuthModel.disableMfa(userId);
  return { token: signAuthToken(userId, tokenVersion, persistentSession) };
}
