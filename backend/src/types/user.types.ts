export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  goal: 'perder_peso' | 'manter_peso' | 'ganhar_massa';
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
