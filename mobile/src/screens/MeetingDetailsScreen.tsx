import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Linking } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@navigation/MainNavigator';
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Portal,
  Dialog,
  ActivityIndicator,
  useTheme,
  Divider,
  Avatar,
  List,
  Surface,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import { apiRequest } from '@/api/queryClient';

// Types for API responses
type Meeting = {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  isVirtual: boolean;
  virtualMeetingUrl?: string;
  isRecurring: boolean;
  recurringPattern: string;
  groupId: number;
  groupName: string;
  organizationId: number;
  createdBy: number;
  creatorName: string;
  isOwner: boolean;
  attendeeCount: number;
  isAttending: boolean;
};

type Attendee = {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  status: string;
  isGroup: boolean;
};

export default function MeetingDetailsScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'MeetingDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { meetingId } = route.params;
  
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<'attending' | 'not-attending' | 'maybe'>();

  // Fetch meeting details
  const { 
    data: meeting, 
    isLoading: isMeetingLoading,
    refetch: refetchMeeting,
  } = useQuery<Meeting>({
    queryKey: [`/api/meetings/${meetingId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/meetings/${meetingId}`);
      if (!res.ok) throw new Error('Failed to fetch meeting details');
      return res.json();
    },
  });

  // Fetch meeting attendees
  const {
    data: attendees,
    isLoading: isAttendeesLoading,
    refetch: refetchAttendees,
  } = useQuery<Attendee[]>({
    queryKey: [`/api/meetings/${meetingId}/attendees`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/meetings/${meetingId}/attendees`);
      if (!res.ok) throw new Error('Failed to fetch attendees');
      return res.json();
    },
  });

  // Update attendance status mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest('POST', `/api/meetings/${meetingId}/attendance`, { status });
      if (!res.ok) throw new Error('Failed to update attendance status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/attendees`] });
    },
  });

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/api/meetings/${meetingId}`);
      if (!res.ok) throw new Error('Failed to delete meeting');
      return res.json();
    },
    onSuccess: () => {
      navigation.goBack();
      queryClient.invalidateQueries({ queryKey: ['/api/meetings/upcoming'] });
      if (meeting?.groupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${meeting.groupId}/meetings`] });
      }
    },
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchMeeting(),
        refetchAttendees(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMeeting, refetchAttendees]);

  const handleDeleteMeeting = () => {
    deleteMeetingMutation.mutate();
    setDeleteDialogVisible(false);
  };

  const handleAttendance = (status: 'attending' | 'not-attending' | 'maybe') => {
    setAttendanceStatus(status);
    updateAttendanceMutation.mutate(status);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const openMaps = (location: string) => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(location)}`;
    Linking.openURL(url);
  };

  const joinVirtualMeeting = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (isMeetingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!meeting) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineSmall">Meeting not found</Text>
        <Button 
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Meeting Card */}
        <Card style={styles.meetingCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="bodySmall" style={styles.groupName}>
                {meeting.groupName}
              </Text>
              
              {meeting.isOwner && (
                <View style={styles.actionButtons}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => {
                      /* Navigate to edit meeting screen */
                    }}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => setDeleteDialogVisible(true)}
                  />
                </View>
              )}
            </View>
            
            <Text variant="headlineMedium" style={styles.title}>
              {meeting.title}
            </Text>
            
            <View style={styles.hostInfo}>
              <Text variant="bodyMedium">Hosted by </Text>
              <Avatar.Text
                size={24}
                label={meeting.creatorName.substring(0, 2).toUpperCase()}
                style={styles.hostAvatar}
              />
              <Text variant="bodyMedium" style={styles.hostName}>
                {meeting.creatorName}
              </Text>
            </View>
            
            {meeting.isRecurring && (
              <Chip icon="repeat" mode="outlined" style={styles.recurringChip}>
                {meeting.recurringPattern}
              </Chip>
            )}
            
            <Divider style={styles.divider} />
            
            {/* Date/Time */}
            <View style={styles.infoSection}>
              <IconButton
                icon="calendar"
                size={24}
                style={styles.infoIcon}
              />
              <View style={styles.infoContent}>
                <Text variant="bodyLarge" style={styles.infoTitle}>
                  {formatDate(meeting.startTime)}
                </Text>
                <Text variant="bodyMedium">
                  {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                </Text>
              </View>
            </View>
            
            {/* Location */}
            {meeting.location && (
              <View style={styles.infoSection}>
                <IconButton
                  icon="map-marker"
                  size={24}
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text variant="bodyLarge" style={styles.infoTitle}>
                    {meeting.isVirtual ? 'Virtual Meeting' : 'Location'}
                  </Text>
                  <Text variant="bodyMedium">
                    {meeting.location}
                  </Text>
                  
                  {!meeting.isVirtual && (
                    <Button
                      mode="text"
                      icon="map"
                      onPress={() => openMaps(meeting.location)}
                      style={styles.locationButton}
                    >
                      View on Map
                    </Button>
                  )}
                  
                  {meeting.isVirtual && meeting.virtualMeetingUrl && (
                    <Button
                      mode="contained"
                      icon="video"
                      onPress={() => joinVirtualMeeting(meeting.virtualMeetingUrl)}
                      style={styles.joinButton}
                    >
                      Join Meeting
                    </Button>
                  )}
                </View>
              </View>
            )}
            
            {/* Description */}
            {meeting.description && (
              <View style={styles.descriptionContainer}>
                <Text variant="titleMedium" style={styles.descriptionTitle}>
                  About this meeting
                </Text>
                <Text variant="bodyMedium" style={styles.description}>
                  {meeting.description}
                </Text>
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            {/* Attendance Buttons */}
            <View style={styles.attendanceContainer}>
              <Text variant="titleMedium" style={styles.attendanceTitle}>
                Are you going?
              </Text>
              <View style={styles.attendanceButtons}>
                <Button
                  mode={meeting.isAttending ? 'contained' : 'outlined'}
                  icon="check"
                  onPress={() => handleAttendance('attending')}
                  style={styles.attendanceButton}
                  loading={updateAttendanceMutation.isPending && attendanceStatus === 'attending'}
                >
                  Yes
                </Button>
                <Button
                  mode="outlined"
                  icon="close"
                  onPress={() => handleAttendance('not-attending')}
                  style={styles.attendanceButton}
                  loading={updateAttendanceMutation.isPending && attendanceStatus === 'not-attending'}
                >
                  No
                </Button>
                <Button
                  mode="outlined"
                  icon="help"
                  onPress={() => handleAttendance('maybe')}
                  style={styles.attendanceButton}
                  loading={updateAttendanceMutation.isPending && attendanceStatus === 'maybe'}
                >
                  Maybe
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Attendees Section */}
        <Surface style={styles.attendeesSection}>
          <Text variant="titleMedium" style={styles.attendeesHeader}>
            Attendees ({meeting.attendeeCount})
          </Text>
          
          {isAttendeesLoading ? (
            <ActivityIndicator style={styles.attendeesLoader} />
          ) : attendees && attendees.length > 0 ? (
            attendees.map((attendee) => (
              <List.Item
                key={attendee.id}
                title={attendee.userName}
                description={
                  attendee.isGroup
                    ? 'Entire Group'
                    : attendee.status === 'attending'
                    ? 'Going'
                    : attendee.status === 'maybe'
                    ? 'Maybe'
                    : 'Not Going'
                }
                left={() => (
                  <Avatar.Text
                    size={40}
                    label={attendee.userName.substring(0, 2).toUpperCase()}
                    style={[
                      styles.attendeeAvatar,
                      {
                        backgroundColor:
                          attendee.status === 'attending'
                            ? '#10b981' // green
                            : attendee.status === 'maybe'
                            ? '#f59e0b' // amber
                            : '#ef4444', // red
                      },
                    ]}
                  />
                )}
                style={styles.attendeeItem}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.noAttendeesText}>
              No one has RSVP'd yet
            </Text>
          )}
        </Surface>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Meeting?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this meeting? All attendees will be notified that the meeting has been cancelled. This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleDeleteMeeting}
              textColor="#ef4444"
              loading={deleteMeetingMutation.isPending}
            >
              Delete
            </Button>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorButton: {
    marginTop: 16,
  },
  meetingCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupName: {
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  title: {
    marginBottom: 8,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostAvatar: {
    marginHorizontal: 8,
  },
  hostName: {
    fontWeight: 'bold',
  },
  recurringChip: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  infoSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    margin: 0,
  },
  infoContent: {
    flex: 1,
    marginLeft: 8,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  joinButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  descriptionContainer: {
    marginVertical: 16,
  },
  descriptionTitle: {
    marginBottom: 8,
  },
  description: {
    lineHeight: 24,
  },
  attendanceContainer: {
    marginVertical: 8,
  },
  attendanceTitle: {
    marginBottom: 12,
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  attendeesSection: {
    padding: 16,
    borderRadius: 8,
  },
  attendeesHeader: {
    marginBottom: 16,
  },
  attendeesLoader: {
    margin: 16,
  },
  attendeeItem: {
    paddingVertical: 8,
  },
  attendeeAvatar: {
    marginRight: 8,
  },
  noAttendeesText: {
    textAlign: 'center',
    opacity: 0.7,
    paddingVertical: 16,
  },
});