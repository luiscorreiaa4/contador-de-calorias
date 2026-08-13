import { Request, Response } from 'express';
import * as FoodService from '../services/food.service.js';

interface CustomError {
  statusCode?: number;
  message?: string;
}

export async function list(req: Request, res: Response) {
  try {
    const foods = await FoodService.listAll();
    return res.status(200).json({ success: true, data: foods });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    return res.status(statusCode).json({ success: false, message: err.message ?? 'Erro interno no servidor.' });
  }
}
