"use client";

import { useState, useCallback } from "react";
import httpClient, { TokenStorage } from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

// ── Types ────────────────────────────────────────────────────────────────────
interface DeviceRegisterPayload {
  deviceIp: string;
  latitude: number;
  longitude: number;
  os: string;
  deviceType: string;
}

interface DeviceRegisterResponse {
  _id: string;
  deviceIp: string;
  latitude: number;
  longitude: number;
  os: string;
  deviceType: string;
  bearerToken: string;
}

interface UseDeviceRegisterReturn {
  registerDevice: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
  bearerToken: string | null;
}

/**
 * Helper to check if a JWT token has expired
 */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;
    // Check if current time is past token expiration (exp is in seconds)
    return Date.now() >= exp * 1000;
  } catch (err) {
    return true; // If error parsing, assume invalid/expired
  }
}

/**
 * Hook to register the current browser device with the backend.
 * Returns a bearer token that must be used for login/register API calls.
 *
 * Flow: Call this on login page mount → stores bearer token in localStorage.
 */
export function useDeviceRegister(): UseDeviceRegisterReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bearerToken, setBearerToken] = useState<string | null>(
    TokenStorage.getBearerToken()
  );

  const registerDevice = useCallback(async (): Promise<string | null> => {
    // Skip on server-side
    if (typeof window === "undefined") return null;

    // If we already have a valid bearer token, return it directly
    const existingToken = TokenStorage.getBearerToken();
    if (existingToken && !isTokenExpired(existingToken)) {
      setBearerToken(existingToken);
      return existingToken;
    }

    // Clear expired token if present
    if (existingToken && isTokenExpired(existingToken)) {
      TokenStorage.removeBearerToken();
    }

    setIsLoading(true);
    setError(null);

    try {
      // Gather device info
      const deviceInfo: DeviceRegisterPayload = {
        deviceIp: "127.0.0.1",
        latitude: 1,
        longitude: 1,
        os: navigator.platform || "Unknown",
        deviceType: /Mobi|Android/i.test(navigator.userAgent)
          ? "Mobile"
          : "Desktop",
      };

      const response = await httpClient.post<DeviceRegisterResponse>(
        ENDPOINTS.DEVICE.REGISTER,
        deviceInfo
      );

      if (response.success && response.data?.bearerToken) {
        TokenStorage.setBearerToken(response.data.bearerToken);
        setBearerToken(response.data.bearerToken);
        return response.data.bearerToken;
      }

      setError("Device registration failed: No bearer token received");
      return null;
    } catch (err: any) {
      const message = err?.message || "Failed to register device";
      setError(message);
      console.error("Device registration error:", message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { registerDevice, isLoading, error, bearerToken };
}
