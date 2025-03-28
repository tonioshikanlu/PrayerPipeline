import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../navigation/NavigationContext';

interface PrayerRequestSummary {
  id: number;
  title: string;
  createdAt: string;
  status: 'new' | 'in-progress' | 'answered';
  groupName: string;
}

interface GroupSummary {
  id: number;
  name: string;
  memberCount: number;
  requestCount: number;
}

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState<PrayerRequestSummary[]>([]);
  const [myGroups, setMyGroups] = useState<GroupSummary[]>([]);

  useEffect(() => {
    // Simulated data loading
    const loadData = async () => {
      // This would be API calls in a real app
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setRecentRequests([
        {
          id: 1,
          title: "Health and recovery",
          createdAt: "2025-03-25T10:30:00Z",
          status: "in-progress",
          groupName: "Family Support"
        },
        {
          id: 2,
          title: "Financial blessing",
          createdAt: "2025-03-26T14:45:00Z",
          status: "new",
          groupName: "Community Group"
        },
        {
          id: 3,
          title: "Wisdom for important decision",
          createdAt: "2025-03-27T09:15:00Z",
          status: "new",
          groupName: "Family Support"
        }
      ]);
      
      setMyGroups([
        {
          id: 1,
          name: "Family Support",
          memberCount: 8,
          requestCount: 12
        },
        {
          id: 2,
          name: "Community Group",
          memberCount: 24,
          requestCount: 36
        }
      ]);
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#6366F1'; // Indigo
      case 'in-progress':
        return '#F59E0B'; // Amber
      case 'answered':
        return '#10B981'; // Emerald
      default:
        return '#6B7280'; // Gray
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back, {user?.name}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Prayer Requests</Text>
          <TouchableOpacity onPress={() => navigate('PrayerRequests')}>
            <Text style={styles.seeAllLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentRequests.length > 0 ? (
          recentRequests.map(request => (
            <TouchableOpacity 
              key={request.id}
              style={styles.requestCard}
              onPress={() => navigate('RequestDetails', { requestId: request.id })}
            >
              <View style={styles.requestHeader}>
                <Text style={styles.requestTitle}>{request.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text style={styles.statusText}>{request.status}</Text>
                </View>
              </View>
              <View style={styles.requestMeta}>
                <Text style={styles.requestGroup}>{request.groupName}</Text>
                <Text style={styles.requestDate}>{formatDate(request.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No prayer requests yet</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigate('PrayerRequests', { action: 'create' })}
            >
              <Text style={styles.createButtonText}>Create Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Groups</Text>
          <TouchableOpacity onPress={() => navigate('ExploreGroups')}>
            <Text style={styles.seeAllLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {myGroups.length > 0 ? (
          myGroups.map(group => (
            <TouchableOpacity 
              key={group.id}
              style={styles.groupCard}
              onPress={() => navigate('GroupDetails', { groupId: group.id })}
            >
              <Text style={styles.groupName}>{group.name}</Text>
              <View style={styles.groupStats}>
                <Text style={styles.groupStat}>{group.memberCount} members</Text>
                <Text style={styles.groupStat}>{group.requestCount} requests</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>You haven't joined any groups yet</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigate('ExploreGroups')}
            >
              <Text style={styles.createButtonText}>Find Groups</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllLink: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  requestCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestGroup: {
    fontSize: 12,
    color: '#6B7280',
  },
  requestDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  groupCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupStat: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default HomeScreen;