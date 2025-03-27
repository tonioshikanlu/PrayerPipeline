import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import GroupDetails from "@/pages/group-details";
import RequestDetails from "@/pages/request-details";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import ExploreGroupsPage from "@/pages/explore-groups-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import OrganizationsPage from "@/pages/organizations-page";
import OrganizationDetailsPage from "@/pages/organization-details-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { OrganizationProvider } from "./hooks/use-organizations";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/groups/:groupId" component={GroupDetails} />
      <ProtectedRoute path="/requests/:requestId" component={RequestDetails} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/explore" component={ExploreGroupsPage} />
      <ProtectedRoute path="/organizations" component={() => <div className="container max-w-7xl py-10 pt-16 md:pt-24"><h1 className="text-3xl font-bold">Organizations</h1></div>} />
      <ProtectedRoute path="/organizations/:organizationId" component={() => <div className="container max-w-7xl py-10 pt-16 md:pt-24"><h1 className="text-3xl font-bold">Organization Details</h1></div>} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <Router />
          <Toaster />
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
