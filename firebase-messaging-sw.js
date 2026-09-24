/**
 * ZYRQUEN Sovereign Firebase Cloud Messaging Service Worker
 * Compatible with Android 16.0+ (Baklava / API 36) Notification Channels
 * LOCKEDFROZENv1.2_LTS
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { notification: { title: 'ZYRQUEN Sovereign Alert', body: event.data.text() } };
  }

  const notification = payload.notification || {};
  const android = (payload.message && payload.message.android) || payload.android || {};
  const androidNotif = android.notification || {};
  const data = payload.data || {};

  const title = notification.title || '🚨 ZYRQUEN Sovereign System Alert';
  const options = {
    body: notification.body || 'Post-quantum security event detected.',
    icon: '/icon.svg',
    badge: '/apple-touch-icon.png',
    tag: androidNotif.tag || 'zyrquen_system_alert',
    data: data,
    vibrate: [0, 250, 150, 250],
    requireInteraction: androidNotif.channelId === 'zyrquen_security_alerts',
    actions: [
      { action: 'OPEN_SOVEREIGN_CONSOLE', title: 'Open Console' },
      { action: 'DISMISS', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'DISMISS') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
