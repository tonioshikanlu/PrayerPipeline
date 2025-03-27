import { Meeting } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, MapPin, Calendar, Clock, User, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface MeetingCardProps {
  meeting: Meeting;
  isLeader?: boolean;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
  onViewNotes?: (meeting: Meeting) => void;
}

export default function MeetingCard({ 
  meeting, 
  isLeader = false,
  onEdit,
  onDelete,
  onViewNotes 
}: MeetingCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if the meeting is in the past
  const isPastMeeting = new Date(meeting.meetingDate) < new Date();
  
  // Format the meeting date and time
  const meetingDate = format(new Date(meeting.meetingDate), "EEEE, MMMM d, yyyy");
  const meetingTime = format(new Date(meeting.meetingDate), "h:mm a");
  
  // Determine if the meeting is virtual or physical
  const isVirtual = !!meeting.meetingUrl;
  
  // Handle join meeting click
  const handleJoinMeeting = () => {
    if (meeting.meetingUrl) {
      window.open(meeting.meetingUrl, "_blank");
    } else {
      toast({
        title: "No meeting URL provided",
        description: "This meeting doesn't have a virtual meeting link.",
        variant: "destructive",
      });
    }
  };
  
  // Handle copy meeting info
  const handleCopyInfo = () => {
    const meetingInfo = `
Meeting: ${meeting.title}
Date: ${meetingDate}
Time: ${meetingTime}
${meeting.meetingUrl ? `URL: ${meeting.meetingUrl}` : `Location: ${meeting.location}`}
Description: ${meeting.description}
    `.trim();
    
    navigator.clipboard.writeText(meetingInfo);
    
    toast({
      title: "Meeting info copied",
      description: "Meeting details have been copied to clipboard",
    });
  };
  
  // Determine if the current user is the creator of this meeting
  const isCreator = user?.id === meeting.createdBy;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-1">{meeting.title}</CardTitle>
            <CardDescription className="text-sm flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {meetingDate}
            </CardDescription>
            <CardDescription className="text-sm flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {meetingTime}
            </CardDescription>
          </div>
          
          {(isLeader || isCreator) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                {!isPastMeeting && (
                  <DropdownMenuItem onClick={() => onEdit?.(meeting)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit Meeting</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete?.(meeting)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Meeting</span>
                </DropdownMenuItem>
                {isPastMeeting && (
                  <DropdownMenuItem onClick={() => onViewNotes?.(meeting)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                      <line x1="9" y1="9" x2="10" y2="9" />
                      <line x1="9" y1="13" x2="15" y2="13" />
                      <line x1="9" y1="17" x2="15" y2="17" />
                    </svg>
                    <span>View Notes</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleCopyInfo}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Info</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          {isVirtual ? (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              <Video className="h-3 w-3 mr-1" />
              Virtual
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
              <MapPin className="h-3 w-3 mr-1" />
              In-Person
            </Badge>
          )}
          
          <Badge className="bg-neutral-100 text-neutral-800 hover:bg-neutral-200">
            <User className="h-3 w-3 mr-1" />
            Host: {meeting.createdByUser?.name?.split(" ")[0] || "Unknown"}
          </Badge>
          
          {isPastMeeting && (
            <Badge variant="outline" className="border-neutral-200 text-neutral-500">
              Completed
            </Badge>
          )}
        </div>
        
        {meeting.description && (
          <p className="text-sm text-neutral-600 line-clamp-2">
            {meeting.description}
          </p>
        )}
        
        {isVirtual && (
          <div className="mt-2 text-sm text-primary truncate">
            <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              {meeting.meetingUrl}
            </a>
          </div>
        )}
        
        {!isVirtual && meeting.location && (
          <div className="mt-2 text-sm text-neutral-600 flex items-start gap-1">
            <MapPin className="h-3.5 w-3.5 mt-0.5" />
            <span>{meeting.location}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full flex justify-end gap-2">
          {!isPastMeeting && isVirtual && (
            <Button size="sm" onClick={handleJoinMeeting}>
              <Video className="h-4 w-4 mr-1" />
              Join Meeting
            </Button>
          )}
          
          {isPastMeeting && (
            <Button size="sm" variant="outline" onClick={() => onViewNotes?.(meeting)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                <line x1="9" y1="9" x2="10" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="15" y2="17" />
              </svg>
              View Notes
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}