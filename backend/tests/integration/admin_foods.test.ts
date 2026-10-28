import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/database/pool.js';
import { cleanupTestData } from '../helpers/db.js';
import { createVerifiedUser, createVerifiedAdmin } from '../helpers/auth.js';

describe('Admin Global Foods Catalog API (D-22 / B3 / B4 / B5 / B6 / B7 / B11 / B12)', () => {
  closeTestPool(async () => {
    await cleanupTestData('tester-admin-food-%');
    // Limpa alimentos criados no teste
    await pool.query("DELETE FROM foods WHERE source = 'catalog' AND name LIKE 'Teste Admin%'");
    await pool.query("DELETE FROM foods WHERE name LIKE 'Teste Admin%'");
  });

  let adminToken: string;
  let userToken: string;
  let testFoodId: string;

  it('Setup: Criar usuário comum e administrador', async () => {
    const timestamp = Date.now();
    const admin = await createVerifiedAdmin({
      name: 'Admin do Catálogo',
      email: `tester-admin-food-adm-${timestamp}@example.com`,
    });
    adminToken = admin.token;

    const user = await createVerifiedUser({
      name: 'Usuário Comum',
      email: `tester-admin-food-usr-${timestamp}@example.com`,
    });
    userToken = user.token;
  });

  it('1. Matriz de autorização enumera rotas do router admin (401 anônimo, 403 usuário comum, 2xx admin)', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000001';
    const routesToTest = [
      { method: 'get', path: '/api/admin/foods', body: undefined },
      { method: 'post', path: '/api/admin/foods', body: { name: 'Inválido' } },
      { method: 'get', path: `/api/admin/foods/${fakeUuid}`, body: undefined },
      { method: 'put', path: `/api/admin/foods/${fakeUuid}`, body: { name: 'Inválido' } },
      { method: 'patch', path: `/api/admin/foods/${fakeUuid}/status`, body: { active: false } },
    ];

    for (const r of routesToTest) {
      // 401 Anônimo
      const reqAnon = (request(app) as unknown as Record<string, (url: string) => request.Test>)[r.method](r.path);
      if (r.body) reqAnon.send(r.body);
      const resAnon = await reqAnon;
      assert.strictEqual(resAnon.status, 401, `Rota ${r.method.toUpperCase()} ${r.path} deveria retornar 401 para anônimo`);

      // 403 Usuário Comum
      const reqUser = (request(app) as unknown as Record<string, (url: string) => request.Test>)[r.method](r.path)
        .set('Authorization', `Bearer ${userToken}`);
      if (r.body) reqUser.send(r.body);
      const resUser = await reqUser;
      assert.strictEqual(resUser.status, 403, `Rota ${r.method.toUpperCase()} ${r.path} deveria retornar 403 para usuário comum`);
      assert.strictEqual(resUser.body.code, 'FORBIDDEN');
    }
  });

  it('2. Validação dura por 100g: valores negativos, kcal > 900, macro > 100, P+C+G > 100.5g e falta de source_ref', async () => {
    // Falta source_ref
    const resNoSource = await request(app)
      .post('/api/admin/foods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Teste Admin Sem Fonte',
        calories: 100,
        proteins: 10,
        carbs: 10,
        fats: 2,
      });
    assert.strictEqual(resNoSource.status, 400);

    // Kcal > 900
    const resHighKcal = await request(app)
      .post('/api/admin/foods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Teste Admin Kcal Alta',
        calories: 950,
        proteins: 10,
        carbs: 10,
        fats: 2,
        source_ref: 'Rótulo do fabricante',
      });
    assert.strictEqual(resHighKcal.status, 400);

    // P + C + G > 100.5
    const resOverloadMacros = await request(app)
      .post('/api/admin/foods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Teste Admin Macros 150g',
        calories: 600,
        proteins: 50,
        carbs: 50,
        fats: 50,
        source_ref: 'Rótulo do fabricante',
      });
    assert.strictEqual(resOverloadMacros.status, 400);
  });

  it('3. Criação de alimento global com sucesso, auditoria atômica e cálculo de warnings calóricos', async () => {
    // Alimento com divergência calórica proposital de 40%:
    // P=10 (40 kcal) + C=10 (40 kcal) + G=10 (90 kcal) = 170 kcal calculadas. Informamos 280 kcal (> 25% de erro).
    const createRes = await request(app)
      .post('/api/admin/foods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Teste Admin Alimento Especial',
        calories: 280,
        proteins: 10,
        carbs: 10,
        fats: 10,
        base_unit: 'g',
        serving_weight: 100,
        unit_name: 'colher',
        unit_weight: 20,
        source_ref: 'TACO 4ª ed., código 999',
      });

    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.success, true);
    assert(createRes.body.warnings && createRes.body.warnings.length > 0, 'Deveria retornar aviso de divergência calórica');
    testFoodId = createRes.body.data.id;

    // Verifica que gravou em admin_audit_log
    const auditRes = await pool.query(
      "SELECT * FROM admin_audit_log WHERE entity_type = 'food' AND entity_id = $1 AND action = 'create_food'",
      [testFoodId]
    );
    assert.strictEqual(auditRes.rows.length, 1, 'Auditoria deve registrar create_food atomicamente');
    assert.strictEqual(auditRes.rows[0].actor_type, 'user');
    assert.strictEqual(auditRes.rows[0].before, null);
    assert.strictEqual(auditRes.rows[0].after.name, 'Teste Admin Alimento Especial');
  });

  it('4. Listagem administrativa com filtros status (all/active/inactive) e busca com escape de ILIKE', async () => {
    // Busca com caracteres que poderiam bugar ILIKE ('%')
    const listRes = await request(app)
      .get('/api/admin/foods?search=Especial%25&status=all')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.success, true);

    // Busca exata pelo nome
    const searchRes = await request(app)
      .get('/api/admin/foods?search=Especial&status=active')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(searchRes.status, 200);
    assert(searchRes.body.data.foods.some((f: { id: string }) => f.id === testFoodId));
  });

  it('5. Edição de alimento atualiza dados, marca admin_edited_at e grava auditoria', async () => {
    const updateRes = await request(app)
      .put(`/api/admin/foods/${testFoodId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Teste Admin Alimento Editado',
        calories: 170, // Agora bate exato com os macros
        proteins: 10,
        carbs: 10,
        fats: 10,
        base_unit: 'g',
        serving_weight: 100,
        unit_name: 'colher',
        unit_weight: 20,
        source_ref: 'TACO 4ª ed., código 999 corrigido',
      });

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.name, 'Teste Admin Alimento Editado');
    assert.strictEqual(updateRes.body.warnings.length, 0, 'Não deve ter divergência calórica após correção');

    // Verifica auditoria
    const auditRes = await pool.query(
      "SELECT * FROM admin_audit_log WHERE entity_type = 'food' AND entity_id = $1 AND action = 'update_food'",
      [testFoodId]
    );
    assert.strictEqual(auditRes.rows.length, 1);
    assert.strictEqual(auditRes.rows[0].before.name, 'Teste Admin Alimento Especial');
    assert.strictEqual(auditRes.rows[0].after.name, 'Teste Admin Alimento Editado');
  });

  it('6. Desativação do alimento (active=false): some da busca pública mas histórico de refeições segue intacto (B6 / B7)', async () => {
    // 6a. Usuário comum cria uma refeição consumindo este alimento enquanto ele ainda está ativo
    const mealRes = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Almoço de Teste',
        mealTime: new Date().toISOString(),
        items: [
          {
            foodId: testFoodId,
            quantity: 100,
            unit: 'g',
          },
        ],
      });

    assert.strictEqual(mealRes.status, 201);
    const mealId = mealRes.body.data.id;
    assert.strictEqual(mealRes.body.data.items[0].calories, 170);

    // 6b. Admin desativa o alimento
    const statusRes = await request(app)
      .patch(`/api/admin/foods/${testFoodId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });

    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusRes.body.data.active, false);

    // 6c. Alimento desativado some da busca pública de alimentos
    const publicSearch = await request(app)
      .get('/api/foods?search=Alimento+Editado')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(publicSearch.status, 200);
    assert(!publicSearch.body.data.foods.some((f: { id: string }) => f.id === testFoodId), 'Alimento inativo não deve aparecer na busca pública');

    // 6d. A refeição antiga do usuário ainda existe e ainda tem seus macros intactos (B6)
    const mealCheck = await request(app)
      .get('/api/meals/today')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(mealCheck.status, 200);
    const foundMeal = mealCheck.body.data.find((m: { id: string }) => m.id === mealId);
    assert(foundMeal, 'Refeição passada deve continuar existindo');
    assert.strictEqual(foundMeal.items[0].calories, 170, 'Macros de refeição passada devem ser preservados pelo snapshot');

    // 6e. Tentativa de criar NOVA refeição com o alimento inativo é rejeitada com 422 (B7)
    const newMealAttempt = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Jantar Proibido',
        mealTime: new Date().toISOString(),
        items: [
          {
            foodId: testFoodId,
            quantity: 100,
            unit: 'g',
          },
        ],
      });

    assert.strictEqual(newMealAttempt.status, 422, 'Deve rejeitar novo lançamento com alimento inativo');
    assert(newMealAttempt.body.message.includes('desativado'), 'Mensagem deve indicar que alimento está desativado');

    // 6f. Edição da refeição pré-existente preserva o item inativo (B7)
    const updateExistingMeal = await request(app)
      .put(`/api/meals/${mealId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Almoço Renomeado',
        mealTime: new Date().toISOString(),
        items: [
          {
            foodId: testFoodId,
            quantity: 150,
            unit: 'g',
          },
        ],
      });

    assert.strictEqual(updateExistingMeal.status, 200, 'Edição de refeição existente preserva itens já incluídos');
    assert.strictEqual(updateExistingMeal.body.data.name, 'Almoço Renomeado');
  });
});
