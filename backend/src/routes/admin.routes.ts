import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import adminFoodRoutes from './admin-food.routes.js';

const router = Router();

// B11: Guarda estrita no roteador inteiro de /api/admin.
// Não autenticado = 401; usuário comum = 403 (FORBIDDEN).
router.use(authenticate, requireAdmin);

router.use('/foods', adminFoodRoutes);
router.use('/alimentos', adminFoodRoutes);

export default router;
