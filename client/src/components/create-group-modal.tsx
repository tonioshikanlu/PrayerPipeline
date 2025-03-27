import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertGroupSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizations } from "@/hooks/use-organizations";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CreateGroupModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  organizationId?: number; // Optional organization ID prop
};

export default function CreateGroupModal({
  open,
  setOpen,
  organizationId,
}: CreateGroupModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { organizations: userOrgs } = useOrganizations();
  
  // If no organizationId is provided, use the first organization the user is a member of
  // This ensures we always have a valid organization ID for group creation
  const activeOrgId = organizationId || (userOrgs.length ? userOrgs[0].id : undefined);

  // Define our form schema type
  const createGroupSchema = insertGroupSchema.omit({ createdBy: true });
  type CreateGroupInput = z.infer<typeof createGroupSchema>;
  
  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "other",
      privacy: "request",
      leaderRotation: 0,
      organizationId: activeOrgId,
    },
  });

  // Update form when organizationId changes
  useEffect(() => {
    if (activeOrgId) {
      form.setValue("organizationId", activeOrgId);
    }
  }, [activeOrgId, form]);

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupInput) => {
      await apiRequest("POST", "/api/groups", data);
    },
    onSuccess: () => {
      toast({
        title: "Group created",
        description: "Your new prayer group has been created successfully.",
      });
      // Reset form and close modal
      form.reset();
      setOpen(false);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: (error) => {
      toast({
        title: "Error creating group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateGroupInput) => {
    // Don't allow submitting without an organization ID
    if (!data.organizationId) {
      toast({
        title: "Error creating group",
        description: "You must be a member of an organization to create a group.",
        variant: "destructive",
      });
      return;
    }
    
    createGroupMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Create New Prayer Group
          </DialogTitle>
          <DialogDescription>
            Create a new group to share prayer requests with others.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Morning Prayer Group"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What is this prayer group about?"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="career">Career</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="relationship">Relationship</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Settings</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group privacy" />
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
              control={form.control}
              name="leaderRotation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leadership Rotation</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(parseInt(val))}
                    defaultValue={field.value.toString()}
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

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Creating...
                  </div>
                ) : (
                  "Create Group"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
