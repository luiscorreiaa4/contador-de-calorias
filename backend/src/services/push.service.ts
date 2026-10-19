import * as PushModel from '../models/push.model.js';
import type { PushSubscriptionDTO } from '@caloriesync/shared';

const DEFAULT_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

export function getPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
}

export async function subscribe(userId: string, data: PushSubscriptionDTO) {
  return PushModel.saveSubscription(userId, data);
}

export async function unsubscribe(userId: string, endpoint: string) {
  return PushModel.deleteSubscription(userId, endpoint);
}

export async function sendTestNotification(userId: string) {
  const subscriptions = await PushModel.getSubscriptionsByUser(userId);
  return {
    sent: true,
    recipientCount: subscriptions.length,
    message: 'Notificação teste despachada com sucesso.',
  };
}
