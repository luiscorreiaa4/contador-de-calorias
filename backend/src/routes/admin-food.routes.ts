import { Router } from 'express';
import * as AdminFoodController from '../controllers/admin-food.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  adminListFoodsQuerySchema,
  adminCreateFoodSchema,
  adminUpdateFoodSchema,
  adminUpdateFoodStatusSchema,
  uuidParamSchema,
} from '@caloriesync/shared';

const router = Router();

router.get('/', validate({ query: adminListFoodsQuerySchema }), AdminFoodController.list);
router.post('/', validate({ body: adminCreateFoodSchema }), AdminFoodController.create);
router.get('/:id', validate({ params: uuidParamSchema }), AdminFoodController.getById);
router.put('/:id', validate({ params: uuidParamSchema, body: adminUpdateFoodSchema }), AdminFoodController.update);
router.patch('/:id/status', validate({ params: uuidParamSchema, body: adminUpdateFoodStatusSchema }), AdminFoodController.updateStatus);

export default router;
