import { pool } from '../database/pool.js';
import { Meal, MealItem } from '../types/meal.types.js';
import { getSaoPauloDateString } from '../utils/date.js';

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

    // 2. Insert items
    const insertedItems: MealItem[] = [];
    for (const item of itemsData) {
      const itemResult = await client.query<MealItem>(
        `INSERT INTO meal_items (meal_id, food_id, quantity, unit, display_amount, calories, proteins, carbs, fats)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          meal.id,
          item.foodId,
          item.quantity,
          item.unit || 'g',
          item.displayAmount ?? null,
          item.calories,
          item.proteins,
          item.carbs,
          item.fats,
        ]
      );
      insertedItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');
    
    return { ...meal, items: insertedItems };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function findMealsByUserAndDate(userId: string, dateStart: string, dateEnd: string): Promise<Meal[]> {
  // Retorna as refeições de um dia com as agregações feitas no banco
  const mealsResult = await pool.query<Meal & { total_calories: string | number; total_proteins: string | number }>(
    `SELECT m.id, m.user_id, m.name, m.meal_time, m.created_at, m.updated_at,
            COALESCE((SELECT SUM(calories) FROM meal_items WHERE meal_id = m.id), 0) as total_calories,
            COALESCE((SELECT SUM(proteins) FROM meal_items WHERE meal_id = m.id), 0) as total_proteins
     FROM meals m 
     WHERE m.user_id = $1 AND m.meal_time >= $2 AND m.meal_time < $3
     ORDER BY m.meal_time DESC`,
    [userId, dateStart, dateEnd]
  );
  
  const meals = mealsResult.rows;
  
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
    
    return {
      ...meal,
      items,
      total_calories: Number(meal.total_calories),
      total_proteins: Number(meal.total_proteins)
    };
  });
}

export async function deleteMealById(userId: string, mealId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM meals WHERE id = $1 AND user_id = $2',
    [mealId, userId]
  );
  return (result.rowCount ?? 0) > 0;
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
      throw new Error('Refeição não encontrada ou não pertence a este usuário.');
    }

    const meal = mealResult.rows[0];

    // 2. Delete old items
    await client.query('DELETE FROM meal_items WHERE meal_id = $1', [meal.id]);

    // 3. Insert new items
    const insertedItems: MealItem[] = [];
    for (const item of itemsData) {
      const itemResult = await client.query<MealItem>(
        `INSERT INTO meal_items (meal_id, food_id, quantity, unit, display_amount, calories, proteins, carbs, fats)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          meal.id,
          item.foodId,
          item.quantity,
          item.unit || 'g',
          item.displayAmount ?? null,
          item.calories,
          item.proteins,
          item.carbs,
          item.fats,
        ]
      );
      insertedItems.push(itemResult.rows[0]);
    }

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
