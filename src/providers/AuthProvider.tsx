import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, configureTokenGetter } from '@/services/apiFetch';
import { AuthContext } from '@/contexts/AuthContext';
import {
  type User,
  type LoginCredentials,
  type LoginResponse,
} from '@/types/auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  );

  configureTokenGetter(() => token || localStorage.getItem('token'));

  const {
    data: user,
    refetch,
    isFetched,
    isPending,

    isError,
  } = useQuery<User>({
    queryKey: ['auth', 'user'],
    queryFn: () => apiFetch('/api/auth/me'),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  const login = async (credentials: LoginCredentials) => {
    const { accessToken, user: userData } = await apiFetch<
      LoginResponse,
      LoginCredentials
    >('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    queryClient.setQueryData(['auth', 'user'], userData);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.removeQueries({ queryKey: ['auth'] });
  };

  const isCheckingAuthOnLoad = !!token && isPending;

  if (isCheckingAuthOnLoad) {
    return <div>Checking authentication...</div>;
  }

  const isAuthenticated = !!token && isFetched && !isError;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated,
        login,
        logout,
        refetchUser: refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
