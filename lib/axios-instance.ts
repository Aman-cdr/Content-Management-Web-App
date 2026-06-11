import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// ── Base URL ─────────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api/v1';

// ── Token Storage Keys ───────────────────────────────────────────────────────
const BEARER_TOKEN_KEY = 'cms_bearer_token';
const ACCESS_TOKEN_KEY = 'cms_access_token';
const USER_DATA_KEY = 'cms_user_data';

// ── Token Helpers ────────────────────────────────────────────────────────────
export const TokenStorage = {
  getBearerToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(BEARER_TOKEN_KEY);
  },
  setBearerToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  },
  removeBearerToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(BEARER_TOKEN_KEY);
  },

  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  removeAccessToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  getUserData: (): any => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  },
  setUserData: (user: any): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  },
  removeUserData: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_DATA_KEY);
  },

  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(BEARER_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  }
};

// ── Axios Instance ───────────────────────────────────────────────────────────
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window === 'undefined') return config;

    const url = config.url || '';

    // Login & Register endpoints → use Bearer token (from device registration)
    if (url.includes('/user/login') || url.includes('/user/register')) {
      const bearerToken = TokenStorage.getBearerToken();
      if (bearerToken) {
        config.headers.Authorization = `Bearer ${bearerToken}`;
      }
    }
    // All other protected endpoints → use Access token (from login)
    else {
      const accessToken = TokenStorage.getAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Access ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Backend returns: { success, statusCode, message, data, timestamp }
    // Unwrap the data property for convenience
    return response;
  },
  (error) => {
    // Handle 401 - Unauthorized → redirect to login
    if (error.response?.status === 401) {
      // Don't redirect if already on login page or device registration
      const url = error.config?.url || '';
      if (!url.includes('/device/register') && typeof window !== 'undefined') {
        const isOnLoginPage = window.location.pathname === '/login';
        if (!isOnLoginPage && !url.includes('/user/login') && !url.includes('/user/register')) {
          TokenStorage.removeAccessToken();
          TokenStorage.removeUserData();
          window.location.href = '/login';
        }
      }
    }

    // Extract backend error message
    const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject({
      message: errorMessage,
      statusCode: error.response?.status,
      data: error.response?.data,
      originalError: error,
    });
  }
);

// ── Common HTTP Methods ──────────────────────────────────────────────────────

export interface ApiResponseType<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

/**
 * Common HTTP methods wrapping the axios instance.
 * These methods extract the `data` field from the backend's ApiResponse wrapper.
 */
const httpClient = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponseType<T>> => {
    const response = await axiosInstance.get<ApiResponseType<T>>(url, config);
    return response.data;
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponseType<T>> => {
    const response = await axiosInstance.post<ApiResponseType<T>>(url, data, config);
    return response.data;
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponseType<T>> => {
    const response = await axiosInstance.put<ApiResponseType<T>>(url, data, config);
    return response.data;
  },

  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponseType<T>> => {
    const response = await axiosInstance.patch<ApiResponseType<T>>(url, data, config);
    return response.data;
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponseType<T>> => {
    const response = await axiosInstance.delete<ApiResponseType<T>>(url, config);
    return response.data;
  },
};

export { axiosInstance };
export default httpClient;
