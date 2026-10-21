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
  return FoodModel.createCustomFood(userId, data);
}


export async function getById(id: string) {
  const food = await FoodModel.findById(id);
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
  await getById(foodId); // Garante que o alimento existe (ou joga 404)
  await FoodModel.addFavoriteFood(userId, foodId);
  return true;
}

export async function removeFavorite(userId: string, foodId: string) {
  await FoodModel.removeFavoriteFood(userId, foodId);
  return true;
}

export async function getFavoriteIds(userId: string) {
  return FoodModel.getFavoriteFoodIds(userId);
}
