import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Meeting } from "@shared/schema";
import { useMeetings } from "@/hooks/use-meetings";
import { useMeetingNotes } from "@/hooks/use-meeting-notes";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Edit, ExternalLink, Trash2, Video, Calendar, Clock, Users, FileEdit } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

// Custom hook for getting a single meeting
function useMeeting(meetingId: number) {
  const { toast } = useToast();
  const { 
    updateMeeting: updateMeetingBase, 
    isUpdatingMeeting,
    deleteMeeting: deleteMeetingBase,
    isDeletingMeeting
  } = useMeetings();

  const {
    data: meeting,
    isLoading: isLoadingMeeting,
    error: meetingError
  } = useQuery<Meeting>({
    queryKey: ['/api/meetings', meetingId],
    enabled: !!meetingId,
  });

  return {
    meeting,
    isLoadingMeeting,
    meetingError,
    updateMeeting: updateMeetingBase,
    isUpdatingMeeting,
    deleteMeeting: deleteMeetingBase,
    isDeletingMeeting
  };
}

export default function MeetingDetails() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tabValue, setTabValue] = useState<string>("details");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    meeting,
    isLoadingMeeting,
    updateMeeting,
    isUpdatingMeeting,
    deleteMeeting,
    isDeletingMeeting,
  } = useMeeting(Number(meetingId));

  const {
    notes: meetingNotes,
    isLoadingNotes: isLoadingMeetingNotes,
    createNotes: addMeetingNote,
    isCreatingNotes: isAddingMeetingNote,
  } = useMeetingNotes(Number(meetingId));

  // Create schema and form for adding notes
  const noteFormSchema = z.object({
    content: z.string().min(1, "Note content is required"),
    summary: z.string().optional(),
  });
  
  type NoteFormValues = z.infer<typeof noteFormSchema>;
  
  const noteForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
      summary: "",
    },
  });

  // Create schema and form for editing meeting
  const meetingFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().nullable(),
    meetingLink: z.string().min(1, "Meeting link is required"),
    startTime: z.date(),
    endTime: z.date().optional().nullable(),
  });
  
  type MeetingFormValues = z.infer<typeof meetingFormSchema>;

  const meetingForm = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: meeting?.title || "",
      description: meeting?.description || "",
      meetingLink: meeting?.meetingLink || "",
      startTime: meeting ? new Date(meeting.startTime) : new Date(),
      endTime: meeting?.endTime ? new Date(meeting.endTime) : null,
    },
  });

  // Update form values when meeting data loads
  useEffect(() => {
    if (meeting) {
      meetingForm.reset({
        title: meeting.title,
        description: meeting.description,
        meetingLink: meeting.meetingLink,
        startTime: new Date(meeting.startTime),
        endTime: meeting.endTime ? new Date(meeting.endTime) : null,
      });
    }
  }, [meeting, meetingForm]);

  // Handle adding a new note
  const handleAddNote = (data: NoteFormValues) => {
    addMeetingNote({
      meetingId: Number(meetingId),
      content: data.content,
      summary: data.summary || null,
      isAiGenerated: false,
    }, {
      onSuccess: () => {
        setIsAddingNote(false);
        noteForm.reset();
        toast({
          title: "Note added",
          description: "Your note has been added successfully.",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error adding note",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Handle updating the meeting
  const handleUpdateMeeting = (data: MeetingFormValues) => {
    if (!meeting) return;
    
    updateMeeting({
      meetingId: meeting.id,
      data,
    }, {
      onSuccess: () => {
        setIsEditingMeeting(false);
        toast({
          title: "Meeting updated",
          description: "The meeting has been updated successfully.",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error updating meeting",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Handle deleting the meeting
  const handleDeleteMeeting = () => {
    if (!meeting) return;
    
    deleteMeeting(meeting.id, {
      onSuccess: () => {
        toast({
          title: "Meeting deleted",
          description: "The meeting has been deleted successfully.",
        });
        // Navigate back to the group page
        window.location.href = `/groups/${meeting.groupId}`;
      },
      onError: (error: Error) => {
        setIsDeleting(false);
        toast({
          title: "Error deleting meeting",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  if (isLoadingMeeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-neutral-600">Loading meeting details...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-neutral-600 mb-4">Meeting not found</p>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    );
  }

  // Check if user is a leader of the group
  const isLeader = user?.id === meeting.createdBy;

  // Format meeting date and times
  const meetingDate = format(new Date(meeting.startTime), "EEEE, MMMM d, yyyy");
  const startTime = format(new Date(meeting.startTime), "h:mm a");
  const endTime = meeting.endTime ? format(new Date(meeting.endTime), "h:mm a") : "TBD";

  return (
    <div className="container max-w-5xl py-6">
      {/* Back button and header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-2"
        >
          <Link href={`/groups/${meeting.groupId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Group
          </Link>
        </Button>
        <div className="flex justify-between items-start">
          <h1 className="text-2xl md:text-3xl font-bold">{meeting.title}</h1>
          {isLeader && (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditingMeeting(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this meeting? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingMeeting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteMeeting}
                      disabled={isDeletingMeeting}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {isDeletingMeeting ? "Deleting..." : "Delete Meeting"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {/* Meeting Tabs */}
      <Tabs
        value={tabValue}
        onValueChange={setTabValue}
        className="w-full"
      >
        <TabsList className="mb-6 border-b border-neutral-200 w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary"
          >
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Meeting Details Tab */}
        <TabsContent value="details" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Meeting Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meeting Type Badge */}
              <div className="flex items-center">
                <Badge variant="outline" className="flex items-center bg-primary/10 text-primary">
                  <Video className="h-3 w-3 mr-1" />
                  {meeting.meetingType === "zoom" ? "Zoom Meeting" : "Google Meet"}
                </Badge>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-neutral-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-500">Date</p>
                    <p className="font-medium">{meetingDate}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-neutral-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-500">Time</p>
                    <p className="font-medium">{startTime} - {endTime}</p>
                  </div>
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <p className="text-sm text-neutral-500 mb-1">Meeting Link</p>
                <a 
                  href={meeting.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  {meeting.meetingLink}
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>

              {/* Description */}
              {meeting.description && (
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Description</p>
                  <p className="whitespace-pre-line">{meeting.description}</p>
                </div>
              )}

              {/* Created by */}
              <div className="pt-2">
                <p className="text-xs text-neutral-500 mb-2">Created by:</p>
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${meeting.createdBy}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">User {meeting.createdBy}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Meeting Form */}
          {isEditingMeeting && (
            <div className="mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Edit Meeting</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...meetingForm}>
                    <form onSubmit={meetingForm.handleSubmit(handleUpdateMeeting)} className="space-y-4">
                      <FormField
                        control={meetingForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Meeting title"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={meetingForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Meeting description"
                                className="resize-none min-h-[100px]"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={meetingForm.control}
                        name="meetingLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meeting Link</FormLabel>
                            <FormControl>
                              <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Meeting link"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={meetingForm.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <input
                                  type="datetime-local"
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                  value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                  onChange={(e) => {
                                    field.onChange(e.target.value ? new Date(e.target.value) : null);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={meetingForm.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Time</FormLabel>
                              <FormControl>
                                <input
                                  type="datetime-local"
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                  value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                  onChange={(e) => {
                                    field.onChange(e.target.value ? new Date(e.target.value) : null);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditingMeeting(false)}
                          disabled={isUpdatingMeeting}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isUpdatingMeeting}>
                          {isUpdatingMeeting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>Save Changes</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Meeting Notes Tab */}
        <TabsContent value="notes" className="mt-0">
          <div className="space-y-6">
            {/* Add Note Button */}
            {!isAddingNote && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => setIsAddingNote(true)}
                  className="flex items-center"
                >
                  <FileEdit className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            )}

            {/* Add Note Form */}
            {isAddingNote && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Add Meeting Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...noteForm}>
                    <form onSubmit={noteForm.handleSubmit(handleAddNote)} className="space-y-4">
                      <FormField
                        control={noteForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Note Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your meeting notes here..."
                                className="resize-none min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={noteForm.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Summary (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Provide a brief summary of the notes..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddingNote(false)}
                          disabled={isAddingMeetingNote}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isAddingMeetingNote}>
                          {isAddingMeetingNote ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>Add Note</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Meeting Notes List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Meeting Notes</h3>
              
              {isLoadingMeetingNotes ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : meetingNotes.length > 0 ? (
                meetingNotes.map((note) => (
                  <Card key={note.id} className={note.isAiGenerated ? "border-primary/20 bg-primary/5" : ""}>
                    <CardContent className="pt-6">
                      {note.isAiGenerated && (
                        <Badge className="mb-2 bg-primary/20 text-primary border-primary/20">
                          AI Generated
                        </Badge>
                      )}
                      
                      {note.summary && (
                        <>
                          <div className="font-medium mb-2">{note.summary}</div>
                          <Separator className="my-3" />
                        </>
                      )}
                      
                      <div className="whitespace-pre-line text-sm">{note.content}</div>
                      
                      <div className="mt-4 text-xs text-neutral-500">
                        Added on {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                  <FileEdit className="h-10 w-10 mx-auto text-neutral-400 mb-2" />
                  <p className="text-neutral-600">
                    No notes have been added for this meeting yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}