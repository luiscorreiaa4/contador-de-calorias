import { apiFetch, apiFetchWithMeta, type ApiResponseWithMeta } from './api';
import type {
  AdminCreateFoodDTO,
  AdminUpdateFoodDTO,
  PaginationMeta,
  Food,
} from '@caloriesync/shared';

export interface AdminFoodListParams {
  q?: string;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  pageSize?: number;
  limit?: number;
  sort?: 'nome' | 'kcal' | 'status' | 'proteins' | 'carbs' | 'fats';
  order?: 'asc' | 'desc';
}

export type AdminFoodListResponse = ApiResponseWithMeta<Food[]> & {
  foods: Food[];
  pagination: PaginationMeta;
};

export interface AdminFoodSaveResponse {
  food: Food;
  warnings?: string[];
}

/**
 * Lista alimentos globais para o painel administrativo com paginação server-side.
 */
export async function listAdminFoods(query?: AdminFoodListParams): Promise<AdminFoodListResponse> {
  const params = new URLSearchParams();
  const searchTerm = query?.q || query?.search;
  if (searchTerm) params.append('q', searchTerm);

  if (query?.status) params.append('status', query.status);
  if (query?.page) params.append('page', String(query.page));

  const size = query?.pageSize || query?.limit;
  if (size) params.append('pageSize', String(size));

  if (query?.sort) params.append('sort', query.sort);
  if (query?.order) params.append('order', query.order);

  const qs = params.toString();
  const res = await apiFetchWithMeta<Food[]>(`/admin/foods${qs ? `?${qs}` : ''}`);

  return {
    data: res.data,
    meta: res.meta,
    foods: res.data,
    pagination: res.meta,
  };
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
