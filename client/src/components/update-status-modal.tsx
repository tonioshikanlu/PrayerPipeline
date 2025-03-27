import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UpdateStatusModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  requestId: number;
  currentStatus?: string;
};

export default function UpdateStatusModal({
  open,
  setOpen,
  requestId,
  currentStatus = "waiting",
}: UpdateStatusModalProps) {
  const { toast } = useToast();

  const form = useForm<{ status: string }>({
    resolver: zodResolver(
      z.object({
        status: z.enum(["waiting", "answered", "declined"]),
      })
    ),
    defaultValues: {
      status: currentStatus,
    },
    values: {
      status: currentStatus,
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: string }) => {
      await apiRequest("PUT", `/api/requests/${requestId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The prayer request status has been updated successfully.",
      });
      // Close modal
      setOpen(false);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: { status: string }) => {
    updateStatusMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Update Prayer Status
          </DialogTitle>
          <DialogDescription>
            Update the status of your prayer request.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="waiting">
                        Still Waiting
                      </SelectItem>
                      <SelectItem value="answered">
                        Answered!
                      </SelectItem>
                      <SelectItem value="declined">
                        God Said No
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
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Updating...
                  </div>
                ) : (
                  "Update Status"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
