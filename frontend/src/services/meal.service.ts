import { apiFetch } from './api';

export interface CreateMealDTO {
  name: string;
  mealTime: string;
  items: {
    foodId: string;
    quantity: number;
    unit?: 'g' | 'ml' | 'un';
    displayAmount?: number;
  }[];
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_id: string;
  quantity: number;
  unit: string;
  display_amount?: number | null;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  food_name: string;
  food_base_unit?: string;
  food_unit_name?: string | null;
  food_unit_weight?: number | null;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  meal_time: string;
  created_at: string;
  items: MealItem[];
  total_calories: number;
  total_proteins: number;
}

export const createMeal = async (data: CreateMealDTO): Promise<Meal> => {
  return apiFetch<Meal>('/meals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateMeal = async (id: string, data: CreateMealDTO): Promise<Meal> => {
  return apiFetch<Meal>(`/meals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteMeal = async (id: string): Promise<void> => {
  return apiFetch<void>(`/meals/${id}`, {
    method: 'DELETE',
  });
};

export const getTodayMeals = async (dateStr?: string, signal?: AbortSignal): Promise<Meal[]> => {
  const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
  return apiFetch<Meal[]>(`/meals/today${query}`, { signal });
};

export interface MealStats {
  period: 'week' | 'month';
  daysLogged: number;
  totalDays: number;
  averages: {
    consumed: { calories: number; proteins: number; carbs: number; fats: number };
    goal: { calories: number; proteins: number; carbs: number; fats: number };
  };
  chartData: {
    date: string;
    dayName: string;
    consumed_calories: number;
    consumed_proteins: number;
    consumed_carbs: number;
    consumed_fats: number;
    goal_calories: number | null;
    goal_proteins: number | null;
    goal_carbs: number | null;
    goal_fats: number | null;
  }[];
}

export const getMealStats = async (period: 'week' | 'month' = 'month', dateStr?: string, signal?: AbortSignal): Promise<MealStats> => {
  const params = new URLSearchParams();
  params.append('period', period);
  if (dateStr) params.append('date', dateStr);
  
  return apiFetch<MealStats>(`/meals/stats?${params.toString()}`, { signal });
};
