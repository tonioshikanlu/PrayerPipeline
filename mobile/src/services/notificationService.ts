import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiRequest } from '@/api/queryClient';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Check if the device can receive push notifications
export async function checkNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications are not available on simulators/emulators');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // If we don't have permission yet, ask for it
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // If we still don't have permission, we can't send notifications
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  return true;
}

// Register for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const hasPermission = await checkNotificationPermissions();
    
    if (!hasPermission) {
      return null;
    }

    // Get the token that uniquely identifies this device
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    // Register the token with our backend
    try {
      await apiRequest('POST', '/api/push/register-token', {
        token: pushToken.data,
        deviceType: Platform.OS,
      });
      console.log('Push token registered with backend:', pushToken.data);
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }

    // Return the token
    return pushToken.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

// Unregister from push notifications (e.g., on logout)
export async function unregisterFromPushNotifications(token: string): Promise<boolean> {
  try {
    await apiRequest('POST', '/api/push/unregister-token', {
      token,
    });
    return true;
  } catch (error) {
    console.error('Failed to unregister push token with backend:', error);
    return false;
  }
}

// Setup notification listeners to handle received notifications
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponseReceived?: (response: Notifications.NotificationResponse) => void
) {
  // Get notification when received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Get notification when user taps/interacts with the notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      if (onNotificationResponseReceived) {
        onNotificationResponseReceived(response);
      }
      
      // Handle notification action here
      // You can extract data from the notification and navigate accordingly
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    }
  );

  // Return cleanup function to remove listeners
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

// Handle navigation based on notification data
export function handleNotificationNavigation(data: any) {
  // This would be integrated with your navigation system
  // Example:
  // if (data.type === 'prayer_request' && data.requestId) {
  //   navigation.navigate('RequestDetails', { requestId: data.requestId });
  // }
  console.log('Notification navigation data:', data);
}

// Send a local notification for testing
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null, // null means send immediately
  });
}

// Schedule a notification for a specific time
export async function scheduleNotification(
  title: string,
  body: string,
  scheduledTime: Date,
  data?: any
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: {
      date: scheduledTime,
    },
  });
}

// Cancel a specific notification by ID
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}