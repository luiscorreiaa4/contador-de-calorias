import { apiFetch } from './api';
import type { LoginFormData, RegisterFormData } from '../types/auth';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  goal: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponseData {
  user: UserProfile;
  token: string;
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
      goal: data.goal,
    }),
  });
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me');
}
