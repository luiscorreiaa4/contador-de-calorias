import { pool } from '../database/pool.js';
import { User, UserWithoutPassword } from '../types/user.types.js';

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  goal: string,
  sex: string,
  birthDate: string
): Promise<UserWithoutPassword> {
  let dbBirthDate = birthDate;
  if (birthDate && birthDate.includes('/')) {
    const [d, m, y] = birthDate.split('/');
    dbBirthDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const result = await pool.query<UserWithoutPassword>(
    `INSERT INTO users (name, email, password_hash, goal, sex, birth_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, goal, sex, birth_date, created_at, updated_at`,
    [name, email, passwordHash, goal, sex, dbBirthDate]
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
    'SELECT id, name, email, goal, sex, birth_date, created_at, updated_at FROM users WHERE id = $1',
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
  }
): Promise<UserWithoutPassword> {
  const updates: string[] = [];
  const values: any[] = [];
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

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, name, email, goal, sex, birth_date, created_at, updated_at
  `;

  const result = await pool.query<UserWithoutPassword>(query, values);
  return result.rows[0];
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
