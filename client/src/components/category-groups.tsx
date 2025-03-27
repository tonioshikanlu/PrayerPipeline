import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import GroupCard from "@/components/group-card";

interface CategoryGroupsProps {
  currentOrganizationId?: number;
}

export default function CategoryGroups({ currentOrganizationId }: CategoryGroupsProps) {
  const [_, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Fetch all groups
  const {
    data: allGroups,
    isLoading: isLoadingAllGroups,
  } = useQuery({
    queryKey: ["/api/groups", currentOrganizationId],
    queryFn: () => {
      if (!currentOrganizationId) return Promise.resolve([]);
      return fetch(`/api/groups?organizationId=${currentOrganizationId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch groups');
          return res.json();
        });
    },
    enabled: !!currentOrganizationId,
  });

  // Fetch groups by category when a category is selected
  const {
    data: categoryGroups,
    isLoading: isLoadingCategoryGroups,
  } = useQuery({
    queryKey: ["/api/groups/category", activeCategory, currentOrganizationId],
    queryFn: () => {
      if (!currentOrganizationId) return Promise.resolve([]);
      return fetch(`/api/groups/category/${activeCategory}?organizationId=${currentOrganizationId}`)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch ${activeCategory} groups`);
          return res.json();
        });
    },
    enabled: activeCategory !== "all" && !!currentOrganizationId,
  });

  const displayGroups = activeCategory === "all" ? allGroups : categoryGroups;
  const isLoading = activeCategory === "all" ? isLoadingAllGroups : isLoadingCategoryGroups;

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Explore Prayer Groups</h2>
      
      <Tabs defaultValue="all" onValueChange={handleCategoryChange} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="career">Career</TabsTrigger>
          <TabsTrigger value="relationship">Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <GroupsList groups={allGroups} isLoading={isLoadingAllGroups} onGroupClick={(id) => navigate(`/groups/${id}`)} />
        </TabsContent>
        
        <TabsContent value="health" className="mt-0">
          <GroupsList groups={categoryGroups} isLoading={isLoadingCategoryGroups} onGroupClick={(id) => navigate(`/groups/${id}`)} />
        </TabsContent>
        
        <TabsContent value="family" className="mt-0">
          <GroupsList groups={categoryGroups} isLoading={isLoadingCategoryGroups} onGroupClick={(id) => navigate(`/groups/${id}`)} />
        </TabsContent>
        
        <TabsContent value="career" className="mt-0">
          <GroupsList groups={categoryGroups} isLoading={isLoadingCategoryGroups} onGroupClick={(id) => navigate(`/groups/${id}`)} />
        </TabsContent>
        
        <TabsContent value="relationship" className="mt-0">
          <GroupsList groups={categoryGroups} isLoading={isLoadingCategoryGroups} onGroupClick={(id) => navigate(`/groups/${id}`)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GroupsList({ 
  groups, 
  isLoading, 
  onGroupClick 
}: { 
  groups?: any[];
  isLoading: boolean;
  onGroupClick: (id: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-10 bg-neutral-50 rounded-lg">
        <p className="text-neutral-600">No groups found for this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <GroupCard 
          key={group.id} 
          group={group} 
          onClick={() => onGroupClick(group.id)}
        />
      ))}
    </div>
  );
}