/* eslint-disable no-restricted-globals */

// Service Worker for Web Push Notifications in Smart Pocket

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (_err) {
      data = {
        title: 'Smart Pocket',
        body: event.data.text() || 'You have a new notification',
      };
    }
  } else {
    data = {
      title: 'Smart Pocket',
      body: 'You have a new notification',
    };
  }

  const title = data.title || 'Smart Pocket';
  const rawUrl = typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/';

  const options = {
    body: data.body || '',
    icon: data.icon || '/vite.svg',
    badge: data.badge || data.icon || '/vite.svg',
    tag: data.tag || 'smart-pocket-notification',
    data: {
      url: rawUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let targetPath = event.notification.data?.url || '/';
  if (typeof targetPath !== 'string' || !targetPath.startsWith('/')) {
    targetPath = '/';
  }

  const fullUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. If an exact window exists, focus it
      for (const client of windowClients) {
        if (client.url === fullUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. If a client window on same origin is open, navigate and focus it
      if (windowClients.length > 0) {
        const client = windowClients[0];
        if ('navigate' in client && 'focus' in client) {
          return client.navigate(fullUrl).then((navigatedClient) => {
            return navigatedClient ? navigatedClient.focus() : client.focus();
          });
        }
      }
      // 3. Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    })
  );
});
