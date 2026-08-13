import { z } from 'zod';

export const createMealSchema = z.object({
  name: z.string().min(1, "O nome da refeição é obrigatório."),
  mealTime: z.string().datetime({ message: "A data e hora da refeição deve ser um formato ISO válido." }),
  items: z.array(
    z.object({
      foodId: z.string().uuid("ID do alimento inválido."),
      quantity: z.number().positive("A quantidade deve ser maior que zero.")
    })
  ).min(1, "A refeição deve ter pelo menos um alimento.")
});

export type CreateMealDTO = z.infer<typeof createMealSchema>;
