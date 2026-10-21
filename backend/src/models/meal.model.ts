import type { PoolClient } from 'pg';
import { pool } from '../database/pool.js';
import { Meal, MealItem } from '@caloriesync/shared';
import { getSaoPauloDateString, combineDateAndTimeInAppTz } from '../utils/date.js';

async function insertMealItemsBatch(
  client: PoolClient,
  mealId: string,
  itemsData: {
    foodId: string;
    quantity: number;
    unit?: string;
    displayAmount?: number | null;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  }[]
): Promise<MealItem[]> {
  if (itemsData.length === 0) return [];

  const values: unknown[] = [];
  const valuePlaceholders: string[] = [];

  itemsData.forEach((item, index) => {
    const base = index * 9;
    valuePlaceholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`
    );
    values.push(
      mealId,
      item.foodId,
      item.quantity,
      item.unit || 'g',
      item.displayAmount ?? null,
      item.calories,
      item.proteins,
      item.carbs,
      item.fats
    );
  });

  const result = await client.query<MealItem>(
    `INSERT INTO meal_items (meal_id, food_id, quantity, unit, display_amount, calories, proteins, carbs, fats)
     VALUES ${valuePlaceholders.join(', ')} RETURNING *`,
    values
  );

  return result.rows;
}

export async function createMealWithItems(
  userId: string,
  name: string,
  mealTime: Date,
  itemsData: {
    foodId: string;
    quantity: number;
    unit?: string;
    displayAmount?: number | null;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  }[]
): Promise<Meal> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create the meal
    const mealResult = await client.query<Meal>(
      'INSERT INTO meals (user_id, name, meal_time) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, mealTime]
    );
    const meal = mealResult.rows[0];

    // 2. Insert items in batch multi-row (PERF-004)
    const insertedItems = await insertMealItemsBatch(client, meal.id, itemsData);

    await client.query('COMMIT');
    
    return { ...meal, items: insertedItems };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function hydrateMealsWithItems(meals: Meal[]): Promise<Meal[]> {
  if (meals.length === 0) return [];

  const mealIds = meals.map(m => m.id);

  // Pegar os itens com projeção explícita (sem mi.*)
  const itemsResult = await pool.query<MealItem>(
    `SELECT mi.id, mi.meal_id, mi.food_id, mi.quantity, mi.unit, mi.display_amount, 
            mi.calories, mi.proteins, mi.carbs, mi.fats,
            f.name as food_name, 
            f.base_unit as food_base_unit, 
            f.unit_name as food_unit_name, 
            f.unit_weight as food_unit_weight
     FROM meal_items mi
     JOIN foods f ON f.id = mi.food_id
     WHERE mi.meal_id = ANY($1::uuid[])`,
    [mealIds]
  );

  const itemsByMeal: Record<string, MealItem[]> = {};
  for (const item of itemsResult.rows) {
    if (!itemsByMeal[item.meal_id]) itemsByMeal[item.meal_id] = [];
    itemsByMeal[item.meal_id].push(item);
  }

  return meals.map(meal => {
    const items = itemsByMeal[meal.id] || [];
    const total_calories = items.reduce((acc, it) => acc + Number(it.calories), 0);
    const total_proteins = items.reduce((acc, it) => acc + Number(it.proteins), 0);

    return {
      ...meal,
      items,
      total_calories,
      total_proteins
    };
  });
}

export async function findMealsByUserAndDate(userId: string, dateStart: string, dateEnd: string): Promise<Meal[]> {
  // Retorna as refeições de um dia com agregação de calorias e proteínas em memória (PERF-001)
  const mealsResult = await pool.query<Meal>(
    `SELECT m.id, m.user_id, m.name, m.meal_time, m.created_at, m.updated_at
     FROM meals m 
     WHERE m.user_id = $1 AND m.meal_time >= $2 AND m.meal_time < $3
     ORDER BY m.meal_time DESC`,
    [userId, dateStart, dateEnd]
  );

  return hydrateMealsWithItems(mealsResult.rows);
}

/** Retorna todo o histórico de refeições do usuário (com itens) para exportação. */
export async function findAllMealsByUser(userId: string): Promise<Meal[]> {
  const mealsResult = await pool.query<Meal>(
    `SELECT m.id, m.user_id, m.name, m.meal_time, m.created_at, m.updated_at
     FROM meals m
     WHERE m.user_id = $1
     ORDER BY m.meal_time ASC, m.created_at ASC`,
    [userId]
  );

  return hydrateMealsWithItems(mealsResult.rows);
}

export async function deleteMealById(userId: string, mealId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM meals WHERE id = $1 AND user_id = $2',
    [mealId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function findMealById(userId: string, mealId: string): Promise<Meal | null> {
  const result = await pool.query<Meal>(
    `SELECT m.id, m.user_id, m.name, m.meal_time, m.created_at, m.updated_at
     FROM meals m
     WHERE m.id = $1 AND m.user_id = $2`,
    [mealId, userId]
  );
  if (result.rowCount === 0) return null;
  const hydrated = await hydrateMealsWithItems(result.rows);
  return hydrated[0] ?? null;
}

export async function copyMeal(
  userId: string,
  sourceMealOrId: string | Meal,
  targetMealTime: Date
): Promise<Meal> {
  const sourceMeal = typeof sourceMealOrId === 'string'
    ? await findMealById(userId, sourceMealOrId)
    : sourceMealOrId;

  if (!sourceMeal) {
    const error: Error & { statusCode?: number } = new Error('Refeição não encontrada ou não pertence a este usuário.');
    error.statusCode = 404;
    throw error;
  }

  const itemsData = (sourceMeal.items || []).map(it => ({
    foodId: it.food_id,
    quantity: Number(it.quantity),
    unit: it.unit,
    displayAmount: it.display_amount !== null && it.display_amount !== undefined ? Number(it.display_amount) : null,
    calories: Number(it.calories),
    proteins: Number(it.proteins),
    carbs: Number(it.carbs),
    fats: Number(it.fats),
  }));

  return createMealWithItems(userId, sourceMeal.name, targetMealTime, itemsData);
}

export async function copyDayMeals(
  userId: string,
  sourceMeals: Meal[],
  targetDate: string
): Promise<Meal[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const createdMeals: Meal[] = [];

    for (const sourceMeal of sourceMeals) {
      const targetTime = combineDateAndTimeInAppTz(targetDate, new Date(sourceMeal.meal_time));
      const mealResult = await client.query<Meal>(
        'INSERT INTO meals (user_id, name, meal_time) VALUES ($1, $2, $3) RETURNING *',
        [userId, sourceMeal.name, targetTime]
      );
      const newMeal = mealResult.rows[0];

      const itemsData = (sourceMeal.items || []).map(it => ({
        foodId: it.food_id,
        quantity: Number(it.quantity),
        unit: it.unit,
        displayAmount: it.display_amount !== null && it.display_amount !== undefined ? Number(it.display_amount) : null,
        calories: Number(it.calories),
        proteins: Number(it.proteins),
        carbs: Number(it.carbs),
        fats: Number(it.fats),
      }));

      const insertedItems = await insertMealItemsBatch(client, newMeal.id, itemsData);
      createdMeals.push({ ...newMeal, items: insertedItems });
    }

    await client.query('COMMIT');
    return createdMeals;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateMealWithItems(
  userId: string,
  mealId: string,
  name: string,
  mealTime: Date,
  itemsData: {
    foodId: string;
    quantity: number;
    unit?: string;
    displayAmount?: number | null;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  }[]
): Promise<Meal> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Update the meal name and updated_at (check if it belongs to user)
    const mealResult = await client.query<Meal>(
      'UPDATE meals SET name = $1, meal_time = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, mealTime, mealId, userId]
    );

    if (mealResult.rowCount === 0) {
      const error: Error & { statusCode?: number } = new Error('Refeição não encontrada ou não pertence a este usuário.');
      error.statusCode = 404;
      throw error;
    }

    const meal = mealResult.rows[0];

    // 2. Delete old items
    await client.query('DELETE FROM meal_items WHERE meal_id = $1', [meal.id]);

    // 3. Insert new items in batch multi-row (PERF-004)
    const insertedItems = await insertMealItemsBatch(client, meal.id, itemsData);

    await client.query('COMMIT');
    
    return { ...meal, items: insertedItems };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export interface DailyStat {
  date: string;
  consumed_calories: number;
  consumed_proteins: number;
  consumed_carbs: number;
  consumed_fats: number;
  goal_calories: number | null;
  goal_proteins: number | null;
  goal_carbs: number | null;
  goal_fats: number | null;
}

export async function getPeriodStats(userId: string, days: number = 30, endDateStr?: string): Promise<DailyStat[]> {
  const endDate = endDateStr || getSaoPauloDateString();
  const result = await pool.query(
    `WITH daily_consumption AS (
      SELECT 
        DATE(m.meal_time AT TIME ZONE 'America/Sao_Paulo') as date_val,
        SUM(mi.calories) as consumed_calories,
        SUM(mi.proteins) as consumed_proteins,
        SUM(mi.carbs) as consumed_carbs,
        SUM(mi.fats) as consumed_fats
      FROM meals m
      JOIN meal_items mi ON mi.meal_id = m.id
      WHERE m.user_id = $1
        AND m.meal_time AT TIME ZONE 'America/Sao_Paulo' >= ($3::date - ($2 || ' days')::interval)
        AND m.meal_time AT TIME ZONE 'America/Sao_Paulo' < ($3::date + '1 day'::interval)
      GROUP BY DATE(m.meal_time AT TIME ZONE 'America/Sao_Paulo')
    ),
    daily_goals AS (
      SELECT
        dc.date_val,
        dc.consumed_calories,
        dc.consumed_proteins,
        dc.consumed_carbs,
        dc.consumed_fats,
        ug.calories as goal_calories,
        ug.proteins as goal_proteins,
        ug.carbs as goal_carbs,
        ug.fats as goal_fats
      FROM daily_consumption dc
      LEFT JOIN LATERAL (
        SELECT calories, proteins, carbs, fats
        FROM user_goals
        WHERE user_id = $1 AND effective_from <= dc.date_val
        ORDER BY effective_from DESC
        LIMIT 1
      ) ug ON true
    )
    SELECT 
      TO_CHAR(date_val, 'YYYY-MM-DD') as date,
      consumed_calories,
      consumed_proteins,
      consumed_carbs,
      consumed_fats,
      goal_calories,
      goal_proteins,
      goal_carbs,
      goal_fats
    FROM daily_goals 
    ORDER BY date_val ASC`,
    [userId, days, endDate]
  );

  return result.rows.map(row => ({
    date: row.date,
    consumed_calories: Number(row.consumed_calories),
    consumed_proteins: Number(row.consumed_proteins),
    consumed_carbs: Number(row.consumed_carbs),
    consumed_fats: Number(row.consumed_fats),
    goal_calories: row.goal_calories ? Number(row.goal_calories) : null,
    goal_proteins: row.goal_proteins ? Number(row.goal_proteins) : null,
    goal_carbs: row.goal_carbs ? Number(row.goal_carbs) : null,
    goal_fats: row.goal_fats ? Number(row.goal_fats) : null,
  }));
}
