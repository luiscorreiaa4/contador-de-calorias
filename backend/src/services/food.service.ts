import * as FoodModel from '../models/food.model.js';

interface CustomError extends Error {
  statusCode?: number;
}

export async function list(query: string = '', page: number = 1, limit: number = 50) {
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const offset = (page - 1) * safeLimit;
  return FoodModel.searchFoods(query, safeLimit, offset);
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
