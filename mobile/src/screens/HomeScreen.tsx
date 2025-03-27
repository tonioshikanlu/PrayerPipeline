import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@navigation/MainNavigator';
import { Text, Card, Button, Divider, List, ActivityIndicator, useTheme, Surface } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import { apiRequest } from '@/api/queryClient';

// Types for API responses
type Group = {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  category: string;
};

type PrayerRequest = {
  id: number;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  groupId: number;
  userId: number;
  userName: string;
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const theme = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Query for user's groups
  const {
    data: groups,
    isLoading: isGroupsLoading,
    refetch: refetchGroups,
  } = useQuery<Group[]>({
    queryKey: ['/api/groups/user'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/groups/user');
      if (!res.ok) throw new Error('Failed to fetch groups');
      return res.json();
    },
  });

  // Query for recent prayer requests
  const {
    data: recentRequests,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useQuery<PrayerRequest[]>({
    queryKey: ['/api/requests/user/recent'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/requests/user/recent');
      if (!res.ok) throw new Error('Failed to fetch recent requests');
      return res.json();
    },
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchGroups(), refetchRequests()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchGroups, refetchRequests]);

  const navigateToGroupDetails = (groupId: number) => {
    navigation.navigate('GroupDetails', { groupId });
  };

  const navigateToRequestDetails = (requestId: number) => {
    navigation.navigate('RequestDetails', { requestId });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <Surface style={styles.welcomeSection}>
        <Text variant="headlineSmall">Welcome back, {user?.name}!</Text>
        <Text variant="bodyMedium" style={{ marginTop: 5 }}>
          Your prayer journey continues today.
        </Text>
      </Surface>

      {/* My Groups Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge">My Groups</Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Explore')}
          >
            Explore More
          </Button>
        </View>

        {isGroupsLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : groups && groups.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.groupsContainer}>
              {groups.slice(0, 3).map((group) => (
                <Card
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => navigateToGroupDetails(group.id)}
                >
                  <Card.Content>
                    <Text variant="titleMedium">{group.name}</Text>
                    <Text variant="bodySmall" style={styles.groupDescription}>
                      {group.description.length > 80
                        ? `${group.description.substring(0, 80)}...`
                        : group.description}
                    </Text>
                    <View style={styles.groupMeta}>
                      <Text variant="labelSmall">{group.memberCount} members</Text>
                      <Text variant="labelSmall" style={styles.groupCategory}>
                        {group.category}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              ))}
              
              {groups.length > 3 && (
                <Card
                  style={[styles.groupCard, styles.viewAllCard]}
                  onPress={() => {/* Navigate to all groups */}}
                >
                  <Card.Content style={styles.viewAllContent}>
                    <Text variant="titleMedium">View All</Text>
                    <Text variant="bodySmall">
                      {groups.length - 3} more {groups.length - 3 === 1 ? 'group' : 'groups'}
                    </Text>
                  </Card.Content>
                </Card>
              )}
            </View>
          </ScrollView>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyMedium">You haven't joined any groups yet.</Text>
              <Button
                mode="contained"
                style={styles.emptyCardButton}
                onPress={() => navigation.navigate('Explore')}
              >
                Find Groups
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Recent Prayer Requests Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge">Recent Prayer Requests</Text>
          <Button
            mode="text"
            onPress={() => {/* Navigate to all prayer requests */}}
          >
            View All
          </Button>
        </View>

        {isRequestsLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : recentRequests && recentRequests.length > 0 ? (
          <View style={styles.requestsContainer}>
            {recentRequests.slice(0, 5).map((request) => (
              <List.Item
                key={request.id}
                title={request.title}
                description={
                  request.content.length > 100
                    ? `${request.content.substring(0, 100)}...`
                    : request.content
                }
                onPress={() => navigateToRequestDetails(request.id)}
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
                  />
                )}
                right={(props) => (
                  <Text {...props} variant="bodySmall">
                    {formatDate(request.createdAt)}
                  </Text>
                )}
                style={styles.requestItem}
              />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyMedium">No prayer requests yet.</Text>
              <Button
                mode="contained"
                style={styles.emptyCardButton}
                onPress={() => {/* Navigate to create prayer request */}}
              >
                Create Request
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  welcomeSection: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loader: {
    marginVertical: 20,
  },
  groupsContainer: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  groupCard: {
    width: 260,
    marginRight: 12,
  },
  groupDescription: {
    marginTop: 4,
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  groupCategory: {
    textTransform: 'uppercase',
  },
  viewAllCard: {
    backgroundColor: '#f0f0f0',
  },
  viewAllContent: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  requestsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
  },
  requestItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 16,
  },
  emptyCardButton: {
    marginTop: 16,
  },
});