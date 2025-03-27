import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizations } from "@/hooks/use-organizations";
import Header from "@/components/header";
import PrayerCard from "@/components/prayer-card";
import GroupCard from "@/components/group-card";
import MobileNav from "@/components/mobile-nav";
import CreateGroupModal from "@/components/create-group-modal";
import CreateRequestModal from "@/components/create-request-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Group, PrayerRequest, Notification } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganizations();
  const [_, navigate] = useLocation();
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);

  // Fetch recent prayer requests
  const {
    data: recentRequests = [],
    isLoading: isLoadingRequests,
  } = useQuery<PrayerRequest[]>({
    queryKey: ["/api/requests/user/recent"],
  });

  // Fetch organization groups
  const {
    data: userGroups = [],
    isLoading: isLoadingGroups,
  } = useQuery<Group[]>({
    queryKey: ["/api/groups/user", currentOrganization?.id],
    enabled: !!currentOrganization,
  });

  // Fetch user stats (would be better to have a dedicated endpoint for this)
  const {
    data: notifications = [],
    isLoading: isLoadingNotifications
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  return (
    <div>
      <Header />

      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-bold font-heading text-neutral-800">
              Welcome back, <span>{user?.name?.split(" ")[0]}</span>
            </h2>
            <p className="text-neutral-600 mt-1">
              "For where two or three gather in my name, there am I with them." - Matthew 18:20
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* First column - Your Groups */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium font-heading text-neutral-800">Your Groups</h3>
                <Button 
                  size="sm"
                  variant="ghost"
                  className="text-primary hover:text-primary/90 font-medium"
                  onClick={() => setCreateGroupOpen(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Group
                </Button>
              </div>

              <div className="space-y-4">
                {isLoadingGroups ? (
                  <>
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                  </>
                ) : userGroups?.length > 0 ? (
                  <>
                    {userGroups.slice(0, 2).map((group) => (
                      <GroupCard 
                        key={group.id} 
                        group={group} 
                        onClick={() => navigate(`/groups/${group.id}`)}
                      />
                    ))}
                    {userGroups.length > 2 && (
                      <Button
                        variant="outline"
                        className="text-center w-full border border-neutral-200 rounded-lg py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                      >
                        View All Groups
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-neutral-600 mb-4">You haven't joined any groups yet.</p>
                    <Button onClick={() => setCreateGroupOpen(true)}>
                      Create Your First Group
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Second column - Recent Prayer Requests */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium font-heading text-neutral-800">Recent Prayer Requests</h3>
                <Button 
                  size="sm"
                  variant="ghost"
                  className="text-primary hover:text-primary/90 font-medium"
                  onClick={() => setCreateRequestOpen(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Request
                </Button>
              </div>

              <div className="space-y-4">
                {isLoadingRequests ? (
                  <>
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                  </>
                ) : recentRequests?.length > 0 ? (
                  <>
                    {recentRequests.slice(0, 2).map((request) => (
                      <PrayerCard 
                        key={request.id} 
                        request={request} 
                        onClick={() => navigate(`/requests/${request.id}`)}
                      />
                    ))}
                    {recentRequests.length > 2 && (
                      <Button
                        variant="outline"
                        className="text-center w-full border border-neutral-200 rounded-lg py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                      >
                        View All Requests
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-neutral-600 mb-4">No prayer requests yet.</p>
                    <Button onClick={() => setCreateRequestOpen(true)}>
                      Create Your First Prayer Request
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Third column - My Prayer Journey */}
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium font-heading text-neutral-800">My Prayer Journey</h3>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between mb-4">
                  <h4 className="font-medium text-neutral-700">Prayer Statistics</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="text-center p-2 bg-neutral-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {isLoadingRequests ? (
                        <Skeleton className="h-8 w-8 mx-auto rounded" />
                      ) : (
                        recentRequests?.length || 0
                      )}
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">Requests Made</div>
                  </div>
                  <div className="text-center p-2 bg-neutral-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">
                      {isLoadingRequests ? (
                        <Skeleton className="h-8 w-8 mx-auto rounded" />
                      ) : (
                        recentRequests?.filter(r => r.status === "answered").length || 0
                      )}
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">Prayers Answered</div>
                  </div>
                  <div className="text-center p-2 bg-neutral-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-500">
                      {isLoadingNotifications ? (
                        <Skeleton className="h-8 w-8 mx-auto rounded" />
                      ) : (
                        notifications?.length || 0
                      )}
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">Notifications</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-neutral-700 mb-2">Daily Scripture</h4>
                  <div className="bg-primary-50 rounded-lg p-4">
                    <p className="text-neutral-800 italic text-sm">
                      "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."
                    </p>
                    <p className="text-neutral-600 text-xs mt-2 text-right">
                      - Philippians 4:6
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-neutral-700 mb-2">Prayer Reminders</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg border border-neutral-200">
                      <div className="flex items-center">
                        <span className="h-6 w-6 bg-primary-100 rounded-full text-xs flex items-center justify-center text-primary-800">M</span>
                        <span className="ml-2 text-sm text-neutral-700">Morning Prayer</span>
                      </div>
                      <span className="text-xs text-neutral-500">7:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg border border-neutral-200">
                      <div className="flex items-center">
                        <span className="h-6 w-6 bg-green-100 rounded-full text-xs flex items-center justify-center text-green-800">E</span>
                        <span className="ml-2 text-sm text-neutral-700">Evening Reflection</span>
                      </div>
                      <span className="text-xs text-neutral-500">9:00 PM</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    className="mt-3 text-center w-full border border-neutral-200 rounded-lg py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    Add Reminder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNav active="home" />
      <CreateGroupModal open={createGroupOpen} setOpen={setCreateGroupOpen} />
      <CreateRequestModal open={createRequestOpen} setOpen={setCreateRequestOpen} />
    </div>
  );
}
