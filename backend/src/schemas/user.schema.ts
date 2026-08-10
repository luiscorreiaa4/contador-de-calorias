import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.'),
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  goal: z.enum(['perder_peso', 'manter_peso', 'ganhar_massa']).default('perder_peso'),
  sex: z.enum(['masculino', 'feminino', 'prefiro_nao_responder'], { message: 'Selecione o sexo.' }),
  birthDate: z.string().min(10, 'A data de nascimento é obrigatória.'),
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

export type RegisterUserDTO = z.infer<typeof registerUserSchema>;
export type LoginUserDTO = z.infer<typeof loginUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
