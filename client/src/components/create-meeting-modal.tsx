import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertMeetingSchema } from "@shared/schema";
import { CreateMeetingInput, useMeetings } from "@/hooks/use-meetings";
import { Loader2, Calendar, Clock, RotateCw } from "lucide-react";
import { format, addDays } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateMeetingModalProps = {
  groupId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateMeetingModal({ groupId, open, onOpenChange }: CreateMeetingModalProps) {
  const { createMeeting, isCreatingMeeting } = useMeetings(groupId);
  const [meetingPlatform, setMeetingPlatform] = useState<"zoom" | "google" | "physical">("zoom");
  const [isRecurring, setIsRecurring] = useState(false);

  // Create a form schema with validations
  const formSchema = insertMeetingSchema.extend({
    // Add form-specific fields
    meetingDate: z.string().refine(
      (val) => {
        try {
          const date = new Date(val);
          return !isNaN(date.getTime()) && date > new Date();
        } catch (e) {
          return false;
        }
      },
      {
        message: "Meeting date must be in the future",
      }
    ),
    meetingTime: z.string().refine(
      (val) => {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);
      },
      {
        message: "Meeting time must be in HH:MM format",
      }
    ),
    // Override date fields to use strings for form handling
    recurringUntil: z.string().optional(),
  }).omit({ 
    groupId: true, 
    createdBy: true, 
    parentMeetingId: true,
    // Remove the Date fields that we're replacing with string versions
    startTime: true,
    endTime: true,
  });

  // Get form methods
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      meetingDate: format(new Date(Date.now() + 86400000), "yyyy-MM-dd"), // Tomorrow
      meetingTime: "18:00",
      meetingType: "zoom" as "zoom" | "google_meet",
      meetingLink: "",
      isRecurring: false,
      recurringPattern: "weekly" as "daily" | "weekly" | "biweekly" | "monthly",
      recurringDay: null,
      recurringUntil: format(addDays(new Date(), 90), "yyyy-MM-dd"), // Default to 90 days
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Combine date and time into a single ISO string
    const meetingDateTime = new Date(`${values.meetingDate}T${values.meetingTime}`);
    
    // Set the meetingType based on platform selection
    let meetingType: "zoom" | "google_meet" = values.meetingType;
    if (meetingPlatform === "zoom") {
      meetingType = "zoom";
    } else if (meetingPlatform === "google") {
      meetingType = "google_meet";
    }
    
    // Create meeting data object with proper Date objects
    const meetingData: CreateMeetingInput = {
      groupId,
      title: values.title,
      description: values.description || "",
      startTime: meetingDateTime, // Using Date object directly
      endTime: null, // Can be enhanced to add end time field
      meetingType,
      meetingLink: meetingPlatform === "physical" ? "In Person" : values.meetingLink,
      isRecurring: values.isRecurring,
      createdBy: 0, // Will be set by the server
    };
    
    // Add recurring meeting fields if applicable
    if (values.isRecurring && values.recurringPattern) {
      meetingData.recurringPattern = values.recurringPattern;
      
      // Set the recurringDay based on the pattern
      if (values.recurringPattern === "monthly" && values.recurringDay !== null) {
        meetingData.recurringDay = values.recurringDay;
      } else if (values.recurringPattern === "weekly") {
        // For weekly, store the day of week (0-6, where 0 is Sunday)
        meetingData.recurringDay = meetingDateTime.getDay();
      }
      
      // Set the recurring end date
      if (values.recurringUntil) {
        // Create a Date object from the string date
        meetingData.recurringUntil = new Date(`${values.recurringUntil}T23:59:59`);
      }
    }
    
    // Submit the form
    createMeeting(meetingData, {
      onSuccess: () => {
        // Close the modal and reset form
        onOpenChange(false);
        form.reset();
        setIsRecurring(false);
      },
    });
  };

  // Handle meeting platform selection
  const handlePlatformChange = (platform: typeof meetingPlatform) => {
    setMeetingPlatform(platform);
    
    // Set the meetingType based on platform
    if (platform === "zoom") {
      form.setValue("meetingType", "zoom");
    } else if (platform === "google") {
      form.setValue("meetingType", "google_meet");
    }
  };

  // Watch the isRecurring field
  const watchIsRecurring = form.watch("isRecurring");
  
  // Update state when form value changes
  const onIsRecurringChange = (checked: boolean) => {
    setIsRecurring(checked);
    form.setValue("isRecurring", checked);
  };

  // Watch the recurringPattern to determine which fields to show
  const watchRecurringPattern = form.watch("recurringPattern");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule a Meeting</DialogTitle>
          <DialogDescription>
            Create a new prayer meeting for your group.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Weekly Prayer Meeting" {...field} />
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
                      placeholder="Join us for our weekly prayer session"
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="meetingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meetingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Meeting Type</FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={meetingPlatform === "zoom" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handlePlatformChange("zoom")}
                >
                  Zoom
                </Button>
                <Button
                  type="button"
                  variant={meetingPlatform === "google" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handlePlatformChange("google")}
                >
                  Google Meet
                </Button>
                <Button
                  type="button"
                  variant={meetingPlatform === "physical" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handlePlatformChange("physical")}
                >
                  In Person
                </Button>
              </div>
            </div>

            {meetingPlatform !== "physical" && (
              <FormField
                control={form.control}
                name="meetingLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Link</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`${meetingPlatform === "zoom" ? "Zoom" : "Google Meet"} meeting link`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="border-t pt-4">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={onIsRecurringChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2">
                        <RotateCw className="h-4 w-4" />
                        Recurring Meeting
                      </FormLabel>
                      <FormDescription>
                        Create a series of meetings that repeat automatically
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {watchIsRecurring && (
              <div className="border rounded-md p-4 space-y-4 bg-muted/20">
                <FormField
                  control={form.control}
                  name="recurringPattern"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Recurrence Pattern</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={(value) => {
                            // Explicitly cast the value to the expected type
                            field.onChange(value as "daily" | "weekly" | "biweekly" | "monthly");
                          }} 
                          defaultValue={field.value || "weekly"} 
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="daily" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Daily
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="weekly" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Weekly
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="biweekly" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Bi-weekly
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="monthly" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Monthly
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchRecurringPattern === "monthly" && (
                  <FormField
                    control={form.control}
                    name="recurringDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Month</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[...Array(31)].map((_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          For months with fewer days, the last day of the month will be used.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="recurringUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          value={typeof field.value === 'string' ? field.value : format(new Date(), 'yyyy-MM-dd')}
                        />
                      </FormControl>
                      <FormDescription>
                        When the recurring meetings should end (maximum 90 days)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => onOpenChange(false)}
                disabled={isCreatingMeeting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingMeeting}>
                {isCreatingMeeting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {watchIsRecurring ? 'Schedule Recurring Meetings' : 'Schedule Meeting'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}