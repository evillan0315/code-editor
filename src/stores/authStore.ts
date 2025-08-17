import { map } from 'nanostores';
import type { User, LoginCredentials, LoginResponse } from '@/types/auth';
import { apiFetch, configureTokenGetter } from '@/services/apiFetch';
import { queryClient } from '@/services/queryClient'; // Import the global QueryClient instance

// --- 1. Define the Nanostore State ---
export const authStore = map<{
  user: User | null;
  token: string | null; // This will be the internal source of truth for the token
  isAuthenticated: boolean;
  isLoading: boolean; // Indicates if an initial auth check is ongoing
}>({
  user: null,
  // Initialize token from localStorage if available (on initial load)
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  isLoading: true, // Assume loading until initial check is done
});

// --- 2. Configure apiFetch to use the token from localStorage ---
// It's more reliable to configure this once and have it always read from localStorage
// or from the `token` in the store, but localStorage is generally fine for the getter.
configureTokenGetter(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null));

// --- 3. Define Auth Actions (these will modify the authStore) ---

export const login = async (credentials: LoginCredentials) => {
  try {
    const { accessToken, user: userData } = await apiFetch<LoginResponse, LoginCredentials>(
      '/api/auth/login',
      {
        method: 'POST',
        body: credentials,
      },
    );

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', accessToken);
    }

    // Update Nanostore state immediately
    authStore.set({
      token: accessToken,
      user: userData,
      isAuthenticated: true,
      isLoading: false, // Login is complete, no longer loading
    });

    // Manually set query data to avoid immediate re-fetch of 'me' endpoint
    queryClient.setQueryData(['auth', 'user'], userData);
  } catch (error) {
    console.error('Login failed:', error);
    // You might want to clear token on failed login if it was partially set
    // Or throw the error for the calling component to handle
    throw error;
  }
};

export const logout = () => {
  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }

  // Update Nanostore state
  authStore.set({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false, // Logout is complete
  });

  // Clear React Query cache for auth-related queries
  queryClient.removeQueries({ queryKey: ['auth'] });
};

export const refetchUser = async () => {
  // This will trigger the useQuery in AuthInitializer to re-run
  return await queryClient.refetchQueries({ queryKey: ['auth', 'user'] });
};

/**
 * Handles the processing of OAuth callback data (token and user info).
 * Stores the token in localStorage and updates the authStore and React Query cache.
 * @param data An object containing the accessToken and User data.
 */
export const handleOAuthCallback = (data: { token: string; user: User }) => {
  const { token, user } = data;

  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }

  authStore.set({
    token: token,
    user: user,
    isAuthenticated: true,
    isLoading: false,
  });

  // Also update React Query's cache if user data is provided
  queryClient.setQueryData(['auth', 'user'], user);
};
