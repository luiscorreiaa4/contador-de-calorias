import { z } from 'zod';

export const editProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'O NOME É OBRIGATÓRIO.'),
    email: z.string().trim().min(1, 'O E-MAIL É OBRIGATÓRIO.').email('DIGITE UM E-MAIL VÁLIDO.'),
    goal: z.string().min(1, 'SELECIONE O OBJETIVO.'),
    sex: z.enum(['masculino', 'feminino', 'prefiro_nao_responder']),
    birthDate: z.string().optional().refine((val) => {
      if (!val || !val.trim()) return true;
      if (val.length < 10) return false;
      const parts = val.split('/');
      if (parts.length !== 3) return false;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
      if (month < 1 || month > 12) return false;
      if (year < 1900 || year > new Date().getFullYear()) return false;
      return true;
    }, 'DATA DE NASCIMENTO INVÁLIDA.'),
    weight: z.string().min(1, 'INFORME SEU PESO.'),
    height: z.string().min(1, 'INFORME SUA ALTURA.'),
    bodyFat: z.string().optional().default(''),
    activityLevel: z.string().min(1, 'SELECIONE SEU NÍVEL DE ATIVIDADE.'),
    currentPassword: z.string().optional().default(''),
    newPassword: z.string().optional().default(''),
    confirmNewPassword: z.string().optional().default(''),
  })
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword.length >= 8 && /(?=.*[a-zA-Z])(?=.*[0-9])/.test(data.newPassword);
      }
      return true;
    },
    {
      message: 'A NOVA SENHA DEVE TER NO MÍNIMO 8 CARACTERES COM LETRA E NÚMERO.',
      path: ['newPassword'],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword === data.confirmNewPassword;
      }
      return true;
    },
    {
      message: 'AS SENHAS NÃO COINCIDEM.',
      path: ['confirmNewPassword'],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length > 0) {
        return !!data.currentPassword && data.currentPassword.trim().length > 0;
      }
      return true;
    },
    {
      message: 'INFORME SUA SENHA ATUAL PARA ALTERAR A SENHA.',
      path: ['currentPassword'],
    }
  );

export type EditProfileFormInputs = z.infer<typeof editProfileSchema>;
