import { apiFetch } from './api';
import type { LoginFormData, RegisterFormData } from '../types/auth';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  goal: string;
  sex?: string;
  birth_date?: string;
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
      goal: data.goal,
      sex: data.sex,
      birthDate: data.birthDate,
    }),
  });
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
