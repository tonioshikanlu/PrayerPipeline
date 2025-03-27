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
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/groups/:groupId" component={GroupDetails} />
      <ProtectedRoute path="/requests/:requestId" component={RequestDetails} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/explore" component={ExploreGroupsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/:rest*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
