import { z } from 'zod';

export const listFoodsQuerySchema = z.object({
  search: z.string().max(100, 'A busca deve ter no máximo 100 caracteres.').optional(),
  page: z.coerce.number().int().min(1, 'A página deve ser maior ou igual a 1.').optional().default(1),
  limit: z.coerce.number().int().min(1).max(50, 'O limite deve ser no máximo 50.').optional().default(50),
});

export type ListFoodsQueryDTO = z.infer<typeof listFoodsQuerySchema>;

export const listFoodsSchema = z.object({});
