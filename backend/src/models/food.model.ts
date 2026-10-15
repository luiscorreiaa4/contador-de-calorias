import { pool } from '../database/pool.js';
import { Food } from '../types/food.types.js';

interface FoodRowWithCount extends Food {
  total_count?: string;
}

const FOOD_COLUMNS = 'id, name, calories, proteins, carbs, fats, base_unit, serving_weight, unit_name, unit_weight, source';

export async function searchFoods(query: string, limit: number, offset: number): Promise<{ foods: Food[], total: number }> {
  let rows: FoodRowWithCount[];

  if (query) {
    // using pg_trgm for similarity search + count(*) OVER() para eliminar segunda query (PERF-003, PERF-007, D-08)
    const sql = `
      SELECT ${FOOD_COLUMNS},
             count(*) OVER() AS total_count
      FROM foods 
      WHERE active = true AND f_unaccent(name) ILIKE f_unaccent($1)
      ORDER BY f_unaccent(name) <-> f_unaccent($2) ASC
      LIMIT $3 OFFSET $4
    `;
    const sanitized = query.replace(/[%_\\]/g, '\\$&');
    const searchPattern = `%${sanitized}%`;
    const result = await pool.query<FoodRowWithCount>(sql, [searchPattern, query, limit, offset]);
    rows = result.rows;

    let total = 0;
    if (rows.length > 0 && rows[0].total_count) {
      total = parseInt(rows[0].total_count, 10);
    } else if (offset > 0) {
      const countSql = `
        SELECT COUNT(*) FROM foods 
        WHERE active = true AND f_unaccent(name) ILIKE f_unaccent($1)
      `;
      const countResult = await pool.query(countSql, [searchPattern]);
      total = parseInt(countResult.rows[0].count, 10);
    }

    const foods: Food[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      calories: r.calories,
      proteins: r.proteins,
      carbs: r.carbs,
      fats: r.fats,
      base_unit: r.base_unit,
      serving_weight: r.serving_weight,
      unit_name: r.unit_name,
      unit_weight: r.unit_weight,
      source: r.source,
    }));
    return { foods, total };
  } else {
    const sql = `
      SELECT ${FOOD_COLUMNS},
             count(*) OVER() AS total_count
      FROM foods 
      WHERE active = true 
      ORDER BY name ASC 
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query<FoodRowWithCount>(sql, [limit, offset]);
    rows = result.rows;

    let total = 0;
    if (rows.length > 0 && rows[0].total_count) {
      total = parseInt(rows[0].total_count, 10);
    } else if (offset > 0) {
      const countSql = `SELECT COUNT(*) FROM foods WHERE active = true`;
      const countResult = await pool.query(countSql);
      total = parseInt(countResult.rows[0].count, 10);
    }

    const foods: Food[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      calories: r.calories,
      proteins: r.proteins,
      carbs: r.carbs,
      fats: r.fats,
      base_unit: r.base_unit,
      serving_weight: r.serving_weight,
      unit_name: r.unit_name,
      unit_weight: r.unit_weight,
      source: r.source,
    }));
    return { foods, total };
  }
}

export async function findById(id: string): Promise<Food | null> {
  const result = await pool.query<Food>(`SELECT ${FOOD_COLUMNS} FROM foods WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function findByIds(ids: string[]): Promise<Food[]> {
  if (ids.length === 0) return [];
  const result = await pool.query<Food>(`SELECT ${FOOD_COLUMNS} FROM foods WHERE id = ANY($1::uuid[])`, [ids]);
  return result.rows;
}
