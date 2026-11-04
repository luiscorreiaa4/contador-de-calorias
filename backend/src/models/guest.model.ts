import { pool } from '../database/pool.js';

export async function isGuestUser(userId: string): Promise<boolean> {
  const result = await pool.query<{ is_guest: boolean }>(
    'SELECT is_guest FROM users WHERE id = $1',
    [userId],
  );
  return result.rows[0]?.is_guest ?? false;
}
