import { Request, Response } from 'express';
import * as FoodService from '../services/food.service.js';
import { ListFoodsQueryDTO } from '@caloriesync/shared';
import { AuthenticatedRequest, requireUserId } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, page, limit } = req.query as unknown as ListFoodsQueryDTO;
  const userId = (req as AuthenticatedRequest).userId;

  // Mínimo 2 letras para busca
  if (search && search.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'A busca requer pelo menos 2 caracteres.' });
  }

  const data = await FoodService.list(search?.trim(), page, limit, userId);

  // Cache HTTP seguro por usuário (PC-03 / D-07)
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('Vary', 'Authorization');

  return res.status(200).json({ success: true, data });
});

export const createCustom = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const food = await FoodService.createCustom(userId, req.body);
  return res.status(201).json({
    success: true,
    data: food,
    message: 'Alimento personalizado cadastrado com sucesso!',
  });
});

export const getRecents = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const data = await FoodService.getRecents(userId);
  return res.status(200).json({ success: true, data });
});

export const getFavorites = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const data = await FoodService.getFavorites(userId);
  return res.status(200).json({ success: true, data });
});

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const foodId = req.params.id as string;
  await FoodService.addFavorite(userId, foodId);
  return res.status(200).json({ success: true, message: 'Alimento adicionado aos favoritos.' });
});

export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const foodId = req.params.id as string;
  await FoodService.removeFavorite(userId, foodId);
  return res.status(200).json({ success: true, message: 'Alimento removido dos favoritos.' });
});
