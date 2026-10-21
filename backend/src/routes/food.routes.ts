import { Router } from 'express';
import * as FoodController from '../controllers/food.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { listFoodsQuerySchema, uuidParamSchema, createCustomFoodSchema } from '@caloriesync/shared';

const router = Router();

// Todas as rotas de alimentos requerem autenticação
router.use(authenticate);

router.post('/custom', validate(createCustomFoodSchema), FoodController.createCustom);
router.get('/recents', FoodController.getRecents);
router.get('/favorites', FoodController.getFavorites);
router.post('/:id/favorite', validate({ params: uuidParamSchema }), FoodController.addFavorite);
router.delete('/:id/favorite', validate({ params: uuidParamSchema }), FoodController.removeFavorite);
router.get('/', validate({ query: listFoodsQuerySchema }), FoodController.list);

export default router;
