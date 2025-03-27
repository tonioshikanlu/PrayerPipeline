import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
interface QueryFnOptions {
  on401?: UnauthorizedBehavior;
  params?: Record<string, any>;
}

export const getQueryFn: <T>(options?: QueryFnOptions) => QueryFunction<T> =
  (options = {}) =>
  async ({ queryKey }) => {
    const { on401: unauthorizedBehavior = "throw", params = {} } = options;
    
    // Build URL with query parameters
    let url: string;
    
    // Handle array query keys differently based on structure
    if (Array.isArray(queryKey) && queryKey.length > 1) {
      // Special case for paths with IDs embedded in them, like '/api/groups/:groupId/meetings'
      if (queryKey.length >= 3 && queryKey[0] === '/api/groups' && queryKey[2] === 'meetings') {
        url = `/api/groups/${queryKey[1]}/meetings`;
      }
      // Special case for meetings notes
      else if (queryKey.length >= 3 && queryKey[0] === '/api/meetings' && queryKey[2] === 'notes') {
        url = `/api/meetings/${queryKey[1]}/notes`;
      }
      // Special case for specific meeting by ID
      else if (queryKey.length === 2 && queryKey[0] === '/api/meetings') {
        url = `/api/meetings/${queryKey[1]}`;
      }
      // Default case: treat second param as organizationId
      else if (queryKey[1] !== undefined && queryKey[1] !== null) {
        url = `${queryKey[0]}${queryKey[0].includes('?') ? '&' : '?'}organizationId=${queryKey[1]}`;
      } 
      else {
        url = queryKey[0] as string;
      }
    } else {
      // Simple case: just use the first element as the URL
      url = queryKey[0] as string;
    }
    
    // Add additional parameters if provided
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      
      // Add all params to the URL
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
