import { pool } from '../database/pool.js';
import { Meal, MealItem } from '../types/meal.types.js';

export async function createMealWithItems(
  userId: string,
  name: string,
  mealTime: Date,
  itemsData: { foodId: string; quantity: number; calories: number; proteins: number; carbs: number; fats: number }[]
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
        `INSERT INTO meal_items (meal_id, food_id, quantity, calories, proteins, carbs, fats)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [meal.id, item.foodId, item.quantity, item.calories, item.proteins, item.carbs, item.fats]
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
  // Retorna as refeições de um dia com os itens
  const mealsResult = await pool.query<Meal>(
    `SELECT * FROM meals 
     WHERE user_id = $1 AND meal_time >= $2 AND meal_time < $3
     ORDER BY meal_time DESC`,
    [userId, dateStart, dateEnd]
  );
  
  const meals = mealsResult.rows;
  
  if (meals.length === 0) return [];
  
  const mealIds = meals.map(m => m.id);
  
  // Pegar os itens das refeições e dar join com foods para pegar o nome do alimento
  const itemsResult = await pool.query<MealItem>(
    `SELECT mi.*, f.name as food_name 
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
    const total_calories = items.reduce((acc, item) => acc + Number(item.calories), 0);
    const total_proteins = items.reduce((acc, item) => acc + Number(item.proteins), 0);
    
    return {
      ...meal,
      items,
      total_calories,
      total_proteins
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
  itemsData: { foodId: string; quantity: number; calories: number; proteins: number; carbs: number; fats: number }[]
): Promise<Meal> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Update the meal name and updated_at (check if it belongs to user)
    const mealResult = await client.query<Meal>(
      'UPDATE meals SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [name, mealId, userId]
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
        `INSERT INTO meal_items (meal_id, food_id, quantity, calories, proteins, carbs, fats)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [meal.id, item.foodId, item.quantity, item.calories, item.proteins, item.carbs, item.fats]
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
