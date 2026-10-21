import { apiFetch } from './api';
import type { SavedMeal, CreateSavedMealDTO } from '@caloriesync/shared';
export type { SavedMeal, CreateSavedMealDTO };

export const getSavedMeals = async (signal?: AbortSignal): Promise<SavedMeal[]> => {
  return apiFetch<SavedMeal[]>('/saved-meals', { signal });
};

export const createSavedMeal = async (data: CreateSavedMealDTO): Promise<SavedMeal> => {
  return apiFetch<SavedMeal>('/saved-meals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteSavedMeal = async (id: string): Promise<void> => {
  return apiFetch<void>(`/saved-meals/${id}`, {
    method: 'DELETE',
  });
};
