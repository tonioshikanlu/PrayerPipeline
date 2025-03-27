import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, ExploreStackParamList } from '@navigation/MainNavigator';
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Portal,
  Modal,
  ActivityIndicator,
  useTheme,
  List,
  Divider,
  Avatar,
  FAB,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import { apiRequest } from '@/api/queryClient';

// Types for API responses
type Group = {
  id: number;
  name: string;
  description: string;
  category: string;
  privacy: string;
  organizationId: number;
  organizationName: string;
  memberCount: number;
  createdAt: string;
  isFavorite: boolean;
  isJoined: boolean;
  role?: string;
};

type GroupMember = {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  role: string;
  joinedAt: string;
};

type PrayerRequest = {
  id: number;
  title: string;
  content: string;
  status: string;
  urgency: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userName: string;
  commentCount: number;
};

type Meeting = {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  isRecurring: boolean;
  recurringPattern: string;
};

// Helper type to allow navigation from both Home and Explore stacks
type NavigationProp = NativeStackNavigationProp<
  HomeStackParamList & ExploreStackParamList
>;

export default function GroupDetailsScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'GroupDetails'>>();
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { groupId } = route.params;
  
  const [activeTab, setActiveTab] = useState('requests');
  const [refreshing, setRefreshing] = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);

  // Fetch group details
  const { 
    data: group, 
    isLoading: isGroupLoading,
    refetch: refetchGroup,
  } = useQuery<Group>({
    queryKey: [`/api/groups/${groupId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/groups/${groupId}`);
      if (!res.ok) throw new Error('Failed to fetch group details');
      return res.json();
    },
  });

  // Fetch group members
  const {
    data: members,
    isLoading: isMembersLoading,
    refetch: refetchMembers,
  } = useQuery<GroupMember[]>({
    queryKey: [`/api/groups/${groupId}/members`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/groups/${groupId}/members`);
      if (!res.ok) throw new Error('Failed to fetch group members');
      return res.json();
    },
  });

  // Fetch prayer requests
  const {
    data: requests,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useQuery<PrayerRequest[]>({
    queryKey: [`/api/groups/${groupId}/requests`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/groups/${groupId}/requests`);
      if (!res.ok) throw new Error('Failed to fetch prayer requests');
      return res.json();
    },
  });

  // Fetch meetings
  const {
    data: meetings,
    isLoading: isMeetingsLoading,
    refetch: refetchMeetings,
  } = useQuery<Meeting[]>({
    queryKey: [`/api/groups/${groupId}/meetings`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/groups/${groupId}/meetings`);
      if (!res.ok) throw new Error('Failed to fetch meetings');
      return res.json();
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!group) return;
      
      const endpoint = `/api/groups/${groupId}/${group.isFavorite ? 'favorite' : 'unfavorite'}`;
      const method = group.isFavorite ? 'DELETE' : 'POST';
      
      const res = await apiRequest(method, endpoint);
      if (!res.ok) throw new Error('Failed to update favorite status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups/favorites'] });
    },
  });

  // Join/leave group mutation
  const membershipMutation = useMutation({
    mutationFn: async (action: 'join' | 'leave') => {
      const endpoint = `/api/groups/${groupId}/${action === 'join' ? 'join' : 'leave'}`;
      const method = action === 'join' ? 'POST' : 'DELETE';
      
      const res = await apiRequest(method, endpoint);
      if (!res.ok) throw new Error(`Failed to ${action} group`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/members`] });
      queryClient.invalidateQueries({ queryKey: ['/api/groups/user'] });
      setLeaveModalVisible(false);
    },
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchGroup(),
        refetchMembers(),
        refetchRequests(),
        refetchMeetings(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchGroup, refetchMembers, refetchRequests, refetchMeetings]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMeetingTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const timeFormat: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    
    const dateFormat: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    
    return `${start.toLocaleDateString(undefined, dateFormat)} · ${start.toLocaleTimeString(
      undefined,
      timeFormat
    )} - ${end.toLocaleTimeString(undefined, timeFormat)}`;
  };

  const isAdmin = group?.role === 'admin' || group?.role === 'leader';
  const isLeader = group?.role === 'leader';

  if (isGroupLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineSmall">Group not found</Text>
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
      >
        {/* Group Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerActions}>
              <View style={styles.headerTags}>
                <Chip mode="outlined" style={styles.categoryChip}>
                  {group.category}
                </Chip>
                {group.privacy === 'private' && (
                  <Chip icon="lock" mode="outlined" style={styles.privacyChip}>
                    Private
                  </Chip>
                )}
              </View>
              
              <IconButton
                icon={group.isFavorite ? "star" : "star-outline"}
                iconColor={group.isFavorite ? theme.colors.primary : undefined}
                onPress={() => toggleFavoriteMutation.mutate()}
              />
            </View>
            
            <Text variant="headlineSmall">{group.name}</Text>
            <Text variant="bodySmall" style={styles.organizationName}>
              {group.organizationName}
            </Text>
            
            <Text variant="bodyMedium" style={styles.description}>
              {group.description}
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text variant="labelLarge">{group.memberCount}</Text>
                <Text variant="bodySmall">Members</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="labelLarge">{requests?.length || 0}</Text>
                <Text variant="bodySmall">Prayers</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="labelLarge">{meetings?.length || 0}</Text>
                <Text variant="bodySmall">Meetings</Text>
              </View>
            </View>
            
            {!group.isJoined ? (
              <Button
                mode="contained"
                icon="account-plus"
                style={styles.actionButton}
                onPress={() => membershipMutation.mutate('join')}
                loading={membershipMutation.isPending}
              >
                Join Group
              </Button>
            ) : isAdmin ? (
              <Button
                mode="contained"
                icon="pencil"
                style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => {
                  /* Navigate to edit group screen */
                }}
              >
                Manage Group
              </Button>
            ) : (
              <Button
                mode="outlined"
                icon="account-remove"
                style={styles.actionButton}
                onPress={() => setLeaveModalVisible(true)}
              >
                Leave Group
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <Button
            mode={activeTab === 'requests' ? 'contained' : 'text'}
            onPress={() => setActiveTab('requests')}
            style={styles.tabButton}
          >
            Prayer Requests
          </Button>
          <Button
            mode={activeTab === 'meetings' ? 'contained' : 'text'}
            onPress={() => setActiveTab('meetings')}
            style={styles.tabButton}
          >
            Meetings
          </Button>
          <Button
            mode={activeTab === 'members' ? 'contained' : 'text'}
            onPress={() => setActiveTab('members')}
            style={styles.tabButton}
          >
            Members
          </Button>
        </View>

        <Divider />

        {/* Prayer Requests Tab */}
        {activeTab === 'requests' && (
          <View style={styles.tabContent}>
            {isRequestsLoading ? (
              <ActivityIndicator style={styles.tabLoader} />
            ) : requests && requests.length > 0 ? (
              requests.map((request) => (
                <List.Item
                  key={request.id}
                  title={request.title}
                  description={
                    request.content.length > 100
                      ? `${request.content.substring(0, 100)}...`
                      : request.content
                  }
                  onPress={() => 
                    navigation.navigate('RequestDetails', { requestId: request.id })
                  }
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        request.status === 'answered'
                          ? 'check-circle'
                          : request.status === 'in-progress'
                          ? 'clock-outline'
                          : 'prayer'
                      }
                      color={
                        request.status === 'answered'
                          ? theme.colors.primary
                          : request.urgency === 'high'
                          ? '#ef4444'  // red for high urgency
                          : undefined
                      }
                    />
                  )}
                  right={(props) => (
                    <View {...props} style={styles.requestMeta}>
                      <Text variant="bodySmall">{formatDate(request.createdAt)}</Text>
                      {request.commentCount > 0 && (
                        <View style={styles.commentCount}>
                          <Text variant="labelSmall">{request.commentCount}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  style={styles.listItem}
                />
              ))
            ) : (
              <View style={styles.emptyTab}>
                <Text variant="bodyLarge">No prayer requests yet</Text>
                <Text variant="bodySmall" style={styles.emptySubText}>
                  {group.isJoined
                    ? "Be the first to share a prayer request"
                    : "Join this group to see and share prayer requests"}
                </Text>
                {group.isJoined && (
                  <Button
                    mode="contained"
                    icon="plus"
                    style={styles.emptyButton}
                    onPress={() => {
                      /* Navigate to create prayer request screen */
                    }}
                  >
                    Add Prayer Request
                  </Button>
                )}
              </View>
            )}
          </View>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <View style={styles.tabContent}>
            {isMeetingsLoading ? (
              <ActivityIndicator style={styles.tabLoader} />
            ) : meetings && meetings.length > 0 ? (
              meetings.map((meeting) => (
                <Card
                  key={meeting.id}
                  style={styles.meetingCard}
                  onPress={() =>
                    navigation.navigate('MeetingDetails', { meetingId: meeting.id })
                  }
                >
                  <Card.Content>
                    <Text variant="titleMedium">{meeting.title}</Text>
                    <Text variant="bodySmall" style={styles.meetingTime}>
                      {formatMeetingTime(meeting.startTime, meeting.endTime)}
                    </Text>
                    {meeting.location && (
                      <View style={styles.locationRow}>
                        <IconButton
                          icon="map-marker"
                          size={16}
                          style={styles.locationIcon}
                        />
                        <Text variant="bodySmall">{meeting.location}</Text>
                      </View>
                    )}
                    {meeting.isRecurring && (
                      <Chip icon="repeat" compact style={styles.recurringChip}>
                        {meeting.recurringPattern}
                      </Chip>
                    )}
                  </Card.Content>
                </Card>
              ))
            ) : (
              <View style={styles.emptyTab}>
                <Text variant="bodyLarge">No meetings scheduled</Text>
                <Text variant="bodySmall" style={styles.emptySubText}>
                  {isAdmin
                    ? "Schedule your first meeting for this group"
                    : "There are no upcoming meetings for this group"}
                </Text>
                {isAdmin && (
                  <Button
                    mode="contained"
                    icon="calendar-plus"
                    style={styles.emptyButton}
                    onPress={() => {
                      /* Navigate to create meeting screen */
                    }}
                  >
                    Schedule Meeting
                  </Button>
                )}
              </View>
            )}
          </View>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <View style={styles.tabContent}>
            {isMembersLoading ? (
              <ActivityIndicator style={styles.tabLoader} />
            ) : members && members.length > 0 ? (
              members.map((member) => (
                <List.Item
                  key={member.id}
                  title={member.userName}
                  description={
                    member.role === 'leader'
                      ? 'Group Leader'
                      : member.role === 'admin'
                      ? 'Group Admin'
                      : `Joined ${formatDate(member.joinedAt)}`
                  }
                  left={() => (
                    <Avatar.Text
                      size={40}
                      label={member.userName.substring(0, 2).toUpperCase()}
                      style={
                        member.role === 'leader' || member.role === 'admin'
                          ? { backgroundColor: theme.colors.secondary }
                          : undefined
                      }
                    />
                  )}
                  style={styles.listItem}
                />
              ))
            ) : (
              <View style={styles.emptyTab}>
                <Text variant="bodyLarge">No members yet</Text>
                <Text variant="bodySmall" style={styles.emptySubText}>
                  This group doesn't have any members yet
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB for creating content (only show if user is a member) */}
      {group.isJoined && (
        <FAB
          icon={
            activeTab === 'requests'
              ? 'prayer'
              : activeTab === 'meetings'
              ? 'calendar-plus'
              : 'account-plus'
          }
          label={
            activeTab === 'requests'
              ? 'New Prayer'
              : activeTab === 'meetings'
              ? 'Schedule'
              : 'Invite'
          }
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          visible={activeTab !== 'members' || isAdmin}
          onPress={() => {
            /* Navigate to appropriate creation screen based on activeTab */
          }}
        />
      )}

      {/* Leave Group Confirmation Modal */}
      <Portal>
        <Modal
          visible={leaveModalVisible}
          onDismiss={() => setLeaveModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall">Leave Group?</Text>
          <Text variant="bodyMedium" style={styles.modalText}>
            Are you sure you want to leave {group.name}? You'll no longer have access to the group's prayer requests and meetings.
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setLeaveModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => membershipMutation.mutate('leave')}
              style={[styles.modalButton, styles.leaveButton]}
              loading={membershipMutation.isPending}
            >
              Leave
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorButton: {
    marginTop: 16,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  privacyChip: {
    marginBottom: 8,
  },
  organizationName: {
    marginBottom: 8,
    opacity: 0.6,
  },
  description: {
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  stat: {
    alignItems: 'center',
  },
  actionButton: {
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 0,
  },
  tabButton: {
    flex: 1,
    borderRadius: 0,
  },
  tabContent: {
    padding: 8,
  },
  tabLoader: {
    margin: 24,
  },
  listItem: {
    backgroundColor: 'white',
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  requestMeta: {
    alignItems: 'flex-end',
  },
  commentCount: {
    backgroundColor: '#e5e5e5',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  meetingCard: {
    margin: 8,
  },
  meetingTime: {
    marginVertical: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationIcon: {
    margin: 0,
    marginLeft: -8,
  },
  recurringChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  emptyTab: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySubText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.6,
  },
  emptyButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalText: {
    marginVertical: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 8,
  },
  leaveButton: {
    backgroundColor: '#ef4444',  // red color for leave button
  },
});