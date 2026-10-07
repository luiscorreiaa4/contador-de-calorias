import { pool } from '../src/database/pool.js';
pool.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('meals', 'meal_items');").then(res => {
  console.log(res.rows);
  pool.end();
}).catch(console.error);
