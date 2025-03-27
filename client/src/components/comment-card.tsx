import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

type CommentCardProps = {
  comment: any;
  requestId: number;
};

export default function CommentCard({ comment, requestId }: CommentCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);
  const [isPrivate, setIsPrivate] = useState(comment.isPrivate);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/comments/${comment.id}`, {
        text: editedText,
        isPrivate,
      });
    },
    onSuccess: () => {
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
      setIsEditing(false);
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

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/comments/${comment.id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between">
        <div className="flex items-center">
          <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
            {getInitials(comment.author.name)}
          </span>
          <div className="ml-2">
            <h4 className="font-medium text-neutral-800 text-sm">
              {comment.author.name}
            </h4>
            <p className="text-xs text-neutral-500">
              {formatDate(comment.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          {comment.isPrivate && (
            <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
              Private
            </span>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-3">
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editIsPrivate"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(!!checked)}
              />
              <label
                htmlFor="editIsPrivate"
                className="text-xs text-neutral-600 cursor-pointer"
              >
                Private
              </label>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedText(comment.text);
                  setIsPrivate(comment.isPrivate);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => updateCommentMutation.mutate()}
                disabled={!editedText.trim() || updateCommentMutation.isPending}
              >
                {updateCommentMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-neutral-700 text-sm mt-3">{comment.text}</p>
          {comment.isOwn && (
            <div className="mt-2 text-right">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-neutral-500 hover:text-neutral-700"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-700 ml-2"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Comment Confirmation */}
      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCommentMutation.mutate()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteCommentMutation.isPending ? "Deleting..." : "Delete Comment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
