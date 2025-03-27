import { useQuery, useMutation } from "@tanstack/react-query";
import { MeetingNote, insertMeetingNotesSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Type for creating meeting notes
export type CreateMeetingNotesInput = z.infer<typeof insertMeetingNotesSchema>;

// Type for updating meeting notes
export type UpdateMeetingNotesInput = Partial<CreateMeetingNotesInput>;

export function useMeetingNotes(meetingId?: number) {
  const { toast } = useToast();
  
  // Get all notes for a meeting
  const {
    data: notes = [],
    isLoading: isLoadingNotes,
    isError: isNotesError,
    error: notesError,
  } = useQuery<MeetingNote[]>({
    queryKey: ['/api/meetings', meetingId, 'notes'],
    enabled: !!meetingId,
  });

  // Create meeting notes
  const createNotesMutation = useMutation({
    mutationFn: async (data: CreateMeetingNotesInput) => {
      const response = await apiRequest(
        "POST", 
        `/api/meetings/${data.meetingId}/notes`, 
        data
      );
      return await response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Notes created",
        description: "Meeting notes have been saved successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/meetings', variables.meetingId, 'notes'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create notes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update meeting notes
  const updateNotesMutation = useMutation({
    mutationFn: async ({ 
      noteId, 
      data 
    }: { 
      noteId: number; 
      data: UpdateMeetingNotesInput 
    }) => {
      const response = await apiRequest(
        "PUT", 
        `/api/meetings/${data.meetingId}/notes/${noteId}`, 
        data
      );
      return await response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Notes updated",
        description: "Meeting notes have been updated successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/meetings', variables.data.meetingId, 'notes'] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update notes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete meeting notes
  const deleteNotesMutation = useMutation({
    mutationFn: async ({ 
      meetingId, 
      noteId 
    }: { 
      meetingId: number; 
      noteId: number 
    }) => {
      await apiRequest(
        "DELETE", 
        `/api/meetings/${meetingId}/notes/${noteId}`
      );
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Notes deleted",
        description: "Meeting notes have been deleted successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/meetings', variables.meetingId, 'notes'] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete notes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create prayer requests from meeting notes
  const createRequestsFromNotesMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      const response = await apiRequest(
        "POST", 
        `/api/meetings/${meetingId}/create-requests`,
        {}
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Prayer requests created",
        description: "Prayer requests have been created from meeting notes.",
      });
      
      // Invalidate prayer requests
      queryClient.invalidateQueries({ 
        queryKey: ['/api/requests/user/recent'] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create prayer requests",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Queries
    notes,
    isLoadingNotes,
    isNotesError,
    notesError,
    
    // Mutations
    createNotes: createNotesMutation.mutate,
    isCreatingNotes: createNotesMutation.isPending,
    
    updateNotes: updateNotesMutation.mutate,
    isUpdatingNotes: updateNotesMutation.isPending,
    
    deleteNotes: deleteNotesMutation.mutate,
    isDeletingNotes: deleteNotesMutation.isPending,
    
    createRequestsFromNotes: createRequestsFromNotesMutation.mutate,
    isCreatingRequests: createRequestsFromNotesMutation.isPending,
  };
}