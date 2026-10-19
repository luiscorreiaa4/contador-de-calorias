import { apiFetch } from './api';

import type { Food, CreateCustomFoodDTO } from '@caloriesync/shared';
export type { Food, CreateCustomFoodDTO };

export interface GetFoodsResponse {
  foods: Food[];
  total: number;
}

export const getFoods = async (
  search: string = '',
  page: number = 1,
  limit: number = 50,
  signal?: AbortSignal
): Promise<GetFoodsResponse> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  return apiFetch<GetFoodsResponse>(`/foods?${params.toString()}`, { signal });
};

export const getRecentFoods = async (signal?: AbortSignal): Promise<Food[]> => {
  return apiFetch<Food[]>('/foods/recents', { signal });
};

export const getFavoriteFoods = async (signal?: AbortSignal): Promise<Food[]> => {
  return apiFetch<Food[]>('/foods/favorites', { signal });
};

export const addFavoriteFood = async (foodId: string): Promise<void> => {
  return apiFetch<void>(`/foods/${foodId}/favorite`, { method: 'POST' });
};

export const removeFavoriteFood = async (foodId: string): Promise<void> => {
  return apiFetch<void>(`/foods/${foodId}/favorite`, { method: 'DELETE' });
};

export const createCustomFood = async (data: CreateCustomFoodDTO): Promise<Food> => {
  return apiFetch<Food>('/foods/custom', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

