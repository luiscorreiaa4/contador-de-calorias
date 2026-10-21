import { z } from 'zod';

export const strongPasswordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.')
  .regex(/(?=.*[a-zA-Z])(?=.*[0-9])/, 'A senha deve conter pelo menos uma letra e um número.');

export const registerUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email: z.string().email('Digite um e-mail válido.'),
  password: strongPasswordSchema,
  // Consentimento explícito obrigatório no cadastro (LGPD art. 7º, I).
  acceptTerms: z.literal(true, {
    message: 'É necessário aceitar os Termos de Uso e a Política de Privacidade.',
    errorMap: () => ({ message: 'É necessário aceitar os Termos de Uso e a Política de Privacidade.' }),
  }),
});

export const loginUserSchema = z.object({
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(1, 'A senha é obrigatória.').max(72, 'A senha deve ter no máximo 72 caracteres.'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(100, 'O nome deve ter no máximo 100 caracteres.').optional(),
  email: z.string().email('Digite um e-mail válido.').optional(),
  goal: z.enum(['perder_peso', 'manter_peso', 'ganhar_massa']).optional(),
  sex: z.enum(['masculino', 'feminino', 'prefiro_nao_responder']).optional(),
  birthDate: z.string().min(10, 'Data de nascimento inválida.').optional(),
  weight: z.number().positive('O peso deve ser maior que zero.').optional(),
  height: z.number().positive('A altura deve ser maior que zero.').optional(),
  body_fat: z.number().positive('O percentual de gordura deve ser maior que zero.').nullable().optional(),
  activity_level: z.enum(['sedentario', 'pouco_ativo', 'moderadamente_ativo', 'muito_ativo', 'extremamente_ativo']).optional(),
  currentPassword: z.string().max(72, 'A senha deve ter no máximo 72 caracteres.').optional(),
  newPassword: strongPasswordSchema.optional(),
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
  password: z.string().min(1, 'Informe sua senha para confirmar a exclusão da conta.').max(72, 'A senha deve ter no máximo 72 caracteres.'),
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

export const previewGoalsSchema = z.object({
  sex: z.enum(['masculino', 'feminino', 'prefiro_nao_responder']).nullable().optional(),
  birthDate: z.string().min(10).nullable().optional(),
  goal: z.enum(['perder_peso', 'manter_peso', 'ganhar_massa']).nullable().optional(),
  weight: z.preprocess((val) => (val === null || val === '' || val === undefined ? undefined : Number(val)), z.number().positive().optional()),
  height: z.preprocess((val) => (val === null || val === '' || val === undefined ? undefined : Number(val)), z.number().positive().optional()),
  body_fat: z.preprocess((val) => (val === null || val === '' || val === undefined ? null : Number(val)), z.number().positive().nullable().optional()),
  activity_level: z.enum(['sedentario', 'pouco_ativo', 'moderadamente_ativo', 'muito_ativo', 'extremamente_ativo']).nullable().optional(),
});

export const updateGoalsSchema = z.object({
  calories: z.number().positive('As calorias devem ser positivas.'),
  proteins: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fats: z.number().nonnegative(),
  mode: z.enum(['auto', 'manual']),
});

export const createMeasurementSchema = z.object({
  weight: z.number().positive('O peso deve ser maior que zero.').max(500, 'Peso inválido.'),
  body_fat: z.number().positive('O percentual de gordura deve ser maior que zero.').max(100, 'Percentual inválido.').nullable().optional(),
  measured_at: z.string().optional(),
});

export const measurementQuerySchema = z.object({
  period: z.enum(['30d', '90d', 'all']).optional(),
});

export type RegisterUserDTO = z.infer<typeof registerUserSchema>;
export type LoginUserDTO = z.infer<typeof loginUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export type DeleteUserDTO = z.infer<typeof deleteUserSchema>;
export type CompleteOnboardingDTO = z.infer<typeof completeOnboardingSchema>;
export type PreviewGoalsDTO = z.infer<typeof previewGoalsSchema>;
export type UpdateGoalsDTO = z.infer<typeof updateGoalsSchema>;
export type CreateMeasurementDTO = z.infer<typeof createMeasurementSchema>;
export type MeasurementQueryDTO = z.infer<typeof measurementQuerySchema>;

