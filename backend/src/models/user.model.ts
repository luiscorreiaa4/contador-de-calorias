import { pool } from '../database/pool.js';
import { User, UserWithoutPassword } from '../types/user.types.js';

export async function createUser(
  name: string,
  email: string,
  passwordHash: string
): Promise<UserWithoutPassword> {
  const result = await pool.query<UserWithoutPassword>(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, goal, sex, birth_date, weight, height, body_fat, activity_level, onboarding_completed, created_at, updated_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserWithoutPassword | null> {
  const result = await pool.query<UserWithoutPassword>(
    'SELECT id, name, email, goal, sex, birth_date, weight, height, body_fat, activity_level, onboarding_completed, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
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
    onboarding_completed?: boolean;
  }
): Promise<UserWithoutPassword> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (fields.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(fields.name);
  }
  if (fields.email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    values.push(fields.email);
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
    let dbBirthDate = fields.birthDate;
    if (fields.birthDate && fields.birthDate.includes('/')) {
      const [d, m, y] = fields.birthDate.split('/');
      dbBirthDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
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
    RETURNING id, name, email, goal, sex, birth_date, weight, height, body_fat, activity_level, onboarding_completed, created_at, updated_at
  `;

  const result = await pool.query<UserWithoutPassword>(query, values);
  return result.rows[0];
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
