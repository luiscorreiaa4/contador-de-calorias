import type { PoolClient } from 'pg';
import { pool } from '../database/pool.js';
import type { SavedMeal, SavedMealItem } from '@caloriesync/shared';
import { calculateItemNutrients } from '@caloriesync/shared/nutrition';

export async function listByUser(userId: string): Promise<SavedMeal[]> {
  const mealsResult = await pool.query<{
    id: string;
    user_id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, user_id, name, created_at, updated_at
     FROM saved_meals
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId]
  );

  const meals = mealsResult.rows;
  if (meals.length === 0) return [];

  const mealIds = meals.map(m => m.id);

  const itemsResult = await pool.query<{
    id: string;
    saved_meal_id: string;
    food_id: string;
    quantity: string | number;
    unit: string;
    display_amount: string | number | null;
    food_name: string;
    food_base_unit: string;
    food_unit_name: string | null;
    food_unit_weight: string | number | null;
    food_calories: string | number;
    food_proteins: string | number;
    food_carbs: string | number;
    food_fats: string | number;
    food_serving_weight: string | number;
  }>(
    `SELECT smi.id, smi.saved_meal_id, smi.food_id, smi.quantity, smi.unit, smi.display_amount,
            f.name as food_name, f.base_unit as food_base_unit,
            f.unit_name as food_unit_name, f.unit_weight as food_unit_weight,
            f.calories as food_calories, f.proteins as food_proteins,
            f.carbs as food_carbs, f.fats as food_fats,
            f.serving_weight as food_serving_weight
     FROM saved_meal_items smi
     JOIN foods f ON f.id = smi.food_id
     WHERE smi.saved_meal_id = ANY($1::uuid[])
     ORDER BY smi.created_at ASC`,
    [mealIds]
  );

  const itemsByMeal: Record<string, SavedMealItem[]> = {};
  for (const m of meals) {
    itemsByMeal[m.id] = [];
  }

  for (const row of itemsResult.rows) {
    const food = {
      id: row.food_id,
      name: row.food_name,
      base_unit: row.food_base_unit as 'g' | 'ml',
      serving_weight: Number(row.food_serving_weight),
      calories: Number(row.food_calories),
      proteins: Number(row.food_proteins),
      carbs: Number(row.food_carbs),
      fats: Number(row.food_fats),
      unit_name: row.food_unit_name,
      unit_weight: row.food_unit_weight != null ? Number(row.food_unit_weight) : null,
    };

    const calculated = calculateItemNutrients(
      {
        foodId: row.food_id,
        quantity: Number(row.quantity),
        unit: row.unit as 'g' | 'ml' | 'un' | undefined,
        displayAmount: row.display_amount != null ? Number(row.display_amount) : undefined,
      },
      food
    );

    itemsByMeal[row.saved_meal_id].push({
      id: row.id,
      saved_meal_id: row.saved_meal_id,
      food_id: row.food_id,
      food_name: row.food_name,
      food_base_unit: row.food_base_unit,
      food_unit_name: row.food_unit_name,
      food_unit_weight: row.food_unit_weight != null ? Number(row.food_unit_weight) : null,
      quantity: Number(row.quantity),
      unit: row.unit,
      display_amount: row.display_amount != null ? Number(row.display_amount) : null,
      calories: calculated.calories,
      proteins: calculated.proteins,
      carbs: calculated.carbs,
      fats: calculated.fats,
    });
  }

  return meals.map(m => {
    const items = itemsByMeal[m.id] || [];
    const total_calories = items.reduce((acc, it) => acc + it.calories, 0);
    const total_proteins = items.reduce((acc, it) => acc + it.proteins, 0);
    const total_carbs = items.reduce((acc, it) => acc + it.carbs, 0);
    const total_fats = items.reduce((acc, it) => acc + it.fats, 0);

    return {
      id: m.id,
      user_id: m.user_id,
      name: m.name,
      created_at: m.created_at,
      updated_at: m.updated_at,
      items,
      total_calories: Math.round(total_calories * 100) / 100,
      total_proteins: Math.round(total_proteins * 100) / 100,
      total_carbs: Math.round(total_carbs * 100) / 100,
      total_fats: Math.round(total_fats * 100) / 100,
    };
  });
}

export async function findById(savedMealId: string, client?: PoolClient): Promise<SavedMeal | null> {
  const db = client || pool;
  const mealRes = await db.query<{
    id: string;
    user_id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, user_id, name, created_at, updated_at
     FROM saved_meals
     WHERE id = $1`,
    [savedMealId]
  );

  const meal = mealRes.rows[0];
  if (!meal) return null;

  const itemsResult = await db.query<{
    id: string;
    saved_meal_id: string;
    food_id: string;
    quantity: string | number;
    unit: string;
    display_amount: string | number | null;
    food_name: string;
    food_base_unit: string;
    food_unit_name: string | null;
    food_unit_weight: string | number | null;
    food_calories: string | number;
    food_proteins: string | number;
    food_carbs: string | number;
    food_fats: string | number;
    food_serving_weight: string | number;
  }>(
    `SELECT smi.id, smi.saved_meal_id, smi.food_id, smi.quantity, smi.unit, smi.display_amount,
            f.name as food_name, f.base_unit as food_base_unit,
            f.unit_name as food_unit_name, f.unit_weight as food_unit_weight,
            f.calories as food_calories, f.proteins as food_proteins,
            f.carbs as food_carbs, f.fats as food_fats,
            f.serving_weight as food_serving_weight
     FROM saved_meal_items smi
     JOIN foods f ON f.id = smi.food_id
     WHERE smi.saved_meal_id = $1
     ORDER BY smi.created_at ASC`,
    [savedMealId]
  );

  const items: SavedMealItem[] = itemsResult.rows.map(row => {
    const food = {
      id: row.food_id,
      name: row.food_name,
      base_unit: row.food_base_unit as 'g' | 'ml',
      serving_weight: Number(row.food_serving_weight),
      calories: Number(row.food_calories),
      proteins: Number(row.food_proteins),
      carbs: Number(row.food_carbs),
      fats: Number(row.food_fats),
      unit_name: row.food_unit_name,
      unit_weight: row.food_unit_weight != null ? Number(row.food_unit_weight) : null,
    };

    const calculated = calculateItemNutrients(
      {
        foodId: row.food_id,
        quantity: Number(row.quantity),
        unit: row.unit as 'g' | 'ml' | 'un' | undefined,
        displayAmount: row.display_amount != null ? Number(row.display_amount) : undefined,
      },
      food
    );

    return {
      id: row.id,
      saved_meal_id: row.saved_meal_id,
      food_id: row.food_id,
      food_name: row.food_name,
      food_base_unit: row.food_base_unit,
      food_unit_name: row.food_unit_name,
      food_unit_weight: row.food_unit_weight != null ? Number(row.food_unit_weight) : null,
      quantity: Number(row.quantity),
      unit: row.unit,
      display_amount: row.display_amount != null ? Number(row.display_amount) : null,
      calories: calculated.calories,
      proteins: calculated.proteins,
      carbs: calculated.carbs,
      fats: calculated.fats,
    };
  });

  const total_calories = items.reduce((acc, it) => acc + it.calories, 0);
  const total_proteins = items.reduce((acc, it) => acc + it.proteins, 0);
  const total_carbs = items.reduce((acc, it) => acc + it.carbs, 0);
  const total_fats = items.reduce((acc, it) => acc + it.fats, 0);

  return {
    id: meal.id,
    user_id: meal.user_id,
    name: meal.name,
    created_at: meal.created_at,
    updated_at: meal.updated_at,
    items,
    total_calories: Math.round(total_calories * 100) / 100,
    total_proteins: Math.round(total_proteins * 100) / 100,
    total_carbs: Math.round(total_carbs * 100) / 100,
    total_fats: Math.round(total_fats * 100) / 100,
  };
}

export async function createWithItems(
  userId: string,
  name: string,
  items: {
    foodId: string;
    quantity: number;
    unit?: string;
    displayAmount?: number | null;
  }[]
): Promise<SavedMeal> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const mealRes = await client.query<{
      id: string;
      user_id: string;
      name: string;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO saved_meals (user_id, name)
       VALUES ($1, $2)
       RETURNING id, user_id, name, created_at, updated_at`,
      [userId, name]
    );

    const savedMeal = mealRes.rows[0];

    // Batch insert items (PERF-004 / A-013)
    if (items.length > 0) {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      items.forEach((item, index) => {
        const base = index * 5;
        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
        );
        values.push(
          savedMeal.id,
          item.foodId,
          item.quantity,
          item.unit || 'g',
          item.displayAmount ?? null
        );
      });

      await client.query(
        `INSERT INTO saved_meal_items (saved_meal_id, food_id, quantity, unit, display_amount)
         VALUES ${placeholders.join(', ')}`,
        values
      );
    }

    const created = await findById(savedMeal.id, client);
    await client.query('COMMIT');

    if (!created) {
      throw new Error('Falha ao recuperar combo salvo recém-criado.');
    }
    return created;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteById(userId: string, id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM saved_meals WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return (result.rowCount ?? 0) > 0;
}
