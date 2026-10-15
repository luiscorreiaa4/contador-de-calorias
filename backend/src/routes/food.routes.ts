import { Router } from 'express';
import * as FoodController from '../controllers/food.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { listFoodsQuerySchema } from '../schemas/food.schema.js';

const router = Router();

// Todas as rotas de alimentos requerem autenticação
router.use(authenticate);

router.get('/', validate({ query: listFoodsQuerySchema }), FoodController.list);

export default router;
