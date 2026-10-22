import type { PoolClient } from 'pg';
import { pool } from '../database/pool.js';
import type { AdminCreateFoodDTO, AdminUpdateFoodDTO } from '@caloriesync/shared';

export interface AdminFoodRow {
  id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  base_unit: 'g' | 'ml';
  serving_weight: number;
  unit_name: string | null;
  unit_weight: number | null;
  source: string | null;
  external_id: string | null;
  source_ref: string | null;
  active: boolean;
  admin_edited_at: string | null;
  created_at: string;
  updated_at: string;
}

const ADMIN_FOOD_COLUMNS = `
  id, name, calories, proteins, carbs, fats, base_unit, serving_weight,
  unit_name, unit_weight, source, external_id, source_ref, active,
  admin_edited_at, created_at, updated_at
`;

export function mapAdminFoodRow(row: Record<string, unknown>): AdminFoodRow {
  return {
    id: String(row.id),
    name: String(row.name),
    calories: Number(row.calories),
    proteins: Number(row.proteins),
    carbs: Number(row.carbs),
    fats: Number(row.fats),
    base_unit: row.base_unit as 'g' | 'ml',
    serving_weight: Number(row.serving_weight),
    unit_name: (row.unit_name as string | null) ?? null,
    unit_weight: row.unit_weight != null ? Number(row.unit_weight) : null,
    source: (row.source as string | null) ?? null,
    external_id: (row.external_id as string | null) ?? null,
    source_ref: (row.source_ref as string | null) ?? null,
    active: Boolean(row.active),
    admin_edited_at: row.admin_edited_at ? new Date(row.admin_edited_at as string).toISOString() : null,
    created_at: new Date(row.created_at as string).toISOString(),
    updated_at: new Date(row.updated_at as string).toISOString(),
  };
}

export async function searchCatalogFoods(options: {
  search?: string;
  status: 'all' | 'active' | 'inactive';
  page: number;
  limit: number;
}): Promise<{ foods: AdminFoodRow[]; total: number }> {
  const { search, status, page, limit } = options;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['user_id IS NULL'];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (status === 'active') {
    conditions.push('active = true');
  } else if (status === 'inactive') {
    conditions.push('active = false');
  }

  let orderClause = 'ORDER BY name ASC';

  if (search && search.trim()) {
    const trimmed = search.trim();
    // Escape de caracteres especiais de ILIKE (B12 / CA-11)
    const escaped = trimmed.replace(/[%_\\]/g, '\\$&');
    conditions.push(`f_unaccent(name) ILIKE f_unaccent($${paramIdx++})`);
    params.push(`%${escaped}%`);

    orderClause = `ORDER BY f_unaccent(name) <-> f_unaccent($${paramIdx++}) ASC`;
    params.push(trimmed);
  }

  const limitParam = `$${paramIdx++}`;
  const offsetParam = `$${paramIdx++}`;
  params.push(limit, offset);

  const whereClause = conditions.join(' AND ');
  const sql = `
    SELECT ${ADMIN_FOOD_COLUMNS}, count(*) OVER() AS total_count
    FROM foods
    WHERE ${whereClause}
    ${orderClause}
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  const result = await pool.query(sql, params);
  const rows = result.rows;

  let total = 0;
  if (rows.length > 0 && rows[0].total_count) {
    total = parseInt(rows[0].total_count, 10);
  } else if (offset > 0) {
    // Se paginação exceder registros, calcula count isolado
    const countParams = params.slice(0, paramIdx - 3);
    const countSql = `SELECT COUNT(*) FROM foods WHERE ${whereClause}`;
    const countRes = await pool.query(countSql, countParams);
    total = parseInt(countRes.rows[0].count, 10);
  }

  return {
    foods: rows.map(mapAdminFoodRow),
    total,
  };
}

export async function findCatalogFoodById(
  id: string,
  client?: PoolClient
): Promise<AdminFoodRow | null> {
  const db = client || pool;
  const result = await db.query(
    `SELECT ${ADMIN_FOOD_COLUMNS} FROM foods WHERE id = $1 AND user_id IS NULL`,
    [id]
  );
  if (!result.rows[0]) return null;
  return mapAdminFoodRow(result.rows[0]);
}

export async function findCatalogFoodByIdForUpdate(
  id: string,
  client: PoolClient
): Promise<AdminFoodRow | null> {
  const result = await client.query(
    `SELECT ${ADMIN_FOOD_COLUMNS} FROM foods WHERE id = $1 AND user_id IS NULL FOR UPDATE`,
    [id]
  );
  if (!result.rows[0]) return null;
  return mapAdminFoodRow(result.rows[0]);
}

export async function insertCatalogFood(
  client: PoolClient,
  data: AdminCreateFoodDTO
): Promise<AdminFoodRow> {
  const result = await client.query(
    `INSERT INTO foods (
      name, calories, proteins, carbs, fats, base_unit, serving_weight,
      unit_name, unit_weight, source, source_ref, active, user_id, admin_edited_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, 'catalog', $10, true, NULL, CURRENT_TIMESTAMP
    ) RETURNING ${ADMIN_FOOD_COLUMNS}`,
    [
      data.name.trim(),
      data.calories,
      data.proteins,
      data.carbs,
      data.fats,
      data.base_unit || 'g',
      data.serving_weight || 100,
      data.unit_name ? data.unit_name.trim() : null,
      data.unit_weight || null,
      data.source_ref.trim(),
    ]
  );
  return mapAdminFoodRow(result.rows[0]);
}

export async function updateCatalogFoodRow(
  client: PoolClient,
  id: string,
  data: AdminUpdateFoodDTO
): Promise<AdminFoodRow> {
  const result = await client.query(
    `UPDATE foods SET
      name = $1,
      calories = $2,
      proteins = $3,
      carbs = $4,
      fats = $5,
      base_unit = $6,
      serving_weight = $7,
      unit_name = $8,
      unit_weight = $9,
      source_ref = $10,
      admin_edited_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11 AND user_id IS NULL
    RETURNING ${ADMIN_FOOD_COLUMNS}`,
    [
      data.name.trim(),
      data.calories,
      data.proteins,
      data.carbs,
      data.fats,
      data.base_unit || 'g',
      data.serving_weight || 100,
      data.unit_name ? data.unit_name.trim() : null,
      data.unit_weight || null,
      data.source_ref.trim(),
      id,
    ]
  );
  return mapAdminFoodRow(result.rows[0]);
}

export async function updateCatalogFoodStatusRow(
  client: PoolClient,
  id: string,
  active: boolean
): Promise<AdminFoodRow> {
  const result = await client.query(
    `UPDATE foods SET
      active = $1,
      admin_edited_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND user_id IS NULL
    RETURNING ${ADMIN_FOOD_COLUMNS}`,
    [active, id]
  );
  return mapAdminFoodRow(result.rows[0]);
}
