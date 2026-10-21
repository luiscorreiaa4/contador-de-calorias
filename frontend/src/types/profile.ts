import { z } from 'zod';
import { parseAndValidateBirthDate } from '@caloriesync/shared';

const profileFields = z
  .object({
    name: z.string().trim().min(1, 'O NOME É OBRIGATÓRIO.'),
    email: z.string().trim().min(1, 'O E-MAIL É OBRIGATÓRIO.').email('DIGITE UM E-MAIL VÁLIDO.'),
    goal: z.string().min(1, 'SELECIONE O OBJETIVO.'),
    sex: z.enum(['masculino', 'feminino', 'prefiro_nao_responder']),
    birthDate: z.string().optional().refine((val) => {
      if (!val || !val.trim()) return true;
      return parseAndValidateBirthDate(val) !== null;
    }, 'DATA DE NASCIMENTO INVÁLIDA.'),
    weight: z.string().min(1, 'INFORME SEU PESO.'),
    height: z.string().min(1, 'INFORME SUA ALTURA.'),
    bodyFat: z.string().optional().default(''),
    activityLevel: z.string().min(1, 'SELECIONE SEU NÍVEL DE ATIVIDADE.'),
    currentPassword: z.string().optional().default(''),
    newPassword: z.string().optional().default(''),
    confirmNewPassword: z.string().optional().default(''),
  });

export const personalInfoSchema = profileFields
  .pick({ name: true, email: true, sex: true, birthDate: true, currentPassword: true });
export type PersonalInfoFormInputs = z.infer<typeof personalInfoSchema>;

export const routineSchema = z.object({
  goal: z.enum(['perder_peso', 'manter_peso', 'ganhar_massa']),
  activityLevel: z.enum(['sedentario', 'pouco_ativo', 'moderadamente_ativo', 'muito_ativo', 'extremamente_ativo']),
});
export type RoutineFormInputs = z.infer<typeof routineSchema>;

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'INFORME SUA SENHA ATUAL.'),
  newPassword: z.string().min(8, 'USE PELO MENOS 8 CARACTERES.').regex(/(?=.*[a-zA-Z])(?=.*[0-9])/, 'USE LETRAS E NÚMEROS.'),
  confirmNewPassword: z.string().min(1, 'CONFIRME A NOVA SENHA.'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'AS SENHAS NÃO COINCIDEM.', path: ['confirmNewPassword'],
});
export type PasswordFormInputs = z.infer<typeof passwordSchema>;
