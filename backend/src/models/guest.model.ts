import { pool } from '../database/pool.js';
import type { User } from '@caloriesync/shared';

export async function isGuestUser(userId: string): Promise<boolean> {
  const result = await pool.query<{ is_guest: boolean }>(
    'SELECT is_guest FROM users WHERE id = $1',
    [userId],
  );
  return result.rows[0]?.is_guest ?? false;
}

export async function createGuestUser(email: string, passwordHash: string): Promise<User> {
  const result = await pool.query<User>(
    `INSERT INTO users (name, email, password_hash, terms_accepted_at, email_verified_at, is_guest)
     VALUES ('Visitante', $1, $2, now(), now(), true)
     RETURNING *`,
    [email, passwordHash],
  );
  return result.rows[0];
}

/** Apaga só contas is_guest vencidas. meals antes: meal_items.food_id é RESTRICT p/ alimentos próprios. */
export async function deleteExpiredGuests(maxAgeHours: number, limit: number): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ids = await client.query<{ id: string }>(
      `SELECT id FROM users
        WHERE is_guest AND created_at < now() - make_interval(hours => $1)
        LIMIT $2`,
      [maxAgeHours, limit],
    );
    const list = ids.rows.map((r) => r.id);
    let removed = 0;
    if (list.length > 0) {
      await client.query('DELETE FROM meals WHERE user_id = ANY($1::uuid[])', [list]);
      const del = await client.query(
        'DELETE FROM users WHERE is_guest AND id = ANY($1::uuid[])',
        [list],
      );
      removed = del.rowCount ?? 0;
    }
    await client.query('COMMIT');
    return removed;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function countActiveGuests(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*) AS count FROM users WHERE is_guest',
  );
  return Number(result.rows[0].count);
}

export async function findGlobalFoodIdsByNames(names: string[]): Promise<Map<string, string>> {
  const result = await pool.query<{ id: string; name: string }>(
    'SELECT id, name FROM foods WHERE user_id IS NULL AND active AND name = ANY($1::text[])',
    [names],
  );
  return new Map(result.rows.map((r) => [r.name, r.id]));
}
