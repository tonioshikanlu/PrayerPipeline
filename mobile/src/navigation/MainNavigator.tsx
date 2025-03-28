import React from 'react';
// Mocking the bottom tab navigator
import HomeScreen from '../screens/HomeScreen';
import ExploreGroupsScreen from '../screens/ExploreGroupsScreen';
import PrayerRequestsScreen from '../screens/PrayerRequestsScreen';
import OrganizationsScreen from '../screens/OrganizationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Icon types for type safety
type IconProps = {
  color: string;
  size: number;
};

// Mock Icon component
const Icon: React.FC<{ name: string; color: string; size: number }> = ({ name, color, size }) => (
  <div style={{ width: size, height: size, backgroundColor: color }}>{name}</div>
);

// Mock implementation of the bottom tab navigator
type NavigatorProps = {
  children: React.ReactNode;
  initialRouteName?: string;
  screenOptions?: any;
};

type ScreenProps = {
  name: string;
  component: React.ComponentType<any>;
  options?: any;
};

const Tab = {
  Navigator: ({ children, initialRouteName, screenOptions }: NavigatorProps) => (
    <div className="bottom-tabs-container" data-initial-route={initialRouteName}>
      {children}
    </div>
  ),
  Screen: ({ name, component, options }: ScreenProps) => {
    const Component = component;
    return (
      <div className={`screen ${name}`} data-options={JSON.stringify(options)}>
        <Component />
      </div>
    );
  },
};

// Mock implementation of the stack navigator
const Stack = {
  Navigator: ({ children, screenOptions }: NavigatorProps) => (
    <div className="stack-container" data-options={JSON.stringify(screenOptions)}>
      {children}
    </div>
  ),
  Screen: ({ name, component, options }: ScreenProps) => {
    const Component = component;
    return (
      <div className={`screen ${name}`} data-options={JSON.stringify(options)}>
        <Component />
      </div>
    );
  },
};

// Mock icons
const MaterialCommunityIcons = {
  name: 'home',
  size: 24,
  color: '#000',
  render: (props: IconProps) => <Icon name="icon" color={props.color} size={props.size} />,
};

// Create bottom tab navigator (mock)
const createBottomTabNavigator = () => Tab;
const createNativeStackNavigator = () => Stack;

// Mock theme
const useTheme = () => ({
  colors: {
    primary: '#4299e1',
    background: '#ffffff',
    text: '#333333',
  },
});

const BottomTabs = createBottomTabNavigator();

// Main app navigation
export function MainNavigator() {
  const theme = useTheme();

  return (
    <BottomTabs.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <BottomTabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }: IconProps) => 
            MaterialCommunityIcons.render({ color, size })
        }}
      />
      <BottomTabs.Screen
        name="ExploreGroups"
        component={ExploreGroupsScreen}
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }: IconProps) => 
            MaterialCommunityIcons.render({ color, size })
        }}
      />
      <BottomTabs.Screen
        name="PrayerRequests"
        component={PrayerRequestsScreen}
        options={{
          title: 'Prayers',
          tabBarIcon: ({ color, size }: IconProps) => 
            MaterialCommunityIcons.render({ color, size })
        }}
      />
      <BottomTabs.Screen
        name="Organizations"
        component={OrganizationsScreen}
        options={{
          tabBarIcon: ({ color, size }: IconProps) => 
            MaterialCommunityIcons.render({ color, size })
        }}
      />
      <BottomTabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }: IconProps) => 
            MaterialCommunityIcons.render({ color, size })
        }}
      />
    </BottomTabs.Navigator>
  );
}

// Stack navigators
export function AuthNavigator() {
  const AuthStack = createNativeStackNavigator();
  
  // Import the actual screens
  const LoginScreen = require('../screens/LoginScreen').default;
  const RegisterScreen = require('../screens/RegisterScreen').default;
  const ForgotPasswordScreen = require('../screens/ForgotPasswordScreen').default;
  const ResetPasswordScreen = require('../screens/ResetPasswordScreen').default;
  
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

export function OrganizationNavigator() {
  const OrganizationStack = createNativeStackNavigator();
  
  return (
    <OrganizationStack.Navigator>
      <OrganizationStack.Screen name="OrganizationsList" component={() => <div>Organizations List</div>} />
      <OrganizationStack.Screen name="OrganizationDetails" component={() => <div>Organization Details</div>} />
      <OrganizationStack.Screen name="OrganizationOnboarding" component={() => <div>Organization Onboarding</div>} />
    </OrganizationStack.Navigator>
  );
}

export function GroupNavigator() {
  const GroupStack = createNativeStackNavigator();
  
  return (
    <GroupStack.Navigator>
      <GroupStack.Screen name="GroupsList" component={() => <div>Groups List</div>} />
      <GroupStack.Screen name="GroupDetails" component={() => <div>Group Details</div>} />
      <GroupStack.Screen name="CreateGroup" component={() => <div>Create Group</div>} />
    </GroupStack.Navigator>
  );
}

export function PrayerRequestNavigator() {
  const PrayerRequestStack = createNativeStackNavigator();
  
  return (
    <PrayerRequestStack.Navigator>
      <PrayerRequestStack.Screen name="RequestsList" component={() => <div>Requests List</div>} />
      <PrayerRequestStack.Screen name="RequestDetails" component={() => <div>Request Details</div>} />
      <PrayerRequestStack.Screen name="CreateRequest" component={() => <div>Create Request</div>} />
    </PrayerRequestStack.Navigator>
  );
}

export function ProfileNavigator() {
  const ProfileStack = createNativeStackNavigator();
  
  // Import the actual screens
  const EditProfileScreen = require('../screens/EditProfileScreen').default;
  const ChangePasswordScreen = require('../screens/ChangePasswordScreen').default;
  
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </ProfileStack.Navigator>
  );
}