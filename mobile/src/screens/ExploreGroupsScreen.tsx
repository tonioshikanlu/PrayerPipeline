import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '@navigation/MainNavigator';
import { 
  Text, 
  Card, 
  Button, 
  Chip, 
  ActivityIndicator, 
  useTheme, 
  Searchbar,
  Divider,
  FAB
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/api/queryClient';

// Group categories for filtering
const CATEGORIES = ['General', 'Bible Study', 'Support', 'Prayer', 'Worship', 'Outreach', 'Youth'];

type Group = {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  privacy: string;
  organizationName: string;
  isJoined: boolean;
};

export default function ExploreGroupsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all groups
  const {
    data: groups,
    isLoading,
    refetch,
  } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/groups');
      if (!res.ok) throw new Error('Failed to fetch groups');
      return res.json();
    },
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing groups:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Filter groups based on search and category
  const filteredGroups = React.useMemo(() => {
    if (!groups) return [];
    
    return groups.filter((group) => {
      const matchesSearch = 
        searchQuery === '' || 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        !selectedCategory || 
        group.category.toLowerCase() === selectedCategory.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
  }, [groups, searchQuery, selectedCategory]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search for groups"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((category) => (
          <Chip
            key={category}
            selected={selectedCategory === category}
            onPress={() => handleCategorySelect(category)}
            style={styles.categoryChip}
            selectedColor={theme.colors.primary}
          >
            {category}
          </Chip>
        ))}
      </ScrollView>
      
      <Divider style={styles.divider} />

      {/* Groups List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.groupsContainer}
        >
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <Card 
                key={group.id} 
                style={styles.groupCard}
                onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium">{group.name}</Text>
                    {group.privacy === 'private' && (
                      <Chip 
                        icon="lock" 
                        compact 
                        mode="outlined"
                      >
                        Private
                      </Chip>
                    )}
                  </View>
                  <Text variant="bodySmall" style={styles.organizationName}>
                    {group.organizationName}
                  </Text>
                  <Text variant="bodyMedium" style={styles.description}>
                    {group.description.length > 120
                      ? `${group.description.substring(0, 120)}...`
                      : group.description}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Chip mode="outlined" style={styles.categoryLabel}>
                      {group.category}
                    </Chip>
                    <Text variant="bodySmall">{group.memberCount} members</Text>
                  </View>
                </Card.Content>
                <Card.Actions>
                  {group.isJoined ? (
                    <Button mode="outlined">View Group</Button>
                  ) : (
                    <Button 
                      mode="contained"
                      icon="account-plus"
                    >
                      Join Group
                    </Button>
                  )}
                </Card.Actions>
              </Card>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text variant="headlineSmall" style={styles.emptyText}>No Groups Found</Text>
              <Text variant="bodyMedium" style={styles.emptySubText}>
                {searchQuery || selectedCategory
                  ? "Try changing your search or filter"
                  : "No groups available in your organization"}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Create Group FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateGroup')}
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
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: 'white',
  },
  categoryContainer: {
    maxHeight: 48,
  },
  categoryContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    marginRight: 8,
    marginVertical: 8,
  },
  divider: {
    marginHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  groupCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  organizationName: {
    marginBottom: 8,
    opacity: 0.6,
  },
  description: {
    marginVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryLabel: {
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 8,
  },
  emptySubText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});