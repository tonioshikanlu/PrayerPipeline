import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle, Bell, BookOpen, User, Settings as SettingsIcon } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PrayerCard from "@/components/prayer-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user's recent prayer requests
  const { data: recentRequests = [], isLoading: isLoadingRequests } = useQuery<any[]>({
    queryKey: ["/api/requests/user/recent"],
  });

  // Fetch user's groups
  const { data: userGroups = [], isLoading: isLoadingGroups } = useQuery<any[]>({
    queryKey: ["/api/groups/user"],
  });

  // Profile update form schema
  const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    bio: z.string().optional(),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      bio: "",  // User schema doesn't have bio field yet
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues): Promise<void> => {
      await apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Get initials for the avatar
  const getInitials = () => {
    if (!user?.name) return user?.username.substring(0, 2).toUpperCase() || "?";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div>
      <Header />
      
      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Sidebar */}
            <div className="w-full md:w-1/3 lg:w-1/4">
              <Card>
                <CardHeader className="pb-2 flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-2">
                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl mt-2">{user?.name || user?.username}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <TabsList className="flex flex-col w-full bg-transparent items-stretch gap-1">
                      <TabsTrigger
                        value="overview"
                        onClick={() => setActiveTab("overview")}
                        className={`justify-start px-3 py-2 ${activeTab === "overview" ? "bg-muted" : ""}`}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="prayers"
                        onClick={() => setActiveTab("prayers")}
                        className={`justify-start px-3 py-2 ${activeTab === "prayers" ? "bg-muted" : ""}`}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        My Prayer Requests
                      </TabsTrigger>
                      <TabsTrigger
                        value="groups"
                        onClick={() => setActiveTab("groups")}
                        className={`justify-start px-3 py-2 ${activeTab === "groups" ? "bg-muted" : ""}`}
                      >
                        <UserCircle className="h-4 w-4 mr-2" />
                        My Groups
                      </TabsTrigger>
                      <TabsTrigger
                        value="notifications"
                        onClick={() => setActiveTab("notifications")}
                        className={`justify-start px-3 py-2 ${activeTab === "notifications" ? "bg-muted" : ""}`}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Notification Settings
                      </TabsTrigger>
                      <TabsTrigger
                        value="settings"
                        onClick={() => setActiveTab("settings")}
                        className={`justify-start px-3 py-2 ${activeTab === "settings" ? "bg-muted" : ""}`}
                      >
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Account Settings
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Content Area */}
            <div className="w-full md:w-2/3 lg:w-3/4">
              {activeTab === "overview" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us a little about yourself" 
                                  rows={4}
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                This will be visible to other members of your prayer groups
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "prayers" && (
                <Card>
                  <CardHeader>
                    <CardTitle>My Prayer Requests</CardTitle>
                    <CardDescription>
                      Manage your prayer requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isLoadingRequests ? (
                        <>
                          <Skeleton className="h-40 w-full" />
                          <Skeleton className="h-40 w-full" />
                        </>
                      ) : recentRequests.length > 0 ? (
                        recentRequests.map((request) => (
                          <PrayerCard
                            key={request.id}
                            request={request}
                            onClick={() => navigate(`/requests/${request.id}`)}
                          />
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12 bg-muted rounded-lg">
                          <p className="text-muted-foreground mb-4">
                            You haven't created any prayer requests yet.
                          </p>
                          <Button onClick={() => navigate("/")}>
                            Create a Prayer Request
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "groups" && (
                <Card>
                  <CardHeader>
                    <CardTitle>My Groups</CardTitle>
                    <CardDescription>
                      Prayer groups you're a part of
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isLoadingGroups ? (
                        <>
                          <Skeleton className="h-32 w-full" />
                          <Skeleton className="h-32 w-full" />
                        </>
                      ) : userGroups.length > 0 ? (
                        userGroups.map((group) => (
                          <Card key={group.id} className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              <CardDescription className="text-sm line-clamp-2">
                                {group.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="flex justify-between items-center mt-2">
                                <div className="text-sm text-muted-foreground">
                                  {new Date(group.createdAt).toLocaleDateString()}
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => navigate(`/groups/${group.id}`)}
                                >
                                  View Group
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12 bg-muted rounded-lg">
                          <p className="text-muted-foreground mb-4">
                            You aren't a member of any prayer groups yet.
                          </p>
                          <Button onClick={() => navigate("/")}>
                            Find or Create a Group
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Manage how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Email Notifications</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure when you receive email notifications
                        </p>
                        <div className="space-y-2">
                          {/* Placeholder for notification settings - to be implemented */}
                          <p className="text-sm text-muted-foreground">
                            Email notification settings will be available in a future update.
                          </p>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Push Notifications</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure your in-app notifications
                        </p>
                        <div className="space-y-2">
                          {/* Placeholder for notification settings - to be implemented */}
                          <p className="text-sm text-muted-foreground">
                            Push notification settings will be available in a future update.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "settings" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Change Password</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Update your password to keep your account secure
                        </p>
                        <div className="space-y-4">
                          {/* Placeholder for password change form - to be implemented */}
                          <p className="text-sm text-muted-foreground">
                            Password changing functionality will be available in a future update.
                          </p>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Account Privacy</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Control your account privacy settings
                        </p>
                        <div className="space-y-2">
                          {/* Placeholder for privacy settings - to be implemented */}
                          <p className="text-sm text-muted-foreground">
                            Privacy settings will be available in a future update.
                          </p>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium text-red-500 mb-2">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Permanently delete your account and all associated data
                        </p>
                        <Button variant="destructive">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}