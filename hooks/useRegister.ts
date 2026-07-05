"use client";

import { useState, useCallback } from "react";
import httpClient, { TokenStorage } from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

// ── Types ────────────────────────────────────────────────────────────────────
interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface RegisteredUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface UseRegisterReturn {
  register: (payload: RegisterPayload) => Promise<RegisteredUser | null>;
  isLoading: boolean;
  error: string | null;
  registeredUser: RegisteredUser | null;
  clearError: () => void;
}

/**
 * Hook for user registration.
 *
 * Flow: Requires bearer token from device registration.
 * Sends user details → backend creates user.
 * After registration, the caller should call the login hook to get the access token.
 */
export function useRegister(): UseRegisterReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);

  const register = useCallback(
    async (payload: RegisterPayload): Promise<RegisteredUser | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Ensure bearer token exists before calling register
        const bearerToken = TokenStorage.getBearerToken();
        if (!bearerToken) {
          setError("Device not registered. Please refresh and try again.");
          return null;
        }

        const response = await httpClient.post<RegisteredUser>(
          ENDPOINTS.USER.REGISTER,
          payload
        );

        if (response.success && response.data) {
          setRegisteredUser(response.data);
          return response.data;
        }

        setError(response.message || "Registration failed");
        return null;
      } catch (err: any) {
        const message = err?.message || "Registration failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { register, isLoading, error, registeredUser, clearError };
}
