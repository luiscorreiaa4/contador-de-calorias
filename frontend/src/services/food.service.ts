import { apiFetch } from './api';

import type { Food } from '@caloriesync/shared';
export type { Food };

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
