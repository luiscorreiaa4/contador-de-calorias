import { z } from 'zod';

export const adminListFoodsQuerySchema = z.object({
  search: z.string().max(100, 'A busca deve ter no máximo 100 caracteres.').optional(),
  q: z.string().max(100, 'A busca deve ter no máximo 100 caracteres.').optional(),
  status: z.preprocess((val) => {
    if (!val) return 'all';
    const s = String(val).toLowerCase();
    if (s === 'ativo' || s === 'active') return 'active';
    if (s === 'inativo' || s === 'inactive' || s === 'desativados') return 'inactive';
    return 'all';
  }, z.enum(['all', 'active', 'inactive']).default('all')),
  page: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return 1;
    const num = Number(val);
    return isNaN(num) ? val : num;
  }, z.number().int('A página deve ser um número inteiro.').min(1, 'A página deve ser maior ou igual a 1.').default(1)),
  pageSize: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return 25;
    const parsed = Number(val);
    if ([25, 50, 100].includes(parsed)) return parsed;
    return 25;
  }, z.number().default(25)),
  limit: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    const parsed = Number(val);
    if ([25, 50, 100].includes(parsed)) return parsed;
    return undefined;
  }, z.number().optional()),
  sort: z.preprocess((val) => {
    if (!val) return 'nome';
    const s = String(val).toLowerCase();
    if (['nome', 'kcal', 'status', 'proteins', 'carbs', 'fats'].includes(s)) return s;
    return 'nome';
  }, z.enum(['nome', 'kcal', 'status', 'proteins', 'carbs', 'fats']).default('nome')),
  order: z.preprocess((val) => {
    if (!val) return 'asc';
    const s = String(val).toLowerCase();
    if (s === 'desc') return 'desc';
    return 'asc';
  }, z.enum(['asc', 'desc']).default('asc')),
});

export type AdminListFoodsQueryDTO = z.infer<typeof adminListFoodsQuerySchema>;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const adminCreateFoodSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(255, 'O nome deve ter no máximo 255 caracteres.'),
  calories: z.number({ invalid_type_error: 'Calorias devem ser um número.' })
    .min(0, 'Calorias não podem ser negativas.')
    .max(900, 'Calorias devem ser no máximo 900 por 100 g/ml.'),
  proteins: z.number({ invalid_type_error: 'Proteínas devem ser um número.' })
    .min(0, 'Proteínas não podem ser negativas.')
    .max(100, 'Proteínas devem ser no máximo 100 g por 100 g.'),
  carbs: z.number({ invalid_type_error: 'Carboidratos devem ser um número.' })
    .min(0, 'Carboidratos não podem ser negativos.')
    .max(100, 'Carboidratos devem ser no máximo 100 g por 100 g.'),
  fats: z.number({ invalid_type_error: 'Gorduras devem ser um número.' })
    .min(0, 'Gorduras não podem ser negativas.')
    .max(100, 'Gorduras devem ser no máximo 100 g por 100 g.'),
  base_unit: z.enum(['g', 'ml']).default('g'),
  serving_weight: z.number().positive('O peso da porção deve ser positivo.').max(1000).default(100),
  unit_name: z.string().trim().max(50, 'Nome da unidade caseira deve ter no máximo 50 caracteres.').nullable().optional(),
  unit_weight: z.number().positive('Peso da unidade caseira deve ser positivo.').max(5000).nullable().optional(),
  source_ref: z.string().trim().min(2, 'A fonte de referência é obrigatória (B9).').max(255),
}).refine(
  (data) => data.proteins + data.carbs + data.fats <= 100.5,
  {
    message: 'A soma de proteínas, carboidratos e gorduras não pode exceder 100,5 g por 100 g.',
    path: ['proteins'],
  }
);

export type AdminCreateFoodDTO = z.infer<typeof adminCreateFoodSchema>;

export const adminUpdateFoodSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(255, 'O nome deve ter no máximo 255 caracteres.'),
  calories: z.number({ invalid_type_error: 'Calorias devem ser um número.' })
    .min(0, 'Calorias não podem ser negativas.')
    .max(900, 'Calorias devem ser no máximo 900 por 100 g/ml.'),
  proteins: z.number({ invalid_type_error: 'Proteínas devem ser um número.' })
    .min(0, 'Proteínas não podem ser negativas.')
    .max(100, 'Proteínas devem ser no máximo 100 g por 100 g.'),
  carbs: z.number({ invalid_type_error: 'Carboidratos devem ser um número.' })
    .min(0, 'Carboidratos não podem ser negativos.')
    .max(100, 'Carboidratos devem ser no máximo 100 g por 100 g.'),
  fats: z.number({ invalid_type_error: 'Gorduras devem ser um número.' })
    .min(0, 'Gorduras não podem ser negativas.')
    .max(100, 'Gorduras devem ser no máximo 100 g por 100 g.'),
  base_unit: z.enum(['g', 'ml']).default('g'),
  serving_weight: z.number().positive('O peso da porção deve ser positivo.').max(1000).default(100),
  unit_name: z.string().trim().max(50).nullable().optional(),
  unit_weight: z.number().positive().max(5000).nullable().optional(),
  source_ref: z.string().trim().min(2, 'A fonte de referência é obrigatória (B9).').max(255),
}).refine(
  (data) => data.proteins + data.carbs + data.fats <= 100.5,
  {
    message: 'A soma de proteínas, carboidratos e gorduras não pode exceder 100,5 g por 100 g.',
    path: ['shared/src/schemas/admin-food.schema.ts'],
  }
);

export type AdminUpdateFoodDTO = z.infer<typeof adminUpdateFoodSchema>;

export const adminUpdateFoodStatusSchema = z.object({
  active: z.boolean({ required_error: 'O campo active é obrigatório.' }),
});

export type AdminUpdateFoodStatusDTO = z.infer<typeof adminUpdateFoodStatusSchema>;

/**
 * Heurística de divergência calórica (B12):
 * |kcal - (4P + 4C + 9G)| / kcal > 25% gera aviso informativo sem bloquear.
 */
export function calculateCaloricWarnings(calories: number, proteins: number, carbs: number, fats: number): string[] {
  const warnings: string[] = [];
  const calculated = Math.round((proteins * 4 + carbs * 4 + fats * 9) * 10) / 10;
  if (calories > 0) {
    const diff = Math.abs(calories - calculated);
    const percent = diff / calories;
    if (percent > 0.25) {
      warnings.push(
        `Divergência calórica de ${Math.round(percent * 100)}%: calorias informadas (${calories} kcal) vs soma dos macros (${calculated} kcal [4×P + 4×C + 9×G]).`
      );
    }
  }
  return warnings;
}
