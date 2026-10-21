import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';

describe('Saved Meals and Combos (BL-20 / FEAT-C02 / D-20)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-combo-%');
  });

  let user1Token: string;
  let user2Token: string;
  let food1Id: string;
  let food2Id: string;
  let savedMealId: string;

  it('Setup: Registrar usuários e obter alimentos', async () => {
    const res1 = await request(app).post('/api/users/register').send({
      name: 'Combo Tester 1',
      email: `tester-combo-1-${Date.now()}@example.com`,
      password: 'password123',
      acceptTerms: true,
    });
    user1Token = res1.body.data.token;

    const res2 = await request(app).post('/api/users/register').send({
      name: 'Combo Tester 2',
      email: `tester-combo-2-${Date.now()}@example.com`,
      password: 'password123',
      acceptTerms: true,
    });
    user2Token = res2.body.data.token;

    const foodsRes = await request(app)
      .get('/api/foods')
      .set('Authorization', `Bearer ${user1Token}`);
    assert.ok(foodsRes.body.data.foods.length >= 2);
    food1Id = foodsRes.body.data.foods[0].id;
    food2Id = foodsRes.body.data.foods[1].id;
  });

  it('GET /api/saved-meals - 401 sem autenticação', async () => {
    const res = await request(app).get('/api/saved-meals');
    assert.strictEqual(res.status, 401);
  });

  it('GET /api/saved-meals - lista vazia inicial', async () => {
    const res = await request(app)
      .get('/api/saved-meals')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data, []);
  });

  it('POST /api/saved-meals - cria combo com itens', async () => {
    const res = await request(app)
      .post('/api/saved-meals')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Café da Manhã Padrão',
        items: [
          { foodId: food1Id, quantity: 100, unit: 'g' },
          { foodId: food2Id, quantity: 50, unit: 'g' },
        ],
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.strictEqual(res.body.data.name, 'Café da Manhã Padrão');
    assert.strictEqual(res.body.data.items.length, 2);
    savedMealId = res.body.data.id;
  });

  it('GET /api/saved-meals - retorna combo criado com itens e totais', async () => {
    const res = await request(app)
      .get('/api/saved-meals')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.length, 1);
    assert.strictEqual(res.body.data[0].id, savedMealId);
    assert.strictEqual(res.body.data[0].name, 'Café da Manhã Padrão');
    assert.ok(res.body.data[0].total_calories > 0);
    assert.strictEqual(typeof res.body.data[0].total_carbs, 'number');
    assert.strictEqual(typeof res.body.data[0].total_fats, 'number');
  });

  it('Isolamento IDOR: usuário 2 não vê combos do usuário 1', async () => {
    const res = await request(app)
      .get('/api/saved-meals')
      .set('Authorization', `Bearer ${user2Token}`);

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data, []);
  });

  it('Isolamento IDOR: usuário 2 não pode excluir combo do usuário 1 (404)', async () => {
    const res = await request(app)
      .delete(`/api/saved-meals/${savedMealId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    assert.strictEqual(res.status, 404);
  });

  it('DELETE /api/saved-meals/:id - usuário 1 exclui seu próprio combo', async () => {
    const res = await request(app)
      .delete(`/api/saved-meals/${savedMealId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const listRes = await request(app)
      .get('/api/saved-meals')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(listRes.status, 200);
    assert.deepStrictEqual(listRes.body.data, []);
  });
});
