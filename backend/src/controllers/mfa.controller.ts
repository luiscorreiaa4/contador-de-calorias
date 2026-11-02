import { Request, Response } from 'express';
import * as MfaService from '../services/mfa.service.js';
import { requireUserId } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const setup = asyncHandler(async (req: Request, res: Response) => {
  const data = await MfaService.setupMfa(requireUserId(req));
  return res.status(200).json({ success: true, data });
});

export const enable = asyncHandler(async (req: Request, res: Response) => {
  const recovery_codes = await MfaService.enableMfa(requireUserId(req), req.body.code);
  return res.status(200).json({ success: true, data: { recovery_codes } });
});

export const disable = asyncHandler(async (req: Request, res: Response) => {
  await MfaService.disableMfa(requireUserId(req), req.body.code);
  return res.status(200).json({ success: true, message: 'MFA desativado.' });
});
