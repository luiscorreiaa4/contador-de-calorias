import { Request, Response } from 'express';
import * as AdminFoodService from '../services/admin-food.service.js';
import { requireUserId } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type {
  AdminListFoodsQueryDTO,
  AdminCreateFoodDTO,
  AdminUpdateFoodDTO,
  AdminUpdateFoodStatusDTO,
} from '@caloriesync/shared';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AdminListFoodsQueryDTO;
  const result = await AdminFoodService.list(query);
  return res.status(200).json({
    success: true,
    data: result.foods,
    meta: result.meta,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const food = await AdminFoodService.getById(id);
  return res.status(200).json({
    success: true,
    data: food,
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = requireUserId(req);
  const body = req.body as AdminCreateFoodDTO;
  const { food, warnings } = await AdminFoodService.create(adminUserId, body);
  return res.status(201).json({
    success: true,
    data: food,
    warnings,
    message: 'Alimento adicionado ao catálogo global com sucesso.',
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = requireUserId(req);
  const id = req.params.id as string;
  const body = req.body as AdminUpdateFoodDTO;
  const { food, warnings } = await AdminFoodService.update(adminUserId, id, body);
  return res.status(200).json({
    success: true,
    data: food,
    warnings,
    message: 'Alimento atualizado no catálogo global com sucesso.',
  });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = requireUserId(req);
  const id = req.params.id as string;
  const body = req.body as AdminUpdateFoodStatusDTO;
  const { food } = await AdminFoodService.updateStatus(adminUserId, id, body.active);
  return res.status(200).json({
    success: true,
    data: food,
    message: food.active
      ? 'Alimento reativado no catálogo global com sucesso.'
      : 'Alimento desativado no catálogo global com sucesso.',
  });
});
