import { Router } from 'express';
import * as UserController from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { registerUserSchema, loginUserSchema, updateUserSchema, deleteUserSchema, completeOnboardingSchema } from '../schemas/user.schema.js';

const router = Router();

router.post('/register', validate(registerUserSchema), UserController.register);
router.post('/login', validate(loginUserSchema), UserController.login);
router.get('/me', authenticate, UserController.getProfile);
router.put('/me', authenticate, validate(updateUserSchema), UserController.updateProfile);
router.put('/me/onboarding', authenticate, validate(completeOnboardingSchema), UserController.completeOnboarding);
router.delete('/me', authenticate, validate(deleteUserSchema), UserController.deleteAccount);

export default router;
