import { z } from 'zod';

export const createMealSchema = z.object({
  name: z.string().min(1, "O nome da refeição é obrigatório.").max(100, "O nome da refeição deve ter no máximo 100 caracteres."),
  mealTime: z.string().datetime({ message: "A data e hora da refeição deve ser um formato ISO válido." }),
  items: z.array(
    z.object({
      foodId: z.string().uuid("ID do alimento inválido."),
      quantity: z.number().positive("A quantidade deve ser maior que zero.").max(10000, "A quantidade máxima permitida é 10000."),
      unit: z.enum(['g', 'ml', 'un']).optional(),
      displayAmount: z.number().positive("A quantidade exibida deve ser maior que zero.").max(10000, "A quantidade exibida máxima permitida é 10000.").optional(),
    })
  ).min(1, "A refeição deve ter pelo menos um alimento.").max(50, "A refeição pode ter no máximo 50 alimentos.")
});

export type CreateMealDTO = z.infer<typeof createMealSchema>;

export const copyMealSchema = z.object({
  sourceMealId: z.string().uuid("ID de refeição inválido.").optional(),
  sourceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de origem deve estar no formato YYYY-MM-DD.").optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de destino deve estar no formato YYYY-MM-DD.")
}).refine(data => data.sourceMealId || data.sourceDate, {
  message: "sourceMealId ou sourceDate deve ser informado."
});

export type CopyMealDTO = z.infer<typeof copyMealSchema>;

export const createSavedMealSchema = z.object({
  name: z.string().trim().min(1, 'O nome do combo é obrigatório.').max(100, 'O nome do combo deve ter no máximo 100 caracteres.'),
  items: z.array(
    z.object({
      foodId: z.string().uuid('ID do alimento inválido.'),
      quantity: z.number().positive('A quantidade deve ser maior que zero.').max(10000, 'A quantidade máxima permitida é 10000.'),
      unit: z.enum(['g', 'ml', 'un']).optional(),
      displayAmount: z.number().positive('A quantidade exibida deve ser maior que zero.').max(10000, 'A quantidade exibida máxima permitida é 10000.').optional(),
    })
  ).min(1, 'O combo deve ter pelo menos um alimento.').max(50, 'O combo pode ter no máximo 50 alimentos.'),
});

export type CreateSavedMealDTO = z.infer<typeof createSavedMealSchema>;
