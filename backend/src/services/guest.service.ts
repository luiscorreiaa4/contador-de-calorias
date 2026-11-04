import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'node:crypto';
import type { AuthResponse } from '@caloriesync/shared';
import { structuredLog } from '../config/logger.js';
import * as GuestModel from '../models/guest.model.js';
import * as UserModel from '../models/user.model.js';
import * as UserService from './user.service.js';
import * as MealService from './meal.service.js';
import { toAuthResponse } from './auth.service.js';
import { bcryptCost } from '../utils/authTokens.js';
import { getSaoPauloDateString } from '../utils/date.js';

export const GUEST_TTL_HOURS = 24;
export const GUEST_MAX_ACTIVE = 500;
export const CLEANUP_BATCH = 50;

const SEED_MEALS = [
  {
    name: 'Café da manhã',
    time: '07:30',
    items: [['Pão Francês', 50], ['Ovo Cozido', 100], ['Leite Integral', 200]],
  },
  {
    name: 'Almoço',
    time: '12:30',
    items: [['Arroz Branco Cozido', 150], ['Feijão Carioca Cozido', 100], ['Frango Grelhado', 120]],
  },
  {
    name: 'Jantar',
    time: '19:30',
    items: [['Aveia em Flocos', 40], ['Banana Prata', 100], ['Maçã', 150]],
  },
] as const;

const DEFAULT_SEED_NAMES = SEED_MEALS.flatMap((m) => m.items.map(([name]) => name));

function fail(message: string, statusCode: number, code: string): never {
  throw Object.assign(new Error(message), { statusCode, code });
}

async function seedMeals(userId: string, seedFoodNames: string[]): Promise<void> {
  const foodIds = await GuestModel.findGlobalFoodIdsByNames(seedFoodNames);
  const now = Date.now();
  for (let back = 0; back < 7; back++) {
    const date = getSaoPauloDateString(new Date(now - back * 24 * 3600 * 1000));
    for (const meal of SEED_MEALS) {
      const mealTime = new Date(`${date}T${meal.time}:00-03:00`);
      if (mealTime.getTime() > now) continue; // refeição futura não passa no schema
      const items = meal.items.flatMap(([name, quantity]) => {
        const foodId = foodIds.get(name);
        return foodId ? [{ foodId, quantity }] : [];
      });
      if (items.length === 0) continue;
      await MealService.createMeal(userId, { name: meal.name, mealTime: mealTime.toISOString(), items });
    }
  }
}

export async function createGuestSession(
  options: { maxActive?: number; seedFoodNames?: string[] } = {},
): Promise<AuthResponse> {
  const { maxActive = GUEST_MAX_ACTIVE, seedFoodNames = DEFAULT_SEED_NAMES } = options;

  try {
    await GuestModel.deleteExpiredGuests(GUEST_TTL_HOURS, CLEANUP_BATCH);
  } catch (error) {
    structuredLog('error', 'guest_cleanup_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // shortcut: contagem e insert não são atômicos; cliques simultâneos podem passar um pouco do teto — trocar por advisory lock se virar problema.
  if ((await GuestModel.countActiveGuests()) >= maxActive) {
    fail('Demonstração indisponível no momento.', 503, 'DEMO_UNAVAILABLE');
  }

  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), bcryptCost());
  const created = await GuestModel.createGuestUser(`demo-${randomUUID()}@visitante.invalid`, passwordHash);

  try {
    await UserService.completeOnboarding(created.id, {
      sex: 'masculino',
      birthDate: '1995-06-15',
      goal: 'perder_peso',
      weight: 80,
      height: 178,
      body_fat: null,
      activity_level: 'moderadamente_ativo',
    });
    await seedMeals(created.id, seedFoodNames);
    const user = await UserModel.findFullUserById(created.id);
    if (!user) throw new Error('Visitante não encontrado após o seed.');
    return toAuthResponse(user, false);
  } catch (error) {
    await UserModel.deleteUser(created.id);
    throw error;
  }
}
