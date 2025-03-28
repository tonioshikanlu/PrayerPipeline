import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useNavigation } from './NavigationContext';
import { useAuth } from '../hooks/useAuth';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import OrganizationOnboardingScreen from '../screens/OrganizationOnboardingScreen';
import TabBar from './TabBar';

// Import placeholder screens
import {
  GroupsScreen,
  PrayerRequestsScreen,
  ProfileScreen,
  OrganizationsScreen,
  RequestDetailsScreen,
  MeetingsScreen,
  ForgotPasswordScreen
} from '../screens/PlaceholderScreens';

// Auth routes don't require authentication
const authRoutes = ['Login', 'Register', 'ForgotPassword', 'OrganizationOnboarding'];

// Routes that show the tab bar at the bottom
const tabRoutes = ['Home', 'Groups', 'PrayerRequests', 'Organizations', 'Profile'];

const Navigator: React.FC = () => {
  const { currentRoute } = useNavigation();
  const { user } = useAuth();
  
  // If the user is not authenticated, only show auth screens
  const isAuthRoute = authRoutes.includes(currentRoute.name);
  
  if (!user && !isAuthRoute) {
    return <LoginScreen />;
  }
  
  // Render the current screen based on the route name
  const renderScreen = () => {
    switch (currentRoute.name) {
      case 'Login':
        return <LoginScreen />;
      case 'Register':
        return <RegisterScreen />;
      case 'ForgotPassword':
        return <ForgotPasswordScreen />;
      case 'OrganizationOnboarding':
        return <OrganizationOnboardingScreen />;
      case 'Home':
        return <HomeScreen />;
      case 'Groups':
        return <GroupsScreen />;
      case 'PrayerRequests':
        return <PrayerRequestsScreen />;
      case 'Organizations':
        return <OrganizationsScreen />;
      case 'Profile':
        return <ProfileScreen />;
      case 'RequestDetails':
        return <RequestDetailsScreen />;
      case 'Meetings':
        return <MeetingsScreen />;
      default:
        return <HomeScreen />;
    }
  };
  
  const showTabBar = tabRoutes.includes(currentRoute.name);
  
  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      {showTabBar && (
        <TabBar />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  screenContainer: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
});

export default Navigator;