import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

describe('Custom Foods Feature (BL-22 / FEAT-C05 / D-07)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-food-%');
  });

  let user1Token: string;
  let user2Token: string;
  let customFoodId: string;

  it('Setup: Registrar usuários de teste', async () => {
    const user1 = await createVerifiedUser({
      name: 'Custom Food Tester 1',
      email: `tester-food-1-${Date.now()}@example.com`,
      password: 'password123',
    });
    user1Token = user1.token;

    const user2 = await createVerifiedUser({
      name: 'Custom Food Tester 2',
      email: `tester-food-2-${Date.now()}@example.com`,
      password: 'password123',
    });
    user2Token = user2.token;
  });

  it('POST /api/foods/custom - deve retornar 401 sem autenticação', async () => {
    const res = await request(app).post('/api/foods/custom').send({
      name: 'Whey Artesanal',
      calories: 120,
      proteins: 24,
      carbs: 2,
      fats: 1.5,
    });
    assert.strictEqual(res.status, 401);
  });

  it('POST /api/foods/custom - deve validar payload e retornar 400 se inválido', async () => {
    const res = await request(app)
      .post('/api/foods/custom')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'A', // nome muito curto
        calories: -50,
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/foods/custom - deve criar alimento personalizado com sucesso', async () => {
    const res = await request(app)
      .post('/api/foods/custom')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Whey Isolado Gourmet',
        calories: 110,
        proteins: 26,
        carbs: 1,
        fats: 0.5,
        base_unit: 'g',
        serving_weight: 100,
        unit_name: 'scoop',
        unit_weight: 30,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.strictEqual(res.body.data.name, 'Whey Isolado Gourmet');
    assert.strictEqual(res.body.data.source, 'custom');
    customFoodId = res.body.data.id;
  });

  it('GET /api/foods - usuário 1 deve encontrar seu próprio alimento personalizado na busca', async () => {
    const res = await request(app)
      .get('/api/foods?search=Whey Isolado')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const found = res.body.data.foods.find((f: { id: string }) => f.id === customFoodId);
    assert.ok(found, 'Alimento personalizado deve aparecer na busca do criador');
  });

  it('GET /api/foods - IDOR: usuário 2 NÃO deve ver o alimento personalizado do usuário 1', async () => {
    const res = await request(app)
      .get('/api/foods?search=Whey Isolado')
      .set('Authorization', `Bearer ${user2Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const found = res.body.data.foods.find((f: { id: string }) => f.id === customFoodId);
    assert.strictEqual(found, undefined, 'Usuário 2 não deve acessar alimento privado de outro usuário');
  });

  it('POST /api/foods/custom - deve rejeitar criação de alimento com mesmo nome pelo mesmo usuário com 409 (A-003)', async () => {
    const res = await request(app)
      .post('/api/foods/custom')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Whey Isolado Gourmet',
        calories: 120,
        proteins: 25,
        carbs: 2,
        fats: 1,
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Você já possui um alimento ativo cadastrado com este nome.');
  });

  it('POST /api/foods/custom - usuário 2 deve conseguir criar alimento com o mesmo nome de usuário 1 (A-003)', async () => {
    const res = await request(app)
      .post('/api/foods/custom')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        name: 'Whey Isolado Gourmet',
        calories: 125,
        proteins: 24,
        carbs: 3,
        fats: 1.2,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
  });

  it('POST /api/foods/:id/favorite - deve rejeitar favoritar alimento privado de outro usuário com 404 (A-015)', async () => {
    const res = await request(app)
      .post(`/api/foods/${customFoodId}/favorite`)
      .set('Authorization', `Bearer ${user2Token}`);

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Alimento não encontrado.');
  });

  it('POST /api/meals - deve rejeitar registrar refeição com alimento privado de outro usuário com 404 (A-015)', async () => {
    const res = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        name: 'Tentativa Alimento Alheio',
        mealTime: new Date().toISOString(),
        items: [{ foodId: customFoodId, quantity: 50 }],
      });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, `Alimento com ID ${customFoodId} não encontrado.`);
  });
});
