import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizations } from "@/hooks/use-organizations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrganizationSchema } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";
import { useLocation } from "wouter";

// Extend the insert schema for form validation
const formSchema = insertOrganizationSchema.omit({ createdBy: true }).extend({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export default function OrganizationOnboarding() {
  const { user } = useAuth();
  const { organizations, createOrganizationMutation } = useOrganizations();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if user already has an organization
  useEffect(() => {
    if (organizations.length > 0) {
      setLocation('/');
    }
  }, [organizations, setLocation]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    createOrganizationMutation.mutate(values);
  };

  return (
    <div className="container flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to Prayer Pipeline</CardTitle>
          <CardDescription className="text-lg mt-2">
            To get started, create your first organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Organizations are the central hub for your prayer groups. You'll be able to invite members,
                create prayer groups, and manage prayer requests within your organization.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., My Church, Prayer Ministry, etc." {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be the main identifier for your organization.
                      </FormDescription>
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
                          placeholder="Describe the purpose of your organization..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Tell members what this organization is about.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createOrganizationMutation.isPending}
                >
                  {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Need to join an existing organization instead?</p>
            <p>Ask an administrator to invite you using your email: {user?.username}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}