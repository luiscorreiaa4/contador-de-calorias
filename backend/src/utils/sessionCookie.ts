import type { CookieOptions, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const SESSION_COOKIE = 'cs_session';

const baseOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
});

/**
 * Grava o JWT em cookie HttpOnly; a validade do cookie acompanha o `exp` do JWT.
 * Token com `p: false` vira cookie de sessão (sem `maxAge`), apagado ao fechar o navegador (V-3).
 */
export function setSessionCookie(res: Response, token: string): void {
  const claims = jwt.decode(token) as { exp?: number; p?: boolean } | null;
  const exp = claims?.p === false ? undefined : claims?.exp;
  const maxAge = exp ? Math.max(0, exp * 1000 - Date.now()) : undefined;
  res.cookie(SESSION_COOKIE, token, { ...baseOptions(), maxAge });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, baseOptions());
}

/** Token da requisição: Bearer tem prioridade sobre o cookie de sessão. */
export function readRequestToken(req: Request): { token: string | null; fromCookie: boolean } {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (bearer) return { token: bearer, fromCookie: false };
  const cookie = readSessionCookie(req);
  return { token: cookie, fromCookie: cookie !== null };
}

/** Lê o cookie de sessão sem dependência extra (shortcut: parse simples, sem decode de aspas). */
export function readSessionCookie(req: Request): string | null {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=') || null;
  }
  return null;
}
