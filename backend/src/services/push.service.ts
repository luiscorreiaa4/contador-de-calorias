import * as PushModel from '../models/push.model.js';
import type { PushSubscriptionDTO } from '@caloriesync/shared';
import { env } from '../config/env.js';

interface CustomError extends Error {
  statusCode?: number;
}

function createError(message: string, statusCode: number): CustomError {
  const err: CustomError = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// ID-4: sem chave configurada não há fallback; uma chave fixa não teria a privada correspondente.
export function getPublicKey(): string {
  if (!env.VAPID_PUBLIC_KEY) {
    throw createError('Chave pública VAPID não configurada no servidor.', 503);
  }
  return env.VAPID_PUBLIC_KEY;
}

export async function subscribe(userId: string, data: PushSubscriptionDTO) {
  return PushModel.saveSubscription(userId, data);
}

export async function unsubscribe(userId: string, endpoint: string) {
  return PushModel.deleteSubscription(userId, endpoint);
}
