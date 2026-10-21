import { Router } from 'express';
import * as MealController from '../controllers/meal.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { createMealSchema, copyMealSchema, uuidParamSchema, dateQuerySchema, statsQuerySchema } from '@caloriesync/shared';

const router = Router();

router.use(authenticate);

router.post('/', validate(createMealSchema), MealController.create);
router.post('/copy', validate({ body: copyMealSchema }), MealController.copy);
router.get('/today', validate({ query: dateQuerySchema }), MealController.getToday);
router.get('/stats', validate({ query: statsQuerySchema }), MealController.getStats);
router.put('/:id', validate({ params: uuidParamSchema, body: createMealSchema }), MealController.update);
router.delete('/:id', validate({ params: uuidParamSchema }), MealController.remove);

export default router;
