import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

describe('Meal Copy Feature (BL-18 / FEAT-C03 / D-20)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-copy-%');
  });

  let user1Token: string;
  let user2Token: string;
  let foodId: string;
  let sourceMealId: string;

  it('Setup: Registrar usuários e obter alimentos', async () => {
    const user1 = await createVerifiedUser({
      name: 'Copy Tester 1',
      email: `tester-copy-1-${Date.now()}@example.com`,
      password: 'password123',
    });
    user1Token = user1.token;

    const user2 = await createVerifiedUser({
      name: 'Copy Tester 2',
      email: `tester-copy-2-${Date.now()}@example.com`,
      password: 'password123',
    });
    user2Token = user2.token;

    const foodsRes = await request(app)
      .get('/api/foods')
      .set('Authorization', `Bearer ${user1Token}`);
    assert.ok(foodsRes.body.data.foods.length > 0);
    foodId = foodsRes.body.data.foods[0].id;
  });

  it('Setup: Criar refeição no dia 2026-10-10 para o usuário 1', async () => {
    const mealTime = new Date('2026-10-10T12:30:00.000-03:00').toISOString();
    const res = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Almoço Original',
        mealTime,
        items: [{ foodId, quantity: 200, unit: 'g' }]
      });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.id);
    sourceMealId = res.body.data.id;
  });

  it('POST /api/meals/copy - deve retornar 401 sem autenticação', async () => {
    const res = await request(app)
      .post('/api/meals/copy')
      .send({ sourceMealId, targetDate: '2026-10-11' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/meals/copy - deve rejeitar payload sem sourceMealId nem sourceDate com 400', async () => {
    const res = await request(app)
      .post('/api/meals/copy')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ targetDate: '2026-10-11' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/meals/copy - deve copiar uma refeição individual para targetDate', async () => {
    const res = await request(app)
      .post('/api/meals/copy')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        sourceMealId,
        targetDate: '2026-10-11'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.notStrictEqual(res.body.data.id, sourceMealId);
    assert.strictEqual(res.body.data.name, 'Almoço Original');
    assert.strictEqual(res.body.data.items.length, 1);
    assert.strictEqual(Number(res.body.data.items[0].quantity), 200);

    // Verificar se no dia 2026-10-11 ela aparece na listagem do diário
    const listRes = await request(app)
      .get('/api/meals/today?date=2026-10-11')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.data.length, 1);
    assert.strictEqual(listRes.body.data[0].id, res.body.data.id);
  });

  it('POST /api/meals/copy - deve rejeitar cópia de refeição de outro usuário com 404 (IDOR)', async () => {
    const res = await request(app)
      .post('/api/meals/copy')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        sourceMealId,
        targetDate: '2026-10-11'
      });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/meals/copy - deve copiar todas as refeições de um dia inteiro (sourceDate)', async () => {
    // Adicionar mais uma refeição no dia 2026-10-10
    await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Jantar Original',
        mealTime: new Date('2026-10-10T19:30:00.000-03:00').toISOString(),
        items: [{ foodId, quantity: 150 }]
      });

    // Copiar todo o dia 2026-10-10 para 2026-10-12
    const res = await request(app)
      .post('/api/meals/copy')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        sourceDate: '2026-10-10',
        targetDate: '2026-10-12'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.strictEqual(res.body.data.length, 2);

    // Verificar dia 2026-10-12
    const listRes = await request(app)
      .get('/api/meals/today?date=2026-10-12')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.data.length, 2);
  });
});
