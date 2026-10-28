import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente antes da validação garantindo localização correta
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT deve ser numérica')
    .refine((v) => Number(v) > 0 && Number(v) <= 65535, 'PORT fora do intervalo')
    .default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_HOST: z.string().min(1, 'DB_HOST é obrigatório'),
  DB_PORT: z.string().regex(/^\d+$/, 'DB_PORT deve ser numérica').refine(v => Number(v) > 0 && Number(v) <= 65535, 'DB_PORT fora do intervalo'),
  DB_USER: z.string().min(1, 'DB_USER é obrigatório'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD é obrigatória'),
  DB_NAME: z.string().min(1, 'DB_NAME é obrigatório'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres para garantir segurança criptográfica adequada.'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DB_SSL_CA: z.string().optional(),
  // BL-27 / A-030 — Chaves VAPID para Web Push Notifications
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  // Número de saltos confiáveis (ex: "1") ou "false"; nunca "true".
  TRUST_PROXY: z
    .string()
    .refine((value) => /^\d+$/.test(value) || value === 'false', {
      message: 'TRUST_PROXY deve ser o número de saltos (ex: "1") ou "false"; nunca "true".',
    })
    .optional(),
  // BL-12 / BL-05 / D-21 — autenticação por e-mail.
  APP_BASE_URL: z
    .string()
    .url('APP_BASE_URL deve ser uma URL absoluta (ex: http://localhost:5173).')
    .transform((value) => value.replace(/\/+$/, '')),
  MAIL_FROM: z.string().min(3, 'MAIL_FROM é obrigatório (ex: CalorieSync <no-reply@dominio>).'),
  MAIL_TRANSPORT: z.enum(['smtp', 'memory'], {
    errorMap: () => ({ message: 'MAIL_TRANSPORT deve ser "smtp" ou "memory".' }),
  }),
  MAIL_SMTP_HOST: z.string().min(1, 'MAIL_SMTP_HOST é obrigatório quando MAIL_TRANSPORT=smtp.').optional(),
  MAIL_SMTP_PORT: z
    .string()
    .regex(/^\d+$/, 'MAIL_SMTP_PORT deve ser numérica.')
    .refine((value) => Number(value) > 0 && Number(value) <= 65535, 'MAIL_SMTP_PORT fora do intervalo.')
    .optional(),
  MAIL_SMTP_USER: z.string().optional(),
  MAIL_SMTP_PASS: z.string().optional(),
  MAIL_SMTP_SECURE: z
    .enum(['true', 'false'], {
      errorMap: () => ({ message: 'MAIL_SMTP_SECURE deve ser "true" ou "false".' }),
    })
    .default('false')
    .transform((value) => value === 'true'),
  AUTH_TOKEN_PEPPER: z
    .string()
    .min(32, 'AUTH_TOKEN_PEPPER deve ter no mínimo 32 caracteres.'),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production' && !data.APP_BASE_URL.startsWith('https://')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['APP_BASE_URL'],
      message: 'APP_BASE_URL deve usar https em NODE_ENV=production.',
    });
  }

  if (data.AUTH_TOKEN_PEPPER === data.JWT_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['AUTH_TOKEN_PEPPER'],
      message: 'AUTH_TOKEN_PEPPER deve ser diferente de JWT_SECRET.',
    });
  }

  if (data.MAIL_TRANSPORT === 'smtp') {
    if (!data.MAIL_SMTP_HOST) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MAIL_SMTP_HOST'],
        message: 'MAIL_SMTP_HOST é obrigatório quando MAIL_TRANSPORT=smtp.',
      });
    }
    if (!data.MAIL_SMTP_PORT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MAIL_SMTP_PORT'],
        message: 'MAIL_SMTP_PORT é obrigatório quando MAIL_TRANSPORT=smtp.',
      });
    }
    if (data.NODE_ENV === 'production' && (!data.MAIL_SMTP_USER || !data.MAIL_SMTP_PASS)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MAIL_SMTP_USER'],
        message: 'MAIL_SMTP_USER e MAIL_SMTP_PASS são obrigatórios em produção com MAIL_TRANSPORT=smtp.',
      });
    }
  }
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuração de Ambiente Inválida:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
