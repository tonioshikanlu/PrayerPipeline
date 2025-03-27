import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@navigation/MainNavigator';
import {
  Text,
  TextInput,
  Button,
  Portal,
  Dialog,
  useTheme,
  Card,
  HelperText,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/api/queryClient';
import { useAuth } from '@hooks/useAuth';

type NavigationProps = NativeStackNavigationProp<SettingsStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen() {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();
  const { user } = useAuth();
  
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  // Success state
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);
  
  // Error handling
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Validate password
  const validateNewPassword = () => {
    if (newPassword.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return '';
  };

  const validateConfirmPassword = () => {
    if (confirmPassword && newPassword !== confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  // Update password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await apiRequest('POST', '/api/user/change-password', data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to change password' }));
        throw new Error(error.message || 'Failed to change password');
      }
      return res.json();
    },
    onSuccess: () => {
      // Show success dialog
      setSuccessDialogVisible(true);
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setErrorDialogVisible(true);
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword) {
      setErrorMessage('Please enter your current password');
      setErrorDialogVisible(true);
      return;
    }

    const passwordError = validateNewPassword();
    if (passwordError) {
      setErrorMessage(passwordError);
      setErrorDialogVisible(true);
      return;
    }

    const confirmError = validateConfirmPassword();
    if (confirmError) {
      setErrorMessage(confirmError);
      setErrorDialogVisible(true);
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogVisible(false);
    navigation.goBack();
  };

  const passwordError = validateNewPassword();
  const confirmPasswordError = validateConfirmPassword();
  const isFormValid = 
    currentPassword.trim() && 
    newPassword.length >= 8 && 
    newPassword === confirmPassword;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>Change Password</Text>
              
              <View style={styles.formSection}>
                <Text variant="bodyMedium" style={styles.sectionDescription}>
                  For security reasons, please enter your current password before setting a new one
                </Text>
                
                <TextInput
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!currentPasswordVisible}
                  right={
                    <TextInput.Icon
                      icon={currentPasswordVisible ? 'eye-off' : 'eye'}
                      onPress={() => setCurrentPasswordVisible(!currentPasswordVisible)}
                    />
                  }
                  mode="outlined"
                  style={styles.input}
                />
                
                <Divider style={styles.divider} />
                
                <TextInput
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!newPasswordVisible}
                  right={
                    <TextInput.Icon
                      icon={newPasswordVisible ? 'eye-off' : 'eye'}
                      onPress={() => setNewPasswordVisible(!newPasswordVisible)}
                    />
                  }
                  mode="outlined"
                  style={styles.input}
                />
                {newPassword ? (
                  <HelperText type={passwordError ? 'error' : 'info'} visible={!!newPassword}>
                    {passwordError || 'Password strength: ' + (newPassword.length >= 12 ? 'Strong' : newPassword.length >= 8 ? 'Medium' : 'Weak')}
                  </HelperText>
                ) : null}
                
                <TextInput
                  label="Confirm New Password"
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
              </View>
              
              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleChangePassword}
                  style={styles.submitButton}
                  loading={changePasswordMutation.isPending}
                  disabled={!isFormValid || changePasswordMutation.isPending}
                >
                  Update Password
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
      
      {/* Success Dialog */}
      <Portal>
        <Dialog visible={successDialogVisible} onDismiss={handleSuccessDialogClose}>
          <Dialog.Title>Password Updated</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Your password has been successfully updated. You'll need to use your new password the next time you log in.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSuccessDialogClose}>OK</Button>
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
    </KeyboardAvoidingView>
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
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  formSection: {
    marginBottom: 16,
  },
  sectionDescription: {
    marginBottom: 16,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 2,
  },
});