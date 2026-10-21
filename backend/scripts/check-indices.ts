import { pool } from '../src/database/pool.js';

async function main() {
  try {
    const res = await pool.query(
      "SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('meals', 'meal_items');"
    );
    console.log(res.rows);
  } catch (err) {
    console.error('Erro ao consultar índices:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
