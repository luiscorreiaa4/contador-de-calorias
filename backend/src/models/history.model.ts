import { pool } from '../database/pool.js';

export interface UserGoal {
  id: string;
  user_id: string;
  effective_from: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  mode: 'auto' | 'manual';
  created_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  weight: number;
  body_fat: number | null;
  measured_at: string;
  created_at: string;
}

export async function insertGoal(
  userId: string,
  effectiveFrom: string, // YYYY-MM-DD
  calories: number,
  proteins: number,
  carbs: number,
  fats: number,
  mode: 'auto' | 'manual'
): Promise<UserGoal> {
  // Fazemos um UPSERT para garantir que haja apenas uma meta por dia.
  // Se já existir, atualiza com os novos valores.
  const result = await pool.query<UserGoal>(
    `INSERT INTO user_goals (user_id, effective_from, calories, proteins, carbs, fats, mode)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, effective_from) 
     DO UPDATE SET 
        calories = EXCLUDED.calories,
        proteins = EXCLUDED.proteins,
        carbs = EXCLUDED.carbs,
        fats = EXCLUDED.fats,
        mode = EXCLUDED.mode
     RETURNING *`,
    [userId, effectiveFrom, calories, proteins, carbs, fats, mode]
  );
  return result.rows[0];
}

export async function getActiveGoal(userId: string, date: string): Promise<UserGoal | null> {
  // Busca a meta mais recente cuja data de vigência seja <= a data solicitada
  const result = await pool.query<UserGoal>(
    `SELECT * FROM user_goals 
     WHERE user_id = $1 AND effective_from <= $2 
     ORDER BY effective_from DESC 
     LIMIT 1`,
    [userId, date]
  );
  return result.rows[0] ?? null;
}

export async function insertBodyMeasurement(
  userId: string,
  weight: number,
  bodyFat: number | null,
  measuredAt: Date
): Promise<BodyMeasurement> {
  const result = await pool.query<BodyMeasurement>(
    `INSERT INTO body_measurements (user_id, weight, body_fat, measured_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, weight, bodyFat, measuredAt]
  );
  return result.rows[0];
}
