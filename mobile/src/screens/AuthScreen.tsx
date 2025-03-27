import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  SegmentedButtons,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '@hooks/useAuth';

export default function AuthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  
  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerPasswordVisible, setRegisterPasswordVisible] = useState(false);
  const [registerConfirmPasswordVisible, setRegisterConfirmPasswordVisible] = useState(false);
  
  // Error handling
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigation.navigate('Main');
    }
  }, [user, navigation]);

  // Validate registration form
  const validateRegisterPassword = () => {
    if (registerPassword.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return '';
  };

  const validateConfirmPassword = () => {
    if (registerConfirmPassword && registerPassword !== registerConfirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const isLoginFormValid = loginUsername.trim() && loginPassword.trim();
  
  const isRegisterFormValid = 
    registerName.trim() && 
    registerUsername.trim() && 
    registerEmail.trim() && 
    registerPassword.length >= 8 && 
    registerPassword === registerConfirmPassword;

  const handleLogin = () => {
    if (isLoginFormValid) {
      loginMutation.mutate(
        { username: loginUsername, password: loginPassword },
        {
          onError: (error) => {
            setErrorMessage(error.message || 'Login failed. Please check your credentials.');
            setErrorDialogVisible(true);
          }
        }
      );
    }
  };

  const handleRegister = () => {
    if (isRegisterFormValid) {
      registerMutation.mutate(
        {
          name: registerName,
          username: registerUsername,
          email: registerEmail,
          password: registerPassword,
        },
        {
          onError: (error) => {
            setErrorMessage(error.message || 'Registration failed. Please try again.');
            setErrorDialogVisible(true);
          }
        }
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* App Logo and Title */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/app-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text variant="headlineLarge" style={styles.appTitle}>
              Prayer Pipeline
            </Text>
            <Text variant="bodyLarge" style={styles.appSubtitle}>
              Connect, Share, and Pray Together
            </Text>
          </View>
          
          {/* Auth Card */}
          <Card style={styles.authCard}>
            <Card.Content>
              <SegmentedButtons
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'login' | 'register')}
                buttons={[
                  { value: 'login', label: 'Login' },
                  { value: 'register', label: 'Register' },
                ]}
                style={styles.tabButtons}
              />
              
              {/* Login Form */}
              {activeTab === 'login' && (
                <View style={styles.formContainer}>
                  <TextInput
                    label="Username"
                    value={loginUsername}
                    onChangeText={setLoginUsername}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="none"
                  />
                  
                  <TextInput
                    label="Password"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry={!loginPasswordVisible}
                    right={
                      <TextInput.Icon
                        icon={loginPasswordVisible ? 'eye-off' : 'eye'}
                        onPress={() => setLoginPasswordVisible(!loginPasswordVisible)}
                      />
                    }
                    mode="outlined"
                    style={styles.input}
                  />
                  
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('ForgotPassword')}
                    style={styles.forgotPasswordButton}
                  >
                    Forgot Password?
                  </Button>
                  
                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    style={styles.submitButton}
                    loading={loginMutation.isPending}
                    disabled={!isLoginFormValid || loginMutation.isPending}
                  >
                    Login
                  </Button>
                </View>
              )}
              
              {/* Register Form */}
              {activeTab === 'register' && (
                <View style={styles.formContainer}>
                  <TextInput
                    label="Full Name"
                    value={registerName}
                    onChangeText={setRegisterName}
                    mode="outlined"
                    style={styles.input}
                  />
                  
                  <TextInput
                    label="Username"
                    value={registerUsername}
                    onChangeText={setRegisterUsername}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="none"
                  />
                  
                  <TextInput
                    label="Email Address"
                    value={registerEmail}
                    onChangeText={setRegisterEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  
                  <TextInput
                    label="Password"
                    value={registerPassword}
                    onChangeText={setRegisterPassword}
                    secureTextEntry={!registerPasswordVisible}
                    right={
                      <TextInput.Icon
                        icon={registerPasswordVisible ? 'eye-off' : 'eye'}
                        onPress={() => setRegisterPasswordVisible(!registerPasswordVisible)}
                      />
                    }
                    mode="outlined"
                    style={styles.input}
                  />
                  {registerPassword ? (
                    <HelperText type={validateRegisterPassword() ? 'error' : 'info'} visible={!!registerPassword}>
                      {validateRegisterPassword() || 'Password strength: ' + (registerPassword.length >= 12 ? 'Strong' : registerPassword.length >= 8 ? 'Medium' : 'Weak')}
                    </HelperText>
                  ) : null}
                  
                  <TextInput
                    label="Confirm Password"
                    value={registerConfirmPassword}
                    onChangeText={setRegisterConfirmPassword}
                    secureTextEntry={!registerConfirmPasswordVisible}
                    right={
                      <TextInput.Icon
                        icon={registerConfirmPasswordVisible ? 'eye-off' : 'eye'}
                        onPress={() => setRegisterConfirmPasswordVisible(!registerConfirmPasswordVisible)}
                      />
                    }
                    mode="outlined"
                    style={styles.input}
                  />
                  {registerConfirmPassword ? (
                    <HelperText type={validateConfirmPassword() ? 'error' : 'info'} visible={!!registerConfirmPassword}>
                      {validateConfirmPassword() || 'Passwords match'}
                    </HelperText>
                  ) : null}
                  
                  <Button
                    mode="contained"
                    onPress={handleRegister}
                    style={styles.submitButton}
                    loading={registerMutation.isPending}
                    disabled={!isRegisterFormValid || registerMutation.isPending}
                  >
                    Register
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  authCard: {
    marginBottom: 32,
  },
  tabButtons: {
    marginBottom: 16,
  },
  formContainer: {
    paddingVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});