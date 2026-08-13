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
}

export interface OnboardingFormData {
  sex: 'masculino' | 'feminino' | 'prefiro_nao_responder' | '';
  birthDate: string;
  goal: 'perder_peso' | 'manter_peso' | 'ganhar_massa' | '';
  weight: string;
  height: string;
  bodyFat: string;
  activityLevel: 'sedentario' | 'pouco_ativo' | 'moderadamente_ativo' | 'muito_ativo' | 'extremamente_ativo' | '';
}

export interface FormErrors {
  [key: string]: string | undefined;
}
