import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from '../mocks/expo-secure-store';
import { apiRequest } from '../api/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  organizations?: { id: number; name: string }[];
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, username: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from API on app start
    const loadUser = async () => {
      try {
        // First check if we have a stored user (for faster initial load)
        const storedUser = await SecureStore.getItemAsync('user');
        
        if (storedUser) {
          // Set the stored user first for immediate UI feedback
          setUser(JSON.parse(storedUser));
        }
        
        // Then fetch the latest user data from the API
        const response = await apiRequest('GET', '/api/user');
        
        if (!response.ok) {
          // If unauthorized, clear local user data
          if (response.status === 401) {
            await SecureStore.deleteItemAsync('user');
            setUser(null);
          }
        } else {
          // Update with the latest user data from API
          const userData = await response.json();
          await SecureStore.setItemAsync('user', JSON.stringify(userData));
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Keep the stored user if there's an API error
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/login', { username, password });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Invalid credentials');
        return false;
      }
      
      const userData = await response.json();
      
      // Store in secure storage
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      // We don't need to store a token as we're using cookies
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    name: string,
    email: string,
    username: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Validate input
      if (!name || !email || !username || password.length < 6) {
        Alert.alert('Error', 'Please fill all fields. Password must be at least 6 characters.');
        return false;
      }
      
      const response = await apiRequest('POST', '/api/register', {
        name,
        email,
        username,
        password
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Registration failed');
        return false;
      }
      
      const userData = await response.json();
      
      // Store in secure storage
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      // We don't need to store a token as we're using cookies
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Call the logout API endpoint
      const response = await apiRequest('POST', '/api/logout');
      
      // Even if the API call fails, we should clean up local data
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('token');
      
      setUser(null);
      
      if (!response.ok) {
        console.warn('Logout API call failed, but local state was cleared');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('token');
      setUser(null);
      
      Alert.alert('Warning', 'There was an issue signing out from the server, but you have been logged out locally.');
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Always return success for demo
      Alert.alert('Success', 'If an account exists with that email, a password reset link has been sent.');
      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', 'Failed to process request. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate password
      if (newPassword.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters.');
        return false;
      }
      
      // Always return success for demo
      Alert.alert('Success', 'Your password has been reset successfully.');
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'Failed to reset password. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to update your profile.');
        return false;
      }
      
      // We'll use the /api/user/profile endpoint (assumed to exist)
      // If such endpoint doesn't exist, we would need to create it on the backend
      const response = await apiRequest('PATCH', '/api/user/profile', data);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to update profile');
        return false;
      }
      
      // Get updated user data
      await refreshUser();
      
      Alert.alert('Success', 'Profile updated successfully.');
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Validate password
      if (newPassword.length < 6) {
        Alert.alert('Error', 'New password must be at least 6 characters.');
        return false;
      }
      
      // We'll use the /api/user/password endpoint (assumed to exist)
      // If such endpoint doesn't exist, we would need to create it on the backend
      const response = await apiRequest('POST', '/api/user/password', {
        currentPassword,
        newPassword
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to change password');
        return false;
      }
      
      Alert.alert('Success', 'Password changed successfully.');
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Fetch current user data from API
      const response = await apiRequest('GET', '/api/user');
      
      if (!response.ok) {
        // If unauthorized, clear local user data
        if (response.status === 401) {
          await SecureStore.deleteItemAsync('user');
          await SecureStore.deleteItemAsync('token');
          setUser(null);
          return;
        }
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      
      // Store updated user in secure storage
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};