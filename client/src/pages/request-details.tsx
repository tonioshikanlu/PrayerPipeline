import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import CommentCard from "@/components/comment-card";
import UpdateStatusModal from "@/components/update-status-modal";
import { ArrowLeft, Heart, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function RequestDetails() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId ? parseInt(params.requestId) : 0;
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Get prayer request details
  const {
    data: request,
    isLoading: isLoadingRequest,
  } = useQuery({
    queryKey: [`/api/requests/${requestId}`],
    enabled: !!requestId,
  });

  // Get comments for this prayer request
  const {
    data: comments,
    isLoading: isLoadingComments,
  } = useQuery({
    queryKey: [`/api/requests/${requestId}/comments`],
    enabled: !!requestId,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/requests/${requestId}/comments`, {
        text: newComment,
        isPrivate,
      });
    },
    onSuccess: () => {
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully",
      });
      setNewComment("");
      setIsPrivate(false);
      queryClient.invalidateQueries({
        queryKey: [`/api/requests/${requestId}/comments`],
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

  // Delete prayer request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/requests/${requestId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Prayer request deleted",
        description: "The prayer request has been removed",
      });
      navigate("/"); // Navigate back to home page
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [`/api/groups/${request?.groupId}/requests`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/requests/user/recent"],
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

  // Toggle praying for mutation
  const togglePrayingMutation = useMutation({
    mutationFn: async () => {
      if (request?.isPraying) {
        await apiRequest("DELETE", `/api/requests/${requestId}/pray`, {});
      } else {
        await apiRequest("POST", `/api/requests/${requestId}/pray`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/requests/${requestId}`],
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

  const getStatusBadgeClass = (status) => {
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

  const getStatusText = (status) => {
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

  return (
    <div>
      <Header />

      <main className="pt-20 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              className="flex items-center text-primary hover:text-primary/90 mb-4"
              onClick={() => navigate(`/groups/${request?.groupId}`)}
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to Group
            </Button>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-neutral-800">
                    {isLoadingRequest ? (
                      <Skeleton className="h-7 w-64" />
                    ) : (
                      request?.title
                    )}
                  </h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    {isLoadingRequest ? (
                      <Skeleton className="h-4 w-96" />
                    ) : (
                      <>
                        In {request?.group?.name} • Posted by{" "}
                        {request?.isAnonymous ? "Anonymous" : request?.author?.name} •{" "}
                        {new Date(request?.createdAt).toLocaleDateString()}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center">
                  {!isLoadingRequest && (
                    <>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mr-2 ${getStatusBadgeClass(
                          request?.status
                        )}`}
                      >
                        {getStatusText(request?.status)}
                      </span>
                      {(request?.isOwn || user?.role === "admin") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="p-1 rounded-full text-neutral-400 hover:text-neutral-600"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {request?.isOwn && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setStatusModalOpen(true)}
                                >
                                  Update Status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteConfirmOpen(true)}
                                  className="text-red-600"
                                >
                                  Delete Request
                                </DropdownMenuItem>
                              </>
                            )}
                            {user?.role === "admin" && !request?.isOwn && (
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmOpen(true)}
                                className="text-red-600"
                              >
                                Delete Request (Admin)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  )}
                </div>
              </div>

              <p className="text-neutral-700 mb-6">
                {isLoadingRequest ? (
                  <>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-4/5" />
                  </>
                ) : (
                  request?.description
                )}
              </p>

              <div className="flex items-center justify-between py-3 border-t border-neutral-200">
                <Button
                  variant="ghost"
                  className={`flex items-center ${
                    request?.isPraying
                      ? "text-primary"
                      : "text-neutral-600 hover:text-primary"
                  }`}
                  onClick={() => togglePrayingMutation.mutate()}
                  disabled={togglePrayingMutation.isPending}
                >
                  <Heart
                    className={`h-5 w-5 mr-1 ${
                      request?.isPraying ? "fill-primary" : ""
                    }`}
                  />
                  <span className="text-sm">
                    {togglePrayingMutation.isPending
                      ? "..."
                      : `Praying for this (${request?.prayingCount || 0})`}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center text-neutral-600 hover:text-primary"
                >
                  <Share2 className="h-5 w-5 mr-1" />
                  <span className="text-sm">Share</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h3 className="text-lg font-medium font-heading text-neutral-800 mb-4">
              Comments ({comments?.length || 0})
            </h3>

            {/* New Comment Form */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <Textarea
                id="newComment"
                placeholder="Share your thoughts, encouragement, or let them know you're praying..."
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPrivate"
                    checked={isPrivate}
                    onCheckedChange={(checked) => setIsPrivate(!!checked)}
                  />
                  <label
                    htmlFor="isPrivate"
                    className="text-sm text-neutral-600 cursor-pointer"
                  >
                    Private (only visible to request owner)
                  </label>
                </div>
                <Button
                  onClick={() => addCommentMutation.mutate()}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm"
                >
                  {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {isLoadingComments ? (
                <>
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </>
              ) : comments?.length > 0 ? (
                comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    requestId={requestId}
                  />
                ))
              ) : (
                <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-neutral-600">
                    No comments yet. Be the first to encourage!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <MobileNav active="prayers" />

      <UpdateStatusModal
        open={statusModalOpen}
        setOpen={setStatusModalOpen}
        requestId={requestId}
        currentStatus={request?.status}
      />

      {/* Delete Prayer Request Confirmation */}
      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prayer Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prayer request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRequestMutation.mutate()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteRequestMutation.isPending ? "Deleting..." : "Delete Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
