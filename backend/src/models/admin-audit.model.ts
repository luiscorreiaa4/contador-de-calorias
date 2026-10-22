import type { PoolClient } from 'pg';

export interface AuditLogEntry {
  actor_user_id: string | null;
  actor_type: 'user' | 'cli';
  action: string;
  entity_type: string;
  entity_id: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Registra uma entrada imutável no log de auditoria na mesma transação da operação (D-22 / B5).
 */
export async function recordAuditLog(client: PoolClient, entry: AuditLogEntry): Promise<void> {
  await client.query(
    `INSERT INTO admin_audit_log (
      actor_user_id, actor_type, action, entity_type, entity_id, before, after, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
    [
      entry.actor_user_id,
      entry.actor_type,
      entry.action,
      entry.entity_type,
      entry.entity_id,
      entry.before !== undefined && entry.before !== null ? JSON.stringify(entry.before) : null,
      entry.after !== undefined && entry.after !== null ? JSON.stringify(entry.after) : null,
    ]
  );
}
