import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente antes da validação
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_HOST: z.string().min(1, 'DB_HOST é obrigatório'),
  DB_PORT: z.string().default('5432'),
  DB_USER: z.string().min(1, 'DB_USER é obrigatório'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD é obrigatória'),
  DB_NAME: z.string().min(1, 'DB_NAME é obrigatório'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres para garantir segurança criptográfica adequada.'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuração de Ambiente Inválida:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
