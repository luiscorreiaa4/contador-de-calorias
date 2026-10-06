import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';

describe('Meal Routes (Integration)', () => {
  after(async () => {
    await pool.end();
  });

  it('GET /api/meals/today - deve retornar 401 sem token (Não Autorizado)', async () => {
    const response = await request(app).get('/api/meals/today');
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.success, false);
  });

  let userToken: string;
  let foodId: string;

  it('Setup: Registrar usuário e pegar alimento para o teste de fuso', async () => {
    const res = await request(app).post('/api/users/register').send({
      name: 'Timezone Tester',
      email: `tz-${Date.now()}@example.com`,
      password: 'password123'
    });
    userToken = res.body.data.token;
    
    const foodsRes = await request(app)
      .get('/api/foods')
      .set('Authorization', `Bearer ${userToken}`);
    foodId = foodsRes.body.data[0].id;
  });

  it('POST /api/meals - criar refeição às 23:59 de Brasília e garantir que aparece no dia correto', async () => {
    // 2026-10-06T23:59:00.000-03:00
    const mealTime = new Date('2026-10-06T23:59:00.000-03:00').toISOString();

    await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Ceia Tardia',
        mealTime: mealTime,
        items: [{ foodId, quantity: 100 }]
      });

    // Buscar as refeições passando a data do "hoje"
    const todayRes = await request(app)
      .get('/api/meals/today?date=2026-10-06')
      .set('Authorization', `Bearer ${userToken}`);
      
    assert.strictEqual(todayRes.body.data.length, 1);
    assert.strictEqual(todayRes.body.data[0].name, 'Ceia Tardia');

    // Buscar do dia seguinte (UTC já seria dia 07), mas aqui não deve retornar
    const tomorrowRes = await request(app)
      .get('/api/meals/today?date=2026-10-07')
      .set('Authorization', `Bearer ${userToken}`);
      
    assert.strictEqual(tomorrowRes.body.data.length, 0);
  });
});
