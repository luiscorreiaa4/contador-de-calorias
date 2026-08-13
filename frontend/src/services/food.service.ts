import { apiFetch } from './api';

export interface Food {
  id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export const getFoods = async (): Promise<Food[]> => {
  return apiFetch<Food[]>('/foods');
};
