import { pool } from '../database/pool.js';
import type { PoolClient } from 'pg';

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
  mode: 'auto' | 'manual',
  client?: PoolClient
): Promise<UserGoal> {
  // Fazemos um UPSERT para garantir que haja apenas uma meta por dia.
  // Se já existir, atualiza com os novos valores.
  const db = client || pool;
  const result = await db.query<UserGoal>(
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
  measuredAt: Date,
  client?: PoolClient
): Promise<BodyMeasurement> {
  const db = client || pool;
  const result = await db.query<BodyMeasurement>(
    `INSERT INTO body_measurements (user_id, weight, body_fat, measured_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, weight, bodyFat, measuredAt]
  );
  return result.rows[0];
}

/** Lista todas as metas do usuário em ordem cronológica para exportação (limitado a 500 registros, A-034). */
export async function listGoalsByUser(userId: string): Promise<UserGoal[]> {
  const result = await pool.query<UserGoal>(
    `SELECT * FROM user_goals WHERE user_id = $1 ORDER BY effective_from ASC, created_at ASC LIMIT 500`,
    [userId]
  );
  return result.rows;
}

/** Lista todas as medições corporais do usuário em ordem cronológica com limite de segurança (A-034). */
export async function listBodyMeasurementsByUser(
  userId: string,
  period: '30d' | '90d' | 'all' = 'all'
): Promise<BodyMeasurement[]> {
  let query = `SELECT * FROM body_measurements WHERE user_id = $1`;
  const params: unknown[] = [userId];

  if (period === '30d') {
    query += ` AND measured_at >= NOW() - INTERVAL '30 days'`;
  } else if (period === '90d') {
    query += ` AND measured_at >= NOW() - INTERVAL '90 days'`;
  }

  query += ` ORDER BY measured_at ASC, created_at ASC LIMIT 1000`;

  const result = await pool.query<BodyMeasurement>(query, params);
  return result.rows;
}

/** Registra uma nova medição corporal e atualiza o peso atual do perfil do usuário em transação atômica. */
export async function addBodyMeasurement(
  userId: string,
  weight: number,
  bodyFat: number | null,
  measuredAt?: Date
): Promise<BodyMeasurement> {
  const dateToUse = measuredAt || new Date();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const measurement = await insertBodyMeasurement(userId, weight, bodyFat, dateToUse, client);

    // A-006: Só atualiza o peso do perfil se esta medição for a mais recente do usuário
    const newerMeasurementCheck = await client.query(
      `SELECT 1 FROM body_measurements WHERE user_id = $1 AND measured_at > $2 LIMIT 1`,
      [userId, dateToUse]
    );

    if (newerMeasurementCheck.rowCount === 0) {
      await client.query(
        `UPDATE users 
         SET weight = $1, 
             body_fat = COALESCE($2, body_fat), 
             updated_at = NOW() 
         WHERE id = $3`,
        [weight, bodyFat, userId]
      );
    }
    await client.query('COMMIT');
    return measurement;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

