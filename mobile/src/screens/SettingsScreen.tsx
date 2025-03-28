import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleEditProfile = () => {
    // Navigate to EditProfile screen
    console.log('Navigate to Edit Profile');
  };

  const handleChangePassword = () => {
    // Navigate to ChangePassword screen
    console.log('Navigate to Change Password');
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Navigation should happen automatically when auth state changes
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={styles.option} onPress={handleEditProfile}>
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handleChangePassword}>
          <Text style={styles.optionText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.option, styles.logoutOption]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={[styles.optionText, styles.logoutText]}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    padding: 16,
  },
  option: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  optionText: {
    fontSize: 16,
    color: '#4a5568',
  },
  logoutOption: {
    marginTop: 24,
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  logoutText: {
    color: '#B91C1C',
  },
});