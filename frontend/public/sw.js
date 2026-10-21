const CACHE_VERSION = 'v2';
const CACHE_NAME = `caloriesync-cache-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Falha parcial ao pré-armazenar assets no Service Worker:', err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Não interceptar requisições para a API do backend nem ambiente local de desenvolvimento (evita conflitos com HMR do Vite)
  if (
    url.pathname.startsWith('/api') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1'
  ) {
    return;
  }

  const isNavigation = event.request.mode === 'navigate' || event.request.destination === 'document';

  // Network-First para documentos e rotas de navegação (A-101): previne que o app shell fique preso no cache
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('/') || caches.match('/index.html'))
        )
    );
    return;
  }

  // Stale-While-Revalidate / Cache-First com atualização em background para assets estáticos
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// Suporte a Notificações Push (BL-27 / FEAT-C09)
self.addEventListener('push', (event) => {
  let data = { title: 'CalorieSync', body: 'Lembre-se de registrar sua refeição!' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (_e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  // Respeita silêncio ou redução de movimento/vibração (A-104)
  const shouldVibrate = !data.silent && !data.reduceMotion;

  const options = {
    body: data.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: shouldVibrate ? [100, 50, 100] : undefined,
    silent: !shouldVibrate,
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Normaliza URL relativa com a origem atual para comparação correta com client.url absoluto (A-102)
  const rawTargetUrl = event.notification.data?.url || '/';
  const targetUrl = new URL(rawTargetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
