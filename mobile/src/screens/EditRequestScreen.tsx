import React, { useState, useEffect } from 'react';
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
  SegmentedButtons,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/api/queryClient';
import { useAuth } from '@hooks/useAuth';

type RouteProps = RouteProp<PrayerRequestsStackParamList, 'EditRequest'>;
type NavigationProps = NativeStackNavigationProp<PrayerRequestsStackParamList, 'EditRequest'>;

export default function EditRequestScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { requestId } = route.params;
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'new' | 'in_progress' | 'answered' | 'closed'>('new');
  const [isPublic, setIsPublic] = useState(true);
  
  // Error handling
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch prayer request details
  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ['/api/requests', requestId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/requests/${requestId}`);
      if (!res.ok) throw new Error('Failed to fetch prayer request');
      return res.json();
    },
  });

  // Update form fields when request data is loaded
  useEffect(() => {
    if (request) {
      setTitle(request.title);
      setContent(request.content);
      setUrgency(request.urgency);
      setStatus(request.status);
      setIsPublic(request.isPublic);
    }
  }, [request]);

  // Update request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      urgency: string;
      status: string;
      isPublic: boolean;
    }) => {
      const res = await apiRequest('PUT', `/api/requests/${requestId}`, data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to update prayer request' }));
        throw new Error(error.message || 'Failed to update prayer request');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/requests', requestId] });
      queryClient.invalidateQueries({ queryKey: ['/api/requests/user/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups', request.groupId, 'requests'] });
      
      // Navigate back to the request details
      navigation.navigate('RequestDetails', { requestId });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setErrorDialogVisible(true);
    },
  });

  const handleUpdateRequest = () => {
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

    updateRequestMutation.mutate({
      title,
      content,
      urgency,
      status,
      isPublic,
    });
  };

  if (isLoadingRequest) {
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
              <Text variant="titleLarge" style={styles.title}>Edit Prayer Request</Text>
              
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
                <Text variant="titleMedium" style={styles.sectionTitle}>Status</Text>
                <SegmentedButtons
                  value={status}
                  onValueChange={(value) => setStatus(value as 'new' | 'in_progress' | 'answered' | 'closed')}
                  buttons={[
                    { value: 'new', label: 'New' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'answered', label: 'Answered' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                  style={styles.segmentedButtons}
                  multiline
                />
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
                  onPress={handleUpdateRequest}
                  style={styles.submitButton}
                  loading={updateRequestMutation.isPending}
                  disabled={!title.trim() || !content.trim() || updateRequestMutation.isPending}
                >
                  Update Request
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
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
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