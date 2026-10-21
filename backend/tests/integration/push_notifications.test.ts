import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

describe('Push Notifications Feature (BL-27 / FEAT-C09)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-push-%');
  });

  let token: string;
  const sampleSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/fake-endpoint-tester',
    keys: {
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9AcUbV3CnhBPdVxePBhiD',
      auth: 'tBHItJI5svbpez7KI4CCXg',
    },
  };

  it('Setup: Registrar usuário de teste', async () => {
    const user = await createVerifiedUser({
      name: 'Push Tester',
      email: `tester-push-${Date.now()}@example.com`,
      password: 'password123',
    });
    token = user.token;
  });

  it('GET /api/push/public-key - deve retornar a chave pública VAPID', async () => {
    const res = await request(app).get('/api/push/public-key');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.data.publicKey === 'string');
    assert.ok(res.body.data.publicKey.length > 0);
  });

  it('POST /api/push/subscribe - deve retornar 401 sem autenticação', async () => {
    const res = await request(app)
      .post('/api/push/subscribe')
      .send(sampleSubscription);
    assert.strictEqual(res.status, 401);
  });

  it('POST /api/push/subscribe - deve validar formato e retornar 400 se inválido', async () => {
    const res = await request(app)
      .post('/api/push/subscribe')
      .set('Authorization', `Bearer ${token}`)
      .send({ endpoint: 'url-invalida' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/push/test - deve retornar 422 quando usuário não possui inscrições ativas', async () => {
    const res = await request(app)
      .post('/api/push/test')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Nenhum dispositivo cadastrado/i);
  });

  it('POST /api/push/subscribe - deve salvar inscrição com sucesso', async () => {
    const res = await request(app)
      .post('/api/push/subscribe')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleSubscription);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
  });

  it('POST /api/push/test - deve enviar notificação de teste com sucesso quando inscrito', async () => {
    const res = await request(app)
      .post('/api/push/test')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.sent, true);
    assert.strictEqual(res.body.data.recipientCount, 1);
  });

  it('POST /api/push/unsubscribe - deve remover inscrição com sucesso', async () => {
    const res = await request(app)
      .post('/api/push/unsubscribe')
      .set('Authorization', `Bearer ${token}`)
      .send({ endpoint: sampleSubscription.endpoint });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  it('POST /api/push/test - deve voltar a retornar 422 após remoção da inscrição', async () => {
    const res = await request(app)
      .post('/api/push/test')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.success, false);
  });
});
