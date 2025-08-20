// src/components/auth/AuthInitializer.tsx
import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/apiFetch";
import { authStore } from "@/stores/authStore"; 
import { useStore } from "@nanostores/react"; 
import type { User } from "@/types/auth";


export const AuthInitializer: React.FC = () => {
  const queryClient = useQueryClient();
  
  const { token } = useStore(authStore);
  
  const {
    data: user,
    refetch,
    isFetched, 
    isPending, 
    isError, 
  } = useQuery<User>({
    queryKey: ["auth", "user"],
    queryFn: () => apiFetch("/api/auth/me"),
    enabled: !!token, 
    retry: false, 
    staleTime: Infinity, 
  });

  
  useEffect(() => {
    
    const isCheckingAuthOnLoad = !!token && isPending;

    
    const isAuthenticated = !!token && isFetched && !isError;

    
    authStore.set({
      user: user || null,
      token: token, 
      isAuthenticated: isAuthenticated,
      isLoading: isCheckingAuthOnLoad,
    });

    
    
    if (isError && token) {
      console.error(
        "AuthInitializer: Error fetching user with token, logging out.",
      );
      
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
  }, [user, token, isFetched, isPending, isError, queryClient]);

  
  
  return null;
};
