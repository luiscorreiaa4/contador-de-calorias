import { apiFetch } from './api';

export interface CreateMealDTO {
  name: string;
  mealTime: string;
  items: {
    foodId: string;
    quantity: number;
  }[];
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_id: string;
  quantity: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  food_name: string;
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

export const getTodayMeals = async (dateStr?: string): Promise<Meal[]> => {
  const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
  return apiFetch<Meal[]>(`/meals/today${query}`);
};
