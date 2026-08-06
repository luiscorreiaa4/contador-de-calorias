export type AuthMode = 'login' | 'register';

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  goal: 'perder_peso' | 'manter_peso' | 'ganhar_massa';
}

export interface FormErrors {
  [key: string]: string | undefined;
}
