import type { ClientRateLimitInfo, Options, Store } from 'express-rate-limit';
import { pool } from '../database/pool.js';

/** Store do express-rate-limit em Postgres: contador compartilhado entre instâncias (#5). */
export class PgRateLimitStore implements Store {
  private windowMs = 15 * 60 * 1000;

  constructor(private readonly keyPrefix: string) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private k(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    // shortcut: linhas expiradas só são sobrescritas ao reaparecer a chave; limpar por reset_at num job se a tabela crescer.
    const { rows } = await pool.query<{ hits: number; reset_at: Date }>(
      `INSERT INTO rate_limits (key, hits, reset_at)
       VALUES ($1, 1, CURRENT_TIMESTAMP + make_interval(secs => $2))
       ON CONFLICT (key) DO UPDATE SET
         hits = CASE WHEN rate_limits.reset_at <= CURRENT_TIMESTAMP THEN 1 ELSE rate_limits.hits + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= CURRENT_TIMESTAMP
                         THEN CURRENT_TIMESTAMP + make_interval(secs => $2)
                         ELSE rate_limits.reset_at END
       RETURNING hits, reset_at`,
      [this.k(key), this.windowMs / 1000]
    );
    return { totalHits: rows[0].hits, resetTime: rows[0].reset_at };
  }

  async decrement(key: string): Promise<void> {
    await pool.query('UPDATE rate_limits SET hits = GREATEST(hits - 1, 0) WHERE key = $1', [this.k(key)]);
  }

  async resetKey(key: string): Promise<void> {
    await pool.query('DELETE FROM rate_limits WHERE key = $1', [this.k(key)]);
  }
}
