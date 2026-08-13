import { apiFetch } from './api';
import type { LoginFormData, RegisterFormData } from '../types/auth';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  goal: 'perder_peso' | 'manter_peso' | 'ganhar_massa';
  sex: 'masculino' | 'feminino' | 'prefiro_nao_responder' | null;
  birth_date: string | null;
  weight: number | null;
  height: number | null;
  body_fat: number | null;
  activity_level: string | null;
  daily_calories_goal: number;
  daily_proteins_goal: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponseData {
  user: UserProfile;
  token: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  goal?: string;
  sex?: string;
  birthDate?: string;
  weight?: number;
  height?: number;
  body_fat?: number | null;
  activity_level?: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function loginUser(data: LoginFormData): Promise<AuthResponseData> {
  return apiFetch<AuthResponseData>('/users/login', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });
}

export async function registerUser(data: RegisterFormData): Promise<AuthResponseData> {
  return apiFetch<AuthResponseData>('/users/register', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
    }),
  });
}

export async function completeUserOnboarding(data: { sex: string; birthDate: string; goal: string; weight: number; height: number; body_fat?: number; activity_level: string; }): Promise<AuthResponseData> {
  const user = await apiFetch<UserProfile>('/users/me/onboarding', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  // O endpoint retorna o user atualizado, mas nossa AuthContext espera setar (user, token) se chamarmos setAuthSession, ou updateUserSession(user)
  // Como estamos atualizando a sessão atual, basta retornar o user.
  // Vamos ajustar para retornar { user, token } ou apenas o user dependendo do uso. O melhor é retornar o user atualizado.
  return { user, token: localStorage.getItem('auth_token') || '' };
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me');
}

export async function updateUserProfile(data: UpdateProfileData): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUserAccount(password: string): Promise<void> {
  return apiFetch<void>('/users/me', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}
