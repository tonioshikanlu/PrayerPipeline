import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';
import {
  Text,
  TextInput,
  Button,
  Portal,
  Dialog,
  useTheme,
  Card,
  HelperText,
} from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/api/queryClient';

export default function ResetPasswordScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ResetPassword'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const { token } = route.params;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const res = await apiRequest('POST', '/api/auth/reset-password', data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to reset password' }));
        throw new Error(error.message || 'Failed to reset password');
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

  const validatePassword = () => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return '';
  };

  const validateConfirmPassword = () => {
    if (confirmPassword && password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleResetPassword = () => {
    const passwordError = validatePassword();
    const confirmError = validateConfirmPassword();
    
    if (passwordError) {
      setErrorMessage(passwordError);
      setErrorDialogVisible(true);
      return;
    }
    
    if (confirmError) {
      setErrorMessage(confirmError);
      setErrorDialogVisible(true);
      return;
    }
    
    resetPasswordMutation.mutate({
      token,
      password,
    });
  };

  const handleSuccessClose = () => {
    setSuccessDialogVisible(false);
    navigation.navigate('Auth');
  };

  const passwordError = validatePassword();
  const confirmPasswordError = validateConfirmPassword();
  const isFormValid = password.length >= 8 && password === confirmPassword;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              Create New Password
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Your password must be at least 8 characters long.
            </Text>
          </View>
          
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="New Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                right={
                  <TextInput.Icon
                    icon={passwordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  />
                }
                mode="outlined"
                style={styles.input}
              />
              {password ? (
                <HelperText type={passwordError ? 'error' : 'info'} visible={!!password}>
                  {passwordError || 'Password strength: ' + (password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Medium' : 'Weak')}
                </HelperText>
              ) : null}
              
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible}
                right={
                  <TextInput.Icon
                    icon={confirmPasswordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  />
                }
                mode="outlined"
                style={styles.input}
              />
              {confirmPassword ? (
                <HelperText type={confirmPasswordError ? 'error' : 'info'} visible={!!confirmPassword}>
                  {confirmPasswordError || 'Passwords match'}
                </HelperText>
              ) : null}
              
              <Button
                mode="contained"
                onPress={handleResetPassword}
                style={styles.resetButton}
                loading={resetPasswordMutation.isPending}
                disabled={!isFormValid || resetPasswordMutation.isPending}
              >
                Reset Password
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
              source={require('@/assets/reset-password-illustration.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
      
      {/* Success Dialog */}
      <Portal>
        <Dialog visible={successDialogVisible} onDismiss={handleSuccessClose}>
          <Dialog.Title>Password Reset</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Your password has been reset successfully. You can now log in with your new password.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSuccessClose}>Login</Button>
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
    marginTop: 8,
  },
  resetButton: {
    marginTop: 16,
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