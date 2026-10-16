import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';

describe('Multi-user Authorization & IDOR Protection (PC-18 / TST-003)', () => {
  closeTestPool(async () => {
      await cleanupTestData('tester-auth-%');
  });

  let tokenA: string;
  let tokenB: string;
  let mealAId: string;
  let foodId: string;
  const targetDate = '2026-10-15';

  it('Setup: Registrar Usuário A e Usuário B e obter alimento de teste', async () => {
    const timestamp = Date.now();
    const resA = await request(app).post('/api/users/register').send({
      name: 'Usuário A',
      email: `tester-auth-a-${timestamp}@example.com`,
      password: 'password123'
    });
    assert.strictEqual(resA.status, 201);
    tokenA = resA.body.data.token;

    const resB = await request(app).post('/api/users/register').send({
      name: 'Usuário B',
      email: `tester-auth-b-${timestamp}@example.com`,
      password: 'password123'
    });
    assert.strictEqual(resB.status, 201);
    tokenB = resB.body.data.token;

    const foodsRes = await request(app)
      .get('/api/foods?limit=1')
      .set('Authorization', `Bearer ${tokenA}`);
    assert.strictEqual(foodsRes.status, 200);
    foodId = foodsRes.body.data.foods[0].id;
  });

  it('Setup: Usuário A cria uma refeição', async () => {
    const res = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Almoço Privado de A',
        mealTime: new Date(`${targetDate}T12:00:00Z`).toISOString(),
        items: [{ foodId, quantity: 200 }]
      });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.id);
    mealAId = res.body.data.id;
  });

  it('IDOR: Usuário B não deve enxergar refeição de Usuário A em GET /api/meals/today', async () => {
    const res = await request(app)
      .get(`/api/meals/today?date=${targetDate}`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length, 0);
  });

  it('IDOR: Usuário B não deve receber calorias de Usuário A em GET /api/meals/stats', async () => {
    const res = await request(app)
      .get(`/api/meals/stats?period=week&date=${targetDate}`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.daysLogged, 0);
    assert.strictEqual(res.body.data.averages.consumed.calories, 0);
    // Todos os dias do chartData devem ter consumed_calories 0
    assert.ok(res.body.data.chartData.every((d: { consumed_calories: number }) => d.consumed_calories === 0));
  });

  it('IDOR: Usuário B não pode atualizar refeição de Usuário A (deve retornar 404)', async () => {
    const res = await request(app)
      .put(`/api/meals/${mealAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Tentativa de Hack por B',
        mealTime: new Date(`${targetDate}T12:00:00Z`).toISOString(),
        items: [{ foodId, quantity: 50 }]
      });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /não encontrada ou não pertence a este usuário/i);
  });

  it('IDOR: Usuário B não pode excluir refeição de Usuário A (deve retornar 404)', async () => {
    const res = await request(app)
      .delete(`/api/meals/${mealAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /não encontrada ou não pertence a este usuário/i);
  });

  it('IDOR: Perfil /api/users/me de Usuário B deve retornar estritamente os dados de Usuário B', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.name, 'Usuário B');
    assert.notStrictEqual(res.body.data.name, 'Usuário A');
  });
});
