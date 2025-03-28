import { QueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api';

// Initialize QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Interface for QueryFn options
interface GetQueryFnOptions {
  on401?: 'throw' | 'returnNull';
  on404?: 'throw' | 'returnNull';
}

// Utility to build full URLs from endpoints
export function buildApiUrl(endpoint: string): string {
  // If the endpoint already starts with http, assume it's a full URL
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Make sure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
}

// Default fetcher with error handling options
export function getQueryFn(options: GetQueryFnOptions = {}) {
  return async ({ queryKey }: { queryKey: readonly unknown[] }): Promise<any> => {
    const endpoint = String(queryKey[0]);
    const url = buildApiUrl(endpoint);
    
    console.log(`Making API request to: ${url}`);
    
    try {
      // Set up fetch options with credentials for cookies
      const fetchOptions: RequestInit = {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      };
      
      const res = await fetch(url, fetchOptions);

      if (!res.ok) {
        if (res.status === 401 && options.on401 === 'returnNull') {
          console.log('401 Unauthorized response handled with returnNull');
          return null;
        }
        if (res.status === 404 && options.on404 === 'returnNull') {
          console.log('404 Not Found response handled with returnNull');
          return null;
        }
        
        const errorText = await res.text();
        console.error(`API error ${res.status}: ${errorText}`);
        throw new Error(errorText || `API error ${res.status}`);
      }

      // For non-JSON responses like empty responses
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        console.log('API response data:', JSON.stringify(data).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : ''));
        return data;
      }

      return null;
    } catch (error) {
      console.error(`API Request to ${url} failed:`, error);
      throw error;
    }
  };
}

// Function for making API requests
export async function apiRequest(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE', 
  endpoint: string, 
  data?: any
): Promise<Response> {
  const url = buildApiUrl(endpoint);
  
  console.log(`Making ${method} request to: ${url}`);
  if (data) {
    console.log('Request payload:', JSON.stringify(data));
  }
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include', // Important for sending cookies in cross-domain requests
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    // Log response status
    console.log(`${method} response from ${url}: ${response.status} ${response.statusText}`);
    
    // Check for response content-type
    const contentType = response.headers.get('content-type');
    console.log(`Response content-type: ${contentType}`);
    
    // Clone the response for debugging if needed
    if (!response.ok) {
      try {
        const clonedResponse = response.clone();
        const errorText = await clonedResponse.text();
        console.error(`Error response body: ${errorText}`);
      } catch (err) {
        console.error('Could not read error response body');
      }
    }
    
    return response;
  } catch (error) {
    console.error(`${method} request to ${url} failed:`, error);
    throw error;
  }
}