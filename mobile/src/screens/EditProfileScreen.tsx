import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
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
  Avatar,
  HelperText,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/api/queryClient';
import { useAuth } from '@hooks/useAuth';

type NavigationProps = NativeStackNavigationProp<SettingsStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  
  // Error handling
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      username: string;
      email: string;
      bio: string;
    }) => {
      const res = await apiRequest('PUT', '/api/user/profile', data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to update profile' }));
        throw new Error(error.message || 'Failed to update profile');
      }
      return res.json();
    },
    onSuccess: () => {
      // Refresh user data
      if (refreshUser) {
        refreshUser();
      }
      
      // Navigate back to settings
      navigation.goBack();
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setErrorDialogVisible(true);
    },
  });

  const handleUpdateProfile = () => {
    if (!name.trim()) {
      setErrorMessage('Please provide your name');
      setErrorDialogVisible(true);
      return;
    }

    if (!username.trim()) {
      setErrorMessage('Please provide a username');
      setErrorDialogVisible(true);
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please provide an email address');
      setErrorDialogVisible(true);
      return;
    }

    updateProfileMutation.mutate({
      name,
      username,
      email,
      bio,
    });
  };

  if (!user) {
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
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>Edit Profile</Text>
              
              <View style={styles.profileImageContainer}>
                <Avatar.Text 
                  size={80} 
                  label={name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  style={styles.profileImage}
                />
                <Button 
                  mode="text" 
                  compact 
                  onPress={() => {
                    // We would implement image upload functionality here
                    // For now, just show an error message
                    setErrorMessage('Image upload functionality coming soon');
                    setErrorDialogVisible(true);
                  }}
                >
                  Change Photo
                </Button>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Account Information</Text>
                
                <TextInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                />
                
                <TextInput
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  mode="outlined"
                  style={styles.input}
                  autoCapitalize="none"
                />
                
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>About You</Text>
                
                <TextInput
                  label="Bio"
                  value={bio}
                  onChangeText={setBio}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                  maxLength={200}
                />
                <HelperText type="info" visible>
                  {200 - bio.length} characters remaining
                </HelperText>
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
                  onPress={handleUpdateProfile}
                  style={styles.submitButton}
                  loading={updateProfileMutation.isPending}
                  disabled={!name.trim() || !username.trim() || !email.trim() || updateProfileMutation.isPending}
                >
                  Save Changes
                </Button>
              </View>
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
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    marginBottom: 8,
  },
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    marginBottom: 8,
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