import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, InsertUserSchema } from '../shared/schema';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '../api/queryClient';

type InsertUser = z.infer<typeof InsertUserSchema>;

type LoginData = Pick<InsertUser, 'username' | 'password'>;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (data: LoginData) => Promise<void>;
  signUp: (data: InsertUser) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  // Fetch the current user
  const { 
    data: user, 
    isLoading,
    error: queryError
  } = useQuery<User | undefined, Error>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // Update error state when query error changes
  useEffect(() => {
    if (queryError) {
      setError(queryError);
    }
  }, [queryError]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest('POST', '/api/login', credentials);
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to login');
      }
      
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(['/api/user'], userData);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest('POST', '/api/register', userData);
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to register');
      }
      
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(['/api/user'], userData);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/logout');
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to logout');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error);
    },
  });

  // Auth methods
  const signIn = useCallback(async (credentials: LoginData) => {
    await loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const signUp = useCallback(async (userData: InsertUser) => {
    await registerMutation.mutateAsync(userData);
  }, [registerMutation]);

  const signOut = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const value = {
    user: user ?? null,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};