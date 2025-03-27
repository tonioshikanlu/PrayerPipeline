// Push Notification Utilities

// Get the server's VAPID public key for web push
export async function getVapidPublicKey(): Promise<string> {
  try {
    const response = await fetch('/api/push/vapid-public-key');
    if (!response.ok) {
      throw new Error('Failed to get VAPID public key');
    }
    const data = await response.json();
    return data.vapidPublicKey;
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    throw error;
  }
}

// Convert base64 string to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported by the browser
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

// Request permission for notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported in this browser');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
}

// Register the service worker for push notifications
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service worker not supported in this browser');
  }

  try {
    return await navigator.serviceWorker.register('/service-worker.js');
  } catch (error) {
    console.error('Error registering service worker:', error);
    throw error;
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    console.error('Push notifications not supported');
    return null;
  }

  try {
    // Request notification permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Get the service worker registration
    let swRegistration;
    if (!navigator.serviceWorker.controller) {
      swRegistration = await registerServiceWorker();
    } else {
      swRegistration = await navigator.serviceWorker.ready;
    }

    // Get the VAPID public key
    const vapidPublicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe to push
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Save the subscription on the server
    await saveSubscription(subscription);

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
}

// Save the push subscription on the server
export async function saveSubscription(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Failed to save push subscription');
    }
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    console.error('Push notifications not supported');
    return false;
  }

  try {
    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await swRegistration.pushManager.getSubscription();

    if (!subscription) {
      return true; // Already unsubscribed
    }

    // Unsubscribe from push
    const success = await subscription.unsubscribe();
    if (success) {
      // Remove the subscription from the server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    }

    return success;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
}