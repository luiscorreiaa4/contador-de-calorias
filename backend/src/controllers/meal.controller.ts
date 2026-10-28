import { Request, Response } from 'express';
import { requireUserId } from '../middlewares/auth.js';
import * as MealService from '../services/meal.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const newMeal = await MealService.createMeal(userId, req.body);
  return res.status(201).json({ success: true, message: 'Refeição registrada com sucesso!', data: newMeal });
});

export const getToday = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const clientDate = req.query.date as string;
  const meals = await MealService.getTodayMeals(userId, clientDate);
  return res.status(200).json({ success: true, data: meals });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const mealId = req.params.id as string;
  const updatedMeal = await MealService.updateMeal(userId, mealId, req.body);
  return res.status(200).json({ success: true, message: 'Refeição atualizada com sucesso!', data: updatedMeal });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const mealId = req.params.id as string;
  await MealService.deleteMeal(userId, mealId);
  return res.status(200).json({ success: true, message: 'Refeição excluída com sucesso!' });
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const clientDate = req.query.date as string;
  const period = (req.query.period as string) === 'week' ? 'week' : 'month';
  const stats = await MealService.getMealStats(userId, period, clientDate);
  return res.status(200).json({ success: true, data: stats });
});

export const copy = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const result = await MealService.copyMealOrDay(userId, req.body);
  const message = Array.isArray(result)
    ? 'Refeições do dia copiadas com sucesso!'
    : 'Refeição copiada com sucesso!';
  return res.status(201).json({ success: true, message, data: result });
});
