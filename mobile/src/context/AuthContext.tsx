import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from '../mocks/expo-secure-store';

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
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
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from secure storage on app start
    const loadUser = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        const storedToken = await SecureStore.getItemAsync('token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // In a real app, this would make an API call
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any username/password combo
      // where password is at least 6 characters
      if (password.length < 6) {
        Alert.alert('Error', 'Invalid credentials');
        return false;
      }
      
      // Mock user data
      const userData: User = {
        id: 1,
        username,
        email: `${username}@example.com`,
        name: username.charAt(0).toUpperCase() + username.slice(1),
      };
      
      // Store in secure storage
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      await SecureStore.setItemAsync('token', 'mock-jwt-token');
      
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
      // In a real app, this would make an API call
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate input
      if (!name || !email || !username || password.length < 6) {
        Alert.alert('Error', 'Please fill all fields. Password must be at least 6 characters.');
        return false;
      }
      
      // Mock user data
      const userData: User = {
        id: 1,
        username,
        email,
        name,
      };
      
      // Store in secure storage
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      await SecureStore.setItemAsync('token', 'mock-jwt-token');
      
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
      // Remove from secure storage
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('token');
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
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
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to update your profile.');
        return false;
      }
      
      // Update user data
      const updatedUser = { ...user, ...data };
      
      // Store in secure storage
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
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
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate password
      if (newPassword.length < 6) {
        Alert.alert('Error', 'New password must be at least 6 characters.');
        return false;
      }
      
      // For demo, any currentPassword is accepted
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};