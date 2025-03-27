import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type PrayerCardProps = {
  request: any;
  onClick?: () => void;
};

export default function PrayerCard({ request, onClick }: PrayerCardProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-amber-50 text-amber-500";
      case "answered":
        return "bg-green-50 text-green-600";
      case "declined":
        return "bg-neutral-50 text-neutral-500";
      default:
        return "bg-neutral-50 text-neutral-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return "Still Waiting";
      case "answered":
        return "Answered!";
      case "declined":
        return "God Said No";
      default:
        return "Unknown";
    }
  };

  // Format date to relative time (e.g., 2 days ago)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div 
      className="prayer-card bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer transform hover:-translate-y-0.5"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-neutral-800">{request.title}</h4>
          <p className="text-xs text-neutral-500 mt-1">
            {request.group ? `In ${request.group.name} • ` : ''}
            {request.isAnonymous 
              ? "Posted anonymously" 
              : `Posted by ${request.author?.name || "Unknown"}`} • {formatDate(request.createdAt)}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
          {getStatusText(request.status)}
        </span>
      </div>
      <p className="text-sm text-neutral-600 mt-3 line-clamp-2">
        {request.description}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center text-neutral-500 text-xs">
          <MessageSquare className="h-4 w-4 mr-1" />
          <span>{request.commentCount || 0} comments</span>
        </div>
        <Button 
          variant="ghost"
          size="sm"
          className="text-primary text-sm hover:text-primary/90"
          onClick={(e) => {
            e.stopPropagation();
            onClick && onClick();
          }}
        >
          View
        </Button>
      </div>
    </div>
  );
}
