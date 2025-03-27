import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';
import {
  Text,
  TextInput,
  Button,
  Portal,
  Dialog,
  ActivityIndicator,
  useTheme,
  Card,
} from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/api/queryClient';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  
  const [email, setEmail] = useState('');
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password reset request mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', '/api/auth/forgot-password', { email });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to send reset email' }));
        throw new Error(error.message || 'Failed to send reset email');
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccessDialogVisible(true);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setErrorDialogVisible(true);
    },
  });

  const handleResetRequest = () => {
    if (email.trim()) {
      resetPasswordMutation.mutate(email.trim());
    } else {
      setErrorMessage('Email address is required');
      setErrorDialogVisible(true);
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialogVisible(false);
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              Reset Password
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>
          
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              
              <Button
                mode="contained"
                onPress={handleResetRequest}
                style={styles.resetButton}
                loading={resetPasswordMutation.isPending}
                disabled={!email.trim() || resetPasswordMutation.isPending}
              >
                Send Reset Link
              </Button>
              
              <Button
                mode="text"
                onPress={() => navigation.navigate('Auth')}
                style={styles.backButton}
              >
                Back to Login
              </Button>
            </Card.Content>
          </Card>
          
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/forgot-password-illustration.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
      
      {/* Success Dialog */}
      <Portal>
        <Dialog visible={successDialogVisible} onDismiss={handleSuccessClose}>
          <Dialog.Title>Email Sent</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              We've sent a password reset link to {email}. Please check your email and follow the instructions to reset your password.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSuccessClose}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Error Dialog */}
      <Portal>
        <Dialog visible={errorDialogVisible} onDismiss={() => setErrorDialogVisible(false)}>
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{errorMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setErrorDialogVisible(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  resetButton: {
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 8,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  image: {
    width: '80%',
    height: 180,
  },
});