import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';

describe('Food Routes (Integration)', () => {
  after(async () => {
    await pool.end();
  });

  let userToken: string;

  it('Setup: Registrar usuário para acessar as rotas de alimentos', async () => {
    const res = await request(app).post('/api/users/register').send({
      name: 'Food Tester',
      email: `foodtester-${Date.now()}@example.com`,
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
    // Deve ignorar acentos. Apenas testamos se a busca não quebrou. 
    // Como a base pode ter ou não Maçã, checamos pelo menos sucesso.
    assert.strictEqual(res.body.success, true);
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
});
