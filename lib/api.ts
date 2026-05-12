import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '@/config/endpoints';
import { getSession } from 'next-auth/react';

// Create the axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Handles the dual-token system of the backend:
 * 1. Login/Register: Requires 'Bearer <deviceToken>'
 * 2. Protected Routes: Requires 'Access <accessToken>'
 */
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window === 'undefined') return config;

    const url = config.url || '';

    // Case 1: Initial Login or Registration
    // These endpoints require the Bearer token obtained from device registration
    if (url.includes(ENDPOINTS.USER.LOGIN) || url.includes(ENDPOINTS.USER.REGISTER)) {
      const deviceToken = localStorage.getItem('device_bearer_token');
      if (deviceToken) {
        config.headers.Authorization = `Bearer ${deviceToken}`;
      }
    } 
    // Case 2: Standard API calls
    // These require the Access token obtained after a successful login
    else {
      const session = await getSession();
      if (session?.user?.accessToken) {
        config.headers.Authorization = `Access ${session.user.accessToken}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap the backend's ApiResponse format
    return response.data?.data || response.data;
  },
  (error) => {
    return Promise.reject(error.response?.data || error);
  }
);

// Clean API Methods
const api = {
  get: (url: string, config = {}) => apiClient.get(url, config),
  post: (url: string, data: any, config = {}) => apiClient.post(url, data, config),
  put: (url: string, data: any, config = {}) => apiClient.put(url, data, config),
  patch: (url: string, data: any, config = {}) => apiClient.patch(url, data, config),
  delete: (url: string, config = {}) => apiClient.delete(url, config),
};

export default api;
