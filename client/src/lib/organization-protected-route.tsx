import { useAuth } from "@/hooks/use-auth";
import { useOrganizations } from "@/hooks/use-organizations";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function OrganizationProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { organizations, isLoading: isLoadingOrgs } = useOrganizations();

  // If still loading auth or orgs data, show loading spinner
  if (isLoadingAuth || isLoadingOrgs) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If user has no organizations, redirect to the onboarding page
  if (organizations.length === 0) {
    return (
      <Route path={path}>
        <Redirect to="/onboarding" />
      </Route>
    );
  }

  // User is authenticated and has at least one organization, render the component
  return <Route path={path} component={Component} />;
}