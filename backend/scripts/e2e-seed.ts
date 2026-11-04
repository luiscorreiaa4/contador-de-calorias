// Cria o usuário verificado e com onboarding concluído usado pelo E2E (#22).
// Só roda no banco `_test` (cleanupTestData e o pool abortam em outro banco).
import bcrypt from 'bcrypt';
import { pool } from '../src/database/pool.js';
import { cleanupTestData } from '../tests/helpers/db.js';

export const E2E_EMAIL = 'tester-e2e-user@example.com';
export const E2E_PASSWORD = 'senhaForte123';

try {
  await cleanupTestData('tester-e2e-%');
  await pool.query(
    `INSERT INTO users (name, email, password_hash, terms_accepted_at, email_verified_at,
        onboarding_completed, sex, birth_date, weight, height, activity_level, goal,
        daily_calories_goal, daily_proteins_goal)
     VALUES ('Tester E2E', $1, $2, now(), now(), true, 'masculino', '1990-01-01', 80, 180,
        'moderadamente_ativo', 'manter_peso', 2500, 130)`,
    [E2E_EMAIL, await bcrypt.hash(E2E_PASSWORD, 1)],
  );
  console.log('E2E: usuário de teste criado.');
} finally {
  await pool.end();
}
