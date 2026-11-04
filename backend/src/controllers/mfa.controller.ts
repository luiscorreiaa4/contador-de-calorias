import { Request, Response } from 'express';
import * as MfaService from '../services/mfa.service.js';
import { requireUserId, type AuthenticatedRequest } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { setSessionCookie } from '../utils/sessionCookie.js';

export const setup = asyncHandler(async (req: Request, res: Response) => {
  const data = await MfaService.setupMfa(requireUserId(req));
  return res.status(200).json({ success: true, data });
});

export const enable = asyncHandler(async (req: Request, res: Response) => {
  const { recoveryCodes: recovery_codes, token } = await MfaService.enableMfa(
    requireUserId(req),
    req.body.code,
    (req as AuthenticatedRequest).sessionPersistent,
  );
  setSessionCookie(res, token);
  return res.status(200).json({ success: true, data: { recovery_codes } });
});

export const disable = asyncHandler(async (req: Request, res: Response) => {
  const { token } = await MfaService.disableMfa(
    requireUserId(req),
    req.body.code,
    (req as AuthenticatedRequest).sessionPersistent,
  );
  setSessionCookie(res, token);
  return res.status(200).json({ success: true, message: 'MFA desativado.' });
});
