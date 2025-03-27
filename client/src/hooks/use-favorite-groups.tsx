import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Group } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

export function useFavoriteGroups() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all favorite groups
  const {
    data: favoriteGroups = [],
    isLoading,
    error,
  } = useQuery<Group[]>({
    queryKey: ["/api/groups/favorites"],
    enabled: true,
  });

  // Check if a group is favorited
  const useIsFavorite = (groupId: number) => {
    return useQuery<{ isFavorite: boolean }>({
      queryKey: ["/api/groups", groupId, "favorite"],
      enabled: !!groupId,
    });
  };

  // Add a group to favorites
  const addToFavoritesMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/favorite`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/favorites"] });
      toast({
        title: "Group added to favorites",
        description: "You can now find this group in your favorites.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to favorites",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove a group from favorites
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest("DELETE", `/api/groups/${groupId}/favorite`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/favorites"] });
      toast({
        title: "Group removed from favorites",
        description: "The group has been removed from your favorites.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove from favorites",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle favorite status
  const toggleFavorite = (groupId: number, currentStatus: boolean) => {
    if (currentStatus) {
      return removeFromFavoritesMutation.mutate(groupId);
    } else {
      return addToFavoritesMutation.mutate(groupId);
    }
  };

  return {
    favoriteGroups,
    isLoading,
    error,
    useIsFavorite,
    addToFavorites: addToFavoritesMutation.mutate,
    removeFromFavorites: removeFromFavoritesMutation.mutate,
    toggleFavorite,
    isPendingAdd: addToFavoritesMutation.isPending,
    isPendingRemove: removeFromFavoritesMutation.isPending,
  };
}

// FavoriteButton component
export function FavoriteButton({ 
  groupId,
  isFavorite,
  isLoading,
  onToggle,
  size = "default" 
}: { 
  groupId: number; 
  isFavorite: boolean;
  isLoading: boolean;
  onToggle: () => void;
  size?: "default" | "sm" | "lg"
}) {
  const sizeClasses = {
    "default": "h-6 w-6",
    "sm": "h-4 w-4",
    "lg": "h-8 w-8",
  };
  
  return (
    <button
      className="text-yellow-500 hover:text-yellow-600 transition-colors duration-200 focus:outline-none"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      disabled={isLoading}
    >
      <Star 
        className={`${sizeClasses[size]} transition-all duration-300 ${isFavorite ? "fill-yellow-500" : "fill-none"} ${isLoading ? "opacity-50" : "opacity-100"}`} 
      />
    </button>
  );
}