import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertPrayerRequestSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

type CreateRequestModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  defaultGroupId?: number;
};

export default function CreateRequestModal({
  open,
  setOpen,
  defaultGroupId,
}: CreateRequestModalProps) {
  const { toast } = useToast();

  // Fetch user's groups
  const { data: userGroups = [] } = useQuery<any[]>({
    queryKey: ["/api/groups/user"],
  });

  // Define our form schema type
  const createRequestSchema = insertPrayerRequestSchema.omit({ userId: true });
  type CreateRequestInput = z.infer<typeof createRequestSchema>;
  
  const form = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      groupId: defaultGroupId || 0,
      urgency: "medium",
      isAnonymous: false,
      status: "waiting",
      followUpDate: undefined,
    },
  });

  // Update the form when defaultGroupId changes
  useEffect(() => {
    if (defaultGroupId) {
      form.setValue("groupId", defaultGroupId);
    }
  }, [defaultGroupId, form]);

  const createRequestMutation = useMutation({
    mutationFn: async (data: CreateRequestInput): Promise<void> => {
      await apiRequest("POST", `/api/groups/${data.groupId}/requests`, data);
    },
    onSuccess: () => {
      toast({
        title: "Prayer request created",
        description: "Your prayer request has been submitted successfully.",
      });
      // Reset form and close modal
      form.reset();
      setOpen(false);
      // Invalidate relevant queries
      if (defaultGroupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${defaultGroupId}/requests`] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/requests/user/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Error creating prayer request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateRequestInput) => {
    // Handle date conversion for followUpDate
    const formattedData = {
      ...data,
      // Convert string date to Date object if it exists
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined
    };
    
    createRequestMutation.mutate(formattedData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            New Prayer Request
          </DialogTitle>
          <DialogDescription>
            Share your prayer need with your group.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Healing for my mother"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!defaultGroupId && (
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userGroups?.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share details about your prayer request..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">
                        Low - Ongoing need
                      </SelectItem>
                      <SelectItem value="medium">
                        Medium - Important but not critical
                      </SelectItem>
                      <SelectItem value="high">
                        High - Urgent situation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Post anonymously (your name won't be shown)
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="followUpDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Follow-up Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date for follow-up</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Set a date to check back on this prayer request. You'll receive a reminder when this date arrives.
                  </FormDescription>
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
                disabled={createRequestMutation.isPending}
              >
                {createRequestMutation.isPending ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Submitting...
                  </div>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
