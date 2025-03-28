import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationProvider } from './src/navigation/NavigationContext';
import Navigator from './src/navigation/Navigator';
import TabBar from './src/navigation/TabBar';
import { AuthProvider } from './src/context/AuthContext';
import { useAuth } from './src/hooks/useAuth';

// Wrapper component to access auth state within context
const AppContent = () => {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationProvider initialScreen={isAuthenticated ? 'Home' : 'Login'}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Navigator authenticated={isAuthenticated} />
        </View>
        
        {isAuthenticated && (
          <View style={styles.footer}>
            <TabBar />
          </View>
        )}
      </View>
    </NavigationProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});