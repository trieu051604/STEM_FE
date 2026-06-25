import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Get API base URL from environment or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:55158/api';

// Generic API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

// Generic API error structure
export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT authorization headers
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration/unauthorized events globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout on unauthorized response
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
