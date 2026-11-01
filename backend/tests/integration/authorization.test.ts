import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

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
    const userA = await createVerifiedUser({
      name: 'Usuário A',
      email: `tester-auth-a-${timestamp}@example.com`,
      password: 'password123',
    });
    tokenA = userA.token;

    const userB = await createVerifiedUser({
      name: 'Usuário B',
      email: `tester-auth-b-${timestamp}@example.com`,
      password: 'password123',
    });
    tokenB = userB.token;

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

  it('IDOR: Alimentos customizados de Usuário A não devem ser visíveis para Usuário B', async () => {
    const customFoodRes = await request(app)
      .post('/api/foods/custom')
      .set('Authorization', 'Bearer ' + tokenA)
      .send({
        name: 'Bolo Secreto do A',
        calories: 350,
        proteins: 5,
        carbs: 45,
        fats: 12,
        serving_weight: 100
      });

    assert.strictEqual(customFoodRes.status, 201);
    assert.strictEqual(customFoodRes.body.success, true);

    const searchB = await request(app)
      .get('/api/foods?search=Bolo%20Secreto%20do%20A')
      .set('Authorization', 'Bearer ' + tokenB);

    assert.strictEqual(searchB.status, 200);
    assert.strictEqual(searchB.body.data.foods.length, 0);

    const searchA = await request(app)
      .get('/api/foods?search=Bolo%20Secreto%20do%20A')
      .set('Authorization', 'Bearer ' + tokenA);

    assert.strictEqual(searchA.status, 200);
    assert.strictEqual(searchA.body.data.foods.length, 1);
    assert.strictEqual(searchA.body.data.foods[0].name, 'Bolo Secreto do A');
  });

  it('IDOR: Refeições salvas de Usuário A não devem ser acessíveis nem deletáveis por Usuário B', async () => {
    const createSavedRes = await request(app)
      .post('/api/saved-meals')
      .set('Authorization', 'Bearer ' + tokenA)
      .send({
        name: 'Combo Especial do A',
        items: [{ foodId, quantity: 150 }]
      });

    assert.strictEqual(createSavedRes.status, 201);
    const savedMealId = createSavedRes.body.data.id;

    const listB = await request(app)
      .get('/api/saved-meals')
      .set('Authorization', 'Bearer ' + tokenB);

    assert.strictEqual(listB.status, 200);
    assert.strictEqual(listB.body.data.length, 0);

    const deleteAttemptByB = await request(app)
      .delete('/api/saved-meals/' + savedMealId)
      .set('Authorization', 'Bearer ' + tokenB);

    assert.strictEqual(deleteAttemptByB.status, 404);
  });

  it('IDOR: Alimentos favoritados por Usuário A não devem aparecer nem ser alterados por Usuário B', async () => {
    const favA = await request(app)
      .post('/api/foods/' + foodId + '/favorite')
      .set('Authorization', 'Bearer ' + tokenA);

    assert.strictEqual(favA.status, 200);

    const listFavB = await request(app)
      .get('/api/foods/favorites')
      .set('Authorization', 'Bearer ' + tokenB);

    assert.strictEqual(listFavB.status, 200);
    const hasFoodInB = listFavB.body.data.some((f: { id: string }) => f.id === foodId);
    assert.strictEqual(hasFoodInB, false);

    await request(app)
      .delete('/api/foods/' + foodId + '/favorite')
      .set('Authorization', 'Bearer ' + tokenB);

    const listFavA = await request(app)
      .get('/api/foods/favorites')
      .set('Authorization', 'Bearer ' + tokenA);

    assert.strictEqual(listFavA.status, 200);
    const hasFoodInA = listFavA.body.data.some((f: { id: string }) => f.id === foodId);
    assert.strictEqual(hasFoodInA, true);
  });

  it('IDOR: Medições corporais de Usuário A não devem ser visíveis nem deletáveis por Usuário B', async () => {
    const addMeasRes = await request(app)
      .post('/api/users/me/measurements')
      .set('Authorization', 'Bearer ' + tokenA)
      .send({
        weight: 78.5,
        measured_at: '2026-10-15'
      });

    assert.strictEqual(addMeasRes.status, 201);
    const measurementId = addMeasRes.body.data.id;

    const listMeasB = await request(app)
      .get('/api/users/me/measurements')
      .set('Authorization', 'Bearer ' + tokenB);

    assert.strictEqual(listMeasB.status, 200);
    const hasMeasInB = listMeasB.body.data.some((m: { id: string }) => m.id === measurementId);
    assert.strictEqual(hasMeasInB, false);

    const deleteMeasB = await request(app)
      .delete('/api/users/me/measurements/' + measurementId)
      .set('Authorization', 'Bearer ' + tokenB);

    assert.strictEqual(deleteMeasB.status, 404);
  });

  it('IDOR: Metas nutricionais de Usuário A não devem sobrescrever nem ser retornadas para Usuário B', async () => {
    const updateGoalA = await request(app)
      .put('/api/users/me/goals')
      .set('Authorization', 'Bearer ' + tokenA)
      .send({
        calories: 3100,
        proteins: 210,
        carbs: 350,
        fats: 80,
        mode: 'manual'
      });

    assert.strictEqual(updateGoalA.status, 200);

    const getGoalB = await request(app)
      .get('/api/users/me/goals')
      .set('Authorization', 'Bearer ' + tokenB);

    assert.strictEqual(getGoalB.status, 200);
    if (getGoalB.body.data) {
      assert.notStrictEqual(getGoalB.body.data.calories, 3100);
    }
  });

  it('RBAC: Usuário comum deve ser bloqueado com 403 Forbidden em rotas administrativas', async () => {
    const adminFoodsRes = await request(app)
      .get('/api/admin/foods')
      .set('Authorization', 'Bearer ' + tokenA);

    assert.strictEqual(adminFoodsRes.status, 403);
    assert.strictEqual(adminFoodsRes.body.success, false);
    assert.strictEqual(adminFoodsRes.body.code, 'FORBIDDEN');

    const adminUsersRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer ' + tokenA);

    assert.strictEqual(adminUsersRes.status, 403);
    assert.strictEqual(adminUsersRes.body.success, false);
    assert.strictEqual(adminUsersRes.body.code, 'FORBIDDEN');
  });
});
