import * as MealModel from '../models/meal.model.js';
import * as FoodModel from '../models/food.model.js';
import { CreateMealDTO } from '../schemas/meal.schema.js';

interface CustomError extends Error {
  statusCode?: number;
}

export async function createMeal(userId: string, data: CreateMealDTO) {
  // Prepara os dados dos itens calculando as calorias e macros reais baseadas na quantidade
  const itemsData = [];
  
  for (const item of data.items) {
    const food = await FoodModel.findById(item.foodId);
    if (!food) {
      const error: CustomError = new Error(`Alimento com ID ${item.foodId} não encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    
    // Calcula os macros: (valor / 100) * quantidade. 
    // Considerando que os mocks e as inserções foram feitas para 100g. 
    // Wait, no init-db tem itens que são por unidade, ex "Ovo Cozido (1 unidade - 50g)" = 78 kcal.
    // Assim o multiplicador base do banco é 1 unidade. Ou seja, 'quantity' vai ser o multiplicador direto.
    // Se a pessoa come 2 ovos (quantity = 2), multiplica tudo por 2.
    // Se a pessoa come 100g de frango, quantity = 1 (porque o nome diz 100g e a porção é 1).
    // Na interface do dashboard, a quantidade reflete a unidade definida no banco.
    
    itemsData.push({
      foodId: food.id,
      quantity: item.quantity,
      calories: Number(food.calories) * item.quantity,
      proteins: Number(food.proteins) * item.quantity,
      carbs: Number(food.carbs) * item.quantity,
      fats: Number(food.fats) * item.quantity,
    });
  }

  return MealModel.createMealWithItems(userId, data.name, new Date(data.mealTime), itemsData);
}

export async function getTodayMeals(userId: string, userTimezoneDateStr?: string) {
  // Hoje no fuso do servidor ou via parametro. Para simplificar, vamos pegar o date atual via JS ou via parametro.
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
    
    itemsData.push({
      foodId: food.id,
      quantity: item.quantity,
      calories: Number(food.calories) * item.quantity,
      proteins: Number(food.proteins) * item.quantity,
      carbs: Number(food.carbs) * item.quantity,
      fats: Number(food.fats) * item.quantity,
    });
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
