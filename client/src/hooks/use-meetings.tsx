import { useQuery, useMutation } from "@tanstack/react-query";
import { Meeting, insertMeetingSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Type for creating a new meeting
export type CreateMeetingInput = z.infer<typeof insertMeetingSchema>;

// Type for updating a meeting
export type UpdateMeetingInput = Partial<CreateMeetingInput>;

export function useMeetings(groupId?: number) {
  const { toast } = useToast();
  
  // Get all meetings for a group
  const {
    data: meetings = [],
    isLoading: isLoadingMeetings,
    isError: isMeetingsError,
    error: meetingsError,
  } = useQuery<Meeting[]>({
    queryKey: ['/api/groups', groupId, 'meetings'],
    enabled: !!groupId,
  });

  // Get a specific meeting
  const getMeeting = (meetingId: number) => {
    return useQuery<Meeting>({
      queryKey: ['/api/meetings', meetingId],
    });
  };

  // Get upcoming meetings for the current user
  const {
    data: upcomingMeetings = [],
    isLoading: isLoadingUpcoming,
    isError: isUpcomingError,
    error: upcomingError,
  } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings/upcoming'],
  });

  // Create a new meeting
  const createMeetingMutation = useMutation({
    mutationFn: async (data: CreateMeetingInput) => {
      const response = await apiRequest(
        "POST", 
        `/api/groups/${data.groupId}/meetings`, 
        data
      );
      return await response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Meeting created",
        description: "Your meeting has been scheduled successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/groups', variables.groupId, 'meetings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings/upcoming'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create meeting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update a meeting
  const updateMeetingMutation = useMutation({
    mutationFn: async ({ 
      meetingId, 
      data 
    }: { 
      meetingId: number; 
      data: UpdateMeetingInput 
    }) => {
      const response = await apiRequest(
        "PUT", 
        `/api/meetings/${meetingId}`, 
        data
      );
      return await response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Meeting updated",
        description: "Your meeting has been updated successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', variables.meetingId] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings/upcoming'] });
      
      // If we know the group ID, invalidate that too
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['/api/groups', groupId, 'meetings'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update meeting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a meeting
  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      await apiRequest("DELETE", `/api/meetings/${meetingId}`);
    },
    onSuccess: (_data, meetingId) => {
      toast({
        title: "Meeting deleted",
        description: "The meeting has been cancelled successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings/upcoming'] });
      
      // If we know the group ID, invalidate that too
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['/api/groups', groupId, 'meetings'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete meeting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Queries
    meetings,
    isLoadingMeetings,
    isMeetingsError,
    meetingsError,
    
    upcomingMeetings,
    isLoadingUpcoming,
    isUpcomingError,
    upcomingError,
    
    getMeeting,
    
    // Mutations
    createMeeting: createMeetingMutation.mutate,
    isCreatingMeeting: createMeetingMutation.isPending,
    
    updateMeeting: updateMeetingMutation.mutate,
    isUpdatingMeeting: updateMeetingMutation.isPending,
    
    deleteMeeting: deleteMeetingMutation.mutate,
    isDeletingMeeting: deleteMeetingMutation.isPending,
  };
}