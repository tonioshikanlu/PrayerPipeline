import { useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';

interface QueryParams {
  [key: string]: string;
  token?: string;
  setQueryParam: (key: string, value: string) => void;
  removeQueryParam: (key: string) => void;
}

export function useQueryParams(): QueryParams {
  const [location] = useLocation();
  
  const queryParams = useMemo(() => {
    const url = new URL(window.location.href);
    const params: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }, [location]);
  
  const setQueryParam = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url.toString());
  }, []);
  
  const removeQueryParam = useCallback((key: string) => {
    const url = new URL(window.location.href);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url.toString());
  }, []);
  
  return {
    ...queryParams,
    setQueryParam,
    removeQueryParam
  };
}