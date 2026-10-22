import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser } from '../helpers/auth.js';

describe('User Body Measurements Evolution (BL-21 / FEAT-C04)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-meas-%');
  });

  let user1Token: string;
  let user2Token: string;

  it('Setup: Registrar usuários de teste', async () => {
    const user1 = await createVerifiedUser({
      name: 'Measurement Tester 1',
      email: `tester-meas-1-${Date.now()}@example.com`,
      password: 'password123',
    });
    user1Token = user1.token;

    const user2 = await createVerifiedUser({
      name: 'Measurement Tester 2',
      email: `tester-meas-2-${Date.now()}@example.com`,
      password: 'password123',
    });
    user2Token = user2.token;
  });

  it('GET /api/users/me/measurements - deve retornar 401 sem autenticação', async () => {
    const res = await request(app).get('/api/users/me/measurements');
    assert.strictEqual(res.status, 401);
  });

  it('POST /api/users/me/measurements - deve retornar 401 sem autenticação', async () => {
    const res = await request(app).post('/api/users/me/measurements').send({ weight: 75.5 });
    assert.strictEqual(res.status, 401);
  });

  it('POST /api/users/me/measurements - deve validar campos obrigatórios e rejeitar peso inválido (400)', async () => {
    const res = await request(app)
      .post('/api/users/me/measurements')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ weight: -10 });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/users/me/measurements - deve registrar medição com sucesso e atualizar peso do usuário', async () => {
    const res = await request(app)
      .post('/api/users/me/measurements')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ weight: 82.5, body_fat: 18.2 });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(Number(res.body.data.weight), 82.5);
    assert.strictEqual(Number(res.body.data.body_fat), 18.2);

    // Verificar se perfil do usuário reflete o peso atualizado
    const profileRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${user1Token}`);
    assert.strictEqual(Number(profileRes.body.data.weight), 82.5);
    assert.strictEqual(Number(profileRes.body.data.body_fat), 18.2);
  });

  it('GET /api/users/me/measurements - deve listar medições do usuário em ordem cronológica', async () => {
    // Registrar mais uma medição
    await request(app)
      .post('/api/users/me/measurements')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ weight: 81.8, body_fat: 17.9 });

    const res = await request(app)
      .get('/api/users/me/measurements')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 2);

    // Validação estrita de ordem cronológica crescente (A-119)
    const measurements = res.body.data as Array<{ measured_at: string }>;
    for (let i = 1; i < measurements.length; i += 1) {
      const prevTime = new Date(measurements[i - 1].measured_at).getTime();
      const currTime = new Date(measurements[i].measured_at).getTime();
      assert.ok(
        prevTime <= currTime,
        `Medição ${i - 1} (${measurements[i - 1].measured_at}) deve ser anterior ou igual à medição ${i} (${measurements[i].measured_at})`
      );
    }
  });

  it('GET /api/users/me/measurements - IDOR: usuário 2 não deve ver medições do usuário 1', async () => {
    const res = await request(app)
      .get('/api/users/me/measurements')
      .set('Authorization', `Bearer ${user2Token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length, 0);
  });

  it('POST /api/users/me/measurements - medição retroativa não deve sobrescrever peso atual do perfil (A-006)', async () => {
    // user1 tem peso atual 81.8. Registramos medição passada (ex: ano 2020).
    const pastDate = new Date('2020-01-01T10:00:00Z').toISOString();
    const res = await request(app)
      .post('/api/users/me/measurements')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ weight: 99.9, body_fat: 25.0, measured_at: pastDate });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(Number(res.body.data.weight), 99.9);

    // O perfil do usuário ainda DEVE refletir 81.8 (medição mais recente), não 99.9
    const profileRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${user1Token}`);
    assert.strictEqual(Number(profileRes.body.data.weight), 81.8);
  });

  it('DELETE /api/users/me/measurements/:id - deve retornar 401 sem autenticação', async () => {
    const res = await request(app).delete('/api/users/me/measurements/00000000-0000-0000-0000-000000000000');
    assert.strictEqual(res.status, 401);
  });

  it('DELETE /api/users/me/measurements/:id - deve retornar 400 para UUID inválido', async () => {
    const res = await request(app)
      .delete('/api/users/me/measurements/nao-e-uuid')
      .set('Authorization', `Bearer ${user1Token}`);
    assert.strictEqual(res.status, 400);
  });

  it('DELETE /api/users/me/measurements/:id - IDOR: não deve permitir que usuário 2 exclua medição do usuário 1 (404)', async () => {
    // Registra medição para o usuário 1
    const createRes = await request(app)
      .post('/api/users/me/measurements')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ weight: 75.0, body_fat: 15.0 });
    const measurementId = createRes.body.data.id;

    // Usuário 2 tenta deletar a medição do usuário 1
    const res = await request(app)
      .delete(`/api/users/me/measurements/${measurementId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    assert.strictEqual(res.status, 404);
  });

  it('DELETE /api/users/me/measurements/:id - deve excluir medição e atualizar peso do usuário para a mais recente restante', async () => {
    const user3 = await createVerifiedUser({
      name: 'Measurement Tester 3',
      email: `tester-meas-3-${Date.now()}@example.com`,
      password: 'password123',
    });
    const user3Token = user3.token;

    // Registra uma primeira medição (mais antiga)
    await request(app)
      .post('/api/users/me/measurements')
      .set('Authorization', `Bearer ${user3Token}`)
      .send({ weight: 70.0, measured_at: '2026-05-01T12:00:00Z' });

    // Registra uma medição mais nova (72.0)
    const latestRes = await request(app)
      .post('/api/users/me/measurements')
      .set('Authorization', `Bearer ${user3Token}`)
      .send({ weight: 72.0, measured_at: '2026-05-10T12:00:00Z' });
    const latestId = latestRes.body.data.id;

    // Perfil deve ter peso 72.0
    let profileRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${user3Token}`);
    assert.strictEqual(Number(profileRes.body.data.weight), 72.0);

    // Exclui a medição mais recente (latestId)
    const delRes = await request(app)
      .delete(`/api/users/me/measurements/${latestId}`)
      .set('Authorization', `Bearer ${user3Token}`);
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.body.success, true);

    // Agora o peso no perfil deve ter voltado para a mais recente restante (70.0)
    profileRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${user3Token}`);
    assert.strictEqual(Number(profileRes.body.data.weight), 70.0);
  });
});
