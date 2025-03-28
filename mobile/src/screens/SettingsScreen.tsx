import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../navigation/NavigationContext';

const SettingsScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const { navigate } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            setIsLoading(true);
            await signOut();
            setIsLoading(false);
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarText}>{user?.name?.[0] || '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileUsername}>@{user?.username}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigate('EditProfile')}
          >
            <Text style={styles.profileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <View style={styles.settingsList}>
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => navigate('ChangePassword')}
          >
            <Text style={styles.settingsItemText}>Change Password</Text>
            <Text style={styles.settingsItemIcon}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy details would be shown here.')}
          >
            <Text style={styles.settingsItemText}>Privacy Policy</Text>
            <Text style={styles.settingsItemIcon}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => Alert.alert('Terms of Service', 'Terms of service details would be shown here.')}
          >
            <Text style={styles.settingsItemText}>Terms of Service</Text>
            <Text style={styles.settingsItemIcon}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingsList}>
          <View style={styles.settingsToggleItem}>
            <Text style={styles.settingsItemText}>Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#6366F1' }}
              thumbColor="#ffffff"
            />
          </View>
          
          <View style={styles.settingsToggleItem}>
            <Text style={styles.settingsItemText}>Email Notifications</Text>
            <Switch
              value={emailNotificationsEnabled}
              onValueChange={setEmailNotificationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#6366F1' }}
              thumbColor="#ffffff"
            />
          </View>
          
          <View style={styles.settingsToggleItem}>
            <Text style={styles.settingsItemText}>Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#d1d5db', true: '#6366F1' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </View>
      
      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
      
      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Prayer Pipeline v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#6366F1',
    fontWeight: '500',
  },
  settingsList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingsToggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingsItemText: {
    fontSize: 16,
    color: '#111827',
  },
  settingsItemIcon: {
    fontSize: 18,
    color: '#6B7280',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appVersion: {
    color: '#9ca3af',
    fontSize: 14,
  },
});

export default SettingsScreen;