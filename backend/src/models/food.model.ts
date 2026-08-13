import { pool } from '../database/pool.js';
import { Food } from '../types/food.types.js';

export async function findAll(): Promise<Food[]> {
  const result = await pool.query<Food>('SELECT * FROM foods ORDER BY name ASC');
  return result.rows;
}

export async function findById(id: string): Promise<Food | null> {
  const result = await pool.query<Food>('SELECT * FROM foods WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}
