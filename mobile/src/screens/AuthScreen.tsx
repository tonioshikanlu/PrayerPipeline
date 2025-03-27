import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';
import { Button, Text, TextInput, Surface, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@hooks/useAuth';

type LoginInputs = {
  username: string;
  password: string;
};

type RegisterInputs = {
  username: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { loginMutation, registerMutation } = useAuth();
  
  // Login form
  const loginForm = useForm<LoginInputs>({
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterInputs>({
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  const onSubmitLogin = async (data: LoginInputs) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  const onSubmitRegister = async (data: RegisterInputs) => {
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      });
      return;
    }
    
    // Register the user
    try {
      const { confirmPassword, ...registerData } = data;
      await registerMutation.mutateAsync(registerData);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };
  
  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          {/* Hero section */}
          <View style={styles.heroContainer}>
            <Text variant="displaySmall" style={styles.title}>Prayer Pipeline</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Connect, Pray, Grow. Manage prayer requests and strengthen your spiritual community.
            </Text>
          </View>
          
          {/* Form section */}
          <Surface style={styles.formContainer}>
            <View style={styles.tabContainer}>
              <Button
                mode={isLogin ? 'contained' : 'outlined'}
                onPress={() => setIsLogin(true)}
                style={styles.tabButton}
              >
                Login
              </Button>
              <Button
                mode={!isLogin ? 'contained' : 'outlined'}
                onPress={() => setIsLogin(false)}
                style={styles.tabButton}
              >
                Register
              </Button>
            </View>
            
            {isLogin ? (
              // Login Form
              <View style={styles.form}>
                <Controller
                  control={loginForm.control}
                  rules={{ required: 'Username is required' }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        label="Username"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={!!error}
                        style={styles.input}
                      />
                      {error && <Text style={styles.errorText}>{error.message}</Text>}
                    </>
                  )}
                  name="username"
                />
                
                <Controller
                  control={loginForm.control}
                  rules={{ required: 'Password is required' }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        label="Password"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        secureTextEntry
                        error={!!error}
                        style={styles.input}
                      />
                      {error && <Text style={styles.errorText}>{error.message}</Text>}
                    </>
                  )}
                  name="password"
                />
                
                <Button
                  mode="text"
                  onPress={navigateToForgotPassword}
                  style={styles.forgotPasswordButton}
                >
                  Forgot Password?
                </Button>
                
                <Button
                  mode="contained"
                  onPress={loginForm.handleSubmit(onSubmitLogin)}
                  style={styles.submitButton}
                  loading={loginMutation.isPending}
                  disabled={loginMutation.isPending}
                >
                  Login
                </Button>
              </View>
            ) : (
              // Register Form
              <View style={styles.form}>
                <Controller
                  control={registerForm.control}
                  rules={{ required: 'Username is required' }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        label="Username"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={!!error}
                        style={styles.input}
                      />
                      {error && <Text style={styles.errorText}>{error.message}</Text>}
                    </>
                  )}
                  name="username"
                />
                
                <Controller
                  control={registerForm.control}
                  rules={{ required: 'Name is required' }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        label="Full Name"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={!!error}
                        style={styles.input}
                      />
                      {error && <Text style={styles.errorText}>{error.message}</Text>}
                    </>
                  )}
                  name="name"
                />
                
                <Controller
                  control={registerForm.control}
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        label="Email"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        error={!!error}
                        style={styles.input}
                      />
                      {error && <Text style={styles.errorText}>{error.message}</Text>}
                    </>
                  )}
                  name="email"
                />
                
                <Controller
                  control={registerForm.control}
                  rules={{
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        label="Password"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        secureTextEntry
                        error={!!error}
                        style={styles.input}
                      />
                      {error && <Text style={styles.errorText}>{error.message}</Text>}
                    </>
                  )}
                  name="password"
                />
                
                <Controller
                  control={registerForm.control}
                  rules={{ required: 'Please confirm your password' }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        label="Confirm Password"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        secureTextEntry
                        error={!!error}
                        style={styles.input}
                      />
                      {error && <Text style={styles.errorText}>{error.message}</Text>}
                    </>
                  )}
                  name="confirmPassword"
                />
                
                <Button
                  mode="contained"
                  onPress={registerForm.handleSubmit(onSubmitRegister)}
                  style={styles.submitButton}
                  loading={registerMutation.isPending}
                  disabled={registerMutation.isPending}
                >
                  Register
                </Button>
              </View>
            )}
          </Surface>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  heroContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginHorizontal: 20,
  },
  formContainer: {
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginVertical: 10,
  },
  submitButton: {
    marginTop: 20,
  },
});