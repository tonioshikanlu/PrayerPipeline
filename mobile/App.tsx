import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { MainNavigator } from './src/navigation/MainNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AuthNavigator } from './src/navigation/MainNavigator';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simulate checking if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      // This would typically check for a token in secure storage
      // For now, we'll simulate a delay and set to not authenticated
      setTimeout(() => {
        setIsAuthenticated(false);
        setIsLoading(false);
      }, 1000);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299e1" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <View style={styles.container}>
        {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});