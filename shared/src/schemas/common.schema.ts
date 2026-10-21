import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid('ID inválido.'),
});

export const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (esperado YYYY-MM-DD).').optional(),
});

export const statsQuerySchema = z.object({
  period: z.enum(['week', 'month']).optional().default('week'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (esperado YYYY-MM-DD).').optional(),
});
