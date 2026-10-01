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
  
  // Otimização: Fetch all foods at once (evitar N+1 queries)
  const foodIds = [...new Set(data.items.map(item => item.foodId))];
  const foods = await FoodModel.findByIds(foodIds);
  const foodsMap = new Map(foods.map(f => [f.id, f]));
  
  for (const item of data.items) {
    const food = foodsMap.get(item.foodId);
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
  
  // Otimização: Fetch all foods at once (evitar N+1 queries)
  const foodIds = [...new Set(data.items.map(item => item.foodId))];
  const foods = await FoodModel.findByIds(foodIds);
  const foodsMap = new Map(foods.map(f => [f.id, f]));
  
  for (const item of data.items) {
    const food = foodsMap.get(item.foodId);
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

export async function getMealStats(userId: string, userTimezoneDateStr?: string) {
  const stats = await MealModel.getDailyStats(userId, 30);
  
  const today = userTimezoneDateStr ? new Date(userTimezoneDateStr) : new Date();
  
  const weeklyChart = [];
  let daysWithLogsInWeek = 0;
  let sumInWeek = 0;

  // Gerar os últimos 7 dias consecutivos para o gráfico
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dayStat = stats.find(s => s.date === dateStr);
    const cals = dayStat ? dayStat.total_calories : 0;
    
    weeklyChart.push({
      date: dateStr,
      calories: cals,
      dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    });

    if (cals > 0) {
      daysWithLogsInWeek++;
      sumInWeek += cals;
    }
  }

  const weeklyAverage = daysWithLogsInWeek > 0 ? Math.round(sumInWeek / daysWithLogsInWeek) : 0;

  // Média mensal (últimos 30 dias com base apenas nos dias em que houve registros)
  let sumInMonth = 0;
  let daysWithLogsInMonth = 0;
  stats.forEach(s => {
    if (s.total_calories > 0) {
      sumInMonth += s.total_calories;
      daysWithLogsInMonth++;
    }
  });

  const monthlyAverage = daysWithLogsInMonth > 0 ? Math.round(sumInMonth / daysWithLogsInMonth) : 0;

  return {
    weeklyChart,
    weeklyAverage,
    monthlyAverage,
    daysLoggedThisMonth: daysWithLogsInMonth
  };
}
