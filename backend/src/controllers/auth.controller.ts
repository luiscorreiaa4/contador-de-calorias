import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service.js';
import * as GuestService from '../services/guest.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearSessionCookie, readRequestToken, setSessionCookie } from '../utils/sessionCookie.js';

/**
 * Resposta pública idêntica para register/resend/forgot (A4): não revela se a conta existe.
 */
const GENERIC_EMAIL_RESPONSE =
  'Se os dados estiverem corretos, enviaremos uma mensagem para o e-mail informado.';

export const register = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.register(req.body);
  return res.status(202).json({
    success: true,
    message: GENERIC_EMAIL_RESPONSE,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const authData = await AuthService.login(req.body);
  setSessionCookie(res, authData.token);
  return res.status(200).json({
    success: true,
    message: 'Login realizado com sucesso!',
    data: authData,
  });
});

export const demoLogin = asyncHandler(async (_req: Request, res: Response) => {
  const authData = await GuestService.createGuestSession();
  setSessionCookie(res, authData.token);
  return res.status(200).json({
    success: true,
    message: 'Sessão de demonstração iniciada.',
    data: authData,
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const authData = await AuthService.verifyEmail(req.body);
  setSessionCookie(res, authData.token);
  return res.status(200).json({
    success: true,
    message: 'E-mail verificado com sucesso!',
    data: authData,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // V-2: o JWT desta sessão deixa de valer no servidor, não só some do navegador.
  await AuthService.logout(readRequestToken(req).token);
  clearSessionCookie(res);
  return res.status(200).json({ success: true, message: 'Sessão encerrada.' });
});

export const resendCode = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.resendCode(req.body);
  return res.status(202).json({
    success: true,
    message: GENERIC_EMAIL_RESPONSE,
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body);
  return res.status(202).json({
    success: true,
    message: GENERIC_EMAIL_RESPONSE,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body);
  return res.status(200).json({
    success: true,
    message: 'Senha redefinida com sucesso. Entre com a nova senha.',
  });
});
