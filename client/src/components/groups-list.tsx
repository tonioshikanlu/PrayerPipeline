import React from "react";
import { Group } from "@shared/schema";
import { useFavoriteGroups } from "@/hooks/use-favorite-groups";
import GroupCard from "@/components/group-card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface GroupsListProps {
  groups: Group[];
  onGroupClick: (groupId: number) => void;
  maxShown?: number;
}

export default function GroupsList({ 
  groups, 
  onGroupClick, 
  maxShown = 5 
}: GroupsListProps) {
  const { favoriteGroups } = useFavoriteGroups();
  const [, navigate] = useLocation();
  
  // Find favorite groups that are also in the user's groups
  const favoriteGroupIds = new Set(favoriteGroups.map(g => g.id));
  
  // Split groups into favorites and non-favorites
  const favorites = groups.filter(group => favoriteGroupIds.has(group.id));
  const nonFavorites = groups.filter(group => !favoriteGroupIds.has(group.id));
  
  // Combine them with favorites first, limited to maxShown
  const displayGroups = [...favorites, ...nonFavorites].slice(0, maxShown);
  
  // Check if we need to show "View All" button
  const hasMoreGroups = groups.length > maxShown;
  
  if (groups.length === 0) {
    return (
      <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-neutral-600 mb-4">No groups to display.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {displayGroups.map((group) => (
        <GroupCard 
          key={group.id} 
          group={group} 
          onClick={() => onGroupClick(group.id)}
          showFavoriteButton={true}
        />
      ))}
      
      {hasMoreGroups && (
        <Button
          variant="outline"
          className="text-center w-full border border-neutral-200 rounded-lg py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
          onClick={() => navigate("/explore")}
        >
          View All Groups
        </Button>
      )}
    </div>
  );
}