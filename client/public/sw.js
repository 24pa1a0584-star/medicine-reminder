// DOSEBLOOM Progressive Web App Service Worker
const CACHE_NAME = 'dosebloom-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/logo.svg',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline application shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network-First for APIs, Cache-First for static assets)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API requests
  if (url.pathname.startsWith('/api')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and update in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // Fallback for navigation requests when completely offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Web Push Notification Listener
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  let data = {
    title: 'DOSEBLOOM — Scheduled Reminder',
    body: 'You have a scheduled medicine reminder due now.',
    icon: '/icons/logo.svg',
    badge: '/icons/logo.svg',
    tag: 'dosebloom-reminder',
    data: { url: '/dashboard' },
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/logo.svg',
    badge: data.badge || '/icons/logo.svg',
    tag: data.tag || 'dosebloom-reminder',
    vibrate: [200, 100, 200, 100, 300],
    requireInteraction: true,
    data: data.data || { url: '/dashboard' },
    actions: data.data?.actions || [
      { action: 'take', title: 'Mark Taken' },
      { action: 'snooze', title: 'Remind Later' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const targetUrl = event.notification.data?.url || '/dashboard';

  console.log('[SW] Notification clicked with action:', action);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action,
            data: event.notification.data,
          });
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
