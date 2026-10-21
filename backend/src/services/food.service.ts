import * as FoodModel from '../models/food.model.js';
import type { CreateCustomFoodDTO } from '@caloriesync/shared';

interface CustomError extends Error {
  statusCode?: number;
}

export async function list(query: string = '', page: number = 1, limit: number = 50, userId?: string) {
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const offset = (page - 1) * safeLimit;
  return FoodModel.searchFoods(query, safeLimit, offset, userId);
}

export async function createCustom(userId: string, data: CreateCustomFoodDTO) {
  try {
    return await FoodModel.createCustomFood(userId, data);
  } catch (error: unknown) {
    const pgErr = error as { code?: string };
    if (pgErr?.code === '23505') {
      const customErr: CustomError = new Error('Você já possui um alimento ativo cadastrado com este nome.');
      customErr.statusCode = 409;
      throw customErr;
    }
    throw error;
  }
}

export async function getById(id: string, userId?: string) {
  const food = await FoodModel.findById(id, userId);
  if (!food) {
    const error: CustomError = new Error('Alimento não encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return food;
}

export async function getRecents(userId: string) {
  return FoodModel.getRecentFoods(userId);
}

export async function getFavorites(userId: string) {
  return FoodModel.getFavoriteFoods(userId);
}

export async function addFavorite(userId: string, foodId: string) {
  await getById(foodId, userId); // Garante que o alimento existe e é acessível ao usuário (ou joga 404)
  await FoodModel.addFavoriteFood(userId, foodId);
  return true;
}

export async function removeFavorite(userId: string, foodId: string) {
  const removed = await FoodModel.removeFavoriteFood(userId, foodId);
  if (!removed) {
    const error: CustomError = new Error('Alimento não encontrado nos favoritos.');
    error.statusCode = 404;
    throw error;
  }
  return true;
}

export async function getFavoriteIds(userId: string) {
  return FoodModel.getFavoriteFoodIds(userId);
}
