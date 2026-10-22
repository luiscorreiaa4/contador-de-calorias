import { pool } from '../database/pool.js';
import { Food } from '@caloriesync/shared';

interface FoodRowWithCount extends Food {
  total_count?: string;
}

const FOOD_COLUMNS = 'id, name, calories, proteins, carbs, fats, base_unit, serving_weight, unit_name, unit_weight, source';

/**
 * Converte de forma centralizada uma linha do banco para a entidade Food tipada (A-014).
 * Assegura conversões numéricas consistentes e preservação de campos nulos.
 */
export function mapFoodRow(row: Record<string, unknown>): Food {
  return {
    id: String(row.id),
    name: String(row.name),
    calories: Number(row.calories),
    proteins: Number(row.proteins),
    carbs: Number(row.carbs),
    fats: Number(row.fats),
    base_unit: row.base_unit as 'g' | 'ml',
    serving_weight: Number(row.serving_weight),
    unit_name: (row.unit_name as string | null) ?? null,
    unit_weight: row.unit_weight != null ? Number(row.unit_weight) : null,
    source: (row.source as 'taco' | 'custom' | null) ?? null,
  };
}

/**
 * Mapeia uma coleção de linhas para entidades Food (A-014).
 */
export function mapFoodRows(rows: Record<string, unknown>[]): Food[] {
  return rows.map(mapFoodRow);
}

export async function searchFoods(
  query: string,
  limit: number,
  offset: number,
  userId?: string
): Promise<{ foods: Food[]; total: number }> {
  let rows: FoodRowWithCount[];

  if (query) {
    // using pg_trgm for similarity search + count(*) OVER() para eliminar segunda query (PERF-003, PERF-007, D-08)
    const userFilter = userId ? `(user_id IS NULL OR user_id = $5)` : `user_id IS NULL`;
    const sql = `
      SELECT ${FOOD_COLUMNS},
             count(*) OVER() AS total_count
      FROM foods 
      WHERE active = true AND ${userFilter} AND f_unaccent(name) ILIKE f_unaccent($1)
      ORDER BY f_unaccent(name) <-> f_unaccent($2) ASC
      LIMIT $3 OFFSET $4
    `;
    const sanitized = query.replace(/[%_\\]/g, '\\$&');
    const searchPattern = `%${sanitized}%`;
    const params: unknown[] = [searchPattern, query, limit, offset];
    if (userId) params.push(userId);
    const result = await pool.query<FoodRowWithCount>(sql, params);
    rows = result.rows;

    let total = 0;
    if (rows.length > 0 && rows[0].total_count) {
      total = parseInt(rows[0].total_count, 10);
    } else if (offset > 0) {
      const countUserFilter = userId ? `(user_id IS NULL OR user_id = $2)` : `user_id IS NULL`;
      const countSql = `
        SELECT COUNT(*) FROM foods 
        WHERE active = true AND ${countUserFilter} AND f_unaccent(name) ILIKE f_unaccent($1)
      `;
      const countParams: unknown[] = [searchPattern];
      if (userId) countParams.push(userId);
      const countResult = await pool.query(countSql, countParams);
      total = parseInt(countResult.rows[0].count, 10);
    }

    return { foods: mapFoodRows(rows as unknown as Record<string, unknown>[]), total };
  } else {
    const userFilter = userId ? `(user_id IS NULL OR user_id = $3)` : `user_id IS NULL`;
    const sql = `
      SELECT ${FOOD_COLUMNS},
             count(*) OVER() AS total_count
      FROM foods 
      WHERE active = true AND ${userFilter}
      ORDER BY name ASC 
      LIMIT $1 OFFSET $2
    `;
    const params: unknown[] = [limit, offset];
    if (userId) params.push(userId);
    const result = await pool.query<FoodRowWithCount>(sql, params);
    rows = result.rows;

    let total = 0;
    if (rows.length > 0 && rows[0].total_count) {
      total = parseInt(rows[0].total_count, 10);
    } else if (offset > 0) {
      const countUserFilter = userId ? `(user_id IS NULL OR user_id = $1)` : `user_id IS NULL`;
      const countSql = `SELECT COUNT(*) FROM foods WHERE active = true AND ${countUserFilter}`;
      const countParams: unknown[] = userId ? [userId] : [];
      const countResult = await pool.query(countSql, countParams);
      total = parseInt(countResult.rows[0].count, 10);
    }

    return { foods: mapFoodRows(rows as unknown as Record<string, unknown>[]), total };
  }
}

export async function findById(id: string, userId?: string): Promise<Food | null> {
  let query = `SELECT ${FOOD_COLUMNS} FROM foods WHERE id = $1 AND active = true`;
  const params: unknown[] = [id];
  if (userId) {
    query += ` AND (user_id IS NULL OR user_id = $2)`;
    params.push(userId);
  }
  const result = await pool.query(query, params);
  return result.rows[0] ? mapFoodRow(result.rows[0] as unknown as Record<string, unknown>) : null;
}

export async function findByIds(
  ids: string[],
  userId?: string,
  options?: { includeInactive?: boolean }
): Promise<(Food & { active?: boolean })[]> {
  if (ids.length === 0) return [];
  const activeFilter = options?.includeInactive ? '' : ' AND active = true';
  let query = `SELECT ${FOOD_COLUMNS}, active FROM foods WHERE id = ANY($1::uuid[])${activeFilter}`;
  const params: unknown[] = [ids];
  if (userId) {
    query += ` AND (user_id IS NULL OR user_id = $2)`;
    params.push(userId);
  }
  const result = await pool.query(query, params);
  return result.rows.map((row) => ({
    ...mapFoodRow(row as Record<string, unknown>),
    active: Boolean(row.active),
  }));
}

export async function getRecentFoods(userId: string, limit: number = 20): Promise<Food[]> {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const sql = `
    SELECT 
      f.id, f.name, f.calories, f.proteins, f.carbs, f.fats, f.base_unit, f.serving_weight, f.unit_name, f.unit_weight, f.source,
      COUNT(mi.id) as consumption_count,
      MAX(m.meal_time) as last_consumed
    FROM meal_items mi
    JOIN meals m ON m.id = mi.meal_id
    JOIN foods f ON f.id = mi.food_id
    WHERE m.user_id = $1
      AND m.meal_time >= NOW() - INTERVAL '14 days'
      AND f.active = true
    GROUP BY f.id, f.name, f.calories, f.proteins, f.carbs, f.fats, f.base_unit, f.serving_weight, f.unit_name, f.unit_weight, f.source
    ORDER BY consumption_count DESC, last_consumed DESC
    LIMIT $2
  `;
  const result = await pool.query(sql, [userId, safeLimit]);
  return mapFoodRows(result.rows as unknown as Record<string, unknown>[]);
}

export async function getFavoriteFoods(userId: string): Promise<Food[]> {
  const sql = `
    SELECT f.id, f.name, f.calories, f.proteins, f.carbs, f.fats, f.base_unit, f.serving_weight, f.unit_name, f.unit_weight, f.source
    FROM user_favorite_foods uff
    JOIN foods f ON f.id = uff.food_id
    WHERE uff.user_id = $1 AND f.active = true
    ORDER BY uff.created_at DESC
    LIMIT 100
  `;
  const result = await pool.query(sql, [userId]);
  return mapFoodRows(result.rows as unknown as Record<string, unknown>[]);
}

export async function addFavoriteFood(userId: string, foodId: string): Promise<boolean> {
  const result = await pool.query(
    `INSERT INTO user_favorite_foods (user_id, food_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, food_id) DO NOTHING
     RETURNING food_id`,
    [userId, foodId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function removeFavoriteFood(userId: string, foodId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM user_favorite_foods WHERE user_id = $1 AND food_id = $2`,
    [userId, foodId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getFavoriteFoodIds(userId: string): Promise<string[]> {
  const result = await pool.query<{ food_id: string }>(
    `SELECT food_id FROM user_favorite_foods WHERE user_id = $1 LIMIT 100`,
    [userId]
  );
  return result.rows.map(r => r.food_id);
}

export async function createCustomFood(
  userId: string,
  data: {
    name: string;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
    base_unit?: 'g' | 'ml';
    serving_weight?: number;
    unit_name?: string;
    unit_weight?: number;
  }
): Promise<Food> {
  const result = await pool.query(
    `INSERT INTO foods (
       name, calories, proteins, carbs, fats, base_unit, serving_weight, unit_name, unit_weight, source, user_id, active
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'custom', $10, true)
     RETURNING ${FOOD_COLUMNS}`,
    [
      data.name.trim(),
      data.calories,
      data.proteins,
      data.carbs,
      data.fats,
      data.base_unit || 'g',
      data.serving_weight || 100,
      data.unit_name ? data.unit_name.trim() : null,
      data.unit_weight || null,
      userId,
    ]
  );
  return mapFoodRow(result.rows[0] as unknown as Record<string, unknown>);
}
