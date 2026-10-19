import * as MealModel from '../models/meal.model.js';
import * as FoodModel from '../models/food.model.js';
import type { CreateMealDTO } from '@caloriesync/shared';
import { calculateItemNutrients } from '@caloriesync/shared/nutrition';
import { getSaoPauloDateString } from '../utils/date.js';

interface CustomError extends Error {
  statusCode?: number;
}

// Reexporta o cálculo nutricional compartilhado.
export { calculateItemNutrients };


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

export async function getTodayMeals(userId: string, dateStr?: string) {
  let targetDate: string;
  if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    targetDate = dateStr.split('T')[0];
  } else {
    targetDate = getSaoPauloDateString();
  }

  const [year, month, day] = targetDate.split('-').map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0));
  const nextDateStr = getSaoPauloDateString(nextDay);

  const startIso = `${targetDate}T00:00:00-03:00`;
  const endIso = `${nextDateStr}T00:00:00-03:00`;

  return MealModel.findMealsByUserAndDate(userId, startIso, endIso);
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

  return MealModel.updateMealWithItems(userId, mealId, data.name, new Date(data.mealTime), itemsData);
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

export async function getMealStats(userId: string, period: 'week' | 'month' = 'month', dateStr?: string) {
  const days = period === 'week' ? 7 : 30;
  const stats = await MealModel.getPeriodStats(userId, days, dateStr);
  
  // Calculate averages (only days with logs)
  let sumCals = 0;
  let sumProts = 0;
  let sumCarbs = 0;
  let sumFats = 0;
  
  let sumGoalCals = 0;
  let sumGoalProts = 0;
  let sumGoalCarbs = 0;
  let sumGoalFats = 0;
  let daysWithGoals = 0;

  for (const s of stats) {
    sumCals += s.consumed_calories;
    sumProts += s.consumed_proteins;
    sumCarbs += s.consumed_carbs;
    sumFats += s.consumed_fats;
    if (s.goal_calories) {
       sumGoalCals += s.goal_calories;
       sumGoalProts += (s.goal_proteins || 0);
       sumGoalCarbs += (s.goal_carbs || 0);
       sumGoalFats += (s.goal_fats || 0);
       daysWithGoals++;
    }
  }

  const daysLogged = stats.length;
  
  const averages = {
    consumed: {
      calories: daysLogged > 0 ? Math.round(sumCals / daysLogged) : 0,
      proteins: daysLogged > 0 ? Math.round((sumProts / daysLogged) * 10) / 10 : 0,
      carbs: daysLogged > 0 ? Math.round((sumCarbs / daysLogged) * 10) / 10 : 0,
      fats: daysLogged > 0 ? Math.round((sumFats / daysLogged) * 10) / 10 : 0,
    },
    goal: {
      calories: daysWithGoals > 0 ? Math.round(sumGoalCals / daysWithGoals) : 0,
      proteins: daysWithGoals > 0 ? Math.round((sumGoalProts / daysWithGoals) * 10) / 10 : 0,
      carbs: daysWithGoals > 0 ? Math.round((sumGoalCarbs / daysWithGoals) * 10) / 10 : 0,
      fats: daysWithGoals > 0 ? Math.round((sumGoalFats / daysWithGoals) * 10) / 10 : 0,
    }
  };

  // Build the chart data padding missing days with 0s
  let targetDate: string;
  if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    targetDate = dateStr.split('T')[0];
  } else {
    targetDate = getSaoPauloDateString();
  }

  const [tYear, tMonth, tDay] = targetDate.split('-').map(Number);
  const baseDate = new Date(Date.UTC(tYear, tMonth - 1, tDay, 12, 0, 0));

  const chartData = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dStr = getSaoPauloDateString(d);
    
    const dayStat = stats.find(s => s.date === dStr);
    
    chartData.push({
      date: dStr,
      dayName: d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).replace('.', ''),
      consumed_calories: dayStat ? dayStat.consumed_calories : 0,
      consumed_proteins: dayStat ? dayStat.consumed_proteins : 0,
      consumed_carbs: dayStat ? dayStat.consumed_carbs : 0,
      consumed_fats: dayStat ? dayStat.consumed_fats : 0,
      goal_calories: dayStat?.goal_calories || null,
      goal_proteins: dayStat?.goal_proteins || null,
      goal_carbs: dayStat?.goal_carbs || null,
      goal_fats: dayStat?.goal_fats || null,
    });
  }

  return {
    period,
    daysLogged,
    totalDays: days,
    averages,
    chartData
  };
}
