import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as UserController from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { registerUserSchema, loginUserSchema, updateUserSchema, deleteUserSchema, completeOnboardingSchema, previewGoalsSchema, updateGoalsSchema } from '../schemas/user.schema.js';
import { dateQuerySchema } from '../schemas/common.schema.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limita cada IP a 10 requisições por janela de tempo para rotas de auth
  message: { success: false, message: 'Muitas tentativas de login. Tente novamente após 15 minutos.' }
});

router.post('/register', authLimiter, validate(registerUserSchema), UserController.register);
router.post('/login', authLimiter, validate(loginUserSchema), UserController.login);
router.get('/me', authenticate, UserController.getProfile);
router.put('/me', authenticate, validate(updateUserSchema), UserController.updateProfile);
router.put('/me/onboarding', authenticate, validate(completeOnboardingSchema), UserController.completeOnboarding);
router.delete('/me', authenticate, validate(deleteUserSchema), UserController.deleteAccount);

router.post('/me/preview-goals', authenticate, validate(previewGoalsSchema), UserController.previewGoals);
router.put('/me/goals', authenticate, validate(updateGoalsSchema), UserController.updateGoals);
router.get('/me/goals', authenticate, validate({ query: dateQuerySchema }), UserController.getActiveGoal);

export default router;
