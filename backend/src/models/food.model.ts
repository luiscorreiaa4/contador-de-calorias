import { pool } from '../database/pool.js';
import { Food } from '../types/food.types.js';

export async function searchFoods(query: string, limit: number, offset: number): Promise<{ foods: Food[], total: number }> {
  let foodsResult;
  let totalResult;

  if (query) {
    // using pg_trgm for similarity search
    const sql = `
      SELECT * FROM foods 
      WHERE active = true AND f_unaccent(name) ILIKE f_unaccent($1)
      ORDER BY f_unaccent(name) <-> f_unaccent($2) ASC
      LIMIT $3 OFFSET $4
    `;
    const sanitized = query.replace(/[%_\\]/g, '\\$&');
    const searchPattern = `%${sanitized}%`;
    foodsResult = await pool.query<Food>(sql, [searchPattern, query, limit, offset]);

    const countSql = `
      SELECT COUNT(*) FROM foods 
      WHERE active = true AND f_unaccent(name) ILIKE f_unaccent($1)
    `;
    totalResult = await pool.query(countSql, [searchPattern]);
  } else {
    const sql = `
      SELECT * FROM foods 
      WHERE active = true 
      ORDER BY name ASC 
      LIMIT $1 OFFSET $2
    `;
    foodsResult = await pool.query<Food>(sql, [limit, offset]);

    const countSql = `SELECT COUNT(*) FROM foods WHERE active = true`;
    totalResult = await pool.query(countSql);
  }

  return {
    foods: foodsResult.rows,
    total: parseInt(totalResult.rows[0].count, 10)
  };
}

export async function findById(id: string): Promise<Food | null> {
  const result = await pool.query<Food>('SELECT * FROM foods WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function findByIds(ids: string[]): Promise<Food[]> {
  if (ids.length === 0) return [];
  const result = await pool.query<Food>('SELECT * FROM foods WHERE id = ANY($1::uuid[])', [ids]);
  return result.rows;
}
