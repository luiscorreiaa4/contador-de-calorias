import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createMealSchema } from '../../src/schemas/meal.schema.js';
import { registerUserSchema, updateUserSchema } from '../../src/schemas/user.schema.js';
import { app } from '../../src/app.js';

describe('Input Limits & Sanitization (CA-11)', () => {
  closeTestPool();
  it('createMealSchema: deve rejeitar nome de refeição com mais de 100 caracteres', () => {
    const data = {
      name: 'A'.repeat(101),
      mealTime: new Date().toISOString(),
      items: [
        {
          foodId: '0a7df39a-6e78-458c-9338-c14a955536fe',
          quantity: 100,
        },
      ],
    };

    const result = createMealSchema.safeParse(data);
    assert.strictEqual(result.success, false);
  });

  it('createMealSchema: deve rejeitar refeição com mais de 50 itens', () => {
    const items = Array.from({ length: 51 }, () => ({
      foodId: '0a7df39a-6e78-458c-9338-c14a955536fe',
      quantity: 100,
    }));

    const data = {
      name: 'Almoço Monstruoso',
      mealTime: new Date().toISOString(),
      items,
    };

    const result = createMealSchema.safeParse(data);
    assert.strictEqual(result.success, false);
  });

  it('createMealSchema: deve rejeitar quantidade maior que 10000', () => {
    const data = {
      name: 'Almoço',
      mealTime: new Date().toISOString(),
      items: [
        {
          foodId: '0a7df39a-6e78-458c-9338-c14a955536fe',
          quantity: 10001,
        },
      ],
    };

    const result = createMealSchema.safeParse(data);
    assert.strictEqual(result.success, false);
  });

  it('registerUserSchema: deve rejeitar nome com mais de 100 caracteres', () => {
    const data = {
      name: 'A'.repeat(101),
      email: 'teste@exemplo.com',
      password: 'password123',
    };

    const result = registerUserSchema.safeParse(data);
    assert.strictEqual(result.success, false);
  });

  it('registerUserSchema: deve rejeitar senha com mais de 72 caracteres (limite do bcrypt)', () => {
    const data = {
      name: 'Usuário Teste',
      email: 'teste@exemplo.com',
      password: 'A'.repeat(73),
    };

    const result = registerUserSchema.safeParse(data);
    assert.strictEqual(result.success, false);
  });

  it('updateUserSchema: deve rejeitar nome > 100 caracteres e nova senha > 72 caracteres', () => {
    const longName = updateUserSchema.safeParse({ name: 'A'.repeat(101) });
    assert.strictEqual(longName.success, false);

    const longPass = updateUserSchema.safeParse({
      currentPassword: 'currentpassword',
      newPassword: 'A'.repeat(73),
    });
    assert.strictEqual(longPass.success, false);
  });

  it('express.json: deve rejeitar requisição com payload acima de 50kb', async () => {
    const hugePayload = {
      data: 'X'.repeat(60 * 1024), // ~60KB
    };

    const res = await request(app)
      .post('/api/users/login')
      .send(hugePayload)
      .set('Content-Type', 'application/json');

    assert.strictEqual(res.status, 413);
  });
});
