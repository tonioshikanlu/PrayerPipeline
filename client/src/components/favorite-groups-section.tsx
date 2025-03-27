import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Group } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useFavoriteGroups, FavoriteButton } from "@/hooks/use-favorite-groups";

export default function FavoriteGroupsSection() {
  const { favoriteGroups, isLoading, removeFromFavorites } = useFavoriteGroups();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Favorite Groups</CardTitle>
          <CardDescription>Quick access to your favorite prayer groups</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </CardContent>
      </Card>
    );
  }

  if (favoriteGroups.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Favorite Groups</CardTitle>
          <CardDescription>Star groups to add them to your favorites</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-6">
          <p>You haven't added any groups to your favorites yet.</p>
          <p className="text-sm mt-2">
            Add groups to favorites to quickly access them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Your Favorite Groups</CardTitle>
        <CardDescription>Quick access to your favorite prayer groups</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {favoriteGroups.map((group) => (
            <GroupCard 
              key={group.id} 
              group={group} 
              onRemoveFavorite={() => removeFromFavorites(group.id)} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GroupCard({ 
  group, 
  onRemoveFavorite 
}: { 
  group: Group, 
  onRemoveFavorite: () => void 
}) {
  return (
    <Link href={`/groups/${group.id}`}>
      <div className="relative p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group flex justify-between items-center">
        <div>
          <h3 className="font-medium text-primary">{group.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {group.description || "No description available"}
          </p>
        </div>
        <div className="absolute top-2 right-2">
          <FavoriteButton 
            groupId={group.id} 
            isFavorite={true} 
            isLoading={false} 
            onToggle={onRemoveFavorite} 
            size="sm"
          />
        </div>
      </div>
    </Link>
  );
}