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
  created_at: Date;
  updated_at: Date;
}

export type UserWithoutPassword = Omit<User, 'password_hash'>;

export interface TokenPayload {
  userId: string;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
}
