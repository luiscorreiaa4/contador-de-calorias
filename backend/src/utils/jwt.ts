import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Emite o JWT de sessão com `userId` e `tv` (token_version). O claim `tv` é
 * obrigatório no middleware a partir da D-21/A8; `jti` identifica a sessão (logout).
 */
export function signAuthToken(userId: string, tokenVersion: number, persistent = true): string {
  // `p: false` = sessão sem "lembrar de mim": o cookie morre ao fechar o navegador (V-3).
  const payload = persistent
    ? { userId, tv: tokenVersion }
    : { userId, tv: tokenVersion, p: false };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: (env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
    // jti: identifica esta sessão para o logout revogar só ela.
    jwtid: randomUUID(),
  });
}
