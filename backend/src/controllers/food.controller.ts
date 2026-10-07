import { Request, Response } from 'express';
import * as FoodService from '../services/food.service.js';

interface CustomError {
  statusCode?: number;
  message?: string;
}

import { z } from 'zod';

const listQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(50)
});

export async function list(req: Request, res: Response) {
  try {
    const { search, page, limit } = listQuerySchema.parse(req.query);

    // Mínimo 2 letras para busca
    if (search && search.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'A busca requer pelo menos 2 caracteres.' });
    }

    const data = await FoodService.list(search?.trim(), page, limit);
    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    return res.status(statusCode).json({ success: false, message: err.message ?? 'Erro interno no servidor.' });
  }
}
