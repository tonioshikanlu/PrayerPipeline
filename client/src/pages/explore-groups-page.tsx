import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import CategoryGroups from "@/components/category-groups";
import CreateGroupModal from "@/components/create-group-modal";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

export default function ExploreGroupsPage() {
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  return (
    <div>
      <Header />

      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold font-heading text-neutral-800 mb-2">
                Explore Prayer Groups
              </h1>
              <p className="text-neutral-600">
                Browse and join prayer groups organized by category
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

          <CategoryGroups />
        </div>
      </main>

      <MobileNav active="groups" />
      <CreateGroupModal open={createGroupOpen} setOpen={setCreateGroupOpen} />
    </div>
  );
}