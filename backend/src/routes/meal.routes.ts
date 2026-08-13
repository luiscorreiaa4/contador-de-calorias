import { Router } from 'express';
import * as MealController from '../controllers/meal.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { createMealSchema } from '../schemas/meal.schema.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createMealSchema), MealController.create);
router.get('/today', MealController.getToday);
router.put('/:id', validate(createMealSchema), MealController.update);
router.delete('/:id', MealController.remove);

export default router;
