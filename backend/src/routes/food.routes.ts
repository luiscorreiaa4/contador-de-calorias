import { Router } from 'express';
import * as FoodController from '../controllers/food.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Todas as rotas de alimentos requerem autenticação
router.use(authenticate);

router.get('/', FoodController.list);

export default router;
