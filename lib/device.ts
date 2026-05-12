import api from './api';
import { ENDPOINTS } from '@/config/endpoints';

/**
 * Registers the current device with the backend to obtain a Bearer token.
 * This token is required by the backend's security layer for Login and Registration.
 */
export async function registerDevice() {
  if (typeof window === 'undefined') return null;

  // Check if we already have a valid token
  const existingToken = localStorage.getItem('device_bearer_token');
  if (existingToken) return existingToken;

  try {
    // Get basic device info (mocking geo-location for now, or using defaults)
    const deviceInfo = {
      deviceIp: "127.0.0.1", 
      latitude: 1,
      longitude: 1,
      os: window.navigator.platform || "Unknown",
      deviceType: "Browser"
    };

    // Use raw axios or a separate instance if the main 'api' instance
    // already tries to attach tokens that don't exist yet.
    // However, our current 'api' instance is clean enough.
    const response = await api.post(ENDPOINTS.DEVICE.REGISTER, deviceInfo);
    
    if (response && response.bearerToken) {
      localStorage.setItem('device_bearer_token', response.bearerToken);
      console.log("Device registered successfully");
      return response.bearerToken;
    }
  } catch (error) {
    console.error("Failed to register device:", error?.response?.data?.message || error.message || error);
    return null;
  }
}

/**
 * Returns the stored device bearer token.
 */
export function getDeviceToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('device_bearer_token');
}
