import { useState } from "react";
import { useOrganizations } from "@/hooks/use-organizations";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Plus,
  Loader2,
  LogOut
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertOrganizationSchema } from "@shared/schema";
import { z } from "zod";

const createOrgSchema = insertOrganizationSchema.omit({ createdBy: true });
type CreateOrgData = z.infer<typeof createOrgSchema>;

export default function OrganizationSelector() {
  const [_, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [switchOrgDialogOpen, setSwitchOrgDialogOpen] = useState(false);
  const { 
    organizations, 
    currentOrganization, 
    setCurrentOrganizationId, 
    isLoading,
    createOrganizationMutation,
    leaveOrganizationMutation
  } = useOrganizations();

  const form = useForm<CreateOrgData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleCreateOrganization = async (data: CreateOrgData) => {
    await createOrganizationMutation.mutateAsync(data);
    form.reset();
    setDialogOpen(false);
  };

  const handleOrgChange = (orgId: string) => {
    if (orgId === "manage") {
      navigate("/organizations");
    } else if (orgId === "create") {
      setDialogOpen(true);
    } else if (orgId === "leave" && currentOrganization) {
      // Open confirmation dialog for leaving the current organization
      setSwitchOrgDialogOpen(true);
    } else {
      setCurrentOrganizationId(parseInt(orgId));
    }
  };

  const handleLeaveOrganization = async () => {
    if (!currentOrganization) return;
    
    try {
      await leaveOrganizationMutation.mutateAsync(currentOrganization.id);
      setSwitchOrgDialogOpen(false);
    } catch (error) {
      console.error("Failed to leave organization:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Building className="h-5 w-5 text-primary" />
        <Select
          value={currentOrganization ? String(currentOrganization.id) : ""}
          onValueChange={handleOrgChange}
        >
          <SelectTrigger className="w-[180px] md:w-[240px]">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Your organizations</SelectLabel>
              {organizations.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No organizations yet
                </div>
              )}
              {organizations.map((org) => (
                <SelectItem key={org.id} value={String(org.id)}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Options</SelectLabel>
              <SelectItem value="manage">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Manage organizations
                </div>
              </SelectItem>
              <SelectItem value="create">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create organization
                </div>
              </SelectItem>
              {currentOrganization && organizations.length > 1 && (
                <SelectItem value="leave">
                  <div className="flex items-center gap-2 text-red-500">
                    <Loader2 className={`h-4 w-4 ${leaveOrganizationMutation.isPending ? 'animate-spin' : 'hidden'}`} />
                    Leave {currentOrganization.name}
                  </div>
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage prayer groups and members.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateOrganization)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter organization name" {...field} />
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
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your organization"
                        className="resize-none h-20"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={createOrganizationMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createOrganizationMutation.isPending}
                >
                  {createOrganizationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Organization"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Leave Organization Dialog */}
      <Dialog open={switchOrgDialogOpen} onOpenChange={setSwitchOrgDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Leave Organization</DialogTitle>
            <DialogDescription>
              {currentOrganization?.name && `You are about to leave ${currentOrganization.name}. You will need to select another organization to continue.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <h3 className="text-sm font-medium mb-2">Select an organization to join:</h3>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {organizations
                .filter(org => org.id !== currentOrganization?.id)
                .map(org => (
                  <button
                    key={org.id}
                    className="flex items-center w-full p-2 rounded-md hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      if (currentOrganization) {
                        leaveOrganizationMutation.mutate(currentOrganization.id);
                        setCurrentOrganizationId(org.id);
                        setSwitchOrgDialogOpen(false);
                      }
                    }}
                  >
                    <Building className="h-5 w-5 mr-2 text-primary" />
                    <span>{org.name}</span>
                  </button>
                ))
              }
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSwitchOrgDialogOpen(false)}
              disabled={leaveOrganizationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleLeaveOrganization}
              disabled={leaveOrganizationMutation.isPending}
            >
              {leaveOrganizationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Organization
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}