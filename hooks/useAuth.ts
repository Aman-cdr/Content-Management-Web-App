"use client";

import { useState, useCallback, useEffect } from "react";
import { TokenStorage } from "@/lib/axios-instance";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface UseAuthReturn {
  user: UserData | null;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => void;
}

/**
 * Hook for checking authentication state and logging out.
 * Reads from localStorage to determine if user is logged in.
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sync auth state from localStorage
  const refreshUser = useCallback(() => {
    const userData = TokenStorage.getUserData();
    const hasToken = TokenStorage.isAuthenticated();
    setUser(userData);
    setIsAuthenticated(hasToken);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    TokenStorage.clearAll();
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  return { user, isAuthenticated, logout, refreshUser };
}
