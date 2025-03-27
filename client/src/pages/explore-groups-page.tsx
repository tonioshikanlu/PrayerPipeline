import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import CategoryGroups from "@/components/category-groups";
import CreateGroupModal from "@/components/create-group-modal";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useOrganizations } from "@/hooks/use-organizations";

export default function ExploreGroupsPage() {
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("explore");
  const { currentOrganization } = useOrganizations();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div>
      <Header />

      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold font-heading text-neutral-800 mb-2">
                {activeTab === "explore" ? "Explore Prayer Groups" : "My Prayer Groups"}
              </h1>
              <p className="text-neutral-600">
                {activeTab === "explore" 
                  ? "Browse and join prayer groups organized by category" 
                  : "Manage your prayer groups and view activity"}
              </p>
            </div>
            <Button 
              className="mt-4 md:mt-0"
              onClick={() => setCreateGroupOpen(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Group
            </Button>
          </div>

          <CategoryGroups 
            currentOrganizationId={currentOrganization?.id} 
            activeTab={activeTab}
            onChangeTab={handleTabChange}
          />
        </div>
      </main>

      <MobileNav active="explore" />
      <CreateGroupModal open={createGroupOpen} setOpen={setCreateGroupOpen} />
    </div>
  );
}