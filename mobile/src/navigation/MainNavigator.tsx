import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text } from 'react-native';

// Import screens
import HomeScreen from '@screens/HomeScreen';
import PrayerRequestsScreen from '@screens/PrayerRequestsScreen';
import ExploreGroupsScreen from '@screens/ExploreGroupsScreen';
import SettingsScreen from '@screens/SettingsScreen';
import GroupDetailsScreen from '@screens/GroupDetailsScreen';
import RequestDetailsScreen from '@screens/RequestDetailsScreen';
import MeetingDetailsScreen from '@screens/MeetingDetailsScreen';
import OrganizationsScreen from '@screens/OrganizationsScreen';
import OrganizationDetailsScreen from '@screens/OrganizationDetailsScreen';

// Type definitions for our route parameters
export type HomeStackParamList = {
  Home: undefined;
  GroupDetails: { groupId: number };
  RequestDetails: { requestId: number };
  MeetingDetails: { meetingId: number };
};

export type PrayerRequestsStackParamList = {
  PrayerRequests: undefined;
  RequestDetails: { requestId: number };
  CreateRequest: undefined;
  EditRequest: { requestId: number };
};

export type ExploreStackParamList = {
  Explore: undefined;
  GroupDetails: { groupId: number };
  CreateGroup: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  Organizations: undefined;
  OrganizationDetails: { organizationId: number };
  EditProfile: undefined;
  ChangePassword: undefined;
};

// Create stack navigators for each tab
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const PrayerRequestsStack = createNativeStackNavigator<PrayerRequestsStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const Tab = createBottomTabNavigator();

// Stack screens for Home tab
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <HomeStack.Screen
        name="GroupDetails"
        component={GroupDetailsScreen}
        options={({ route }) => ({ title: 'Group Details' })}
      />
      <HomeStack.Screen
        name="RequestDetails"
        component={RequestDetailsScreen}
        options={({ route }) => ({ title: 'Prayer Request' })}
      />
      <HomeStack.Screen
        name="MeetingDetails"
        component={MeetingDetailsScreen}
        options={({ route }) => ({ title: 'Meeting Details' })}
      />
    </HomeStack.Navigator>
  );
}

// Stack screens for Prayer Requests tab
function PrayerRequestsStackNavigator() {
  return (
    <PrayerRequestsStack.Navigator>
      <PrayerRequestsStack.Screen
        name="PrayerRequests"
        component={PrayerRequestsScreen}
        options={{ title: 'Prayer Requests' }}
      />
      <PrayerRequestsStack.Screen
        name="RequestDetails"
        component={RequestDetailsScreen}
        options={({ route }) => ({ title: 'Prayer Request' })}
      />
    </PrayerRequestsStack.Navigator>
  );
}

// Stack screens for Explore tab
function ExploreStackNavigator() {
  return (
    <ExploreStack.Navigator>
      <ExploreStack.Screen
        name="Explore"
        component={ExploreGroupsScreen}
        options={{ title: 'Explore Groups' }}
      />
      <ExploreStack.Screen
        name="GroupDetails"
        component={GroupDetailsScreen}
        options={({ route }) => ({ title: 'Group Details' })}
      />
    </ExploreStack.Navigator>
  );
}

// Stack screens for Settings tab
function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen
        name="Organizations"
        component={OrganizationsScreen}
        options={{ title: 'Organizations' }}
      />
      <SettingsStack.Screen
        name="OrganizationDetails"
        component={OrganizationDetailsScreen}
        options={({ route }) => ({ title: 'Organization Details' })}
      />
    </SettingsStack.Navigator>
  );
}

// Main tab navigator
export default function MainNavigator() {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PrayerRequestsTab"
        component={PrayerRequestsStackNavigator}
        options={{
          tabBarLabel: 'Prayers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="prayer" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreStackNavigator}
        options={{
          tabBarLabel: 'Groups',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}