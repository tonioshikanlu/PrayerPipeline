import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import GroupDetails from "@/pages/group-details";
import RequestDetails from "@/pages/request-details";
import MeetingDetails from "@/pages/meeting-details";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import ExploreGroupsPage from "@/pages/explore-groups-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import OrganizationsPage from "@/pages/organizations-page";
import OrganizationDetailsPage from "@/pages/organization-details-page";
import OrganizationOnboarding from "@/pages/organization-onboarding";
import { ProtectedRoute } from "./lib/protected-route";
import { OrganizationProtectedRoute } from "./lib/organization-protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { OrganizationProvider } from "./hooks/use-organizations";

function Router() {
  return (
    <Switch>
      {/* Routes that require both auth and organization */}
      <OrganizationProtectedRoute path="/" component={HomePage} />
      <OrganizationProtectedRoute path="/groups/:groupId" component={GroupDetails} />
      <OrganizationProtectedRoute path="/requests/:requestId" component={RequestDetails} />
      <OrganizationProtectedRoute path="/meetings/:meetingId" component={MeetingDetails} />
      <OrganizationProtectedRoute path="/profile" component={ProfilePage} />
      <OrganizationProtectedRoute path="/settings" component={SettingsPage} />
      <OrganizationProtectedRoute path="/explore" component={ExploreGroupsPage} />
      <OrganizationProtectedRoute path="/organizations" component={OrganizationsPage} />
      <OrganizationProtectedRoute path="/organizations/:organizationId" component={OrganizationDetailsPage} />
      
      {/* Routes that require just auth */}
      <ProtectedRoute path="/onboarding" component={OrganizationOnboarding} />
      
      {/* Public routes */}
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
