import { useState } from "react";
import { Meeting, Group } from "@shared/schema";
import { useMeetings } from "@/hooks/use-meetings";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, CalendarDays, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import MeetingCard from "@/components/meeting-card";
import CreateMeetingModal from "@/components/create-meeting-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";

interface MeetingsTabProps {
  group: Group;
  isLeader: boolean;
}

export default function MeetingsTab({ group, isLeader }: MeetingsTabProps) {
  const [_, navigate] = useLocation();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [meetingsTab, setMeetingsTab] = useState<"upcoming" | "past">("upcoming");
  const [expandedUpcoming, setExpandedUpcoming] = useState(false);
  const [expandedPast, setExpandedPast] = useState(false);
  
  const { 
    meetings,
    isLoadingMeetings,
    deleteMeeting,
    isDeletingMeeting
  } = useMeetings(group.id);
  
  // Sort and filter meetings
  const now = new Date();
  
  // Get all upcoming meetings first for counting
  const allUpcomingMeetings = meetings
    .filter(meeting => new Date(meeting.startTime) >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Then slice to get only the first 3
  const upcomingMeetings = allUpcomingMeetings.slice(0, 3);
  const hasMoreUpcoming = allUpcomingMeetings.length > 3;
  
  // Same for past meetings
  const allPastMeetings = meetings
    .filter(meeting => new Date(meeting.startTime) < now)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  
  const pastMeetings = allPastMeetings.slice(0, 3);
  const hasMorePast = allPastMeetings.length > 3;
  
  // Handle meeting edit - redirect to meeting details page
  const handleEditMeeting = (meeting: Meeting) => {
    navigate(`/meetings/${meeting.id}`);
  };
  
  // Handle meeting delete
  const handleDeleteMeeting = (meeting: Meeting) => {
    setMeetingToDelete(meeting);
  };
  
  // Confirm meeting deletion
  const confirmDeleteMeeting = () => {
    if (meetingToDelete) {
      deleteMeeting(meetingToDelete.id);
      setMeetingToDelete(null);
    }
  };
  
  // Handle view meeting notes
  const handleViewNotes = (meeting: Meeting) => {
    navigate(`/meetings/${meeting.id}/notes`);
  };
  
  // Handle toggling the expanded view for meetings
  const handleToggleExpand = (type: "upcoming" | "past") => {
    if (type === "upcoming") {
      setExpandedUpcoming(!expandedUpcoming);
    } else {
      setExpandedPast(!expandedPast);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium font-heading text-neutral-800">
          Meetings
        </h3>
        {isLeader && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition flex items-center text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Schedule Meeting
          </Button>
        )}
      </div>
      
      {/* Meetings Tabs */}
      <Tabs
        value={meetingsTab}
        onValueChange={(value) => setMeetingsTab(value as "upcoming" | "past")}
        className="w-full mb-6"
      >
        <TabsList className="mb-4 border-b border-neutral-200 w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger
            value="upcoming"
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary"
          >
            Upcoming ({allUpcomingMeetings.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary"
          >
            Past ({allPastMeetings.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingMeetings ? (
              <>
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </>
            ) : upcomingMeetings.length > 0 ? (
              <>
                {upcomingMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    isLeader={isLeader}
                    onEdit={handleEditMeeting}
                    onDelete={handleDeleteMeeting}
                    onViewNotes={handleViewNotes}
                  />
                ))}
                {hasMoreUpcoming && (
                  <div className="col-span-full mt-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary hover:bg-primary/5" 
                      onClick={() => handleToggleExpand("upcoming")}
                    >
                      {expandedUpcoming ? (
                        <>Collapse <ChevronUp className="h-4 w-4 ml-1" /></>
                      ) : (
                        <>View all {allUpcomingMeetings.length} upcoming meetings <ChevronDown className="h-4 w-4 ml-1" /></>
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Expanded upcoming meetings section */}
                {expandedUpcoming && hasMoreUpcoming && (
                  <div className="col-span-full mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allUpcomingMeetings.slice(3).map((meeting) => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        isLeader={isLeader}
                        onEdit={handleEditMeeting}
                        onDelete={handleDeleteMeeting}
                        onViewNotes={handleViewNotes}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                <CalendarDays className="h-10 w-10 mx-auto text-neutral-400 mb-2" />
                <p className="text-neutral-600 mb-4">
                  No upcoming meetings scheduled.
                </p>
                {isLeader && (
                  <Button onClick={() => setCreateModalOpen(true)}>
                    Schedule First Meeting
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="past" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingMeetings ? (
              <>
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </>
            ) : pastMeetings.length > 0 ? (
              <>
                {pastMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    isLeader={isLeader}
                    onDelete={handleDeleteMeeting}
                    onViewNotes={handleViewNotes}
                  />
                ))}
                {hasMorePast && (
                  <div className="col-span-full mt-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary hover:bg-primary/5" 
                      onClick={() => handleToggleExpand("past")}
                    >
                      {expandedPast ? (
                        <>Collapse <ChevronUp className="h-4 w-4 ml-1" /></>
                      ) : (
                        <>View all {allPastMeetings.length} past meetings <ChevronDown className="h-4 w-4 ml-1" /></>
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Expanded past meetings section */}
                {expandedPast && hasMorePast && (
                  <div className="col-span-full mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allPastMeetings.slice(3).map((meeting) => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        isLeader={isLeader}
                        onDelete={handleDeleteMeeting}
                        onViewNotes={handleViewNotes}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                <CalendarDays className="h-10 w-10 mx-auto text-neutral-400 mb-2" />
                <p className="text-neutral-600">
                  No past meetings found.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Create Meeting Modal */}
      <CreateMeetingModal
        groupId={group.id}
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!meetingToDelete}
        onOpenChange={(open) => !open && setMeetingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this meeting? This action cannot be undone.
              {meetingToDelete && new Date(meetingToDelete.startTime) > new Date() && (
                <span className="block mt-2 text-red-500 font-medium">
                  Note: This will cancel the meeting for all participants.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingMeeting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMeeting}
              disabled={isDeletingMeeting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeletingMeeting ? "Deleting..." : "Delete Meeting"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  );
}