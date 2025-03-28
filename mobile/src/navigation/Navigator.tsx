import React from 'react';
import { useNavigation } from './NavigationContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ExploreGroupsScreen from '../screens/ExploreGroupsScreen';
import PrayerRequestsScreen from '../screens/PrayerRequestsScreen';
import OrganizationsScreen from '../screens/OrganizationsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import RequestDetailsScreen from '../screens/RequestDetailsScreen';
import OrganizationDetailsScreen from '../screens/OrganizationDetailsScreen';
import OrganizationOnboardingScreen from '../screens/OrganizationOnboardingScreen';
import MeetingDetailsScreen from '../screens/MeetingDetailsScreen';

// Screen mapping
const screens: Record<string, React.ComponentType<any>> = {
  // Auth screens
  Login: LoginScreen,
  Register: RegisterScreen,
  ForgotPassword: ForgotPasswordScreen,
  ResetPassword: ResetPasswordScreen,
  
  // Main screens
  Home: HomeScreen,
  ExploreGroups: ExploreGroupsScreen,
  PrayerRequests: PrayerRequestsScreen,
  Organizations: OrganizationsScreen,
  Settings: SettingsScreen,
  
  // Profile screens
  EditProfile: EditProfileScreen,
  ChangePassword: ChangePasswordScreen,
  
  // Detail screens
  GroupDetails: GroupDetailsScreen,
  RequestDetails: RequestDetailsScreen,
  OrganizationDetails: OrganizationDetailsScreen,
  OrganizationOnboarding: OrganizationOnboardingScreen,
  MeetingDetails: MeetingDetailsScreen
};

interface NavigatorProps {
  authenticated: boolean;
}

const Navigator: React.FC<NavigatorProps> = ({ authenticated }) => {
  const { currentScreen, params } = useNavigation();
  
  // If not authenticated, only show auth screens
  if (!authenticated) {
    if (currentScreen === 'Login' || 
        currentScreen === 'Register' || 
        currentScreen === 'ForgotPassword' ||
        currentScreen === 'ResetPassword') {
      const Screen = screens[currentScreen];
      return <Screen {...params} />;
    }
    // Fallback to Login if trying to access protected screen
    const LoginComponent = screens['Login'];
    return <LoginComponent />;
  }
  
  // If authenticated, show requested screen
  const Screen = screens[currentScreen] || screens['Home']; // Default to Home if screen not found
  return <Screen {...params} />;
};

export default Navigator;