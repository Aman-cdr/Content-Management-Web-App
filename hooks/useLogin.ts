"use client";

import { useState, useCallback } from "react";
import httpClient, { TokenStorage } from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

// ── Types ────────────────────────────────────────────────────────────────────
interface LoginPayload {
  email: string;
  password: string;
}

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface LoginResponse {
  user: UserData;
  token: string;
}

interface UseLoginReturn {
  login: (payload: LoginPayload) => Promise<LoginResponse | null>;
  isLoading: boolean;
  error: string | null;
  user: UserData | null;
  clearError: () => void;
}

/**
 * Hook for user login.
 *
 * Flow: Requires bearer token from device registration.
 * Sends credentials → receives access token + user data.
 * Stores access token for subsequent API calls.
 */
export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(TokenStorage.getUserData());

  const login = useCallback(
    async (payload: LoginPayload): Promise<LoginResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Ensure bearer token exists before calling login
        const bearerToken = TokenStorage.getBearerToken();
        if (!bearerToken) {
          setError("Device not registered. Please refresh and try again.");
          return null;
        }

        const response = await httpClient.post<LoginResponse>(
          ENDPOINTS.USER.LOGIN,
          payload
        );

        if (response.success && response.data) {
          const { user: userData, token: accessToken } = response.data;

          // Store access token (used for all subsequent API calls)
          TokenStorage.setAccessToken(accessToken);
          // Store user data
          TokenStorage.setUserData(userData);
          setUser(userData);

          return response.data;
        }

        setError(response.message || "Login failed");
        return null;
      } catch (err: any) {
        const message = err?.message || "Invalid email or password";

        // If the error is a bearer token issue, clear it, re-register, and retry once
        if (
          err?.statusCode === 401 &&
          typeof message === "string" &&
          message.toLowerCase().includes("bearer")
        ) {
          try {
            TokenStorage.removeBearerToken();

            // Re-register the device to get a fresh bearer token
            const deviceInfo = {
              deviceIp: "127.0.0.1",
              latitude: 1,
              longitude: 1,
              os: navigator.platform || "Unknown",
              deviceType: /Mobi|Android/i.test(navigator.userAgent)
                ? "Mobile"
                : "Desktop",
            };

            const deviceRes = await httpClient.post<{ bearerToken: string }>(
              ENDPOINTS.DEVICE.REGISTER,
              deviceInfo
            );

            if (deviceRes.success && deviceRes.data?.bearerToken) {
              TokenStorage.setBearerToken(deviceRes.data.bearerToken);

              // Retry login with the fresh token
              const retryResponse = await httpClient.post<LoginResponse>(
                ENDPOINTS.USER.LOGIN,
                payload
              );

              if (retryResponse.success && retryResponse.data) {
                const { user: userData, token: accessToken } = retryResponse.data;
                TokenStorage.setAccessToken(accessToken);
                TokenStorage.setUserData(userData);
                setUser(userData);
                return retryResponse.data;
              }
            }
          } catch {
            // Retry failed — fall through to show original error
          }
        }

        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { login, isLoading, error, user, clearError };
}
