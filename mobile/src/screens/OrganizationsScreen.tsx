import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@navigation/MainNavigator';
import {
  Text,
  Card,
  Button,
  Portal,
  Dialog,
  TextInput,
  ActivityIndicator,
  useTheme,
  Avatar,
  FAB,
  Divider,
  List,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import { apiRequest } from '@/api/queryClient';

// Types for API responses
type Organization = {
  id: number;
  name: string;
  description: string;
  website: string;
  memberCount: number;
  isAdmin: boolean;
  joinedAt: string;
};

type OrganizationInvite = {
  id: number;
  organizationId: number;
  organizationName: string;
  invitedByName: string;
  invitedAt: string;
  status: string;
};

export default function OrganizationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const theme = useTheme();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [refreshing, setRefreshing] = useState(false);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [newOrgWebsite, setNewOrgWebsite] = useState('');
  const [leaveDialogVisible, setLeaveDialogVisible] = useState(false);
  const [leaveOrgId, setLeaveOrgId] = useState<number | null>(null);
  const [leaveOrgName, setLeaveOrgName] = useState('');

  // Fetch user's organizations
  const {
    data: organizations,
    isLoading: isOrgsLoading,
    refetch: refetchOrgs,
  } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/organizations');
      if (!res.ok) throw new Error('Failed to fetch organizations');
      return res.json();
    },
  });

  // Fetch organization invites
  const {
    data: invites,
    isLoading: isInvitesLoading,
    refetch: refetchInvites,
  } = useQuery<OrganizationInvite[]>({
    queryKey: ['/api/organizations/invites'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/organizations/invites');
      if (!res.ok) throw new Error('Failed to fetch invites');
      return res.json();
    },
  });

  // Accept invite mutation
  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      const res = await apiRequest('POST', `/api/organizations/invites/${inviteId}/accept`);
      if (!res.ok) throw new Error('Failed to accept invite');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/invites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      refreshUser();
    },
  });

  // Decline invite mutation
  const declineInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      const res = await apiRequest('POST', `/api/organizations/invites/${inviteId}/decline`);
      if (!res.ok) throw new Error('Failed to decline invite');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/invites'] });
    },
  });

  // Join with invite code mutation
  const joinWithCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest('POST', '/api/organizations/join', { code });
      if (!res.ok) throw new Error('Failed to join organization');
      return res.json();
    },
    onSuccess: () => {
      setInviteCode('');
      setInviteDialogVisible(false);
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      refreshUser();
    },
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; website: string }) => {
      const res = await apiRequest('POST', '/api/organizations', data);
      if (!res.ok) throw new Error('Failed to create organization');
      return res.json();
    },
    onSuccess: (data) => {
      setCreateDialogVisible(false);
      setNewOrgName('');
      setNewOrgDescription('');
      setNewOrgWebsite('');
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      refreshUser();
      
      // Navigate to the new organization details
      navigation.navigate('OrganizationDetails', { organizationId: data.id });
    },
  });

  // Leave organization mutation
  const leaveOrgMutation = useMutation({
    mutationFn: async (orgId: number) => {
      const res = await apiRequest('DELETE', `/api/organizations/${orgId}/leave`);
      if (!res.ok) throw new Error('Failed to leave organization');
      return res.json();
    },
    onSuccess: () => {
      setLeaveDialogVisible(false);
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      refreshUser();
    },
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchOrgs(),
        refetchInvites(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchOrgs, refetchInvites]);

  const handleAcceptInvite = (inviteId: number) => {
    acceptInviteMutation.mutate(inviteId);
  };

  const handleDeclineInvite = (inviteId: number) => {
    declineInviteMutation.mutate(inviteId);
  };

  const handleJoinWithCode = () => {
    if (inviteCode.trim()) {
      joinWithCodeMutation.mutate(inviteCode.trim());
    }
  };

  const handleCreateOrg = () => {
    if (newOrgName.trim()) {
      createOrgMutation.mutate({
        name: newOrgName.trim(),
        description: newOrgDescription.trim(),
        website: newOrgWebsite.trim(),
      });
    }
  };

  const handleLeaveOrg = () => {
    if (leaveOrgId) {
      leaveOrgMutation.mutate(leaveOrgId);
    }
  };

  const openLeaveDialog = (orgId: number, orgName: string) => {
    setLeaveOrgId(orgId);
    setLeaveOrgName(orgName);
    setLeaveDialogVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Current Organizations */}
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Your Organizations
        </Text>
        
        {isOrgsLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : organizations && organizations.length > 0 ? (
          organizations.map((org) => (
            <Card
              key={org.id}
              style={styles.orgCard}
              onPress={() => navigation.navigate('OrganizationDetails', { organizationId: org.id })}
            >
              <Card.Content>
                <View style={styles.orgHeader}>
                  <Avatar.Text
                    size={40}
                    label={getInitials(org.name)}
                    style={[
                      styles.orgAvatar,
                      { backgroundColor: org.isAdmin ? theme.colors.secondary : theme.colors.primary },
                    ]}
                  />
                  <View style={styles.orgInfo}>
                    <Text variant="titleMedium">{org.name}</Text>
                    <Text variant="bodySmall">
                      {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                </View>
                
                {org.description && (
                  <Text variant="bodyMedium" style={styles.orgDescription}>
                    {org.description.length > 100
                      ? `${org.description.substring(0, 100)}...`
                      : org.description}
                  </Text>
                )}
                
                <View style={styles.orgFooter}>
                  <Text variant="bodySmall" style={styles.joinedDate}>
                    Joined {formatDate(org.joinedAt)}
                  </Text>
                  
                  {org.isAdmin ? (
                    <Button
                      mode="outlined"
                      onPress={() => navigation.navigate('OrganizationDetails', { organizationId: org.id })}
                    >
                      Manage
                    </Button>
                  ) : (
                    <Button
                      mode="outlined"
                      onPress={() => openLeaveDialog(org.id, org.name)}
                    >
                      Leave
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                You aren't a member of any organizations yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Create a new organization or join with an invite code
              </Text>
              <View style={styles.emptyActions}>
                <Button
                  mode="outlined"
                  icon="link-variant"
                  onPress={() => setInviteDialogVisible(true)}
                  style={styles.emptyButton}
                >
                  Join with Code
                </Button>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => setCreateDialogVisible(true)}
                  style={styles.emptyButton}
                >
                  Create New
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Organization Invites */}
        {invites && invites.length > 0 && (
          <>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Pending Invites
            </Text>
            
            {isInvitesLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : (
              invites.map((invite) => (
                <Card key={invite.id} style={styles.inviteCard}>
                  <Card.Content>
                    <Text variant="titleMedium">{invite.organizationName}</Text>
                    <Text variant="bodyMedium" style={styles.inviteText}>
                      {invite.invitedByName} has invited you to join this organization
                    </Text>
                    <Text variant="bodySmall" style={styles.inviteDate}>
                      Invited on {formatDate(invite.invitedAt)}
                    </Text>
                    
                    <View style={styles.inviteActions}>
                      <Button
                        mode="outlined"
                        onPress={() => handleDeclineInvite(invite.id)}
                        style={styles.inviteButton}
                        loading={declineInviteMutation.isPending}
                      >
                        Decline
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => handleAcceptInvite(invite.id)}
                        style={styles.inviteButton}
                        loading={acceptInviteMutation.isPending}
                      >
                        Accept
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* FAB for creating/joining organizations */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setCreateDialogVisible(true)}
      />

      {/* Join with Invite Code Dialog */}
      <Portal>
        <Dialog visible={inviteDialogVisible} onDismiss={() => setInviteDialogVisible(false)}>
          <Dialog.Title>Join Organization</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Enter the invite code provided by the organization admin:
            </Text>
            <TextInput
              label="Invite Code"
              value={inviteCode}
              onChangeText={setInviteCode}
              mode="outlined"
              style={styles.dialogInput}
              autoCapitalize="none"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInviteDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleJoinWithCode}
              loading={joinWithCodeMutation.isPending}
              disabled={!inviteCode.trim()}
            >
              Join
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Create Organization Dialog */}
      <Portal>
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Create Organization</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Create a new organization to connect with your community:
            </Text>
            <TextInput
              label="Organization Name *"
              value={newOrgName}
              onChangeText={setNewOrgName}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Description"
              value={newOrgDescription}
              onChangeText={setNewOrgDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
            <TextInput
              label="Website"
              value={newOrgWebsite}
              onChangeText={setNewOrgWebsite}
              mode="outlined"
              style={styles.dialogInput}
              keyboardType="url"
              autoCapitalize="none"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleCreateOrg}
              loading={createOrgMutation.isPending}
              disabled={!newOrgName.trim()}
            >
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Leave Organization Dialog */}
      <Portal>
        <Dialog visible={leaveDialogVisible} onDismiss={() => setLeaveDialogVisible(false)}>
          <Dialog.Title>Leave Organization?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to leave {leaveOrgName}? You'll lose access to all groups and prayer requests in this organization.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLeaveDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleLeaveOrg}
              textColor="#ef4444"
              loading={leaveOrgMutation.isPending}
            >
              Leave
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
    paddingBottom: 80, // Add space for FAB
  },
  sectionTitle: {
    marginBottom: 16,
  },
  loader: {
    marginVertical: 24,
  },
  orgCard: {
    marginBottom: 16,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orgAvatar: {
    marginRight: 16,
  },
  orgInfo: {
    flex: 1,
  },
  orgDescription: {
    marginBottom: 16,
  },
  orgFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinedDate: {
    opacity: 0.6,
  },
  inviteCard: {
    marginBottom: 16,
  },
  inviteText: {
    marginVertical: 8,
  },
  inviteDate: {
    marginBottom: 16,
    opacity: 0.6,
  },
  inviteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  inviteButton: {
    marginLeft: 12,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 16,
  },
  emptyActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  emptyButton: {
    margin: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialogText: {
    marginBottom: 16,
  },
  dialogInput: {
    marginBottom: 12,
  },
});