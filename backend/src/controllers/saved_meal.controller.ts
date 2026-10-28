import { Request, Response } from 'express';
import { requireUserId } from '../middlewares/auth.js';
import * as SavedMealService from '../services/saved_meal.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const savedMeals = await SavedMealService.listSavedMeals(userId);
  return res.status(200).json({ success: true, data: savedMeals });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const savedMeal = await SavedMealService.createSavedMeal(userId, req.body);
  return res.status(201).json({ success: true, message: 'Combo salvo com sucesso!', data: savedMeal });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const id = req.params.id as string;
  await SavedMealService.deleteSavedMeal(userId, id);
  return res.status(200).json({ success: true, message: 'Combo excluído com sucesso!' });
});
