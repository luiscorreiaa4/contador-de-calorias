import { Router } from 'express';
import * as UserController from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { registerUserSchema, loginUserSchema } from '../schemas/user.schema.js';

const router = Router();

router.post('/register', validate(registerUserSchema), UserController.register);
router.post('/login', validate(loginUserSchema), UserController.login);
router.get('/me', authenticate, UserController.getProfile);

export default router;
