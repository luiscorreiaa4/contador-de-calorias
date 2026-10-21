import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Resposta pública idêntica para register/resend/forgot (A4): não revela se a conta existe.
 */
export const GENERIC_EMAIL_RESPONSE =
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
  return res.status(200).json({
    success: true,
    message: 'Login realizado com sucesso!',
    data: authData,
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const authData = await AuthService.verifyEmail(req.body);
  return res.status(200).json({
    success: true,
    message: 'E-mail verificado com sucesso!',
    data: authData,
  });
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
