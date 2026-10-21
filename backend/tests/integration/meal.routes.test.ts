import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

describe('Meal Routes (Integration)', () => {
  closeTestPool(async () => {
      await cleanupTestData('tester-tz-%');
  });

  it('GET /api/meals/today - deve retornar 401 sem token (Não Autorizado)', async () => {
    const response = await request(app).get('/api/meals/today');
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.success, false);
  });

  let userToken: string;
  let foodId: string;
  let createdMealId: string;

  it('Setup: Registrar usuário e pegar alimento para o teste de fuso', async () => {
    const user = await createVerifiedUser({
      name: 'Timezone Tester',
      email: `tester-tz-${Date.now()}@example.com`,
      password: 'password123',
    });
    userToken = user.token;
    
    const foodsRes = await request(app)
      .get('/api/foods')
      .set('Authorization', `Bearer ${userToken}`);
    foodId = foodsRes.body.data.foods[0].id;
  });

  it('POST /api/meals - criar refeição às 23:59 de Brasília e garantir que aparece no dia correto', async () => {
    // 2026-10-06T23:59:00.000-03:00
    const mealTime = new Date('2026-10-06T23:59:00.000-03:00').toISOString();

    const createRes = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Ceia Tardia',
        mealTime: mealTime,
        items: [{ foodId, quantity: 100 }]
      });

    assert.strictEqual(createRes.status, 201);
    assert.ok(createRes.body.data.id);
    createdMealId = createRes.body.data.id;

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

    // GET /api/meals/stats - refeição às 23:59 deve ser agrupada na data de Brasília (CA-14 / D-01)
    const statsRes = await request(app)
      .get('/api/meals/stats?period=week&date=2026-10-06')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(statsRes.status, 200);
    const dayItem = statsRes.body.data.chartData.find((d: { date: string }) => d.date === '2026-10-06');
    assert.ok(dayItem, 'Data 2026-10-06 deve constar no chartData');
    assert.ok(dayItem.consumed_calories > 0, 'Consumo deve estar atribuído a 2026-10-06 e não ao dia seguinte');
  });

  it('PUT /api/meals/:id - deve atualizar refeição e substituir itens atomicamente', async () => {
    const mealTime = new Date('2026-10-06T20:00:00.000-03:00').toISOString();

    const res = await request(app)
      .put(`/api/meals/${createdMealId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Ceia Atualizada',
        mealTime: mealTime,
        items: [{ foodId, quantity: 200 }]
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.name, 'Ceia Atualizada');
    assert.strictEqual(res.body.data.items.length, 1);
    assert.strictEqual(Number(res.body.data.items[0].quantity), 200);
  });

  it('GET /api/meals/stats - deve calcular estatísticas mensais e médias justas', async () => {
    const res = await request(app)
      .get('/api/meals/stats?period=month&date=2026-10-06')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.period, 'month');
    assert.strictEqual(res.body.data.totalDays, 30);
    assert.strictEqual(res.body.data.daysLogged, 1);
    assert.ok(res.body.data.averages.consumed.calories > 0);
  });

  it('DELETE /api/meals/:id - valida formato UUID via middleware validate (CA-15)', async () => {
    const res = await request(app)
      .delete('/api/meals/abc-nao-eh-uuid')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /ID inválido/);
  });

  it('DELETE /api/meals/:id - deve excluir a refeição com sucesso', async () => {
    const res = await request(app)
      .delete(`/api/meals/${createdMealId}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    // Confirma que a refeição não aparece mais no today
    const checkRes = await request(app)
      .get('/api/meals/today?date=2026-10-06')
      .set('Authorization', `Bearer ${userToken}`);
    assert.strictEqual(checkRes.body.data.length, 0);
  });
});
