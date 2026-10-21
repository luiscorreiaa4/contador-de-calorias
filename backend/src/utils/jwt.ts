import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Emite o JWT de sessão com `userId` e `tv` (token_version). O claim `tv` é
 * obrigatório no middleware a partir da D-21/A8.
 */
export function signAuthToken(userId: string, tokenVersion: number): string {
  return jwt.sign({ userId, tv: tokenVersion }, env.JWT_SECRET, {
    expiresIn: (env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}
