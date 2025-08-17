// src/contexts/AuthContext.ts

import { createContext } from "react";
import type { User, LoginCredentials } from "@/types/auth";

import type { QueryObserverResult } from "@tanstack/react-query";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<QueryObserverResult<User, Error>>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
