import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import * as UserController from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import {
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

