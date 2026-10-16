import { apiFetch } from './api';

export interface Food {
  id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  base_unit: 'g' | 'ml';
  serving_weight: number;
  unit_name?: string | null;
  unit_weight?: number | null;
  source?: string | null;
}

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
