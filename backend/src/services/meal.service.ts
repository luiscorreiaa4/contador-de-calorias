import * as MealModel from '../models/meal.model.js';
import * as FoodModel from '../models/food.model.js';
import { CreateMealDTO } from '../schemas/meal.schema.js';

interface CustomError extends Error {
  statusCode?: number;
}

function calculateItemNutrients(
  item: { foodId: string; quantity: number; unit?: 'g' | 'ml' | 'un'; displayAmount?: number },
  food: any
) {
  let finalQuantity = Number(item.quantity);
  let displayAmount = item.displayAmount ? Number(item.displayAmount) : undefined;
  const unit = item.unit || food.base_unit || 'g';

  // Se a unidade for 'un' e houver peso por unidade cadastrado:
  if (unit === 'un' && food.unit_weight) {
    if (!displayAmount) {
      displayAmount = finalQuantity;
    }
    // Converte para a quantidade real em gramas
    finalQuantity = displayAmount * Number(food.unit_weight);
  } else if (!displayAmount) {
    displayAmount = finalQuantity;
  }

  // Base padrão de 100g ou 100ml
  const servingWeight = Number(food.serving_weight) || 100;
  const factor = finalQuantity / servingWeight;

  return {
    foodId: food.id,
    quantity: finalQuantity,
    unit,
    displayAmount,
    calories: Math.round(Number(food.calories) * factor * 10) / 10,
    proteins: Math.round(Number(food.proteins) * factor * 10) / 10,
    carbs: Math.round(Number(food.carbs) * factor * 10) / 10,
    fats: Math.round(Number(food.fats) * factor * 10) / 10,
  };
}

export async function createMeal(userId: string, data: CreateMealDTO) {
  const itemsData = [];
  
  for (const item of data.items) {
    const food = await FoodModel.findById(item.foodId);
    if (!food) {
      const error: CustomError = new Error(`Alimento com ID ${item.foodId} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    
    itemsData.push(calculateItemNutrients(item, food));
  }

  return MealModel.createMealWithItems(userId, data.name, new Date(data.mealTime), itemsData);
}

export async function getTodayMeals(userId: string, userTimezoneDateStr?: string) {
  const today = userTimezoneDateStr ? new Date(userTimezoneDateStr) : new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return MealModel.findMealsByUserAndDate(userId, today.toISOString(), tomorrow.toISOString());
}

export async function updateMeal(userId: string, mealId: string, data: CreateMealDTO) {
  const itemsData = [];
  
  for (const item of data.items) {
    const food = await FoodModel.findById(item.foodId);
    if (!food) {
      const error: CustomError = new Error(`Alimento com ID ${item.foodId} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    
    itemsData.push(calculateItemNutrients(item, food));
  }

  return MealModel.updateMealWithItems(userId, mealId, data.name, itemsData);
}

export async function deleteMeal(userId: string, mealId: string) {
  const success = await MealModel.deleteMealById(userId, mealId);
  if (!success) {
    const error: CustomError = new Error('Refeição não encontrada ou não pertence a este usuário.');
    error.statusCode = 404;
    throw error;
  }
  return true;
}
