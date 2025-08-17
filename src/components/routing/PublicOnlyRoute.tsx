// src/components/routing/PublicOnlyRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; // Your custom auth hook
import { DASHBOARD_PATH } from "@/constants/paths"; // Defined dashboard path

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // If still loading, show a loading indicator.
  if (isLoading) {
    return <div>Loading authentication...</div>; // Replace with a proper loading spinner/component
  }

  // If authenticated, redirect to the dashboard (or other default authenticated route).
  if (isAuthenticated) {
    return <Navigate to={DASHBOARD_PATH} replace />;
  }

  // If not authenticated, render the children (e.g., login form).
  return <>{children}</>;
};
