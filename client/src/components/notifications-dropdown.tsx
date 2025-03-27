import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notifications marked as read",
        description: "All notifications have been marked as read.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Mark as read if it's not already
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "new_request" || notification.type === "status_update") {
      // Navigate to the prayer request
      navigate(`/requests/${notification.referenceId}`);
    } else if (notification.type === "new_comment") {
      // Navigate to the prayer request with the comment
      navigate(`/requests/${notification.referenceId}`);
    } else if (notification.type === "added_to_group") {
      // Navigate to the group
      navigate(`/groups/${notification.referenceId}`);
    }

    setIsOpen(false);
  };

  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return diffMins === 0 ? "Just now" : `${diffMins} min ago`;
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffMins / (60 * 24));
      if (days < 7) {
        return `${days} day${days > 1 ? "s" : ""} ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  // Count unread notifications
  const unreadCount = notifications?.filter(
    (notification: any) => !notification.read
  ).length || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="relative p-1 rounded-full text-neutral-600 hover:text-primary focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-20">
          <div className="px-4 py-2 border-b border-neutral-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-neutral-800">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-primary hover:text-primary/90"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                {markAllReadMutation.isPending ? "Marking..." : "Mark all as read"}
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-96">
            {isLoading ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : notifications?.length > 0 ? (
              notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-b-0 ${
                    !notification.read ? "bg-primary-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p className={`text-sm ${!notification.read ? "font-medium text-neutral-800" : "text-neutral-700"}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-neutral-600">No notifications</p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
