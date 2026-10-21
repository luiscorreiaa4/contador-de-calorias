import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid('ID inválido.'),
});

export const dateQuerySchema = z.object({
  date: z.string().date('Formato de data inválido (esperado YYYY-MM-DD).').optional(),
});

export const statsQuerySchema = z.object({
  period: z.enum(['week', 'month']).optional().default('week'),
  date: z.string().date('Formato de data inválido (esperado YYYY-MM-DD).').optional(),
});
