import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PrayerRequestsStackParamList } from '@navigation/MainNavigator';
import {
  Text,
  Searchbar,
  Chip,
  List,
  ActivityIndicator,
  useTheme,
  IconButton,
  FAB,
  Menu,
  Divider,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/api/queryClient';

// Types for API response
type PrayerRequest = {
  id: number;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  groupId: number;
  groupName: string;
  userId: number;
  userName: string;
};

// Status filter options
const STATUS_FILTERS = ['all', 'new', 'in-progress', 'answered'];

export default function PrayerRequestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PrayerRequestsStackParamList>>();
  const theme = useTheme();
  
  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Query for prayer requests
  const {
    data: prayerRequests,
    isLoading,
    refetch,
  } = useQuery<PrayerRequest[]>({
    queryKey: ['/api/requests/user', { status: statusFilter !== 'all' ? statusFilter : undefined }],
    queryFn: async () => {
      let endpoint = '/api/requests/user';
      if (statusFilter !== 'all') {
        endpoint += `?status=${statusFilter}`;
      }
      const response = await apiRequest('GET', endpoint);
      if (!response.ok) throw new Error('Failed to fetch prayer requests');
      return response.json();
    },
  });
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  
  const navigateToRequestDetails = (requestId: number) => {
    navigation.navigate('RequestDetails', { requestId });
  };
  
  // Filter requests based on search query
  const filteredRequests = prayerRequests
    ? prayerRequests.filter(
        (request) =>
          request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.groupName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered':
        return 'check-circle';
      case 'in-progress':
        return 'clock-outline';
      default:
        return 'prayer';
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search prayer requests"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <IconButton
          icon="filter-variant"
          size={24}
          onPress={() => setMenuVisible(true)}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={{ x: 300, y: 60 }}
        >
          <Menu.Item
            onPress={() => {
              setStatusFilter('all');
              setMenuVisible(false);
            }}
            title="All Requests"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setStatusFilter('new');
              setMenuVisible(false);
            }}
            title="New"
          />
          <Menu.Item
            onPress={() => {
              setStatusFilter('in-progress');
              setMenuVisible(false);
            }}
            title="In Progress"
          />
          <Menu.Item
            onPress={() => {
              setStatusFilter('answered');
              setMenuVisible(false);
            }}
            title="Answered"
          />
        </Menu>
      </View>
      
      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
        contentContainerStyle={styles.chipsContent}
      >
        {STATUS_FILTERS.map((status) => (
          <Chip
            key={status}
            selected={statusFilter === status}
            onPress={() => setStatusFilter(status)}
            style={styles.chip}
            mode={statusFilter === status ? 'flat' : 'outlined'}
          >
            {status === 'all' ? 'All' : status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Chip>
        ))}
      </ScrollView>
      
      {/* Prayer Requests List */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <ScrollView
          style={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <List.Item
                key={request.id}
                title={request.title}
                description={request.content.substring(0, 100) + (request.content.length > 100 ? '...' : '')}
                left={(props) => <List.Icon {...props} icon={getStatusIcon(request.status)} />}
                right={(props) => (
                  <View {...props} style={styles.metaContainer}>
                    <Text variant="labelSmall" style={styles.groupName}>
                      {request.groupName}
                    </Text>
                    <Text variant="labelSmall" style={styles.date}>
                      {formatDate(request.createdAt)}
                    </Text>
                  </View>
                )}
                onPress={() => navigateToRequestDetails(request.id)}
                style={styles.listItem}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge">No prayer requests found</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {searchQuery
                  ? 'Try using different search terms'
                  : statusFilter !== 'all'
                  ? `You don't have any ${statusFilter} prayer requests`
                  : 'You have not created any prayer requests yet'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      
      {/* FAB for adding new prayer request */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {/* Navigate to create prayer request */}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  chipsContainer: {
    maxHeight: 50,
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  metaContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  groupName: {
    marginBottom: 4,
  },
  date: {
    opacity: 0.6,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});