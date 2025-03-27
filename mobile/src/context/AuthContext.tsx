import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, insertUserSchema } from '@shared/schema';
import { z } from 'zod';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { apiRequest, getQueryFn, queryClient } from '@/api/queryClient';

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  name: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use query to fetch the current user if already authenticated
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error: error || null,
        loginMutation,
        registerMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Login mutation
function useLoginMutation() {
  return useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiRequest('POST', '/api/login', credentials);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/user'], user);
    },
    onError: (error: Error) => {
      Alert.alert('Login Failed', error.message);
    },
  });
}

// Register mutation
function useRegisterMutation() {
  const registerSchema = insertUserSchema.extend({
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });
  
  return useMutation({
    mutationFn: async (credentials: RegisterData) => {
      // Validate with Zod schema
      registerSchema.parse(credentials);
      
      const response = await apiRequest('POST', '/api/register', credentials);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }
      
      return response.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/user'], user);
    },
    onError: (error: Error) => {
      Alert.alert('Registration Failed', error.message);
    },
  });
}

// Logout mutation
function useLogoutMutation() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/logout');
      if (!response.ok) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      Alert.alert('Logout Failed', error.message);
    },
  });
}