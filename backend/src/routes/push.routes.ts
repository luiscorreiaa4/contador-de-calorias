import { Router } from 'express';
import * as PushController from '../controllers/push.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { pushSubscriptionSchema, unsubscribePushSchema } from '@caloriesync/shared';

const router = Router();

router.get('/public-key', PushController.getPublicKey);
router.post('/subscribe', authenticate, validate(pushSubscriptionSchema), PushController.subscribe);
router.post('/unsubscribe', authenticate, validate(unsubscribePushSchema), PushController.unsubscribe);
router.post('/test', authenticate, PushController.sendTest);

export default router;
