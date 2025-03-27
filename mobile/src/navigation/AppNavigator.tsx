import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@hooks/useAuth';
import AuthScreen from '@screens/AuthScreen';
import ForgotPasswordScreen from '@screens/ForgotPasswordScreen';
import ResetPasswordScreen from '@screens/ResetPasswordScreen';
import MainNavigator from './MainNavigator';
import OrganizationOnboardingScreen from '@screens/OrganizationOnboardingScreen';

// Type definitions for our route parameters
export type RootStackParamList = {
  Auth: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  OrganizationOnboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigator that handles authentication flow
 */
export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={() => null} />
      </Stack.Navigator>
    );
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth screens
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : (
        // Main app screens
        <>
          {/* Onboarding screen for users without an organization */}
          {!user.organizationId && (
            <Stack.Screen
              name="OrganizationOnboarding"
              component={OrganizationOnboardingScreen}
            />
          )}
          <Stack.Screen name="Main" component={MainNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
}