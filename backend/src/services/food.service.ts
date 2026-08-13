import * as FoodModel from '../models/food.model.js';

interface CustomError extends Error {
  statusCode?: number;
}

export async function listAll() {
  return FoodModel.findAll();
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
