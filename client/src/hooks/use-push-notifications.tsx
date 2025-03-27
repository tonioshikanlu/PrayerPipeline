import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from '@/lib/push-notifications';

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);
    
    if (supported && 'Notification' in window) {
      setPermission(Notification.permission);
      
      // Check if already subscribed
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setIsSubscribed(!!sub);
          setSubscription(sub);
          setIsLoading(false);
        });
      }).catch(error => {
        console.error('Error checking subscription status:', error);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe to notifications",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsLoading(true);
      const result = await subscribeToPushNotifications();
      
      if (result) {
        setIsSubscribed(true);
        setSubscription(result);
        setPermission('granted');
        
        toast({
          title: "Notifications enabled",
          description: "You'll now receive prayer updates via notifications",
        });
        return true;
      } else {
        toast({
          title: "Notification setup failed",
          description: "We couldn't set up notifications. Please check your browser settings.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Notification error",
        description: "There was a problem setting up notifications",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await unsubscribeFromPushNotifications();
      
      if (result) {
        setIsSubscribed(false);
        setSubscription(null);
        
        toast({
          title: "Notifications disabled",
          description: "You won't receive push notifications anymore",
        });
        return true;
      } else {
        toast({
          title: "Error disabling notifications",
          description: "We couldn't disable notifications. Please try again.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Notification error",
        description: "There was a problem disabling notifications",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Request permission for notifications
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const permission = await requestNotificationPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribe();
        return true;
      } else {
        toast({
          title: "Permission required",
          description: "Notification permission is needed to receive updates",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Permission error",
        description: "There was a problem requesting notification permission",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscribe, toast]);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscription,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission
  };
}