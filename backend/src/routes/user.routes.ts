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
} from '@caloriesync/shared';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limita cada credencial a 10 requisições por janela de tempo para rotas de auth
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

router.post('/register', authLimiter, validate(registerUserSchema), UserController.register);
router.post('/login', authLimiter, validate(loginUserSchema), UserController.login);
router.get('/me', authenticate, UserController.getProfile);
router.get('/me/export', authenticate, UserController.exportData);
router.put('/me', authenticate, validate(updateUserSchema), UserController.updateProfile);
router.put('/me/onboarding', authenticate, validate(completeOnboardingSchema), UserController.completeOnboarding);
router.delete('/me', authenticate, validate(deleteUserSchema), UserController.deleteAccount);

router.post('/me/preview-goals', authenticate, validate(previewGoalsSchema), UserController.previewGoals);
router.put('/me/goals', authenticate, validate(updateGoalsSchema), UserController.updateGoals);
router.get('/me/goals', authenticate, validate({ query: dateQuerySchema }), UserController.getActiveGoal);

export default router;
