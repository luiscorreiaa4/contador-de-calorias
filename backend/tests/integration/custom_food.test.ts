import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';

describe('Custom Foods Feature (BL-22 / FEAT-C05 / D-07)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-food-%');
  });

  let user1Token: string;
  let user2Token: string;
  let customFoodId: string;

  it('Setup: Registrar usuários de teste', async () => {
    const res1 = await request(app).post('/api/users/register').send({
      name: 'Custom Food Tester 1',
      email: `tester-food-1-${Date.now()}@example.com`,
      password: 'password123',
      acceptTerms: true,
    });
    assert.strictEqual(res1.status, 201);
    user1Token = res1.body.data.token;

    const res2 = await request(app).post('/api/users/register').send({
      name: 'Custom Food Tester 2',
      email: `tester-food-2-${Date.now()}@example.com`,
      password: 'password123',
      acceptTerms: true,
    });
    assert.strictEqual(res2.status, 201);
    user2Token = res2.body.data.token;
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
});
