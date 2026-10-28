import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/** Quantidade de dígitos do código de verificação (A2). */
export const VERIFICATION_CODE_LENGTH = 6;
/** Validade do código de verificação: 15 minutos. */
export const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
/** Validade do link de redefinição: 30 minutos. */
export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
/** Intervalo mínimo entre reenvios de código. */
export const RESEND_COOLDOWN_MS = 60 * 1000;
/** Máximo de tentativas de validação por código. */
export const MAX_VERIFICATION_ATTEMPTS = 5;
/** Teto de códigos enviados por e-mail em uma hora. */
export const MAX_VERIFICATION_SENDS_PER_HOUR = 5;
/** Teto de pedidos de reset por e-mail em uma hora. */
export const MAX_RESET_REQUESTS_PER_HOUR = 5;

/**
 * Normaliza e-mail para consulta/persistência: trim + minúsculas, sem remover "+tag" (A11).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Gera um código numérico de 6 dígitos com entropia criptográfica e zeros à esquerda.
 */
export function generateVerificationCode(): string {
  return randomInt(0, 10 ** VERIFICATION_CODE_LENGTH)
    .toString()
    .padStart(VERIFICATION_CODE_LENGTH, '0');
}

/**
 * HMAC-SHA256 do código com a pepera dedicada. Só o HMAC é persistido (A2).
 */
export function hashVerificationCode(code: string, pepper: string = env.AUTH_TOKEN_PEPPER): string {
  return createHmac('sha256', pepper).update(code, 'utf8').digest('hex');
}

/**
 * Gera o token opaco de reset: 32 bytes aleatórios em base64url (A3).
 */
export function generateResetToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * SHA-256 do token de reset. Só o hash é persistido (A3).
 */
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Compara dois hashes hexadecimais em tempo constante. Tamanhos diferentes são rejeitados
 * sem chamar timingSafeEqual (que lança em buffers de tamanhos distintos).
 */
export function safeCompareHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (!/^[0-9a-f]+$/i.test(a) || !/^[0-9a-f]+$/i.test(b)) return false;
  if (a.length % 2 !== 0 || b.length % 2 !== 0) return false;
  const bufferA = Buffer.from(a, 'hex');
  const bufferB = Buffer.from(b, 'hex');
  if (bufferA.length === 0 || bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
