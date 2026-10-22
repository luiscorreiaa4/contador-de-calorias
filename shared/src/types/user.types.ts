export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
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
  terms_accepted_at: Date | null;
  email_verified_at: Date | null;
  token_version: number;
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export type UserWithoutPassword = Omit<User, 'password_hash'>;

export interface TokenPayload {
  userId: string;
  /** Versão da sessão (D-21 / A8). Claim ausente é inválido. */
  tv: number;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  weight: number;
  body_fat: number | null;
  measured_at: string;
  created_at: string;
}
