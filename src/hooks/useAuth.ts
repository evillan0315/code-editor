// src/hooks/useAuth.ts
import { useStore } from '@nanostores/react';
import { authStore, login, logout, refetchUser } from '@/stores/authStore';
import type { AuthContextValue } from '@/contexts/AuthContext';

type AuthHookReturn = Pick<
  AuthContextValue,
  'user' | 'isAuthenticated' | 'isLoading' | 'login' | 'logout' | 'refetchUser'
>;

export function useAuth(): AuthHookReturn {
  const { user, isAuthenticated, isLoading } = useStore(authStore);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refetchUser,
  };
}
