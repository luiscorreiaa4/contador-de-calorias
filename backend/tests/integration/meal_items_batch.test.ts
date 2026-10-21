import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { pool } from '../../src/database/pool.js';
import { createMealWithItems, updateMealWithItems } from '../../src/models/meal.model.js';
import { cleanupTestData } from '../helpers/db.js';

describe('Inserção Multi-row em Lote de meal_items (PC-22 / PERF-004)', () => {
  let userId: string;
  let foodId: string;

  before(async () => {
    const userRes = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ('Batch Tester', 'tester-batch-${Date.now()}@example.com', 'hash') RETURNING id`
    );
    userId = userRes.rows[0].id;

    const foodRes = await pool.query(`SELECT id FROM foods WHERE active = true LIMIT 1`);
    foodId = foodRes.rows[0].id;
  });

  closeTestPool(async () => {
      await cleanupTestData('tester-batch-%');
  });

  it('createMealWithItems: deve inserir múltiplos itens com sucesso em lote', async () => {
    const items = [
      { foodId, quantity: 100, calories: 100, proteins: 10, carbs: 10, fats: 2 },
      { foodId, quantity: 150, calories: 150, proteins: 15, carbs: 15, fats: 3 },
      { foodId, quantity: 200, calories: 200, proteins: 20, carbs: 20, fats: 4 },
    ];

    const meal = await createMealWithItems(userId, 'Almoço Batch', new Date(), items);
    assert.ok(meal.items, 'meal.items deve existir');
    assert.strictEqual(meal.items.length, 3, 'Deve retornar os 3 itens inseridos');
    assert.strictEqual(meal.name, 'Almoço Batch');

    // Valida persistência direta no banco
    const dbItems = await pool.query('SELECT * FROM meal_items WHERE meal_id = $1 ORDER BY calories ASC', [meal.id]);
    assert.strictEqual(dbItems.rows.length, 3);
    assert.strictEqual(Number(dbItems.rows[0].calories), 100);
    assert.strictEqual(Number(dbItems.rows[1].calories), 150);
    assert.strictEqual(Number(dbItems.rows[2].calories), 200);
  });

  it('updateMealWithItems: deve substituir itens e persistir novo lote multi-row', async () => {
    const initialItems = [
      { foodId, quantity: 50, calories: 50, proteins: 5, carbs: 5, fats: 1 },
    ];
    const meal = await createMealWithItems(userId, 'Jantar Inicial', new Date(), initialItems);

    const updatedItems = [
      { foodId, quantity: 120, calories: 120, proteins: 12, carbs: 12, fats: 2 },
      { foodId, quantity: 180, calories: 180, proteins: 18, carbs: 18, fats: 3 },
    ];

    const updated = await updateMealWithItems(userId, meal.id, 'Jantar Atualizado', new Date(), updatedItems);
    assert.ok(updated.items);
    assert.strictEqual(updated.items.length, 2);

    const dbItems = await pool.query('SELECT * FROM meal_items WHERE meal_id = $1 ORDER BY calories ASC', [meal.id]);
    assert.strictEqual(dbItems.rows.length, 2);
    assert.strictEqual(Number(dbItems.rows[0].calories), 120);
    assert.strictEqual(Number(dbItems.rows[1].calories), 180);
  });
});
