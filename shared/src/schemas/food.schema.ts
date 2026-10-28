import { z } from 'zod';

export const listFoodsQuerySchema = z.object({
  search: z.string().max(100, 'A busca deve ter no máximo 100 caracteres.').optional(),
  page: z.coerce.number().int().min(1, 'A página deve ser maior ou igual a 1.').optional().default(1),
  limit: z.coerce.number().int().min(1).max(50, 'O limite deve ser no máximo 50.').optional().default(50),
});

export type ListFoodsQueryDTO = z.infer<typeof listFoodsQuerySchema>;

export const createCustomFoodSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(100, 'O nome deve ter no máximo 100 caracteres.'),
  calories: z.number().nonnegative('Calorias não podem ser negativas.').max(1000, 'Calorias excessivas por porção base.'),
  proteins: z.number().nonnegative('Proteínas não podem ser negativas.').max(100),
  carbs: z.number().nonnegative('Carboidratos não podem ser negativos.').max(100),
  fats: z.number().nonnegative('Gorduras não podem ser negativas.').max(100),
  base_unit: z.enum(['g', 'ml']).default('g'),
  serving_weight: z.number().positive().default(100),
  unit_name: z.string().trim().max(50).optional(),
  unit_weight: z.number().positive().optional(),
});

export type CreateCustomFoodDTO = z.infer<typeof createCustomFoodSchema>;

