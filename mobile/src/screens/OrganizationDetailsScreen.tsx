import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Share, Clipboard } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@navigation/MainNavigator';
import {
  Text,
  Card,
  Button,
  IconButton,
  Portal,
  Dialog,
  TextInput,
  ActivityIndicator,
  useTheme,
  Avatar,
  List,
  Divider,
  Surface,
  Snackbar,
  Menu,
  TouchableRipple,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import { apiRequest } from '@/api/queryClient';

// Types for API responses
type OrganizationDetails = {
  id: number;
  name: string;
  description: string;
  website: string;
  inviteCode: string;
  memberCount: number;
  groupCount: number;
  isAdmin: boolean;
  createdAt: string;
};

type OrganizationMember = {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  isAdmin: boolean;
  joinedAt: string;
};

export default function OrganizationDetailsScreen() {
  const route = useRoute<RouteProp<SettingsStackParamList, 'OrganizationDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const theme = useTheme();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { organizationId } = route.params;
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'members'>('details');
  const [editOrgDialogVisible, setEditOrgDialogVisible] = useState(false);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgDescription, setEditOrgDescription] = useState('');
  const [editOrgWebsite, setEditOrgWebsite] = useState('');
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [regenerateCodeDialogVisible, setRegenerateCodeDialogVisible] = useState(false);
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [removeUserId, setRemoveUserId] = useState<number | null>(null);
  const [removeUserName, setRemoveUserName] = useState('');
  const [transferDialogVisible, setTransferDialogVisible] = useState(false);
  const [transferUserId, setTransferUserId] = useState<number | null>(null);
  const [transferUserName, setTransferUserName] = useState('');
  const [manageMenuVisible, setManageMenuVisible] = useState(false);
  const [memberMenuVisible, setMemberMenuVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [selectedMemberIsAdmin, setSelectedMemberIsAdmin] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch organization details
  const { 
    data: organization, 
    isLoading: isOrgLoading,
    refetch: refetchOrg,
  } = useQuery<OrganizationDetails>({
    queryKey: [`/api/organizations/${organizationId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/organizations/${organizationId}`);
      if (!res.ok) throw new Error('Failed to fetch organization details');
      return res.json();
    },
  });

  // Fetch organization members
  const {
    data: members,
    isLoading: isMembersLoading,
    refetch: refetchMembers,
  } = useQuery<OrganizationMember[]>({
    queryKey: [`/api/organizations/${organizationId}/members`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/organizations/${organizationId}/members`);
      if (!res.ok) throw new Error('Failed to fetch organization members');
      return res.json();
    },
  });

  // Update organization mutation
  const updateOrgMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; website: string }) => {
      const res = await apiRequest('PUT', `/api/organizations/${organizationId}`, data);
      if (!res.ok) throw new Error('Failed to update organization');
      return res.json();
    },
    onSuccess: () => {
      setEditOrgDialogVisible(false);
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
    },
  });

  // Regenerate invite code mutation
  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/organizations/${organizationId}/regenerate-code`);
      if (!res.ok) throw new Error('Failed to regenerate invite code');
      return res.json();
    },
    onSuccess: () => {
      setRegenerateCodeDialogVisible(false);
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}`] });
      showSnackbar('Invite code regenerated successfully');
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', `/api/organizations/${organizationId}/invite`, { email });
      if (!res.ok) throw new Error('Failed to send invitation');
      return res.json();
    },
    onSuccess: () => {
      setInviteDialogVisible(false);
      setInviteEmail('');
      showSnackbar('Invitation sent successfully');
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const res = await apiRequest('PUT', `/api/organizations/${organizationId}/members/${userId}`, { isAdmin });
      if (!res.ok) throw new Error('Failed to update member role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}/members`] });
      showSnackbar('Member role updated');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('DELETE', `/api/organizations/${organizationId}/members/${userId}`);
      if (!res.ok) throw new Error('Failed to remove member');
      return res.json();
    },
    onSuccess: () => {
      setRemoveDialogVisible(false);
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}`] });
      showSnackbar('Member removed successfully');
    },
  });

  // Transfer ownership mutation
  const transferOwnershipMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('POST', `/api/organizations/${organizationId}/transfer`, { userId });
      if (!res.ok) throw new Error('Failed to transfer ownership');
      return res.json();
    },
    onSuccess: () => {
      setTransferDialogVisible(false);
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${organizationId}/members`] });
      showSnackbar('Organization ownership transferred');
    },
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchOrg(),
        refetchMembers(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchOrg, refetchMembers]);

  const handleOpenEditDialog = () => {
    if (organization) {
      setEditOrgName(organization.name);
      setEditOrgDescription(organization.description || '');
      setEditOrgWebsite(organization.website || '');
      setEditOrgDialogVisible(true);
    }
  };

  const handleUpdateOrg = () => {
    if (editOrgName.trim()) {
      updateOrgMutation.mutate({
        name: editOrgName.trim(),
        description: editOrgDescription.trim(),
        website: editOrgWebsite.trim(),
      });
    }
  };

  const handleInviteMember = () => {
    if (inviteEmail.trim()) {
      inviteMemberMutation.mutate(inviteEmail.trim());
    }
  };

  const handleCopyInviteCode = () => {
    if (organization?.inviteCode) {
      Clipboard.setString(organization.inviteCode);
      showSnackbar('Invite code copied to clipboard');
    }
  };

  const handleShareInviteCode = async () => {
    if (organization?.inviteCode) {
      try {
        await Share.share({
          message: `Join ${organization.name} on Prayer Pipeline using invite code: ${organization.inviteCode}`,
        });
      } catch (error) {
        console.error('Error sharing invite code:', error);
      }
    }
  };

  const handleToggleAdminRole = (userId: number, isCurrentlyAdmin: boolean) => {
    updateMemberRoleMutation.mutate({
      userId,
      isAdmin: !isCurrentlyAdmin,
    });
  };

  const openRemoveDialog = (userId: number, userName: string) => {
    setRemoveUserId(userId);
    setRemoveUserName(userName);
    setRemoveDialogVisible(true);
  };

  const handleRemoveMember = () => {
    if (removeUserId) {
      removeMemberMutation.mutate(removeUserId);
    }
  };

  const openTransferDialog = (userId: number, userName: string) => {
    setTransferUserId(userId);
    setTransferUserName(userName);
    setTransferDialogVisible(true);
  };

  const handleTransferOwnership = () => {
    if (transferUserId) {
      transferOwnershipMutation.mutate(transferUserId);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isOrgLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!organization) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineSmall">Organization not found</Text>
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
        {/* Organization Header */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <Avatar.Text
              size={60}
              label={organization.name.substring(0, 2).toUpperCase()}
              style={styles.orgAvatar}
            />
            <View style={styles.headerInfo}>
              <Text variant="headlineSmall">{organization.name}</Text>
              <Text variant="bodyMedium" style={styles.headerStats}>
                {organization.memberCount} {organization.memberCount === 1 ? 'member' : 'members'} · {organization.groupCount} {organization.groupCount === 1 ? 'group' : 'groups'}
              </Text>
            </View>
            
            {organization.isAdmin && (
              <Menu
                visible={manageMenuVisible}
                onDismiss={() => setManageMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={24}
                    onPress={() => setManageMenuVisible(true)}
                  />
                }
              >
                <Menu.Item
                  title="Edit Organization"
                  leadingIcon="pencil"
                  onPress={() => {
                    setManageMenuVisible(false);
                    handleOpenEditDialog();
                  }}
                />
                <Menu.Item
                  title="Invite Member"
                  leadingIcon="account-plus"
                  onPress={() => {
                    setManageMenuVisible(false);
                    setInviteDialogVisible(true);
                  }}
                />
                <Menu.Item
                  title="Regenerate Invite Code"
                  leadingIcon="refresh"
                  onPress={() => {
                    setManageMenuVisible(false);
                    setRegenerateCodeDialogVisible(true);
                  }}
                />
              </Menu>
            )}
          </View>
        </Surface>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableRipple
            style={[
              styles.tabButton,
              activeTab === 'details' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('details')}
          >
            <Text
              variant="labelLarge"
              style={[
                styles.tabText,
                activeTab === 'details' && styles.activeTabText,
              ]}
            >
              Details
            </Text>
          </TouchableRipple>
          
          <TouchableRipple
            style={[
              styles.tabButton,
              activeTab === 'members' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('members')}
          >
            <Text
              variant="labelLarge"
              style={[
                styles.tabText,
                activeTab === 'members' && styles.activeTabText,
              ]}
            >
              Members
            </Text>
          </TouchableRipple>
        </View>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <View style={styles.tabContent}>
            <Card style={styles.detailsCard}>
              <Card.Content>
                {organization.description && (
                  <>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      About
                    </Text>
                    <Text variant="bodyMedium" style={styles.description}>
                      {organization.description}
                    </Text>
                    <Divider style={styles.divider} />
                  </>
                )}
                
                {organization.website && (
                  <>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Website
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={styles.website}
                      onPress={() => Linking.openURL(organization.website)}
                    >
                      {organization.website}
                    </Text>
                    <Divider style={styles.divider} />
                  </>
                )}
                
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Created
                </Text>
                <Text variant="bodyMedium" style={styles.createdDate}>
                  {formatDate(organization.createdAt)}
                </Text>
                
                {organization.isAdmin && (
                  <>
                    <Divider style={styles.divider} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Invite Code
                    </Text>
                    <View style={styles.inviteCodeContainer}>
                      <Text variant="bodyMedium" style={styles.inviteCode}>
                        {organization.inviteCode}
                      </Text>
                      <View style={styles.inviteCodeActions}>
                        <IconButton
                          icon="content-copy"
                          size={20}
                          onPress={handleCopyInviteCode}
                        />
                        <IconButton
                          icon="share-variant"
                          size={20}
                          onPress={handleShareInviteCode}
                        />
                      </View>
                    </View>
                    <Text variant="bodySmall" style={styles.inviteCodeHelp}>
                      Share this code to allow others to join your organization
                    </Text>
                  </>
                )}
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <View style={styles.tabContent}>
            {organization.isAdmin && (
              <Button
                mode="contained"
                icon="account-plus"
                onPress={() => setInviteDialogVisible(true)}
                style={styles.inviteButton}
              >
                Invite Member
              </Button>
            )}
            
            {isMembersLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : members && members.length > 0 ? (
              <Card style={styles.membersCard}>
                {members.map((member) => (
                  <React.Fragment key={member.id}>
                    <List.Item
                      title={member.userName}
                      description={
                        member.isAdmin
                          ? 'Administrator'
                          : `Joined ${formatDate(member.joinedAt)}`
                      }
                      left={() => (
                        <Avatar.Text
                          size={40}
                          label={member.userName.substring(0, 2).toUpperCase()}
                          style={[
                            styles.memberAvatar,
                            member.isAdmin && { backgroundColor: theme.colors.secondary },
                          ]}
                        />
                      )}
                      right={() => (
                        organization.isAdmin && member.userId !== user?.id ? (
                          <IconButton
                            icon="dots-vertical"
                            onPress={() => {
                              setSelectedMemberId(member.userId);
                              setSelectedMemberName(member.userName);
                              setSelectedMemberIsAdmin(member.isAdmin);
                              setMemberMenuVisible(true);
                            }}
                          />
                        ) : null
                      )}
                    />
                    <Divider style={styles.memberDivider} />
                  </React.Fragment>
                ))}
              </Card>
            ) : (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text variant="bodyLarge" style={styles.emptyText}>
                    No members found
                  </Text>
                </Card.Content>
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      {/* Member Menu */}
      <Portal>
        <Menu
          visible={memberMenuVisible}
          onDismiss={() => setMemberMenuVisible(false)}
          anchor={{ x: 0, y: 0 }}
          style={styles.memberMenu}
        >
          <Menu.Item
            title={selectedMemberIsAdmin ? "Remove Admin Role" : "Make Admin"}
            leadingIcon={selectedMemberIsAdmin ? "account" : "shield-account"}
            onPress={() => {
              setMemberMenuVisible(false);
              if (selectedMemberId !== null) {
                handleToggleAdminRole(selectedMemberId, selectedMemberIsAdmin);
              }
            }}
          />
          <Menu.Item
            title="Transfer Ownership"
            leadingIcon="crown"
            onPress={() => {
              setMemberMenuVisible(false);
              if (selectedMemberId !== null) {
                openTransferDialog(selectedMemberId, selectedMemberName);
              }
            }}
          />
          <Menu.Item
            title="Remove from Organization"
            leadingIcon="account-remove"
            onPress={() => {
              setMemberMenuVisible(false);
              if (selectedMemberId !== null) {
                openRemoveDialog(selectedMemberId, selectedMemberName);
              }
            }}
          />
        </Menu>
      </Portal>

      {/* Edit Organization Dialog */}
      <Portal>
        <Dialog visible={editOrgDialogVisible} onDismiss={() => setEditOrgDialogVisible(false)}>
          <Dialog.Title>Edit Organization</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Organization Name *"
              value={editOrgName}
              onChangeText={setEditOrgName}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Description"
              value={editOrgDescription}
              onChangeText={setEditOrgDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
            <TextInput
              label="Website"
              value={editOrgWebsite}
              onChangeText={setEditOrgWebsite}
              mode="outlined"
              style={styles.dialogInput}
              keyboardType="url"
              autoCapitalize="none"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditOrgDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleUpdateOrg}
              loading={updateOrgMutation.isPending}
              disabled={!editOrgName.trim()}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Invite Member Dialog */}
      <Portal>
        <Dialog visible={inviteDialogVisible} onDismiss={() => setInviteDialogVisible(false)}>
          <Dialog.Title>Invite Member</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Enter the email address of the person you want to invite:
            </Text>
            <TextInput
              label="Email Address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              mode="outlined"
              style={styles.dialogInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInviteDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleInviteMember}
              loading={inviteMemberMutation.isPending}
              disabled={!inviteEmail.trim()}
            >
              Send Invite
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Regenerate Invite Code Dialog */}
      <Portal>
        <Dialog visible={regenerateCodeDialogVisible} onDismiss={() => setRegenerateCodeDialogVisible(false)}>
          <Dialog.Title>Regenerate Invite Code?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This will invalidate the current invite code. Anyone with the old code will no longer be able to join the organization. Are you sure you want to proceed?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRegenerateCodeDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => regenerateCodeMutation.mutate()}
              loading={regenerateCodeMutation.isPending}
            >
              Regenerate
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Remove Member Dialog */}
      <Portal>
        <Dialog visible={removeDialogVisible} onDismiss={() => setRemoveDialogVisible(false)}>
          <Dialog.Title>Remove Member?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to remove {removeUserName} from this organization? They will lose access to all groups and prayer requests in this organization.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRemoveDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleRemoveMember}
              textColor="#ef4444"
              loading={removeMemberMutation.isPending}
            >
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Transfer Ownership Dialog */}
      <Portal>
        <Dialog visible={transferDialogVisible} onDismiss={() => setTransferDialogVisible(false)}>
          <Dialog.Title>Transfer Ownership?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to transfer ownership of this organization to {transferUserName}? 
              You will retain admin privileges, but {transferUserName} will become the primary owner with full control over the organization.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTransferDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleTransferOwnership}
              loading={transferOwnershipMutation.isPending}
            >
              Transfer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
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
    paddingBottom: 16,
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
  header: {
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgAvatar: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerStats: {
    marginTop: 4,
    opacity: 0.7,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    color: '#64748b',
  },
  activeTabText: {
    color: '#6366f1',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 24,
  },
  divider: {
    marginVertical: 16,
  },
  website: {
    marginBottom: 16,
    color: '#6366f1',
    textDecorationLine: 'underline',
  },
  createdDate: {
    marginBottom: 16,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
  },
  inviteCode: {
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  inviteCodeActions: {
    flexDirection: 'row',
  },
  inviteCodeHelp: {
    opacity: 0.6,
  },
  inviteButton: {
    marginBottom: 16,
  },
  membersCard: {
    marginBottom: 16,
  },
  memberAvatar: {
    marginRight: 8,
  },
  memberDivider: {
    height: 1,
    marginLeft: 72,
  },
  loader: {
    marginVertical: 24,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    padding: 16,
  },
  memberMenu: {
    position: 'absolute',
    right: 16,
    top: 100,
  },
  dialogText: {
    marginBottom: 16,
  },
  dialogInput: {
    marginBottom: 12,
  },
});