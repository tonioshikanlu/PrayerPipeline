import { useQuery, useMutation } from '@tanstack/react-query';
import { PrayerReminder, InsertPrayerReminder } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Interface for the custom days of week
type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface PrayerReminderWithDays extends Omit<PrayerReminder, 'recurringDays'> {
  recurringDays: DayOfWeek[];
}

export interface CreatePrayerReminderData extends Omit<InsertPrayerReminder, 'userId' | 'recurringDays'> {
  recurringDays?: DayOfWeek[];
}

export function usePrayerReminders() {
  const { toast } = useToast();

  const {
    data: reminders = [],
    isLoading,
    isError,
    error,
  } = useQuery<PrayerReminder[]>({
    queryKey: ['/api/prayer-reminders'],
    select: (data) => {
      // Parse the recurringDays JSON string for each reminder
      return data.map((reminder) => {
        try {
          const parsedDays = reminder.recurringDays ? JSON.parse(reminder.recurringDays) : [];
          return {
            ...reminder,
            recurringDays: parsedDays,
          };
        } catch (e) {
          console.error('Error parsing recurring days:', e);
          return {
            ...reminder,
            recurringDays: [],
          };
        }
      }) as PrayerReminderWithDays[];
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data: CreatePrayerReminderData) => {
      const res = await apiRequest('POST', '/api/prayer-reminders', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-reminders'] });
      toast({
        title: 'Prayer reminder created',
        description: 'Your prayer reminder has been scheduled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create reminder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreatePrayerReminderData>;
    }) => {
      const res = await apiRequest('PUT', `/api/prayer-reminders/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-reminders'] });
      toast({
        title: 'Prayer reminder updated',
        description: 'Your prayer reminder has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update reminder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/prayer-reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-reminders'] });
      toast({
        title: 'Prayer reminder deleted',
        description: 'Your prayer reminder has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete reminder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    reminders,
    isLoading,
    isError,
    error,
    createReminder: createReminderMutation.mutate,
    updateReminder: updateReminderMutation.mutate,
    deleteReminder: deleteReminderMutation.mutate,
    isCreating: createReminderMutation.isPending,
    isUpdating: updateReminderMutation.isPending,
    isDeleting: deleteReminderMutation.isPending,
  };
}