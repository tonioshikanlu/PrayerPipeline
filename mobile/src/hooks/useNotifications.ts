import { useNotifications as useNotificationsFromContext } from '@/context/NotificationContext';

// Re-export the hook from the context
export const useNotifications = useNotificationsFromContext;