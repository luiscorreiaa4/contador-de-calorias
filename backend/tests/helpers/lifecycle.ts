import { after } from 'node:test';
import { pool } from '../../src/database/pool.js';

/** Registre antes dos testes; o finally fecha o pool mesmo se a limpeza falhar. */
export function closeTestPool(cleanup?: () => Promise<void>): void {
  after(async () => {
    try {
      await cleanup?.();
    } finally {
      await pool.end();
    }
  });
}
