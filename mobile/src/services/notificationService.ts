import { Platform } from 'react-native';
import { PushTokenRegistration } from '../shared/schema';
import { apiRequest } from '../api/queryClient';

// Check if we're in a browser environment
const isBrowser = Platform.OS === 'web';

// Mock implementation for testing
export async function requestNotificationPermission(): Promise<boolean> {
  if (isBrowser) {
    // Browser implementation using web push
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  } else {
    // Mobile implementation would use Expo Notifications
    // This is a placeholder - would need to implement with actual Expo Notifications
    console.log('Mobile notification permissions would be requested here');
    return true;
  }
}

export async function registerPushToken(token: string): Promise<boolean> {
  try {
    const deviceType = isBrowser ? 'web' : Platform.OS === 'ios' ? 'ios' : 'android';
    
    const tokenRegistration: PushTokenRegistration = {
      token,
      deviceType: deviceType as 'ios' | 'android' | 'web',
    };
    
    const response = await apiRequest('POST', '/api/notifications/register-token', tokenRegistration);
    
    return response.ok;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

export async function unregisterPushToken(token: string): Promise<boolean> {
  try {
    const response = await apiRequest('POST', '/api/notifications/unregister-token', { token });
    return response.ok;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return false;
  }
}

// Function to get VAPID public key for web push
export async function getVapidPublicKey(): Promise<string | null> {
  if (!isBrowser) return null;
  
  try {
    const response = await apiRequest('GET', '/api/notifications/vapid-public-key');
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return null;
  }
}

// Subscribe for web push notifications
export async function subscribeForWebPush(): Promise<boolean> {
  if (!isBrowser || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  
  try {
    const publicKey = await getVapidPublicKey();
    if (!publicKey) return false;
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey
    });
    
    // Send the subscription to the server
    const response = await apiRequest(
      'POST', 
      '/api/notifications/subscribe',
      JSON.parse(JSON.stringify(subscription))
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error subscribing to web push:', error);
    return false;
  }
}

// Unsubscribe from web push notifications
export async function unsubscribeFromWebPush(): Promise<boolean> {
  if (!isBrowser || !('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) return true;
    
    // Send unsubscribe request to server
    const response = await apiRequest(
      'POST', 
      '/api/notifications/unsubscribe',
      JSON.parse(JSON.stringify(subscription))
    );
    
    // Unsubscribe on client side
    await subscription.unsubscribe();
    
    return response.ok;
  } catch (error) {
    console.error('Error unsubscribing from web push:', error);
    return false;
  }
}