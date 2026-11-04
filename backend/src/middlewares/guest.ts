import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import { isGuestUser } from '../models/guest.model.js';

/** Bloqueia ações que alteram a conta (senha, e-mail, MFA, exclusão) para visitantes. */
export async function blockGuestUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.userId && (await isGuestUser(req.userId))) {
      return res.status(403).json({
        success: false,
        message: 'Esta ação está desativada na conta de demonstração.',
        code: 'DEMO_READ_ONLY',
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}
