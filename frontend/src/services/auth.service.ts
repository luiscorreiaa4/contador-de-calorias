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
  /** Papel de autorização do usuário (D-22 / B1). */
  role?: 'user' | 'admin';
  /** Presente nas respostas completas do backend (BL-12). */
  email_verified_at?: string | null;
  /** Versão do token usada para revogar sessões antigas (BL-12 / A8). */
  token_version?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthResponseData {
  user: UserProfile;
  token: string;
}

/** Resposta de PUT /users/me: inclui token novo após troca de senha/e-mail. */
export type UpdateProfileResult = UserProfile & { token?: string };

export interface UpdateProfileData {
  name?: string;
  email?: string;
  goal?: string;
  sex?: string;
  birthDate?: string | null;
  weight?: number;
  height?: number;
  body_fat?: number | null;
  activity_level?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

/** POST /auth/register (A4/A6): 202 genérico, sem sessão. */
export async function registerUser(data: RegisterFormData): Promise<void> {
  return apiFetch<void>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      acceptTerms: data.acceptTerms,
    }),
  });
}

/** POST /auth/login (A1/A5): só conta verificada recebe sessão. */
export async function loginUser(data: LoginFormData): Promise<AuthResponseData> {
  return apiFetch<AuthResponseData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });
}

/** POST /auth/verify-email (A2/A6): valida o código e devolve sessão. */
export async function verifyEmail(data: VerifyEmailData): Promise<AuthResponseData> {
  return apiFetch<AuthResponseData>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      code: data.code,
    }),
  });
}

/** POST /auth/resend-code (A2/A4): resposta genérica. */
export async function resendVerificationCode(email: string): Promise<void> {
  return apiFetch<void>('/auth/resend-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** POST /auth/forgot-password (A3/A4/A9): resposta genérica. */
export async function forgotPassword(email: string): Promise<void> {
  return apiFetch<void>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** POST /auth/reset-password (A3/A7/A8): sem auto-login. */
export async function resetPassword(token: string, password: string): Promise<void> {
  return apiFetch<void>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function completeUserOnboarding(data: { sex: string; birthDate: string; goal: string; weight: number; height: number; body_fat?: number; activity_level: string; }): Promise<AuthResponseData> {
  const user = await apiFetch<UserProfile>('/users/me/onboarding', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  // O endpoint retorna o user atualizado; a sessão atual continua válida.
  return { user, token: localStorage.getItem('auth_token') || '' };
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me');
}

export async function updateUserProfile(data: UpdateProfileData): Promise<UpdateProfileResult> {
  return apiFetch<UpdateProfileResult>('/users/me', {
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

export interface UserDataExportPayload {
  exported_at: string;
  schema_version: string;
  profile: UserProfile;
  goals: unknown[];
  body_measurements: unknown[];
  meals: unknown[];
}

/** Baixa o pacote completo de dados do titular (JSON). */
export async function exportUserData(): Promise<UserDataExportPayload> {
  return apiFetch<UserDataExportPayload>('/users/me/export');
}
