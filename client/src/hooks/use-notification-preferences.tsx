import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NotificationPreference } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useNotificationPreferences() {
  const { toast } = useToast();
  
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery<NotificationPreference>({
    queryKey: ["/api/notification-preferences"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updatedPreferences: Partial<NotificationPreference>) => {
      const res = await apiRequest("PATCH", "/api/notification-preferences", updatedPreferences);
      return await res.json();
    },
    onSuccess: (updatedPreferences: NotificationPreference) => {
      queryClient.setQueryData(["/api/notification-preferences"], updatedPreferences);
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update preferences",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferencesMutation.mutate,
    isPending: updatePreferencesMutation.isPending,
  };
}