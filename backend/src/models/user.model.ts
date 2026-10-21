import { pool } from '../database/pool.js';
import type { PoolClient } from 'pg';
import { User, UserWithoutPassword } from '@caloriesync/shared';

function mapUserRow(row: UserWithoutPassword | undefined): UserWithoutPassword | null {
  if (!row) return null;
  return {
    ...row,
    weight: row.weight != null ? Number(row.weight) : null,
    height: row.height != null ? Number(row.height) : null,
    body_fat: row.body_fat != null ? Number(row.body_fat) : null,
    daily_calories_goal: Number(row.daily_calories_goal),
    daily_proteins_goal: Number(row.daily_proteins_goal),
  };
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  termsAcceptedAt: Date
): Promise<UserWithoutPassword> {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query<UserWithoutPassword>(
    `INSERT INTO users (name, email, password_hash, terms_accepted_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, goal, sex, birth_date, weight, height, body_fat, activity_level, daily_calories_goal, daily_proteins_goal, onboarding_completed, terms_accepted_at, created_at, updated_at`,
    [name.trim(), normalizedEmail, passwordHash, termsAcceptedAt]
  );
  return mapUserRow(result.rows[0])!;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query<User>(
    'SELECT * FROM users WHERE lower(email) = lower($1)',
    [normalizedEmail]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserWithoutPassword | null> {
  const result = await pool.query<UserWithoutPassword>(
    'SELECT id, name, email, goal, sex, birth_date, weight, height, body_fat, activity_level, daily_calories_goal, daily_proteins_goal, onboarding_completed, terms_accepted_at, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return mapUserRow(result.rows[0]);
}

export async function findFullUserById(id: string): Promise<User | null> {
  const result = await pool.query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

export async function updateUser(
  id: string,
  fields: {
    name?: string;
    email?: string;
    passwordHash?: string;
    goal?: string;
    sex?: string;
    birthDate?: string;
    weight?: number | null;
    height?: number | null;
    body_fat?: number | null;
    activity_level?: string | null;
    daily_calories_goal?: number;
    daily_proteins_goal?: number;
    onboarding_completed?: boolean;
  },
  client?: PoolClient
): Promise<UserWithoutPassword> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (fields.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(fields.name.trim());
  }
  if (fields.email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    values.push(fields.email.trim().toLowerCase());
  }
  if (fields.passwordHash !== undefined) {
    updates.push(`password_hash = $${paramIndex++}`);
    values.push(fields.passwordHash);
  }
  if (fields.goal !== undefined) {
    updates.push(`goal = $${paramIndex++}`);
    values.push(fields.goal);
  }
  if (fields.sex !== undefined) {
    updates.push(`sex = $${paramIndex++}`);
    values.push(fields.sex);
  }
  if (fields.birthDate !== undefined) {
    let dbBirthDate: string | null = fields.birthDate || null;
    if (fields.birthDate) {
      if (fields.birthDate.includes('/')) {
        const [d, m, y] = fields.birthDate.split('/');
        dbBirthDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else if (fields.birthDate.includes('T')) {
        dbBirthDate = fields.birthDate.split('T')[0];
      }
    }
    updates.push(`birth_date = $${paramIndex++}`);
    values.push(dbBirthDate);
  }
  if (fields.weight !== undefined) {
    updates.push(`weight = $${paramIndex++}`);
    values.push(fields.weight);
  }
  if (fields.height !== undefined) {
    updates.push(`height = $${paramIndex++}`);
    values.push(fields.height);
  }
  if (fields.body_fat !== undefined) {
    updates.push(`body_fat = $${paramIndex++}`);
    values.push(fields.body_fat);
  }
  if (fields.activity_level !== undefined) {
    updates.push(`activity_level = $${paramIndex++}`);
    values.push(fields.activity_level);
  }
  if (fields.daily_calories_goal !== undefined) {
    updates.push(`daily_calories_goal = $${paramIndex++}`);
    values.push(fields.daily_calories_goal);
  }
  if (fields.daily_proteins_goal !== undefined) {
    updates.push(`daily_proteins_goal = $${paramIndex++}`);
    values.push(fields.daily_proteins_goal);
  }
  if (fields.onboarding_completed !== undefined) {
    updates.push(`onboarding_completed = $${paramIndex++}`);
    values.push(fields.onboarding_completed);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, name, email, goal, sex, birth_date, weight, height, body_fat, activity_level, daily_calories_goal, daily_proteins_goal, onboarding_completed, terms_accepted_at, created_at, updated_at
  `;

  const db = client || pool;
  const result = await db.query<UserWithoutPassword>(query, values);
  return mapUserRow(result.rows[0])!;
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
