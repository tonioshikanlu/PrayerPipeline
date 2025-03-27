import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, User, Settings as SettingsIcon, Camera, ChevronRight } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch user's recent prayer requests
  const { data: recentRequests = [], isLoading: isLoadingRequests } = useQuery<any[]>({
    queryKey: ["/api/requests/user/recent"],
  });

  // Profile update form schema
  const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      avatar: user?.avatar || "",
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

  // Handle avatar file change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatarPreview(result);
      profileForm.setValue("avatar", result);
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmitProfile = (data: ProfileFormValues) => {
    if (avatarPreview) {
      data.avatar = avatarPreview;
    }
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
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <CardTitle className="text-xl mt-2">{user?.name || user?.username}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex flex-col w-full bg-transparent items-stretch gap-1">
                      <Button
                        variant={activeTab === "overview" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("overview")}
                        className="justify-start px-3 py-2 h-auto font-normal"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile Overview
                      </Button>
                      <Button
                        variant={activeTab === "notifications" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("notifications")}
                        className="justify-start px-3 py-2 h-auto font-normal"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Notification Settings
                      </Button>
                      <Button
                        variant={activeTab === "settings" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("settings")}
                        className="justify-start px-3 py-2 h-auto font-normal"
                      >
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Account Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Content Area */}
            <div className="w-full md:w-2/3 lg:w-3/4">
              {activeTab === "overview" && (
                <>
                  {/* Profile Information Card */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                          <div className="flex flex-col items-center mb-6">
                            <FormLabel className="mb-2">Profile Picture</FormLabel>
                            <div 
                              className="relative cursor-pointer group"
                              onClick={handleAvatarClick}
                            >
                              <Avatar className="h-32 w-32 border-2 border-border">
                                {avatarPreview ? (
                                  <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                                ) : user?.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                    {getInitials()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-8 w-8 text-white" />
                              </div>
                            </div>
                            <FormDescription className="mt-2 text-center">
                              Click to upload or change your profile picture
                            </FormDescription>
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </div>

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
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone (optional)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="tel"
                                    inputMode="tel"
                                    placeholder="(123) 456-7890" 
                                    {...field} 
                                  />
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

                  {/* My Prayer Journey Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>My Prayer Journey</CardTitle>
                      <CardDescription>
                        Track your prayer requests and their progress
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isLoadingRequests ? (
                          <>
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-40 w-full" />
                          </>
                        ) : recentRequests.length > 0 ? (
                          <>
                            {recentRequests.slice(0, 3).map((request) => (
                              <PrayerCard
                                key={request.id}
                                request={request}
                                onClick={() => navigate(`/requests/${request.id}`)}
                              />
                            ))}
                          </>
                        ) : (
                          <div className="text-center py-12 bg-muted rounded-lg">
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
                    {recentRequests.length > 3 && (
                      <CardFooter className="flex justify-center pt-0">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => navigate("/prayer-requests")}
                        >
                          View All Prayer Requests
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </>
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
      
      <MobileNav active="profile" />
    </div>
  );
}