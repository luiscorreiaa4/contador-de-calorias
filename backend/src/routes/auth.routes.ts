import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { createAuthRateLimiter } from '../middlewares/authRateLimit.js';
import {
  forgotPasswordSchema,
  loginUserSchema,
  registerUserSchema,
  resendVerificationCodeSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@caloriesync/shared';

const router = Router();

// A11: nenhuma resposta de autenticação pode ser armazenada em cache.
router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const registerLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  includeEmail: false,
  message: 'Muitas tentativas de cadastro. Tente novamente após 15 minutos.',
});

const loginCredentialLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitas tentativas de login. Tente novamente após 15 minutos.',
});

const loginIpLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  includeEmail: false,
  message: 'Muitas tentativas de login originadas deste IP. Tente novamente após 15 minutos.',
});

const verifyEmailLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  includeEmail: false,
  message: 'Muitas tentativas de verificação. Tente novamente após 15 minutos.',
});

const resendCodeLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitos pedidos de reenvio. Tente novamente após 15 minutos.',
});

const forgotPasswordLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitos pedidos de recuperação. Tente novamente após 15 minutos.',
});

const resetPasswordLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  includeEmail: false,
  message: 'Muitas tentativas de redefinição. Tente novamente após 1 hora.',
});

router.post('/register', registerLimiter, validate(registerUserSchema), AuthController.register);
router.post('/login', loginIpLimiter, loginCredentialLimiter, validate(loginUserSchema), AuthController.login);
router.post('/verify-email', verifyEmailLimiter, validate(verifyEmailSchema), AuthController.verifyEmail);
router.post('/resend-code', resendCodeLimiter, validate(resendVerificationCodeSchema), AuthController.resendCode);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), AuthController.resetPassword);

export default router;
