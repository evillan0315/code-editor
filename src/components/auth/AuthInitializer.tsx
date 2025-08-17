// src/components/auth/AuthInitializer.tsx
import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/apiFetch";
import { authStore } from "@/stores/authStore"; // Import the auth store
import { useStore } from "@nanostores/react"; // To read the token from nanostore
import type { User } from "@/types/auth";

/**
 * AuthInitializer component:
 * - Runs the `useQuery` for user data.
 * - Synchronizes the `useQuery` state (data, loading, error) with the `authStore` Nanostore.
 * - Should be rendered once at the top level of your application.
 */
export const AuthInitializer: React.FC = () => {
  // Read the token from the Nanostore to enable/disable the query
  const { token } = useStore(authStore);

  const {
    data: user,
    refetch,
    isFetched, // True if the query has completed at least once (or data is from cache)
    isPending, // True if the query is currently fetching for the first time
    isError, // True if the query fetch resulted in an error
  } = useQuery<User>({
    queryKey: ["auth", "user"],
    queryFn: () => apiFetch("/api/auth/me"),
    enabled: !!token, // Only enable this query if a token exists in the store
    retry: false, // Don't retry if 'me' endpoint fails (implies invalid token)
    staleTime: Infinity, // User data doesn't change often, keep it in cache
  });

  // Effect to synchronize React Query state with Nanostore state
  useEffect(() => {
    // Determine the loading state for initial auth check
    const isCheckingAuthOnLoad = !!token && isPending;

    // Determine authentication status
    const isAuthenticated = !!token && isFetched && !isError;

    // Update the Nanostore with the latest state from React Query
    authStore.set({
      user: user || null,
      token: token, // Keep the token consistent in the store
      isAuthenticated: isAuthenticated,
      isLoading: isCheckingAuthOnLoad,
    });

    // If an error occurs and there's a token, it means the token is likely invalid.
    // Invalidate it to force logout state.
    if (isError && token) {
      console.error(
        "AuthInitializer: Error fetching user with token, logging out.",
      );
      // This will trigger the logout action defined in authStore.ts
      authStore.set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      queryClient.removeQueries({ queryKey: ["auth"] });
    }
  }, [user, token, isFetched, isPending, isError]);

  // This component doesn't render any UI directly.
  // Its purpose is purely to manage and synchronize the global auth state.
  return null;
};
