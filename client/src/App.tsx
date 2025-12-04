import { Switch, Route } from "wouter";
import { queryClient, setGetToken } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignedIn, SignedOut, useSession } from "@clerk/clerk-react";
import { clerkPublishableKey } from "@/lib/clerk";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ProblemsPage from "@/pages/problems";
import RecommendationsPage from "@/pages/recommendations";
import ProgressPage from "@/pages/progress";
import SettingsPage from "@/pages/settings";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";

function ClerkSessionSync() {
  const { session } = useSession();

  useEffect(() => {
    setGetToken(async () => {
      if (session) {
        return await session.getToken();
      }
      return null;
    });
  }, [session]);

  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <SignedOut>
        <Landing />
      </SignedOut>
      <SignedIn>
        <Component />
      </SignedIn>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-in/*" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/sign-up/*" component={SignUpPage} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/problems">
        <ProtectedRoute component={ProblemsPage} />
      </Route>
      <Route path="/recommendations">
        <ProtectedRoute component={RecommendationsPage} />
      </Route>
      <Route path="/progress">
        <ProtectedRoute component={ProgressPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkSessionSync />
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
