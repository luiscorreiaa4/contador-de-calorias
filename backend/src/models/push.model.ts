import { pool } from '../database/pool.js';
import type { PushSubscriptionDTO } from '@caloriesync/shared';

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  created_at: string;
}

export async function saveSubscription(
  userId: string,
  data: PushSubscriptionDTO
): Promise<PushSubscriptionRecord> {
  const result = await pool.query<PushSubscriptionRecord>(
    `INSERT INTO push_subscriptions (user_id, endpoint, keys)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, endpoint)
     DO UPDATE SET keys = EXCLUDED.keys
     RETURNING id, user_id, endpoint, keys, created_at`,
    [userId, data.endpoint, JSON.stringify(data.keys)]
  );
  return result.rows[0];
}

export async function deleteSubscription(
  userId: string,
  endpoint: string
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
    [userId, endpoint]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getSubscriptionsByUser(
  userId: string
): Promise<PushSubscriptionRecord[]> {
  const result = await pool.query<PushSubscriptionRecord>(
    `SELECT id, user_id, endpoint, keys, created_at FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );
  return result.rows;
}
