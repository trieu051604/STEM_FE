import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Get API base URL from environment or fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:55458/api';

// Rate limiting - simple in-memory limiter
const requestLog: Map<string, number[]> = new Map();
const RATE_LIMIT = 100; // Max requests per minute
const RATE_WINDOW = 60 * 1000; // Per minute

function checkRateLimit(endpoint: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(endpoint) || [];

  // Filter out old requests
  const recent = timestamps.filter(t => now - t < RATE_WINDOW);

  if (recent.length >= RATE_LIMIT) {
    return false;
  }

  recent.push(now);
  requestLog.set(endpoint, recent);
  return true;
}

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
    // Security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  },
});

// Request interceptor to automatically attach JWT authorization headers and rate limiting
api.interceptors.request.use(
  (config) => {
    // Rate limiting check
    const endpoint = config.url || 'unknown';
    if (!checkRateLimit(endpoint)) {
      return Promise.reject(new Error('Too many requests. Please wait a moment.'));
    }

    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't log sensitive data
    const sanitizedData = config.data ? { ...config.data } : {};
    if (sanitizedData.password) sanitizedData.password = '[REDACTED]';
    if (sanitizedData.newPassword) sanitizedData.newPassword = '[REDACTED]';
    if (sanitizedData.currentPassword) sanitizedData.currentPassword = '[REDACTED]';

    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, sanitizedData);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration/unauthorized events globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout on unauthorized response
      useAuthStore.getState().logout();
    }

    // Log error without sensitive data
    if (error.response?.data) {
      const sanitizedError = { ...error.response.data };
      if (sanitizedError.data?.password) sanitizedError.data.password = '[REDACTED]';
      console.error('[API Error]', sanitizedError);
    }

    return Promise.reject(error);
  }
);

export default api;
