import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertMeetingSchema } from "@shared/schema";
import { CreateMeetingInput, useMeetings } from "@/hooks/use-meetings";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

type CreateMeetingModalProps = {
  groupId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateMeetingModal({ groupId, open, onOpenChange }: CreateMeetingModalProps) {
  const { createMeeting, isCreatingMeeting } = useMeetings(groupId);
  const [meetingPlatform, setMeetingPlatform] = useState<"zoom" | "google" | "physical">("zoom");

  // Create a form schema with validations
  const formSchema = insertMeetingSchema.extend({
    // Convert the date string to Date object for validation
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
  }).omit({ groupId: true, createdBy: true });

  // Get form methods
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      meetingDate: format(new Date(Date.now() + 86400000), "yyyy-MM-dd"), // Tomorrow
      meetingTime: "18:00",
      meetingUrl: "",
      location: "",
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Combine date and time into a single ISO string
    const meetingDateTime = new Date(`${values.meetingDate}T${values.meetingTime}`);
    
    // Create meeting data object
    const meetingData: CreateMeetingInput = {
      groupId,
      title: values.title,
      description: values.description,
      meetingDate: meetingDateTime.toISOString(),
      meetingUrl: values.meetingUrl,
      location: values.location,
    };

    // Submit the form
    createMeeting(meetingData, {
      onSuccess: () => {
        // Close the modal and reset form
        onOpenChange(false);
        form.reset();
      },
    });
  };

  // Handle meeting platform selection
  const handlePlatformChange = (platform: typeof meetingPlatform) => {
    setMeetingPlatform(platform);
    
    // Clear the irrelevant fields
    if (platform === "physical") {
      form.setValue("meetingUrl", "");
    } else {
      form.setValue("location", "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
                      {...field}
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
                    <FormLabel>Date</FormLabel>
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
                    <FormLabel>Time</FormLabel>
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
                name="meetingUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting URL</FormLabel>
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

            {meetingPlatform === "physical" && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Meeting location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                Schedule Meeting
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}