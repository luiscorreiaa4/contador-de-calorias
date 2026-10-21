import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import * as UserController from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import {
  registerUserSchema,
  loginUserSchema,
  updateUserSchema,
  deleteUserSchema,
  completeOnboardingSchema,
  previewGoalsSchema,
  updateGoalsSchema,
  dateQuerySchema,
  createMeasurementSchema,
  measurementQuerySchema,
} from '@caloriesync/shared';

const router = Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Limita até 20 cadastros por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas de cadastro. Tente novamente após 15 minutos.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limita cada credencial a 10 requisições por janela de tempo
  standardHeaders: true,
  legacyHeaders: false,
  // Chave por IP + e-mail normalizado contra ataques de força bruta e bypass por NAT/IP variável.
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip ?? '');
    const rawEmail = (req.body as { email?: unknown } | undefined)?.email;
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    return email ? `${ip}:${email}` : ip;
  },
  message: { success: false, message: 'Muitas tentativas de login. Tente novamente após 15 minutos.' }
});

const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 tentativas para ações sensíveis de alteração de senha/exclusão
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const authReq = req as { userId?: string; ip?: string };
    const ip = ipKeyGenerator(req.ip ?? '');
    return authReq.userId ? `${ip}:user:${authReq.userId}` : ip;
  },
  message: { success: false, message: 'Muitas tentativas para esta operação. Tente novamente após 15 minutos.' }
});

router.post('/register', registerLimiter, validate(registerUserSchema), UserController.register);
router.post('/login', loginLimiter, validate(loginUserSchema), UserController.login);
router.get('/me', authenticate, UserController.getProfile);
router.get('/me/export', authenticate, UserController.exportData);
router.put('/me', authenticate, sensitiveActionLimiter, validate(updateUserSchema), UserController.updateProfile);
router.put('/me/onboarding', authenticate, validate(completeOnboardingSchema), UserController.completeOnboarding);
router.delete('/me', authenticate, sensitiveActionLimiter, validate(deleteUserSchema), UserController.deleteAccount);

router.post('/me/preview-goals', authenticate, validate(previewGoalsSchema), UserController.previewGoals);
router.put('/me/goals', authenticate, validate(updateGoalsSchema), UserController.updateGoals);
router.get('/me/goals', authenticate, validate({ query: dateQuerySchema }), UserController.getActiveGoal);

router.get('/me/measurements', authenticate, validate({ query: measurementQuerySchema }), UserController.getMeasurements);
router.post('/me/measurements', authenticate, validate(createMeasurementSchema), UserController.addMeasurement);

export default router;

