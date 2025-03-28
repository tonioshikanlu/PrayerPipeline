import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { NavigationProvider } from './src/navigation/NavigationContext';
import { AuthProvider } from './src/context/AuthContext';
import Navigator from './src/navigation/Navigator';
import TestApiConnection from './src/TestApiConnection';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View, Text, Button, StyleSheet } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Async Storage has been extracted from react-native core',
  'ViewPropTypes will be removed from React Native',
  'VirtualizedLists should never be nested',
]);

// Toggle this for testing api connectivity
const TEST_MODE_DEFAULT = false;

export default function App() {
  const [testMode, setTestMode] = useState(TEST_MODE_DEFAULT);
  
  // Toggle between normal mode and test mode
  const toggleTestMode = () => setTestMode(!testMode);
  
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        
        {/* Button to toggle test mode */}
        <View style={styles.testModeToggle}>
          <Button
            title={testMode ? "Exit API Test" : "Test API Connection"}
            onPress={toggleTestMode}
          />
        </View>
        
        {testMode ? (
          <TestApiConnection />
        ) : (
          <AuthProvider>
            <NavigationProvider>
              <Navigator />
            </NavigationProvider>
          </AuthProvider>
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  testModeToggle: {
    position: 'absolute',
    top: 40,
    right: 10,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 5,
  },
});