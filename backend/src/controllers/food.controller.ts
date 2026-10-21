import { Request, Response } from 'express';
import * as FoodService from '../services/food.service.js';
import { ListFoodsQueryDTO } from '@caloriesync/shared';
import { AuthenticatedRequest } from '../middlewares/auth.js';

interface CustomError {
  statusCode?: number;
  message?: string;
}

export async function list(req: Request, res: Response) {
  try {
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
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({ success: false, message });
  }
}

export async function createCustom(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const food = await FoodService.createCustom(userId, req.body);
    return res.status(201).json({
      success: true,
      data: food,
      message: 'Alimento personalizado cadastrado com sucesso!',
    });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro ao cadastrar alimento.');
    return res.status(statusCode).json({ success: false, message });
  }
}


export async function getRecents(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const data = await FoodService.getRecents(userId);
    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({ success: false, message });
  }
}

export async function getFavorites(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const data = await FoodService.getFavorites(userId);
    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({ success: false, message });
  }
}

export async function addFavorite(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const foodId = req.params.id as string;
    await FoodService.addFavorite(userId, foodId);
    return res.status(200).json({ success: true, message: 'Alimento adicionado aos favoritos.' });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({ success: false, message });
  }
}

export async function removeFavorite(req: Request, res: Response) {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const foodId = req.params.id as string;
    await FoodService.removeFavorite(userId, foodId);
    return res.status(200).json({ success: true, message: 'Alimento removido dos favoritos.' });
  } catch (error: unknown) {
    const err = error as CustomError;
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Erro interno no servidor.' : (err.message ?? 'Erro interno no servidor.');
    return res.status(statusCode).json({ success: false, message });
  }
}
