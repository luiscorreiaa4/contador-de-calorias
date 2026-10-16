import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';
import { cleanupTestData } from '../helpers/db.js';

describe('Food Routes (Integration)', () => {
  after(async () => {
    try {
      await cleanupTestData('tester-food-%');
    } finally {
      await pool.end();
    }
  });

  let userToken: string;

  it('Setup: Registrar usuário para acessar as rotas de alimentos', async () => {
    const res = await request(app).post('/api/users/register').send({
      name: 'Food Tester',
      email: `tester-food-${Date.now()}@example.com`,
      password: 'password123'
    });
    userToken = res.body.data.token;
  });

  it('GET /api/foods - listar com paginação básica', async () => {
    const res = await request(app)
      .get('/api/foods?limit=2&page=1')
      .set('Authorization', `Bearer ${userToken}`);
    
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data.foods));
    assert.ok(typeof res.body.data.total === 'number');
    assert.ok(res.body.data.foods.length <= 2);
  });

  it('GET /api/foods - buscar com acento (maca -> Maçã)', async () => {
    const res = await request(app)
      .get('/api/foods?search=maca')
      .set('Authorization', `Bearer ${userToken}`);
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.foods));
    assert.ok(res.body.data.foods.length > 0);
    assert.ok(res.body.data.foods.some((f: { name: string }) => f.name.includes('Maçã')));
  });

  it('GET /api/foods - limite trava em 50 (se passar mais)', async () => {
    const res = await request(app)
      .get('/api/foods?limit=100')
      .set('Authorization', `Bearer ${userToken}`);
    
    assert.strictEqual(res.status, 400); // Porque o validador limit max é 50
    assert.match(res.body.message, /(Number must be less than or equal to 50|O limite deve ser no máximo 50)/);
  });

  it('GET /api/foods - rejeita busca com mais de 100 caracteres (CA-11)', async () => {
    const res = await request(app)
      .get(`/api/foods?search=${'A'.repeat(101)}`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 400);
  });

  it('GET /api/foods - sanitiza curingas SQL % e _ sem quebrar ou vazar todos os registros (CA-11)', async () => {
    const res = await request(app)
      .get('/api/foods?search=__nao_existe__')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.foods.length, 0);
  });

  it('GET /api/foods - deve incluir cabeçalhos de cache privado e ETag (PC-03 / D-07)', async () => {
    const res = await request(app)
      .get('/api/foods?search=arroz')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['cache-control'], 'private, max-age=300');
    assert.match(res.headers['vary'] || '', /Authorization/);
    assert.ok(res.headers['etag'], 'Esperado cabeçalho ETag');

    // Valida resposta 304 Not Modified com If-None-Match
    const res304 = await request(app)
      .get('/api/foods?search=arroz')
      .set('Authorization', `Bearer ${userToken}`)
      .set('If-None-Match', res.headers['etag']);

    assert.strictEqual(res304.status, 304);
  });

  it('GET /api/foods - projeção explícita: deve expor source e não expor external_id ou active (PC-09 / D-08)', async () => {
    const res = await request(app)
      .get('/api/foods?limit=1')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.foods.length > 0);
    const food = res.body.data.foods[0];
    assert.ok('source' in food, 'Esperado campo source na projeção');
    assert.strictEqual('external_id' in food, false, 'external_id não deve ser exposto');
    assert.strictEqual('active' in food, false, 'active não deve ser exposto');
  });
});
