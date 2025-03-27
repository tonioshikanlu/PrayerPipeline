import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/AppNavigator';
import {
  Text,
  Card,
  Button,
  Portal,
  Dialog,
  TextInput,
  ActivityIndicator,
  useTheme,
  SegmentedButtons,
  Divider,
} from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import { apiRequest } from '@/api/queryClient';

export default function OrganizationOnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const { refreshUser } = useAuth();
  
  const [activeOption, setActiveOption] = useState<'create' | 'join'>('create');
  
  // Create organization state
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  
  // Join organization state
  const [inviteCode, setInviteCode] = useState('');

  // Error handling
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; website: string }) => {
      const res = await apiRequest('POST', '/api/organizations', data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to create organization' }));
        throw new Error(error.message || 'Failed to create organization');
      }
      return res.json();
    },
    onSuccess: () => {
      refreshUser();
      navigation.navigate('Main');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setErrorDialogVisible(true);
    },
  });

  // Join with invite code mutation
  const joinWithCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest('POST', '/api/organizations/join', { code });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Invalid invite code' }));
        throw new Error(error.message || 'Invalid invite code');
      }
      return res.json();
    },
    onSuccess: () => {
      refreshUser();
      navigation.navigate('Main');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setErrorDialogVisible(true);
    },
  });

  const handleCreateOrg = () => {
    if (orgName.trim()) {
      createOrgMutation.mutate({
        name: orgName.trim(),
        description: orgDescription.trim(),
        website: orgWebsite.trim(),
      });
    } else {
      setErrorMessage('Organization name is required');
      setErrorDialogVisible(true);
    }
  };

  const handleJoinWithCode = () => {
    if (inviteCode.trim()) {
      joinWithCodeMutation.mutate(inviteCode.trim());
    } else {
      setErrorMessage('Invite code is required');
      setErrorDialogVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Join a Community
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              To use Prayer Pipeline, you need to be part of an organization. You can either create your own or join an existing one.
            </Text>
          </View>

          <SegmentedButtons
            value={activeOption}
            onValueChange={(value) => setActiveOption(value as 'create' | 'join')}
            buttons={[
              { value: 'create', label: 'Create New' },
              { value: 'join', label: 'Join Existing' },
            ]}
            style={styles.segmentedButtons}
          />
          
          <Divider style={styles.divider} />
          
          {/* Create Organization Form */}
          {activeOption === 'create' && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Create a New Organization
                </Text>
                <Text variant="bodyMedium" style={styles.cardDescription}>
                  Start your own community and invite others to join.
                </Text>
                
                <TextInput
                  label="Organization Name *"
                  value={orgName}
                  onChangeText={setOrgName}
                  mode="outlined"
                  style={styles.input}
                />
                
                <TextInput
                  label="Description"
                  value={orgDescription}
                  onChangeText={setOrgDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
                
                <TextInput
                  label="Website"
                  value={orgWebsite}
                  onChangeText={setOrgWebsite}
                  mode="outlined"
                  keyboardType="url"
                  autoCapitalize="none"
                  style={styles.input}
                />
                
                <Button
                  mode="contained"
                  onPress={handleCreateOrg}
                  style={styles.submitButton}
                  loading={createOrgMutation.isPending}
                  disabled={!orgName.trim() || createOrgMutation.isPending}
                >
                  Create Organization
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Join Organization Form */}
          {activeOption === 'join' && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Join an Existing Organization
                </Text>
                <Text variant="bodyMedium" style={styles.cardDescription}>
                  Enter the invite code provided by your organization administrator.
                </Text>
                
                <TextInput
                  label="Invite Code *"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  mode="outlined"
                  autoCapitalize="none"
                  style={styles.input}
                />
                
                <Button
                  mode="contained"
                  onPress={handleJoinWithCode}
                  style={styles.submitButton}
                  loading={joinWithCodeMutation.isPending}
                  disabled={!inviteCode.trim() || joinWithCodeMutation.isPending}
                >
                  Join Organization
                </Button>
              </Card.Content>
            </Card>
          )}
          
          <Text variant="bodySmall" style={styles.helpText}>
            Organizations help keep prayer requests organized and secure. Each organization can have multiple prayer groups.
          </Text>
        </View>
        
        {/* Footer Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/onboarding-illustration.png')}
            style={styles.image}
            resizeMode="contain"
          />
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
  header: {
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
  segmentedButtons: {
    marginBottom: 24,
  },
  divider: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardDescription: {
    marginBottom: 16,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  helpText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  image: {
    width: '80%',
    height: 180,
  },
});