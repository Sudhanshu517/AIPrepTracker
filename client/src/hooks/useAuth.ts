import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  
  const { data: backendUser, isLoading: isBackendLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isSignedIn && isLoaded,
    retry: false,
  });

  return {
    user: backendUser,
    clerkUser,
    isLoading: !isLoaded || (isSignedIn && isBackendLoading),
    isAuthenticated: isSignedIn,
  };
}
