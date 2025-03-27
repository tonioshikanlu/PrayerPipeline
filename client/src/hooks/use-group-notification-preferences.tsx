import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GroupNotificationPreference } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useGroupNotificationPreferences(groupId: number) {
  const { toast } = useToast();
  
  const queryKey = [`/api/groups/${groupId}/notification-preferences`];
  
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery<GroupNotificationPreference>({
    queryKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!groupId, // Only run the query if groupId is provided
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updatedPreferences: Partial<GroupNotificationPreference>) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/groups/${groupId}/notification-preferences`, 
        updatedPreferences
      );
      return await res.json();
    },
    onSuccess: (updatedPreferences: GroupNotificationPreference) => {
      queryClient.setQueryData(queryKey, updatedPreferences);
      toast({
        title: "Group preferences updated",
        description: "Your notification preferences for this group have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update group preferences",
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