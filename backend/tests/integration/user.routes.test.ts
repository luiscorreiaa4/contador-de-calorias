import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';

describe('User Routes (Integration - E2E)', () => {
  after(async () => {
    await pool.end();
  });

  const testEmail = `tester-${Date.now()}@example.com`;
  const testPassword = 'password123';

  it('POST /api/users/register - deve retornar 201 no caminho feliz real', async () => {
    const response = await request(app).post('/api/users/register').send({
      name: 'Integração Tester',
      email: testEmail,
      password: testPassword
    });

    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data.user.email, testEmail);
  });

  it('POST /api/users/register - deve retornar 400 em caso de payload inválido', async () => {
    const response = await request(app).post('/api/users/register').send({
      name: 'Tester',
      email: 'email_invalido',
      password: '123'
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
  });

  it('POST /api/users/login - deve retornar 200 e um token no banco de dados', async () => {
    const response = await request(app).post('/api/users/login').send({
      email: testEmail,
      password: testPassword
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.ok(response.body.data.token);
  });
});
