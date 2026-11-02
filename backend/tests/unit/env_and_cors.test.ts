import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { envSchema } from '../../src/config/env.js';
import { app } from '../../src/app.js';
import { closeTestPool } from '../helpers/lifecycle.js';

describe('CORS and Production Env Hardening (#13 / #14)', () => {
  closeTestPool();

  const baseProdEnv = {
    PORT: '3001',
    NODE_ENV: 'production',
    DB_HOST: 'db.prod.internal',
    DB_PORT: '5432',
    DB_USER: 'prod_user',
    DB_PASSWORD: 'super_secret_prod_password_123',
    DB_NAME: 'contador_calorias',
    JWT_SECRET: 'jwt_secret_with_more_than_32_characters_long_12345',
    AUTH_TOKEN_PEPPER: 'pepper_secret_different_than_jwt_secret_32_chars!',
    APP_BASE_URL: 'https://app.caloriesync.com',
    MAIL_FROM: 'CalorieSync <no-reply@caloriesync.com>',
    MAIL_TRANSPORT: 'smtp',
    MAIL_SMTP_HOST: 'smtp.sendgrid.net',
    MAIL_SMTP_PORT: '587',
    MAIL_SMTP_USER: 'apikey',
    MAIL_SMTP_PASS: 'SG.1234567890',
    MAIL_SMTP_SECURE: 'false',
    CORS_ORIGIN: 'https://app.caloriesync.com',
  };

  it('deve aceitar configuração válida em produção', () => {
    const result = envSchema.safeParse(baseProdEnv);
    assert.strictEqual(result.success, true);
  });

  it('deve rejeitar CORS_ORIGIN com "*" em produção (#13)', () => {
    const result = envSchema.safeParse({
      ...baseProdEnv,
      CORS_ORIGIN: '*',
    });
    assert.strictEqual(result.success, false);
    assert.match(result.error?.issues[0]?.message ?? '', /CORS_ORIGIN em produção/i);
  });

  it('deve rejeitar CORS_ORIGIN com "localhost" em produção (#13)', () => {
    const result = envSchema.safeParse({
      ...baseProdEnv,
      CORS_ORIGIN: 'http://localhost:5173',
    });
    assert.strictEqual(result.success, false);
    assert.match(result.error?.issues[0]?.message ?? '', /CORS_ORIGIN em produção/i);
  });

  it('deve rejeitar CORS_ORIGIN com http (sem TLS) em produção (#13)', () => {
    const result = envSchema.safeParse({
      ...baseProdEnv,
      CORS_ORIGIN: 'http://app.caloriesync.com',
    });
    assert.strictEqual(result.success, false);
    assert.match(result.error?.issues[0]?.message ?? '', /CORS_ORIGIN em produção/i);
  });

  it('deve rejeitar MAIL_TRANSPORT=memory em produção (#14)', () => {
    const result = envSchema.safeParse({
      ...baseProdEnv,
      MAIL_TRANSPORT: 'memory',
    });
    assert.strictEqual(result.success, false);
    assert.match(
      result.error?.issues[0]?.message ?? '',
      /MAIL_TRANSPORT=memory é proibido em produção/i,
    );
  });

  it('deve responder 403 limpo quando a origem não for permitida por CORS (#13)', async () => {
    const response = await request(app)
      .get('/api/foods')
      .set('Origin', 'https://malicious-site.example.com');

    assert.strictEqual(response.status, 403);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.code, 'FORBIDDEN');
    assert.match(response.body.message, /origem não permitida por cors/i);
  });
});
