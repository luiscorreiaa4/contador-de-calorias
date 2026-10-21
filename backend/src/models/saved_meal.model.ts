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
     ORDER BY created_at DESC`,
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

    return {
      id: m.id,
      user_id: m.user_id,
      name: m.name,
      created_at: m.created_at,
      updated_at: m.updated_at,
      items,
      total_calories,
      total_proteins,
    };
  });
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

    // Batch insert items
    for (const item of items) {
      await client.query(
        `INSERT INTO saved_meal_items (saved_meal_id, food_id, quantity, unit, display_amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [savedMeal.id, item.foodId, item.quantity, item.unit || 'g', item.displayAmount ?? null]
      );
    }

    await client.query('COMMIT');

    const all = await listByUser(userId);
    return all.find(m => m.id === savedMeal.id)!;
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
