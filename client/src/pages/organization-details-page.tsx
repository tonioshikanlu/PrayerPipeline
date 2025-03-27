import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizations } from "@/hooks/use-organizations";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Organization, OrganizationMember, Group } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  Users,
  Settings,
  Pencil,
  UserPlus,
  Shield,
  User,
  XCircle,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

const inviteFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin"]),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export default function OrganizationDetailsPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const orgIdParam = window.location.pathname.split("/").pop();
  const organizationId = orgIdParam ? parseInt(orgIdParam) : 0;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  
  const { 
    organizations,
    organizationMembers,
    isLoadingMembers,
    updateOrganizationMutation,
    inviteMemberMutation,
    removeMemberMutation
  } = useOrganizations();

  // Get the current organization
  const organization = organizations.find(org => org.id === organizationId);

  // Fetch groups for the organization
  const {
    data: groups = [],
    isLoading: isLoadingGroups,
  } = useQuery<Group[], Error>({
    queryKey: ["/api/organizations/groups", organizationId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!organizationId,
  });

  // Form for organization editing
  const editForm = useForm({
    defaultValues: {
      name: organization?.name || "",
      description: organization?.description || "",
    },
  });

  // Form for inviting members
  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  // Update form when organization data changes
  useEffect(() => {
    if (organization) {
      editForm.reset({
        name: organization.name,
        description: organization.description || "",
      });
    }
  }, [organization, editForm]);

  // Handle organization update
  const handleUpdateOrganization = async (data: { name: string; description: string }) => {
    if (!organization) return;
    
    await updateOrganizationMutation.mutateAsync({
      id: organization.id,
      data,
    });
    
    setEditDialogOpen(false);
  };

  // Handle member invitation
  const handleInviteMember = async (data: InviteFormValues) => {
    if (!organizationId) return;
    
    await inviteMemberMutation.mutateAsync({
      organizationId,
      email: data.email,
      role: data.role,
    });
    
    inviteForm.reset();
    setInviteDialogOpen(false);
  };

  // Handle member removal
  const handleRemoveMember = async (userId: number) => {
    if (!organizationId) return;
    
    await removeMemberMutation.mutateAsync({
      organizationId,
      userId,
    });
  };

  // Check if the current user is an admin
  const currentMember = organizationMembers.find(m => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin";

  if (!organization) {
    return (
      <div className="container max-w-7xl py-10 pt-16 md:pt-24">
        <div className="flex items-center mb-8">
          <Button variant="ghost" className="mr-2" onClick={() => navigate("/organizations")}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Organization not found</h1>
        </div>
        <p>The organization you are looking for does not exist or you don't have access.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-10 pt-16 md:pt-24">
      <div className="flex items-center mb-8">
        <Button variant="ghost" className="mr-2" onClick={() => navigate("/organizations")}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            {organization.name}
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2" 
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {organization.description || "No description provided"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Building className="h-4 w-4 mr-2" />
            Groups
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Organization Members</h2>
            {isAdmin && (
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
          {isLoadingMembers ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : organizationMembers.length === 0 ? (
            <div className="text-center p-12 border rounded-lg bg-muted/50">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No members yet</h3>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                Invite members to join your organization and collaborate on prayer groups.
              </p>
              {isAdmin && (
                <Button className="mt-4" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizationMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium mr-2">
                              {member.userId === user?.id ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            {member.userId === user?.id ? "You" : `User ${member.userId}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {member.role === "admin" ? (
                              <>
                                <Shield className="h-4 w-4 mr-1 text-primary" />
                                Admin
                              </>
                            ) : (
                              <>
                                <User className="h-4 w-4 mr-1" />
                                Member
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {member.userId !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.userId)}
                                disabled={removeMemberMutation.isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Organization Groups</h2>
            <Button onClick={() => navigate("/groups/new")}>
              Create Group
            </Button>
          </div>
          {isLoadingGroups ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center p-12 border rounded-lg bg-muted/50">
              <Building className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No groups yet</h3>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                Create prayer groups to organize prayer requests and members within this organization.
              </p>
              <Button className="mt-4" onClick={() => navigate("/groups/new")}>
                Create Group
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card key={group.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {group.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-1 h-4 w-4" />
                      <span>Category: {group.category}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 px-6 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      View Group
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-xl font-semibold">Organization Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Update your organization information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Organization Name</Label>
                  <div className="flex justify-between items-center">
                    <span>{organization.name}</span>
                    <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {organization.description || "No description provided"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Organization Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update your organization's information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleUpdateOrganization)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...editForm.register("name", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                className="resize-none h-20"
                {...editForm.register("description")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateOrganizationMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateOrganizationMutation.isPending}
              >
                {updateOrganizationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite a Member</DialogTitle>
            <DialogDescription>
              Invite someone to join your organization
            </DialogDescription>
          </DialogHeader>
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(handleInviteMember)} className="space-y-4">
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={inviteForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                  disabled={inviteMemberMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteMemberMutation.isPending}
                >
                  {inviteMemberMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Invite...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}