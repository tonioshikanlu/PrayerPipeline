import { useState } from "react";
import { useLocation } from "wouter";
import { useOrganizations } from "@/hooks/use-organizations";
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
  Building,
  Plus, 
  Users, 
  Settings,
  Trash2,
  Loader2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InsertOrganization, insertOrganizationSchema } from "@shared/schema";
import { z } from "zod";

const createOrgSchema = insertOrganizationSchema.omit({ createdBy: true });
type CreateOrgData = z.infer<typeof createOrgSchema>;

export default function OrganizationsPage() {
  const [location, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOrgId, setDeleteOrgId] = useState<number | null>(null);
  const { 
    organizations,
    isLoading,
    createOrganizationMutation,
    deleteOrganizationMutation
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

  const handleDeleteOrganization = async () => {
    if (deleteOrgId) {
      await deleteOrganizationMutation.mutateAsync(deleteOrgId);
      setDeleteOrgId(null);
    }
  };

  return (
    <div className="container max-w-7xl py-10 pt-16 md:pt-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your prayer community organizations
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Organization
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/50">
          <Building className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No organizations yet</h3>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Create your first organization to start managing prayer groups and invite members to join
            your prayer community.
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Organization
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{org.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {org.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-1 h-4 w-4" />
                  <span>Members</span>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 px-6 py-3 flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/organizations/${org.id}`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
                <AlertDialog open={deleteOrgId === org.id} onOpenChange={(open) => !open && setDeleteOrgId(null)}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteOrgId(org.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the organization
                        and all of its data including prayer groups and prayer requests.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleteOrganizationMutation.isPending}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteOrganization}
                        disabled={deleteOrganizationMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteOrganizationMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : "Delete Organization"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
}