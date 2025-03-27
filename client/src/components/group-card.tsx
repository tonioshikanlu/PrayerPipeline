import { Button } from "@/components/ui/button";
import { useFavoriteGroups, FavoriteButton } from "@/hooks/use-favorite-groups";
import { Group } from "@shared/schema";

type GroupCardProps = {
  group: Group;
  onClick?: () => void;
  showFavoriteButton?: boolean;
};

export default function GroupCard({ 
  group, 
  onClick,
  showFavoriteButton = true
}: GroupCardProps) {
  // Use a default member count since the actual member count might not be available in the Group object
  // In a real implementation, you would get this from the group.members.length
  const memberCount = 0;
  const { useIsFavorite, toggleFavorite, isPendingAdd, isPendingRemove } = useFavoriteGroups();

  return (
    <div 
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-neutral-800">{group.name}</h4>
          <p className="text-sm text-neutral-600 mt-1 line-clamp-1">{group.description}</p>
        </div>
        {showFavoriteButton && (
          <div onClick={(e) => e.stopPropagation()}>
            <GroupFavoriteButton groupId={group.id} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex -space-x-1 overflow-hidden">
            {/* This would be actual member avatars in a real implementation */}
            <span className="h-6 w-6 rounded-full bg-primary-100 text-primary-800 text-xs flex items-center justify-center">A</span>
            <span className="h-6 w-6 rounded-full bg-green-100 text-green-800 text-xs flex items-center justify-center">B</span>
            <span className="h-6 w-6 rounded-full bg-neutral-100 text-neutral-800 text-xs flex items-center justify-center">+</span>
          </div>
          <span className="ml-2 text-xs text-neutral-500">{memberCount} members</span>
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

// GroupFavoriteButton component to handle favorite status for a group
function GroupFavoriteButton({ groupId }: { groupId: number }) {
  const { isFavorite, toggleFavorite, isPendingAdd, isPendingRemove } = useFavoriteGroups();
  
  // Use the isFavorite function to check if this group is favorited
  const isGroupFavorite = isFavorite(groupId);
  const isPending = isPendingAdd || isPendingRemove;

  return (
    <FavoriteButton 
      groupId={groupId}
      isFavorite={isGroupFavorite}
      isLoading={isPending}
      onToggle={() => toggleFavorite(groupId, isGroupFavorite)}
      size="sm"
    />
  );
}
