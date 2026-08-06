import { pool } from '../database/pool.js';
import { User, UserWithoutPassword } from '../types/user.types.js';

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  goal: string
): Promise<UserWithoutPassword> {
  const result = await pool.query<UserWithoutPassword>(
    `INSERT INTO users (name, email, password_hash, goal)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, goal, created_at, updated_at`,
    [name, email, passwordHash, goal]
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
    'SELECT id, name, email, goal, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}
