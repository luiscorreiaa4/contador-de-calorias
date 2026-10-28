import { z } from 'zod';
import { parseAndValidateBirthDate } from '@caloriesync/shared';


export const personalInfoSchema = z.object({
  name: z.string().trim().min(1, 'O NOME É OBRIGATÓRIO.'),
  sex: z.enum(['masculino', 'feminino', 'prefiro_nao_responder']),
  birthDate: z.string().optional().refine((val) => {
    if (!val || !val.trim()) return true;
    return parseAndValidateBirthDate(val) !== null;
  }, 'DATA DE NASCIMENTO INVÁLIDA.'),
  height: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val)) ? undefined : Number(String(val).replace(',', '.'))),
    z.number({ invalid_type_error: 'INFORME UMA ALTURA VÁLIDA.', required_error: 'INFORME SUA ALTURA.' })
      .positive('A ALTURA DEVE SER MAIOR QUE ZERO.')
      .max(300, 'ALTURA INVÁLIDA.')
  ),
});
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
