import { apiFetch } from './api';

import type { CreateMealDTO, Meal, MealItem } from '@caloriesync/shared';
export type { CreateMealDTO, Meal, MealItem };

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
