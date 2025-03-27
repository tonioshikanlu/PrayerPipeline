import { Button } from "@/components/ui/button";

type GroupCardProps = {
  group: any;
  onClick?: () => void;
};

export default function GroupCard({ group, onClick }: GroupCardProps) {
  const memberCount = 6; // This would come from the group data in a real implementation

  return (
    <div 
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <h4 className="font-medium text-neutral-800">{group.name}</h4>
      <p className="text-sm text-neutral-600 mt-1 line-clamp-1">{group.description}</p>
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
