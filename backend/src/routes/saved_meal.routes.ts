import { Router } from 'express';
import * as SavedMealController from '../controllers/saved_meal.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { createSavedMealSchema, uuidParamSchema } from '@caloriesync/shared';

const router = Router();

router.use(authenticate);

router.get('/', SavedMealController.list);
router.post('/', validate({ body: createSavedMealSchema }), SavedMealController.create);
router.delete('/:id', validate({ params: uuidParamSchema }), SavedMealController.remove);

export default router;
