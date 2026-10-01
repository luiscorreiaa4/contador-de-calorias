import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import * as MealService from '../../src/services/meal.service.js';

describe('Meal Routes (Integration)', () => {
  it('GET /api/meals/today - deve retornar 401 sem token (Não Autorizado)', async () => {
    const response = await request(app).get('/api/meals/today');
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.success, false);
  });
  
  // Como estamos testando rotas protegidas sem um mock do middleware de auth, 
  // nós precisaríamos mockar o jwt.verify, mas como o controller de usuário já é longo,
  // apenas validar se está caindo na autenticação corretamente no teste unitário da rota já traz muito valor.
});
