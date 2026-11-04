import { closeTestPool } from '../helpers/lifecycle.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Options } from 'express-rate-limit';
import { pool } from '../../src/database/pool.js';
import {
  PgRateLimitStore,
  deleteExpiredRateLimits,
} from '../../src/middlewares/pgRateLimitStore.js';

describe('PgRateLimitStore (#5)', () => {
  closeTestPool(async () => {
    await pool.query("DELETE FROM rate_limits WHERE key LIKE 'tester-%'");
  });

  it('conta, decrementa e zera por chave, isolando prefixos', async () => {
    const a = new PgRateLimitStore('tester-a');
    const b = new PgRateLimitStore('tester-b');
    a.init({ windowMs: 60_000 } as Options);
    b.init({ windowMs: 60_000 } as Options);

    assert.strictEqual((await a.increment('k')).totalHits, 1);
    assert.strictEqual((await a.increment('k')).totalHits, 2);
    assert.strictEqual((await b.increment('k')).totalHits, 1);
    await a.decrement('k');
    assert.strictEqual((await a.increment('k')).totalHits, 2);
    await a.resetKey('k');
    assert.strictEqual((await a.increment('k')).totalHits, 1);
  });

  it('deleteExpiredRateLimits apaga só contadores vencidos', async () => {
    await pool.query(
      `INSERT INTO rate_limits (key, hits, reset_at) VALUES
         ('tester-old', 1, now() - interval '1 minute'),
         ('tester-live', 1, now() + interval '1 hour')`,
    );
    await deleteExpiredRateLimits();
    const { rows } = await pool.query<{ key: string }>(
      "SELECT key FROM rate_limits WHERE key IN ('tester-old', 'tester-live')",
    );
    assert.deepStrictEqual(
      rows.map((r) => r.key),
      ['tester-live'],
    );
  });
});
