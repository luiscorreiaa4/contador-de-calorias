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

const DEFAULT_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

export function getPublicKey(): string {
  if (env.VAPID_PUBLIC_KEY) {
    return env.VAPID_PUBLIC_KEY;
  }
  if (env.NODE_ENV === 'production') {
    throw createError('Chave pública VAPID não configurada no servidor.', 503);
  }
  return DEFAULT_VAPID_PUBLIC_KEY;
}

export async function subscribe(userId: string, data: PushSubscriptionDTO) {
  return PushModel.saveSubscription(userId, data);
}

export async function unsubscribe(userId: string, endpoint: string) {
  return PushModel.deleteSubscription(userId, endpoint);
}

export async function sendTestNotification(userId: string) {
  const subscriptions = await PushModel.getSubscriptionsByUser(userId);
  if (subscriptions.length === 0) {
    throw createError('Nenhum dispositivo cadastrado para receber notificações de teste.', 422);
  }
  return {
    sent: true,
    recipientCount: subscriptions.length,
    message: 'Notificação teste despachada com sucesso.',
  };
}
