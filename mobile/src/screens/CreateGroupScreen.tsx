import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '@navigation/MainNavigator';
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
  List,
} from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/api/queryClient';
import { useAuth } from '@hooks/useAuth';

type NavigationProps = NativeStackNavigationProp<ExploreStackParamList, 'CreateGroup'>;

export default function CreateGroupScreen() {
  const navigation = useNavigation<NavigationProps>();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'prayer' | 'bible_study' | 'discipleship' | 'worship' | 'fellowship' | 'outreach'>('prayer');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'hidden'>('public');
  const [meetingDay, setMeetingDay] = useState<string>('');
  const [meetingTime, setMeetingTime] = useState<string>('');
  const [meetingLocation, setMeetingLocation] = useState<string>('');
  
  // Error handling
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      category: string;
      visibility: string;
      meetingDetails?: {
        day: string;
        time: string;
        location: string;
      };
      organizationId: number;
    }) => {
      const res = await apiRequest('POST', '/api/groups', data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to create group' }));
        throw new Error(error.message || 'Failed to create group');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/groups/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups/organization', user?.organizationId] });
      
      // Navigate to the new group details
      navigation.replace('GroupDetails', { groupId: data.id });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setErrorDialogVisible(true);
    },
  });

  const handleCreateGroup = () => {
    if (!name.trim()) {
      setErrorMessage('Please provide a name for your group');
      setErrorDialogVisible(true);
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Please provide a description for your group');
      setErrorDialogVisible(true);
      return;
    }

    if (!user?.organizationId) {
      setErrorMessage('You must be part of an organization to create a group');
      setErrorDialogVisible(true);
      return;
    }

    const groupData: any = {
      name,
      description,
      category,
      visibility,
      organizationId: user.organizationId,
    };

    // Add meeting details if all fields are filled
    if (meetingDay.trim() && meetingTime.trim() && meetingLocation.trim()) {
      groupData.meetingDetails = {
        day: meetingDay,
        time: meetingTime,
        location: meetingLocation,
      };
    }

    createGroupMutation.mutate(groupData);
  };

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
              <Text variant="titleLarge" style={styles.title}>Create New Group</Text>
              
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Group Details</Text>
                
                <TextInput
                  label="Group Name"
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                  maxLength={50}
                />
                
                <TextInput
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                  maxLength={300}
                />
                <HelperText type="info" visible>
                  {300 - description.length} characters remaining
                </HelperText>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Category</Text>
                <Text variant="bodyMedium" style={styles.sectionDescription}>
                  Select the primary focus of your group
                </Text>
                
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesList}
                >
                  <Chip
                    selected={category === 'prayer'}
                    onPress={() => setCategory('prayer')}
                    style={styles.categoryChip}
                    showSelectedCheck
                  >
                    Prayer
                  </Chip>
                  <Chip
                    selected={category === 'bible_study'}
                    onPress={() => setCategory('bible_study')}
                    style={styles.categoryChip}
                    showSelectedCheck
                  >
                    Bible Study
                  </Chip>
                  <Chip
                    selected={category === 'discipleship'}
                    onPress={() => setCategory('discipleship')}
                    style={styles.categoryChip}
                    showSelectedCheck
                  >
                    Discipleship
                  </Chip>
                  <Chip
                    selected={category === 'worship'}
                    onPress={() => setCategory('worship')}
                    style={styles.categoryChip}
                    showSelectedCheck
                  >
                    Worship
                  </Chip>
                  <Chip
                    selected={category === 'fellowship'}
                    onPress={() => setCategory('fellowship')}
                    style={styles.categoryChip}
                    showSelectedCheck
                  >
                    Fellowship
                  </Chip>
                  <Chip
                    selected={category === 'outreach'}
                    onPress={() => setCategory('outreach')}
                    style={styles.categoryChip}
                    showSelectedCheck
                  >
                    Outreach
                  </Chip>
                </ScrollView>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Visibility</Text>
                <SegmentedButtons
                  value={visibility}
                  onValueChange={(value) => setVisibility(value as 'public' | 'private' | 'hidden')}
                  buttons={[
                    { value: 'public', label: 'Public' },
                    { value: 'private', label: 'Private' },
                    { value: 'hidden', label: 'Hidden' },
                  ]}
                  style={styles.segmentedButtons}
                />
                <Text variant="bodySmall" style={styles.visibilityHint}>
                  {visibility === 'public' && 'Anyone in your organization can see and join this group'}
                  {visibility === 'private' && 'Anyone can see this group, but they must request to join'}
                  {visibility === 'hidden' && 'Only members can see this group, users must be invited'}
                </Text>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Meeting Details (Optional)</Text>
                <Text variant="bodyMedium" style={styles.sectionDescription}>
                  Add information about when and where your group meets
                </Text>
                
                <TextInput
                  label="Meeting Day"
                  value={meetingDay}
                  onChangeText={setMeetingDay}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g. Every Tuesday"
                />
                
                <TextInput
                  label="Meeting Time"
                  value={meetingTime}
                  onChangeText={setMeetingTime}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g. 7:00 PM"
                />
                
                <TextInput
                  label="Meeting Location"
                  value={meetingLocation}
                  onChangeText={setMeetingLocation}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g. Church Fellowship Hall"
                />
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
                  onPress={handleCreateGroup}
                  style={styles.submitButton}
                  loading={createGroupMutation.isPending}
                  disabled={!name.trim() || !description.trim() || createGroupMutation.isPending}
                >
                  Create Group
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
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingVertical: 8,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  visibilityHint: {
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