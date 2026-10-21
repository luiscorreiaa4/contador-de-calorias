import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const user = process.env.DB_USER || 'postgres';
const pass = process.env.DB_PASSWORD || 'postgres';
const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432', 10);
const dbName = 'contador_calorias_perf';

const pool = new Pool({
  host,
  port,
  user,
  password: pass,
  database: dbName,
  max: 5,
});

const statsQuery = `
EXPLAIN (ANALYZE, BUFFERS)
WITH daily_consumption AS (
  SELECT 
    DATE(m.meal_time AT TIME ZONE 'America/Sao_Paulo') as date_val,
    SUM(mi.calories) as consumed_calories,
    SUM(mi.proteins) as consumed_proteins,
    SUM(mi.carbs) as consumed_carbs,
    SUM(mi.fats) as consumed_fats
  FROM meals m
  JOIN meal_items mi ON mi.meal_id = m.id
  WHERE m.user_id = $1
    AND m.meal_time AT TIME ZONE 'America/Sao_Paulo' >= ($3::date - ($2 || ' days')::interval)
    AND m.meal_time AT TIME ZONE 'America/Sao_Paulo' < ($3::date + '1 day'::interval)
  GROUP BY DATE(m.meal_time AT TIME ZONE 'America/Sao_Paulo')
),
daily_goals AS (
  SELECT
    dc.date_val,
    dc.consumed_calories,
    dc.consumed_proteins,
    dc.consumed_carbs,
    dc.consumed_fats,
    ug.calories as goal_calories,
    ug.proteins as goal_proteins,
    ug.carbs as goal_carbs,
    ug.fats as goal_fats
  FROM daily_consumption dc
  LEFT JOIN LATERAL (
    SELECT calories, proteins, carbs, fats
    FROM user_goals
    WHERE user_id = $1 AND effective_from <= dc.date_val
    ORDER BY effective_from DESC
    LIMIT 1
  ) ug ON true
)
SELECT 
  TO_CHAR(date_val, 'YYYY-MM-DD') as date,
  consumed_calories,
  consumed_proteins,
  consumed_carbs,
  consumed_fats,
  goal_calories,
  goal_proteins,
  goal_carbs,
  goal_fats
FROM daily_goals 
ORDER BY date_val ASC;
`;

async function main() {
  const userRes = await pool.query("SELECT id FROM users WHERE email = 'perf-user@example.com'");
  if (userRes.rows.length === 0) {
    throw new Error('Usuário de performance não encontrado.');
  }
  const userId = userRes.rows[0].id;
  const endDate = '2026-10-15';

  const periods = [7, 30, 90, 365];

  console.log('================================================================');
  console.log('EXPLAIN ANALYZE: /api/meals/stats sob Volume Real (10k meal_items)');
  console.log('================================================================\n');

  for (const days of periods) {
    console.log(`\n--- EXPLAIN ANALYZE: Período = ${days} dias ---`);
    const res = await pool.query(statsQuery, [userId, days, endDate]);
    const plan = res.rows.map(r => r['QUERY PLAN']).join('\n');
    console.log(plan);
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
