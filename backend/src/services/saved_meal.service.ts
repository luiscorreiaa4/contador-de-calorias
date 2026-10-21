import * as SavedMealModel from '../models/saved_meal.model.js';
import * as FoodModel from '../models/food.model.js';
import type { CreateSavedMealDTO } from '@caloriesync/shared';

interface CustomError extends Error {
  statusCode?: number;
}

export async function listSavedMeals(userId: string) {
  return SavedMealModel.listByUser(userId);
}

export async function createSavedMeal(userId: string, data: CreateSavedMealDTO) {
  // Otimização: Fetch all foods at once (evitar N+1 queries)
  const foodIds = [...new Set(data.items.map(item => item.foodId))];
  const foods = await FoodModel.findByIds(foodIds, userId);
  const foodsMap = new Map(foods.map(f => [f.id, f]));

  for (const item of data.items) {
    const food = foodsMap.get(item.foodId);
    if (!food) {
      const error: CustomError = new Error(`Alimento com ID ${item.foodId} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }
  }

  return SavedMealModel.createWithItems(userId, data.name, data.items);
}

export async function deleteSavedMeal(userId: string, id: string) {
  const success = await SavedMealModel.deleteById(userId, id);
  if (!success) {
    const error: CustomError = new Error('Combo de refeição não encontrado ou não pertence a este usuário.');
    error.statusCode = 404;
    throw error;
  }
  return true;
}
