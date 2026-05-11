import axios from 'axios';
import { API_BASE_URL } from '@/config/endpoints';

// Create the axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // timeout: 10000,
});

// Request Interceptor (e.g., attach auth tokens)
apiClient.interceptors.request.use(
  (config) => {
    // Example: retrieve the token from localStorage or NextAuth session
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (e.g., handle global errors, 401s, etc.)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Suppress console.error here to avoid clutter during local mock development
    return Promise.reject(error);
  }
);

import { CONTENT_ITEMS, ROADMAP_ITEMS } from '@/lib/mock-data';

// Common API Methods with built-in Mock fallback
const api = {
  get: async (url: string, config = {}) => {
    if (url === '/content') return [...CONTENT_ITEMS];
    if (url === '/roadmap') return [...ROADMAP_ITEMS];
    if (url === '/analytics') {
      return {
        stats: [
          { name: "Total Views", value: "2.4M", change: "+12%", iconKey: "Play" },
          { name: "Subscribers", value: "84.2K", change: "+840", iconKey: "Users" },
          { name: "Avg Watch Time", value: "4m 12s", change: "+15s", iconKey: "Clock" },
          { name: "Revenue", value: "$4,240", change: "+8%", iconKey: "TrendingUp" }
        ],
        aiSuggestions: [
          { id: 1, title: "Optimize latest video title", description: "Change to 'I Built a Next.js CMS' for better CTR.", impact: "High", confidence: 92, action: "Apply", iconKey: "Sparkles" },
          { id: 2, title: "Reschedule pending post", description: "Audience is active later today.", impact: "Medium", confidence: 85, action: "Reschedule", iconKey: "Clock" }
        ],
        roadmap: [...ROADMAP_ITEMS],
        platformPerformance: []
      };
    }
    try {
      return await apiClient.get(url, config);
    } catch (error) {
      console.warn("Mocking get request for", url);
      return [];
    }
  },
  post: async (url: string, data: any, config = {}) => {
    if (url === '/content' || url === '/roadmap') {
      return { id: Date.now(), ...data };
    }
    if (url === '/generate-script' || url === '/reschedule' || url === '/generate-thumbnail') {
      return { success: true, message: "Mock success" };
    }
    try {
      return await apiClient.post(url, data, config);
    } catch (error) {
      console.warn("Mocking post request for", url);
      return { id: Date.now(), ...data };
    }
  },
  put: async (url: string, data: any, config = {}) => {
    try {
      return await apiClient.put(url, data, config);
    } catch (error) {
      console.warn("Mocking put request for", url);
      return data;
    }
  },
  patch: async (url: string, data: any, config = {}) => {
    try {
      return await apiClient.patch(url, data, config);
    } catch (error) {
      console.warn("Mocking patch request for", url);
      return data;
    }
  },
  delete: async (url: string, config = {}) => {
    try {
      return await apiClient.delete(url, config);
    } catch (error) {
      console.warn("Mocking delete request for", url);
      return { success: true };
    }
  },
};

export default api;
