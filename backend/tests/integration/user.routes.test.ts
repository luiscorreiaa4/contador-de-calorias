import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { cleanupTestData } from '../helpers/db.js';

describe('User Routes (Integration - E2E)', () => {
  closeTestPool(async () => {
      await cleanupTestData('tester-user-%');
  });

  const testEmail = `tester-user-${Date.now()}@example.com`;
  const testPassword = 'password123';
  let userToken: string;

  it('POST /api/users/register - deve retornar 201 no caminho feliz real', async () => {
    const response = await request(app).post('/api/users/register').send({
      name: 'Integração Tester',
      email: testEmail,
      password: testPassword,
      acceptTerms: true
    });

    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data.user.email, testEmail);
    // BL-11 / SEC-020 — o aceite dos termos é persistido no cadastro.
    assert.ok(response.body.data.user.terms_accepted_at, 'terms_accepted_at deve ser registrado no cadastro');
    userToken = response.body.data.token;
  });

  it('POST /api/users/register - deve retornar 400 em caso de payload inválido', async () => {
    const response = await request(app).post('/api/users/register').send({
      name: 'Tester',
      email: 'email_invalido',
      password: '123'
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
  });

  it('POST /api/users/register - deve rejeitar cadastro duplicado com 409 mesmo com casing diferente (A-002 / A-004)', async () => {
    const uppercaseEmail = testEmail.toUpperCase();
    const response = await request(app).post('/api/users/register').send({
      name: 'Tester Duplicado',
      email: uppercaseEmail,
      password: testPassword,
      acceptTerms: true
    });

    assert.strictEqual(response.status, 409);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Este e-mail já está cadastrado.');
  });

  it('POST /api/users/login - deve retornar 200 e um token no banco de dados', async () => {
    const response = await request(app).post('/api/users/login').send({
      email: testEmail.toUpperCase(),
      password: testPassword
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.ok(response.body.data.token);
    userToken = response.body.data.token;
  });

  it('GET /api/users/me - deve retornar dados do perfil do usuário autenticado', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.email, testEmail);
    assert.strictEqual(res.body.data.name, 'Integração Tester');
  });

  it('GET /api/users/me/export - deve exportar todos os dados do titular em JSON (BL-10 / D-04)', async () => {
    const res = await request(app)
      .get('/api/users/me/export')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.match(
      String(res.headers['content-disposition']),
      /^attachment; filename="caloriesync-dados-\d{4}-\d{2}-\d{2}\.json"$/
    );
    assert.strictEqual(res.body.data.profile.email, testEmail);
    assert.strictEqual(res.body.data.schema_version, '1.0');
    assert.ok(Array.isArray(res.body.data.goals));
    assert.ok(Array.isArray(res.body.data.body_measurements));
    assert.ok(Array.isArray(res.body.data.meals));
  });

  it('GET /api/users/me/export - deve exigir autenticação', async () => {
    const res = await request(app).get('/api/users/me/export');
    assert.strictEqual(res.status, 401);
  });

  it('PUT /api/users/me/onboarding - deve concluir onboarding e calcular metas iniciais', async () => {
    const res = await request(app)
      .put('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sex: 'masculino',
        birthDate: '1995-05-20',
        height: 180,
        weight: 80,
        activity_level: 'moderadamente_ativo',
        goal: 'perder_peso'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.onboarding_completed, true);
    assert.ok(Number(res.body.data.daily_calories_goal) > 0);
  });

  it('PUT /api/users/me/onboarding - deve bloquear reexecução quando onboarding_completed já for true (PC-07 / SEC-008)', async () => {
    const res = await request(app)
      .put('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sex: 'feminino',
        birthDate: '1995-05-20',
        height: 175,
        weight: 70,
        activity_level: 'sedentario',
        goal: 'manter_peso'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Onboarding já foi concluído/i);
  });

  it('POST /api/users/me/preview-goals - deve calcular prévia de metas energéticas', async () => {
    const res = await request(app)
      .post('/api/users/me/preview-goals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        weight: 85,
        height: 180,
        goal: 'ganhar_massa'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.suggestedCalories > 0);
    assert.ok(res.body.data.suggestedMacros.proteins > 0);
  });

  it('POST /api/users/me/preview-goals - deve aceitar strings numéricas e valores nulos sem erro 400', async () => {
    const res = await request(app)
      .post('/api/users/me/preview-goals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        weight: '85.50',
        height: '180.00',
        body_fat: null,
        sex: 'masculino',
        birthDate: '1995-05-20',
        goal: 'perder_peso',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.suggestedCalories > 0);
  });

  it('POST /api/users/me/preview-goals - deve retornar 422 quando a data de nascimento estiver ausente (A-043)', async () => {
    const newReg = await request(app).post('/api/users/register').send({
      name: 'User Sem Perfil',
      email: `tester-meas-nobirth-${Date.now()}@example.com`,
      password: testPassword,
      acceptTerms: true,
    });
    const token = newReg.body.data.token;

    const res = await request(app)
      .post('/api/users/me/preview-goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        weight: 70,
        height: 175,
        goal: 'manter_peso',
      });

    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Informe a data de nascimento para calcular as metas.');
  });

  it('PUT /api/users/me/goals - deve atualizar metas manuais e persistir vigência', async () => {
    const res = await request(app)
      .put('/api/users/me/goals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        calories: 2200,
        proteins: 160,
        carbs: 250,
        fats: 60,
        mode: 'manual'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(Number(res.body.data.calories), 2200);
    assert.strictEqual(res.body.data.mode, 'manual');
  });

  it('GET /api/users/me/goals - deve retornar a meta ativa para a data', async () => {
    const res = await request(app)
      .get('/api/users/me/goals')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(Number(res.body.data.calories), 2200);
  });

  it('PUT /api/users/me - deve rejeitar troca de senha sem fornecer senha atual', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        newPassword: 'newpassword123'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('PUT /api/users/me - deve atualizar nome e senha com sucesso quando senha atual for fornecida', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Nome Atualizado',
        currentPassword: testPassword,
        newPassword: 'newpassword123'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.name, 'Nome Atualizado');
  });

  it('DELETE /api/users/me - deve rejeitar exclusão com senha incorreta', async () => {
    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        password: 'senha_incorreta'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('DELETE /api/users/me - deve excluir a conta com a senha correta e revogar acesso', async () => {
    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        password: 'newpassword123'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    // Tentativa de login subsequente deve falhar
    const loginRes = await request(app).post('/api/users/login').send({
      email: testEmail,
      password: 'newpassword123'
    });
    assert.strictEqual(loginRes.status, 401);
  });
});
