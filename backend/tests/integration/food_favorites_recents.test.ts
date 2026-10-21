import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

describe('Food Favorites and Recents (BL-19 / FEAT-C01 / D-20)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-fav-%');
  });

  let user1Token: string;
  let user2Token: string;
  let food1Id: string;
  let food2Id: string;

  it('Setup: Registrar usuários e obter alimentos', async () => {
    const user1 = await createVerifiedUser({
      name: 'Favorite Tester 1',
      email: `tester-fav-1-${Date.now()}@example.com`,
      password: 'password123',
    });
    user1Token = user1.token;

    const user2 = await createVerifiedUser({
      name: 'Favorite Tester 2',
      email: `tester-fav-2-${Date.now()}@example.com`,
      password: 'password123',
    });
    user2Token = user2.token;

    const foodsRes = await request(app)
      .get('/api/foods')
      .set('Authorization', `Bearer ${user1Token}`);
    assert.ok(foodsRes.body.data.foods.length >= 2);
    food1Id = foodsRes.body.data.foods[0].id;
    food2Id = foodsRes.body.data.foods[1].id;
  });

  it('GET /api/foods/recents - deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/foods/recents');
    assert.strictEqual(res.status, 401);
  });

  it('GET /api/foods/recents - retorna lista vazia quando o usuário não registrou refeições', async () => {
    const res = await request(app)
      .get('/api/foods/recents')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.deepStrictEqual(res.body.data, []);
  });

  it('GET /api/foods/recents - deve listar alimentos consumidos recentemente', async () => {
    // Registrar refeição com food1Id e food2Id
    await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Almoço Recente',
        mealTime: new Date().toISOString(),
        items: [
          { foodId: food1Id, quantity: 100 },
          { foodId: food2Id, quantity: 50 },
        ],
      });

    const res = await request(app)
      .get('/api/foods/recents')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length, 2);
    const ids = res.body.data.map((f: { id: string }) => f.id);
    assert.ok(ids.includes(food1Id));
    assert.ok(ids.includes(food2Id));
  });

  it('GET /api/foods/favorites - inicia vazio', async () => {
    const res = await request(app)
      .get('/api/foods/favorites')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data, []);
  });

  it('POST /api/foods/:id/favorite - favorita um alimento', async () => {
    const res = await request(app)
      .post(`/api/foods/${food1Id}/favorite`)
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const listRes = await request(app)
      .get('/api/foods/favorites')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.data.length, 1);
    assert.strictEqual(listRes.body.data[0].id, food1Id);
  });

  it('POST /api/foods/:id/favorite - operação idempotente ao favoritar novamente', async () => {
    const res = await request(app)
      .post(`/api/foods/${food1Id}/favorite`)
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  it('Isolamento: usuário 2 não vê os favoritos do usuário 1', async () => {
    const res = await request(app)
      .get('/api/foods/favorites')
      .set('Authorization', `Bearer ${user2Token}`);

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data, []);
  });

  it('DELETE /api/foods/:id/favorite - desfavorita o alimento', async () => {
    const res = await request(app)
      .delete(`/api/foods/${food1Id}/favorite`)
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const listRes = await request(app)
      .get('/api/foods/favorites')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.data.length, 0);
  });

  it('DELETE /api/foods/:id/favorite - retorna 404 quando o alimento não estiver nos favoritos (A-037 / A-063)', async () => {
    const res = await request(app)
      .delete(`/api/foods/${food1Id}/favorite`)
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Alimento não encontrado nos favoritos.');
  });
});
