import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.'),
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

export const loginUserSchema = z.object({
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.').optional(),
  email: z.string().email('Digite um e-mail válido.').optional(),
  goal: z.enum(['perder_peso', 'manter_peso', 'ganhar_massa']).optional(),
  sex: z.enum(['masculino', 'feminino', 'prefiro_nao_responder']).optional(),
  birthDate: z.string().min(10, 'Data de nascimento inválida.').optional(),
  weight: z.number().positive('O peso deve ser maior que zero.').optional(),
  height: z.number().positive('A altura deve ser maior que zero.').optional(),
  body_fat: z.number().positive('O percentual de gordura deve ser maior que zero.').nullable().optional(),
  activity_level: z.enum(['sedentario', 'pouco_ativo', 'moderadamente_ativo', 'muito_ativo', 'extremamente_ativo']).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.').optional(),
}).superRefine((data, ctx) => {
  if (data.newPassword && (!data.currentPassword || !data.currentPassword.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currentPassword'],
      message: 'Informe a senha atual para alterar sua senha.',
    });
  }
});

export const deleteUserSchema = z.object({
  password: z.string().min(1, 'Informe sua senha para confirmar a exclusão da conta.'),
});

export const completeOnboardingSchema = z.object({
  sex: z.enum(['masculino', 'feminino', 'prefiro_nao_responder'], { message: 'Selecione o sexo.' }),
  birthDate: z.string().min(10, 'A data de nascimento é obrigatória.'),
  goal: z.enum(['perder_peso', 'manter_peso', 'ganhar_massa'], { message: 'Selecione um objetivo válido.' }),
  weight: z.number().positive('O peso deve ser maior que zero.'),
  height: z.number().positive('A altura deve ser maior que zero.'),
  body_fat: z.number().positive('O percentual de gordura deve ser maior que zero.').nullable().optional(),
  activity_level: z.enum(['sedentario', 'pouco_ativo', 'moderadamente_ativo', 'muito_ativo', 'extremamente_ativo'], { message: 'Selecione um nível de atividade válido.' }),
});

export type RegisterUserDTO = z.infer<typeof registerUserSchema>;
export type LoginUserDTO = z.infer<typeof loginUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export type DeleteUserDTO = z.infer<typeof deleteUserSchema>;
export type CompleteOnboardingDTO = z.infer<typeof completeOnboardingSchema>;
