import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRef } from 'react';
import { Platform } from 'react-native';
import {
  registerForPushNotifications,
  setupNotificationListeners,
  unregisterFromPushNotifications,
} from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';

type NotificationContextType = {
  pushToken: string | null;
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  setNotification: React.Dispatch<React.SetStateAction<Notifications.Notification | null>>;
  isNotificationsEnabled: boolean;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<boolean>;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(false);
  
  // Get the auth context to check if user is logged in
  const { user } = useAuth();
  
  // Reference to notification listener cleanup function
  const notificationListenerCleanup = useRef<(() => void) | null>(null);
  
  // Register for push notifications when the user logs in
  useEffect(() => {
    let isMounted = true;
    
    const registerForNotifications = async () => {
      if (user) {
        // Register device for push notifications
        const token = await registerForPushNotifications();
        if (isMounted && token) {
          setExpoPushToken(token);
          setIsNotificationsEnabled(true);
        }
      } else {
        // Clear token when user logs out
        if (expoPushToken) {
          await unregisterFromPushNotifications(expoPushToken);
        }
        if (isMounted) {
          setExpoPushToken(null);
          setIsNotificationsEnabled(false);
        }
      }
    };
    
    registerForNotifications();
    
    return () => {
      isMounted = false;
    };
  }, [user]);
  
  // Setup notification listeners
  useEffect(() => {
    // Set up notification listeners when component mounts
    notificationListenerCleanup.current = setupNotificationListeners(
      (notification) => {
        setNotification(notification);
      }
    );
    
    // Clean up listeners when component unmounts
    return () => {
      if (notificationListenerCleanup.current) {
        notificationListenerCleanup.current();
      }
    };
  }, []);
  
  // Enable notifications
  const enableNotifications = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const token = await registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
        setIsNotificationsEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  };
  
  // Disable notifications
  const disableNotifications = async (): Promise<boolean> => {
    if (!expoPushToken) return true;
    
    try {
      const success = await unregisterFromPushNotifications(expoPushToken);
      if (success) {
        setExpoPushToken(null);
        setIsNotificationsEnabled(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      return false;
    }
  };
  
  return (
    <NotificationContext.Provider
      value={{
        pushToken: expoPushToken,
        expoPushToken,
        notification,
        setNotification,
        isNotificationsEnabled,
        enableNotifications,
        disableNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}