import { pool } from '../database/pool.js';
import * as AdminFoodModel from '../models/admin-food.model.js';
import * as AdminAuditModel from '../models/admin-audit.model.js';
import {
  calculateCaloricWarnings,
  type AdminListFoodsQueryDTO,
  type AdminCreateFoodDTO,
  type AdminUpdateFoodDTO,
} from '@caloriesync/shared';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

function createError(message: string, statusCode: number, code?: string): CustomError {
  const err = new Error(message) as CustomError;
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
}

export async function list(query: AdminListFoodsQueryDTO) {
  const page = query.page || 1;
  const pageSize = query.pageSize || (query.limit && [25, 50, 100].includes(query.limit) ? query.limit : 25);
  return AdminFoodModel.searchCatalogFoods({
    search: query.search,
    q: query.q,
    status: query.status,
    page,
    pageSize,
    sort: query.sort,
    order: query.order,
  });
}

export async function getById(id: string) {
  const food = await AdminFoodModel.findCatalogFoodById(id);
  if (!food) {
    throw createError('Alimento não encontrado no catálogo global.', 404, 'FOOD_NOT_FOUND');
  }
  return food;
}

export async function create(adminUserId: string, data: AdminCreateFoodDTO) {
  const warnings = calculateCaloricWarnings(
    data.calories,
    data.proteins,
    data.carbs,
    data.fats
  );

  const client = await pool.connect();
  let finished = false;

  try {
    await client.query('BEGIN');

    let food: AdminFoodModel.AdminFoodRow;
    try {
      food = await AdminFoodModel.insertCatalogFood(client, data);
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        throw createError('Já existe um alimento ativo no catálogo global com este nome.', 409, 'FOOD_NAME_CONFLICT');
      }
      throw err;
    }

    await AdminAuditModel.recordAuditLog(client, {
      actor_user_id: adminUserId,
      actor_type: 'user',
      action: 'create_food',
      entity_type: 'food',
      entity_id: food.id,
      before: null,
      after: food,
    });

    await client.query('COMMIT');
    finished = true;

    return { food, warnings };
  } catch (error) {
    if (!finished) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function update(adminUserId: string, id: string, data: AdminUpdateFoodDTO) {
  const warnings = calculateCaloricWarnings(
    data.calories,
    data.proteins,
    data.carbs,
    data.fats
  );

  const client = await pool.connect();
  let finished = false;

  try {
    await client.query('BEGIN');

    const before = await AdminFoodModel.findCatalogFoodByIdForUpdate(id, client);
    if (!before) {
      throw createError('Alimento não encontrado no catálogo global.', 404, 'FOOD_NOT_FOUND');
    }

    let updatedFood: AdminFoodModel.AdminFoodRow;
    try {
      updatedFood = await AdminFoodModel.updateCatalogFoodRow(client, id, data);
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        throw createError('Já existe outro alimento ativo no catálogo global com este nome.', 409, 'FOOD_NAME_CONFLICT');
      }
      throw err;
    }

    await AdminAuditModel.recordAuditLog(client, {
      actor_user_id: adminUserId,
      actor_type: 'user',
      action: 'update_food',
      entity_type: 'food',
      entity_id: id,
      before,
      after: updatedFood,
    });

    await client.query('COMMIT');
    finished = true;

    return { food: updatedFood, warnings };
  } catch (error) {
    if (!finished) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateStatus(adminUserId: string, id: string, active: boolean) {
  const client = await pool.connect();
  let finished = false;

  try {
    await client.query('BEGIN');

    const before = await AdminFoodModel.findCatalogFoodByIdForUpdate(id, client);
    if (!before) {
      throw createError('Alimento não encontrado no catálogo global.', 404, 'FOOD_NOT_FOUND');
    }

    let updatedFood: AdminFoodModel.AdminFoodRow;
    try {
      updatedFood = await AdminFoodModel.updateCatalogFoodStatusRow(client, id, active);
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        throw createError('Já existe um alimento ativo com este nome. Não é possível reativar sem renomear.', 409, 'FOOD_NAME_CONFLICT');
      }
      throw err;
    }

    await AdminAuditModel.recordAuditLog(client, {
      actor_user_id: adminUserId,
      actor_type: 'user',
      action: 'status_food',
      entity_type: 'food',
      entity_id: id,
      before,
      after: updatedFood,
    });

    await client.query('COMMIT');
    finished = true;

    return { food: updatedFood };
  } catch (error) {
    if (!finished) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
