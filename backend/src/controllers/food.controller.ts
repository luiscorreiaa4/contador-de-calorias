import { Request, Response } from 'express';
import * as FoodService from '../services/food.service.js';
import { ListFoodsQueryDTO } from '../schemas/food.schema.js';

interface CustomError {
  statusCode?: number;
  message?: string;
}

export async function list(req: Request, res: Response) {
  try {
    const { search, page, limit } = req.query as unknown as ListFoodsQueryDTO;

    // Mínimo 2 letras para busca
    if (search && search.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'A busca requer pelo menos 2 caracteres.' });
    }

    const data = await FoodService.list(search?.trim(), page, limit);
    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({ success: false, message });
  }
}
