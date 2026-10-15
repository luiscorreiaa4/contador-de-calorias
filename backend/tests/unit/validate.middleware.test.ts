import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { validate } from '../../src/middlewares/validate.js';

describe('Validate Middleware (CA-15)', () => {
  it('deve validar req.params e rejeitar com 400 se inválido', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      '/items/:id',
      validate({
        params: z.object({
          id: z.string().uuid('ID inválido.'),
        }),
      }),
      (req, res) => {
        res.json({ success: true, id: req.params.id });
      }
    );

    const failRes = await request(testApp).get('/items/123-invalido');
    assert.strictEqual(failRes.status, 400);
    assert.match(failRes.body.message, /ID inválido/);

    const okRes = await request(testApp).get('/items/0a7df39a-6e78-458c-9338-c14a955536fe');
    assert.strictEqual(okRes.status, 200);
    assert.strictEqual(okRes.body.id, '0a7df39a-6e78-458c-9338-c14a955536fe');
  });

  it('deve validar req.query e rejeitar com 400 se inválido', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get(
      '/search',
      validate({
        query: z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
          period: z.enum(['week', 'month']),
        }),
      }),
      (req, res) => {
        res.json({ success: true, query: req.query });
      }
    );

    const failRes = await request(testApp).get('/search?date=data-errada&period=year');
    assert.strictEqual(failRes.status, 400);

    const okRes = await request(testApp).get('/search?date=2026-10-15&period=week');
    assert.strictEqual(okRes.status, 200);
  });

  it('deve manter compatibilidade retroativa com schemas de body direto validate(schema)', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.post(
      '/legacy',
      validate(
        z.object({
          title: z.string().min(3),
        })
      ),
      (req, res) => {
        res.json({ success: true, body: req.body });
      }
    );

    const failRes = await request(testApp).post('/legacy').send({ title: 'ab' });
    assert.strictEqual(failRes.status, 400);

    const okRes = await request(testApp).post('/legacy').send({ title: 'abc' });
    assert.strictEqual(okRes.status, 200);
  });
});
