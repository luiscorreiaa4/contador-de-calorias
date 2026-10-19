import { apiFetch } from './api';
import type { PushSubscriptionDTO } from '@caloriesync/shared';
export type { PushSubscriptionDTO };

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const getVapidPublicKey = async (signal?: AbortSignal): Promise<{ publicKey: string }> => {
  return apiFetch<{ publicKey: string }>('/push/public-key', { signal });
};

export const subscribePush = async (data: PushSubscriptionDTO): Promise<void> => {
  return apiFetch<void>('/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const unsubscribePush = async (endpoint: string): Promise<void> => {
  return apiFetch<void>('/push/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
  });
};

export const sendTestPush = async (): Promise<{ message: string }> => {
  return apiFetch<{ message: string }>('/push/test', {
    method: 'POST',
  });
};

export const registerPushNotifications = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Navegador não suporta notificações Push.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permissão de notificações não concedida.');
  }

  const registration = await navigator.serviceWorker.ready;
  const { publicKey } = await getVapidPublicKey();
  const convertedVapidKey = urlBase64ToUint8Array(publicKey);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });

  const subJson = subscription.toJSON();
  if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
    throw new Error('Falha ao gerar credenciais de notificação push.');
  }

  await subscribePush({
    endpoint: subJson.endpoint,
    keys: {
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
    },
  });

  return true;
};
