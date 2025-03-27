import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import PrayerCard from "@/components/prayer-card";
import CreateRequestModal from "@/components/create-request-modal";
import { ArrowLeft, PlusIcon, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertGroupSchema } from "@shared/schema";

export default function GroupDetails() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId ? parseInt(params.groupId) : 0;
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [tab, setTab] = useState("prayer-requests");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  // Get group details
  const {
    data: group,
    isLoading: isLoadingGroup,
  } = useQuery({
    queryKey: [`/api/groups/${groupId}`],
    enabled: !!groupId,
  });

  // Get prayer requests for this group
  const {
    data: requests,
    isLoading: isLoadingRequests,
  } = useQuery({
    queryKey: [`/api/groups/${groupId}/requests`],
    enabled: !!groupId,
  });

  // Get group members
  const {
    data: members,
    isLoading: isLoadingMembers,
  } = useQuery({
    queryKey: [`/api/groups/${groupId}/members`],
    enabled: !!groupId,
  });

  // Check if current user is leader
  const isLeader = members?.some(
    (member) => member.userId === user?.id && member.role === "leader"
  );

  // Check if current user is admin
  const isAdmin = user?.role === "admin";

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/groups/${groupId}/leave`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have left the group",
      });
      navigate("/");
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/groups/${groupId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Group has been deleted",
      });
      navigate("/");
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Group update form
  const groupForm = useForm<z.infer<typeof insertGroupSchema>>({
    resolver: zodResolver(insertGroupSchema.omit({ createdBy: true }).partial()),
    defaultValues: {
      name: group?.name || "",
      description: group?.description || "",
      privacy: group?.privacy || "request",
      leaderRotation: group?.leaderRotation || 0,
    },
    values: {
      name: group?.name || "",
      description: group?.description || "",
      privacy: group?.privacy || "request",
      leaderRotation: group?.leaderRotation || 0,
    },
  });

  // Define our update schema type
  const updateGroupSchema = insertGroupSchema.partial();
  type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
  
  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (data: UpdateGroupInput): Promise<void> => {
      await apiRequest("PUT", `/api/groups/${groupId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Group settings updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onUpdateGroup = (data: UpdateGroupInput) => {
    updateGroupMutation.mutate(data);
  };

  return (
    <div>
      <Header />

      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 text-neutral-600 hover:text-neutral-800"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold font-heading text-neutral-800">
                {isLoadingGroup ? (
                  <Skeleton className="h-8 w-40" />
                ) : (
                  group?.name
                )}
              </h2>
            </div>
            <p className="text-neutral-600">
              {isLoadingGroup ? (
                <Skeleton className="h-4 w-96" />
              ) : (
                group?.description
              )}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                <UserCircle className="h-4 w-4 mr-1" />
                <span>
                  {isLoadingMembers ? (
                    <Skeleton className="h-4 w-16 inline-block" />
                  ) : (
                    `${members?.length || 0} members`
                  )}
                </span>
              </div>
              <div className="flex items-center px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                <svg
                  className="h-4 w-4 mr-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {isLoadingGroup ? (
                    <Skeleton className="h-4 w-24 inline-block" />
                  ) : (
                    `Created ${new Date(group?.createdAt).toLocaleDateString()}`
                  )}
                </span>
              </div>
              {!isLoadingMembers && (
                <div className="flex items-center px-3 py-1 bg-primary-100 rounded-full text-sm text-primary-700">
                  <svg
                    className="h-4 w-4 mr-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <span>
                    Leader:{" "}
                    {members
                      ?.find((m) => m.role === "leader")
                      ?.user.name.split(" ")[0] || "Unassigned"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Tabs
            value={tab}
            onValueChange={setTab}
            className="w-full"
          >
            <TabsList className="mb-6 border-b border-neutral-200 w-full justify-start rounded-none bg-transparent p-0">
              <TabsTrigger
                value="prayer-requests"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary"
              >
                Prayer Requests
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary"
              >
                Members
              </TabsTrigger>
              {(isLeader || isAdmin) && (
                <TabsTrigger
                  value="settings"
                  className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary"
                >
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="prayer-requests" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium font-heading text-neutral-800">
                  Prayer Requests
                </h3>
                <Button
                  onClick={() => setCreateRequestOpen(true)}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition flex items-center text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Request
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoadingRequests ? (
                  <>
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </>
                ) : requests?.length > 0 ? (
                  requests.map((request) => (
                    <PrayerCard
                      key={request.id}
                      request={request}
                      onClick={() => navigate(`/requests/${request.id}`)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-neutral-600 mb-4">
                      No prayer requests yet in this group.
                    </p>
                    <Button onClick={() => setCreateRequestOpen(true)}>
                      Create the First Prayer Request
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium font-heading text-neutral-800">
                  Members ({members?.length || 0})
                </h3>
                {(isLeader || isAdmin) && (
                  <Button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition flex items-center text-sm">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Invite Member
                  </Button>
                )}
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoadingMembers ? (
                  <>
                    <div className="p-4 border-b border-neutral-100">
                      <Skeleton className="h-12 w-full" />
                    </div>
                    <div className="p-4 border-b border-neutral-100">
                      <Skeleton className="h-12 w-full" />
                    </div>
                    <div className="p-4 border-b border-neutral-100">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </>
                ) : (
                  members?.map((member, index) => (
                    <div
                      key={member.id}
                      className="p-4 border-b border-neutral-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                            {member.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </span>
                          <div className="ml-3">
                            <h4 className="font-medium text-neutral-800">
                              {member.user.name}
                            </h4>
                            <p className="text-xs text-neutral-500">
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`${
                              member.role === "leader"
                                ? "bg-primary-100 text-primary-800"
                                : "bg-neutral-100 text-neutral-800"
                            } text-xs px-2 py-1 rounded`}
                          >
                            {member.role === "leader" ? "Leader" : "Member"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {(isLeader || isAdmin) && (
              <TabsContent value="settings" className="mt-0">
                <div className="mb-4">
                  <h3 className="text-lg font-medium font-heading text-neutral-800">
                    Group Settings
                  </h3>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <Form {...groupForm}>
                    <form
                      onSubmit={groupForm.handleSubmit(onUpdateGroup)}
                      className="space-y-4"
                    >
                      <FormField
                        control={groupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Group Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={groupForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={groupForm.control}
                        name="privacy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Privacy Settings</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select privacy setting" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="open">
                                  Open (Anyone can join)
                                </SelectItem>
                                <SelectItem value="request">
                                  Request to Join
                                </SelectItem>
                                <SelectItem value="invite">
                                  Invite Only
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={groupForm.control}
                        name="leaderRotation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Leadership Rotation</FormLabel>
                            <Select
                              onValueChange={(val) =>
                                field.onChange(parseInt(val))
                              }
                              defaultValue={field.value.toString()}
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select leadership rotation" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">
                                  No Rotation (Fixed Leader)
                                </SelectItem>
                                <SelectItem value="30">
                                  Rotate Every 30 Days
                                </SelectItem>
                                <SelectItem value="60">
                                  Rotate Every 60 Days
                                </SelectItem>
                                <SelectItem value="90">
                                  Rotate Every 90 Days
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2 mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            groupForm.reset({
                              name: group?.name,
                              description: group?.description,
                              privacy: group?.privacy,
                              leaderRotation: group?.leaderRotation,
                            })
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateGroupMutation.isPending}
                        >
                          {updateGroupMutation.isPending ? (
                            <div className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                ></path>
                              </svg>
                              Saving...
                            </div>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>

                <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-red-800 font-medium mb-2">Danger Zone</h4>
                  <p className="text-sm text-red-700 mb-4">
                    These actions cannot be undone. Please be certain.
                  </p>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-100"
                      onClick={() => setLeaveConfirmOpen(true)}
                    >
                      Leave Group
                    </Button>
                    {isAdmin && (
                      <Button
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => setDeleteConfirmOpen(true)}
                      >
                        Delete Group
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      <MobileNav active="groups" />
      <CreateRequestModal 
        open={createRequestOpen} 
        setOpen={setCreateRequestOpen} 
        defaultGroupId={groupId}
      />

      {/* Leave Group Confirmation */}
      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You'll need to be invited back to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveGroupMutation.mutate()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {leaveGroupMutation.isPending ? "Leaving..." : "Leave Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? This action cannot be undone and will remove all prayer requests and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGroupMutation.mutate()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteGroupMutation.isPending ? "Deleting..." : "Delete Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
