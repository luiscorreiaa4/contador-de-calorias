import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import * as SavedMealService from '../services/saved_meal.service.js';

interface CustomError {
  statusCode?: number;
  message?: string;
}

export async function list(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const savedMeals = await SavedMealService.listSavedMeals(userId);
    return res.status(200).json({ success: true, data: savedMeals });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({ success: false, message });
  }
}

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const savedMeal = await SavedMealService.createSavedMeal(userId, req.body);
    return res.status(201).json({ success: true, message: 'Combo salvo com sucesso!', data: savedMeal });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({ success: false, message });
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    await SavedMealService.deleteSavedMeal(userId, id);
    return res.status(200).json({ success: true, message: 'Combo excluído com sucesso!' });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({ success: false, message });
  }
}
