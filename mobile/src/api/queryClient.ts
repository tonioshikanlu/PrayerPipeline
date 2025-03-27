import { QueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';

// API base URL - get from environment or use default
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

/**
 * Make an API request with automatic token handling
 */
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: any,
  customHeaders?: Record<string, string>
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  
  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Handle 401 Unauthorized globally
    if (response.status === 401) {
      // Could trigger auth flow here or let the component handle it
      console.warn('Unauthorized request:', path);
    }
    
    return response;
  } catch (error) {
    console.error(`API Request Error for ${path}:`, error);
    throw error;
  }
}

/**
 * Default query function used by react-query
 */
export function getQueryFn(options?: { on401?: 'throwError' | 'returnNull' }) {
  return async ({ queryKey }: { queryKey: string[] }) => {
    const [path, ...rest] = queryKey;
    
    // If queryKey has parameters, append them to the URL
    let url = path;
    if (rest.length > 0 && typeof rest[0] === 'object') {
      const params = new URLSearchParams();
      Object.entries(rest[0]).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const paramsString = params.toString();
      if (paramsString) {
        url += `?${paramsString}`;
      }
    }
    
    const response = await apiRequest('GET', url);
    
    // Handle unauthorized based on options
    if (response.status === 401) {
      if (options?.on401 === 'returnNull') {
        return null;
      }
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Request failed with status ${response.status}`
      );
    }
    
    return response.json();
  };
}