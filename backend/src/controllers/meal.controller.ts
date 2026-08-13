import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import * as MealService from '../services/meal.service.js';

interface CustomError {
  statusCode?: number;
  message?: string;
}

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const newMeal = await MealService.createMeal(userId, req.body);
    return res.status(201).json({ success: true, message: 'Refeição registrada com sucesso!', data: newMeal });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    return res.status(statusCode).json({ success: false, message: err.message ?? 'Erro interno no servidor.' });
  }
}

export async function getToday(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const clientDate = req.query.date as string; // YYYY-MM-DD passed from client to avoid timezone mismatches
    
    let targetDate = new Date();
    if (clientDate) {
      targetDate = new Date(clientDate);
    }

    const meals = await MealService.getTodayMeals(userId, targetDate.toISOString());
    return res.status(200).json({ success: true, data: meals });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    return res.status(statusCode).json({ success: false, message: err.message ?? 'Erro interno no servidor.' });
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const mealId = req.params.id as string;
    const updatedMeal = await MealService.updateMeal(userId, mealId, req.body);
    return res.status(200).json({ success: true, message: 'Refeição atualizada com sucesso!', data: updatedMeal });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    return res.status(statusCode).json({ success: false, message: err.message ?? 'Erro interno no servidor.' });
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const mealId = req.params.id as string;
    await MealService.deleteMeal(userId, mealId);
    return res.status(200).json({ success: true, message: 'Refeição excluída com sucesso!' });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    return res.status(statusCode).json({ success: false, message: err.message ?? 'Erro interno no servidor.' });
  }
}
