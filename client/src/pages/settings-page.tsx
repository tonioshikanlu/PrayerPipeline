import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { PrayerRemindersCard } from "@/components/prayer-reminders-card";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Lock,
  User,
  Shield,
  ToggleLeft,
  Moon,
  Sun,
  Palette,
  BellRing,
  BellOff,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading: notificationsLoading,
    subscribe,
    unsubscribe,
    requestPermission
  } = usePushNotifications();
  const {
    preferences: notificationPreferences,
    isLoading: preferencesLoading,
    updatePreferences,
    isPending: updatePending
  } = useNotificationPreferences();

  // Password change form schema
  const passwordSchema = z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

  type PasswordFormValues = z.infer<typeof passwordSchema>;

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues): Promise<void> => {
      await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitPassword = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };

  // Profile form schema
  const profileSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    name: z.string().optional(),
    email: z.string().email("Please enter a valid email address"),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      name: user?.name || "",
      email: user?.email || "",
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
        description: "Your profile has been updated successfully.",
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

  return (
    <div>
      <Header />
      
      <main className="pt-20 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col w-full h-auto items-stretch gap-1">
                    <Button
                      variant={activeTab === "profile" ? "secondary" : "ghost"}
                      onClick={() => setActiveTab("profile")}
                      className="justify-start px-3 py-2 h-auto font-normal"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant={activeTab === "account" ? "secondary" : "ghost"}
                      onClick={() => setActiveTab("account")}
                      className="justify-start px-3 py-2 h-auto font-normal"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                    <Button
                      variant={activeTab === "appearance" ? "secondary" : "ghost"}
                      onClick={() => setActiveTab("appearance")}
                      className="justify-start px-3 py-2 h-auto font-normal"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Appearance
                    </Button>
                    <Button
                      variant={activeTab === "notifications" ? "secondary" : "ghost"}
                      onClick={() => setActiveTab("notifications")}
                      className="justify-start px-3 py-2 h-auto font-normal"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </Button>
                    <Button
                      variant={activeTab === "privacy" ? "secondary" : "ghost"}
                      onClick={() => setActiveTab("privacy")}
                      className="justify-start px-3 py-2 h-auto font-normal"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Privacy
                    </Button>
                    <Button
                      variant={activeTab === "reminders" ? "secondary" : "ghost"}
                      onClick={() => setActiveTab("reminders")}
                      className="justify-start px-3 py-2 h-auto font-normal"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Prayer Reminders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="w-full md:w-3/4">
              {activeTab === "profile" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Manage your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your public display name
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your real name, for personalization
                              </FormDescription>
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
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                Used for notifications and account recovery
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
              
              {activeTab === "account" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Account Security</CardTitle>
                    <CardDescription>
                      Manage your account security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-4">Change Password</h3>
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={changePasswordMutation.isPending}
                            >
                              {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-lg mb-4">Account Status</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Member Since</p>
                            <p className="text-sm text-muted-foreground">
                              Not available
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Account Role</p>
                            <p className="text-sm text-muted-foreground">
                              {user?.role || "Member"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-lg text-red-500 mb-4">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button variant="destructive">
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "appearance" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize how Prayer Pipeline looks for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sun className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Light Mode</p>
                            <p className="text-sm text-muted-foreground">
                              Use light theme
                            </p>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Dark Mode</p>
                            <p className="text-sm text-muted-foreground">
                              Use dark theme
                            </p>
                          </div>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ToggleLeft className="h-5 w-5" />
                          <div>
                            <p className="font-medium">System Preference</p>
                            <p className="text-sm text-muted-foreground">
                              Match your system theme
                            </p>
                          </div>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="mt-6">
                        <Button className="mr-2" variant="default">Save Preferences</Button>
                        <Button variant="outline">Reset to Default</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Control when and how you get notified
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Push notifications section */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="font-medium text-lg">Push Notifications</h3>
                          {isSupported ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                              Supported
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                              Not Supported
                            </Badge>
                          )}
                        </div>
                        
                        {!isSupported && (
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-amber-800">Browser not supported</p>
                              <p className="text-sm text-amber-700 mt-1">
                                Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {isSupported && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isSubscribed ? (
                                  <BellRing className="h-5 w-5 text-primary" />
                                ) : (
                                  <BellOff className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div>
                                  <p className="font-medium">Enable Push Notifications</p>
                                  <p className="text-sm text-muted-foreground">
                                    Receive notifications even when the app is closed
                                  </p>
                                </div>
                              </div>
                              {
                                notificationsLoading ? (
                                  <div className="h-5 w-10 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>
                                ) : (
                                  <Switch 
                                    checked={isSubscribed} 
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        if (permission === 'granted') {
                                          subscribe();
                                        } else {
                                          requestPermission();
                                        }
                                      } else {
                                        unsubscribe();
                                      }
                                    }}
                                  />
                                )
                              }
                            </div>
                            
                            {permission === 'denied' && (
                              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-red-800">Permission denied</p>
                                  <p className="text-sm text-red-700 mt-1">
                                    You've blocked notifications from this site. Please update your browser settings to allow notifications.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      {/* Email notifications section */}
                      <div>
                        <h3 className="font-medium text-lg mb-3">Email Notifications</h3>
                        {preferencesLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">
                                  Enable or disable all email notifications
                                </p>
                              </div>
                              <Switch 
                                checked={notificationPreferences?.emailNotifications} 
                                onCheckedChange={(checked) => {
                                  updatePreferences({ emailNotifications: checked });
                                }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Prayer Requests</p>
                                <p className="text-sm text-muted-foreground">
                                  Get notified about new prayer requests in your groups
                                </p>
                              </div>
                              <Switch 
                                checked={notificationPreferences?.prayerRequests} 
                                disabled={!notificationPreferences?.emailNotifications}
                                onCheckedChange={(checked) => {
                                  updatePreferences({ prayerRequests: checked });
                                }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Group Invitations</p>
                                <p className="text-sm text-muted-foreground">
                                  Get notified when you're invited to a new group
                                </p>
                              </div>
                              <Switch 
                                checked={notificationPreferences?.groupInvitations} 
                                disabled={!notificationPreferences?.emailNotifications}
                                onCheckedChange={(checked) => {
                                  updatePreferences({ groupInvitations: checked });
                                }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Comments</p>
                                <p className="text-sm text-muted-foreground">
                                  Get notified when someone comments on your prayer request
                                </p>
                              </div>
                              <Switch 
                                checked={notificationPreferences?.comments} 
                                disabled={!notificationPreferences?.emailNotifications}
                                onCheckedChange={(checked) => {
                                  updatePreferences({ comments: checked });
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      {/* In-app notifications section */}
                      <div>
                        <h3 className="font-medium text-lg mb-3">In-App Notifications</h3>
                        {preferencesLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">In-App Notifications</p>
                                <p className="text-sm text-muted-foreground">
                                  Enable or disable all in-app notifications
                                </p>
                              </div>
                              <Switch 
                                checked={notificationPreferences?.inAppNotifications} 
                                onCheckedChange={(checked) => {
                                  updatePreferences({ inAppNotifications: checked });
                                }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Status Updates</p>
                                <p className="text-sm text-muted-foreground">
                                  Get notified when prayer request statuses are updated
                                </p>
                              </div>
                              <Switch 
                                checked={notificationPreferences?.statusUpdates} 
                                disabled={!notificationPreferences?.inAppNotifications}
                                onCheckedChange={(checked) => {
                                  updatePreferences({ statusUpdates: checked });
                                }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Group Updates</p>
                                <p className="text-sm text-muted-foreground">
                                  Get notified about changes to groups you're in
                                </p>
                              </div>
                              <Switch 
                                checked={notificationPreferences?.groupUpdates} 
                                disabled={!notificationPreferences?.inAppNotifications}
                                onCheckedChange={(checked) => {
                                  updatePreferences({ groupUpdates: checked });
                                }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Stale Prayer Reminders</p>
                                <p className="text-sm text-muted-foreground">
                                  Get reminders about prayer requests that need updates
                                </p>
                              </div>
                              <Switch 
                                checked={notificationPreferences?.stalePrayerReminders} 
                                disabled={!notificationPreferences?.inAppNotifications}
                                onCheckedChange={(checked) => {
                                  updatePreferences({ stalePrayerReminders: checked });
                                }}
                              />
                            </div>
                            
                            {notificationPreferences?.stalePrayerReminders && (
                              <div className="pl-4 border-l-2 border-muted-foreground/20 mt-2">
                                <div className="mb-2">
                                  <p className="font-medium text-sm">Reminder Interval (days)</p>
                                  <p className="text-xs text-muted-foreground">
                                    How often to remind you about prayers needing updates
                                  </p>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      if (notificationPreferences?.reminderInterval && notificationPreferences.reminderInterval > 1) {
                                        updatePreferences({ reminderInterval: notificationPreferences.reminderInterval - 1 });
                                      }
                                    }}
                                    disabled={!notificationPreferences?.reminderInterval || notificationPreferences.reminderInterval <= 1}
                                  >-</Button>
                                  <span className="font-medium w-8 text-center">{notificationPreferences?.reminderInterval || 7}</span>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      if (notificationPreferences?.reminderInterval) {
                                        updatePreferences({ reminderInterval: notificationPreferences.reminderInterval + 1 });
                                      }
                                    }}
                                  >+</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "privacy" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>
                      Control your privacy preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-lg mb-3">Profile Visibility</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Show Email Address</p>
                              <p className="text-sm text-muted-foreground">
                                Allow others to see your email address
                              </p>
                            </div>
                            <Switch />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Show Profile to Non-Group Members</p>
                              <p className="text-sm text-muted-foreground">
                                Allow non-group members to view your profile
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium text-lg mb-3">Prayer Request Privacy</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Default to Anonymous</p>
                              <p className="text-sm text-muted-foreground">
                                Make all your prayer requests anonymous by default
                              </p>
                            </div>
                            <Switch />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Allow Sharing</p>
                              <p className="text-sm text-muted-foreground">
                                Allow your prayer requests to be shared outside your groups
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Button>Save Privacy Settings</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === "reminders" && (
                <PrayerRemindersCard />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}