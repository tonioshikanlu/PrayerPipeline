// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  return self.clients.claim();
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    // Parse the notification data
    const data = event.data.json();
    console.log('Received notification data:', data);

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title || 'Prayer Pipeline', {
        body: data.body || 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
          url: data.url || '/'
        },
        timestamp: data.timestamp || Date.now(),
        vibrate: [100, 50, 100],
        actions: [
          {
            action: 'open',
            title: 'Open',
          },
          {
            action: 'close',
            title: 'Close',
          },
        ],
      })
    );
  } catch (error) {
    console.error('Error displaying push notification:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received', event);

  // Close the notification
  event.notification.close();

  // Get the notification data
  const data = event.notification.data;
  const url = data?.url || '/';

  // Handle different actions
  if (event.action === 'close') {
    return;
  }

  // Default action (or "open" action): Open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate to the target URL in the existing window
          client.navigate(url);
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});