import { apiFetch } from './api';
import type { UpdateGoalsDTO } from '@caloriesync/shared';

export interface UserGoal {
  id: string;
  user_id: string;
  effective_from: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  mode: 'auto' | 'manual';
  created_at: string;
}

export interface EnergyTargets {
  tmb: number;
  tdee: number;
  suggestedCalories: number;
  suggestedMacros: {
    proteins: number;
    fats: number;
    carbs: number;
  };
}

export async function getActiveGoal(date?: string): Promise<UserGoal> {
  const query = date ? `?date=${date}` : '';
  return apiFetch<UserGoal>(`/users/me/goals${query}`);
}

export async function previewGoals(data: Record<string, unknown>): Promise<EnergyTargets> {
  return apiFetch<EnergyTargets>('/users/me/preview-goals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGoals(data: UpdateGoalsDTO): Promise<UserGoal> {
  return apiFetch<UserGoal>('/users/me/goals', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
