import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PrayerRequestsStackParamList } from '@navigation/MainNavigator';
import {
  Text,
  TextInput,
  Button,
  Portal,
  Dialog,
  useTheme,
  Card,
  Chip,
  HelperText,
  SegmentedButtons,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/api/queryClient';
import { useAuth } from '@hooks/useAuth';

type NavigationProps = NativeStackNavigationProp<PrayerRequestsStackParamList, 'CreateRequest'>;

export default function CreateRequestScreen() {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  
  // Error handling
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch user's groups
  const { data: userGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['/api/groups/user'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/groups/user');
      if (!res.ok) throw new Error('Failed to fetch groups');
      return res.json();
    },
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      groupId: number;
      urgency: string;
      isPublic: boolean;
    }) => {
      const res = await apiRequest('POST', '/api/requests', data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to create prayer request' }));
        throw new Error(error.message || 'Failed to create prayer request');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/requests/user/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups', selectedGroupId, 'requests'] });
      
      // Navigate to the new request details
      navigation.replace('RequestDetails', { requestId: data.id });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setErrorDialogVisible(true);
    },
  });

  const handleCreateRequest = () => {
    if (!selectedGroupId) {
      setErrorMessage('Please select a group for this prayer request');
      setErrorDialogVisible(true);
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please provide a title for your prayer request');
      setErrorDialogVisible(true);
      return;
    }

    if (!content.trim()) {
      setErrorMessage('Please provide details for your prayer request');
      setErrorDialogVisible(true);
      return;
    }

    createRequestMutation.mutate({
      title,
      content,
      groupId: selectedGroupId,
      urgency,
      isPublic,
    });
  };

  if (isLoadingGroups) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!userGroups || userGroups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall" style={styles.emptyText}>
          You need to join a group before creating a prayer request.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('ExploreTab' as any)}
          style={styles.exploreButton}
        >
          Find Groups
        </Button>
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
              <Text variant="titleLarge" style={styles.title}>Create New Prayer Request</Text>
              
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Select Group</Text>
                <Text variant="bodyMedium" style={styles.sectionDescription}>
                  Choose which group you want to share this prayer request with
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.groupsList}
                >
                  {userGroups.map((group: any) => (
                    <Chip
                      key={group.id}
                      selected={selectedGroupId === group.id}
                      onPress={() => setSelectedGroupId(group.id)}
                      style={styles.groupChip}
                      showSelectedCheck
                    >
                      {group.name}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Request Details</Text>
                
                <TextInput
                  label="Title"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  style={styles.input}
                  maxLength={100}
                />
                
                <TextInput
                  label="Details"
                  value={content}
                  onChangeText={setContent}
                  mode="outlined"
                  multiline
                  numberOfLines={5}
                  style={styles.textArea}
                  maxLength={500}
                />
                <HelperText type="info" visible>
                  {500 - content.length} characters remaining
                </HelperText>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Urgency Level</Text>
                <SegmentedButtons
                  value={urgency}
                  onValueChange={(value) => setUrgency(value as 'low' | 'medium' | 'high')}
                  buttons={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                  style={styles.segmentedButtons}
                />
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Privacy Setting</Text>
                <SegmentedButtons
                  value={isPublic ? 'public' : 'private'}
                  onValueChange={(value) => setIsPublic(value === 'public')}
                  buttons={[
                    { value: 'public', label: 'Visible to Group' },
                    { value: 'private', label: 'Only Leaders' },
                  ]}
                  style={styles.segmentedButtons}
                />
                <Text variant="bodySmall" style={styles.privacyHint}>
                  {isPublic
                    ? 'All members of the group can see this request'
                    : 'Only group leaders can see this request'}
                </Text>
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
                  onPress={handleCreateRequest}
                  style={styles.submitButton}
                  loading={createRequestMutation.isPending}
                  disabled={!title.trim() || !content.trim() || !selectedGroupId || createRequestMutation.isPending}
                >
                  Create Request
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    marginTop: 16,
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
  sectionTitle: {
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    opacity: 0.7,
  },
  groupsList: {
    paddingVertical: 8,
  },
  groupChip: {
    marginRight: 8,
    marginBottom: 8,
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
  segmentedButtons: {
    marginVertical: 8,
  },
  privacyHint: {
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.7,
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