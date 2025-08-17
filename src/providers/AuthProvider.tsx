import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, configureTokenGetter } from "@/services/apiFetch";
import { AuthContext } from "@/contexts/AuthContext";
import {
  type User,
  type LoginCredentials,
  type LoginResponse,
} from "@/types/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );

  // Configure the token getter so apiFetch can use it
  configureTokenGetter(() => token || localStorage.getItem("token"));

  const {
    data: user,
    refetch,
    isFetched, // True if the query has completed at least once (or data is from cache)
    isPending, // True if the query is currently fetching for the first time (v5+)
    // If using React Query v4, you might use `isLoading` instead of `isPending`
    isError, // True if the query fetch resulted in an error
  } = useQuery<User>({
    queryKey: ["auth", "user"],
    queryFn: () => apiFetch("/api/auth/me"),
    enabled: !!token, // Only enable this query if a token exists
    retry: false, // Don't retry if 'me' endpoint fails (implies invalid token)
    staleTime: Infinity, // User data doesn't change often, keep it in cache
  });

  const login = async (credentials: LoginCredentials) => {
    const { accessToken, user: userData } = await apiFetch<
      LoginResponse,
      LoginCredentials
    >("/api/auth/login", {
      method: "POST",
      body: credentials,
    });
    setToken(accessToken);
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData)); // Consider removing this if `user` always comes from `auth/me`
    queryClient.setQueryData(["auth", "user"], userData); // Manually set query data to avoid immediate re-fetch
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // Clear user data from local storage
    queryClient.removeQueries({ queryKey: ["auth"] }); // Invalidate/remove all auth-related queries
  };

  // Determine if we are currently checking authentication status on initial load/refresh
  // This is true if a token exists AND the 'auth/me' query is still pending/loading for the first time
  const isCheckingAuthOnLoad = !!token && isPending;

  // If we are checking auth on load, render a loading indicator instead of the children
  // This prevents the protected routes from redirecting before auth status is known.
  if (isCheckingAuthOnLoad) {
    return <div>Checking authentication...</div>; // You can replace this with a proper loading spinner
  }

  // Determine isAuthenticated based on the token presence, fetched status, and error status.
  // Now that `isCheckingAuthOnLoad` handles the initial pending state, this logic works.
  const isAuthenticated = !!token && isFetched && !isError;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null, // Provide user data or null
        isAuthenticated, // Use the derived isAuthenticated status
        login,
        logout,
        refetchUser: refetch, // Allow refetching user data
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
