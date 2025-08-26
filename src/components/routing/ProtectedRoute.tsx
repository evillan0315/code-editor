// src/components/routing/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Your custom auth hook
import { LOGIN_PATH } from '@/constants/paths'; // Defined login path

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // If still loading (initial auth check), show a loading indicator.
  // This prevents flickering or premature redirection.
  if (isLoading) {
    return <div>Loading authentication...</div>; // Replace with a proper loading spinner/component
  }

  // If not authenticated, redirect to the login page.
  if (!isAuthenticated) {
    return <Navigate to={LOGIN_PATH} replace />; // `replace` prevents adding to history stack
  }

  // If authenticated, render the children (the protected content).
  return <>{children}</>;
};
