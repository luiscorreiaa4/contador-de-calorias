import { apiFetch } from './api';
import type {
  AdminCreateFoodDTO,
  AdminUpdateFoodDTO,
  AdminListFoodsQueryDTO,
  Food,
} from '@caloriesync/shared';

export interface AdminFoodListResponse {
  foods: Food[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminFoodSaveResponse {
  food: Food;
  warnings?: string[];
}

/**
 * Lista alimentos globais para o painel administrativo (B12).
 */
export async function listAdminFoods(query?: AdminListFoodsQueryDTO): Promise<AdminFoodListResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.append('search', query.search);
  if (query?.status) params.append('status', query.status);
  if (query?.page) params.append('page', String(query.page));
  if (query?.limit) params.append('limit', String(query.limit));

  const qs = params.toString();
  return apiFetch<AdminFoodListResponse>(`/admin/foods${qs ? `?${qs}` : ''}`);
}

/**
 * Cria novo alimento global no catálogo (B9, B12).
 */
export async function createAdminFood(data: AdminCreateFoodDTO): Promise<AdminFoodSaveResponse> {
  return apiFetch<AdminFoodSaveResponse>('/admin/foods', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza alimento global existente (B6, B12).
 */
export async function updateAdminFood(id: string, data: AdminUpdateFoodDTO): Promise<AdminFoodSaveResponse> {
  return apiFetch<AdminFoodSaveResponse>(`/admin/foods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Altera status ativo/inativo do alimento global (B4).
 */
export async function updateAdminFoodStatus(id: string, active: boolean): Promise<Food> {
  return apiFetch<Food>(`/admin/foods/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}
