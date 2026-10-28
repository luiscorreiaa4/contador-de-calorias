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

export interface PushStatus {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
}

export const getPushSubscriptionStatus = async (): Promise<PushStatus> => {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return {
      isSupported: false,
      permission: 'unsupported',
      isSubscribed: false,
    };
  }

  const permission = Notification.permission;
  if (permission !== 'granted') {
    return {
      isSupported: true,
      permission,
      isSubscribed: false,
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager?.getSubscription();
    return {
      isSupported: true,
      permission,
      isSubscribed: !!subscription,
    };
  } catch (err) {
    console.warn('Erro ao consultar status de inscrição push:', err);
    return {
      isSupported: true,
      permission,
      isSubscribed: false,
    };
  }
};

async function ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration> {
  const existingRegistration = await navigator.serviceWorker.getRegistration();
  if (!existingRegistration) {
    await navigator.serviceWorker.register('/sw.js');
  }

  // Timeout defensivo de 8 segundos com limpeza no finally para evitar timer orfao (A-086)
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Tempo limite esgotado ao aguardar o Service Worker.'));
    }, 8000);
  });

  try {
    return await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export const registerPushNotifications = async (): Promise<boolean> => {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    throw new Error('Navegador não suporta notificações Push.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permissão de notificações não concedida nas configurações do navegador.');
  }

  const registration = await ensureServiceWorkerReady();
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

export const unregisterPushNotifications = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager?.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      try {
        await unsubscribePush(endpoint);
      } catch (err) {
        console.warn('Falha ao remover inscrição push no backend:', err);
      }
      await subscription.unsubscribe();
    }
    return true;
  } catch (err) {
    console.warn('Falha ao cancelar inscrição push:', err);
    throw new Error('Erro ao desativar notificações push.', { cause: err });
  }
};

