import { QueryClient } from '@tanstack/react-query';

// Base URL for API requests - adjust for dev/prod environments
const API_BASE_URL = '/api';

// Create and export the query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Types for the API request options
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ApiOptions = {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  on401?: 'throw' | 'returnNull';
};

/**
 * Helper function to make API requests
 */
export async function apiRequest(
  method: Method,
  endpoint: string,
  body?: any,
  options: ApiOptions = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: options.credentials || 'include',
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  return fetch(url, config);
}

/**
 * Creates a query function for react-query that handles common API response scenarios
 */
export function getQueryFn(options: ApiOptions = {}) {
  return async ({ queryKey }: any) => {
    const [endpoint] = queryKey;
    const response = await apiRequest('GET', endpoint, undefined, options);

    if (!response.ok) {
      if (response.status === 401 && options.on401 === 'returnNull') {
        return null;
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    // For endpoints that don't return JSON (like 204 No Content)
    if (response.status === 204) {
      return null;
    }

    return response.json();
  };
}