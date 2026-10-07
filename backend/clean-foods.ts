import { pool } from './src/database/pool.js';
pool.query('UPDATE foods SET active = false WHERE source IS NULL').then(() => {
  console.log('Old seed foods deactivated');
  pool.end();
}).catch(console.error);
