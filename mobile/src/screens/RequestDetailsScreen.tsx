import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TextInput as RNTextInput } from 'react-native';
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
  TextInput,
  List,
  Menu,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import { apiRequest } from '@/api/queryClient';

// Types for API responses
type PrayerRequest = {
  id: number;
  title: string;
  content: string;
  status: string;
  urgency: string;
  createdAt: string;
  updatedAt: string;
  groupId: number;
  groupName: string;
  userId: number;
  userName: string;
  commentCount: number;
  isOwner: boolean;
};

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  isOwner: boolean;
};

export default function RequestDetailsScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'RequestDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { requestId } = route.params;
  
  const [refreshing, setRefreshing] = useState(false);
  const [comment, setComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<'request' | 'comment'>('comment');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [commentMenuVisible, setCommentMenuVisible] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  
  const commentInputRef = useRef<RNTextInput>(null);

  // Fetch prayer request details
  const { 
    data: request, 
    isLoading: isRequestLoading,
    refetch: refetchRequest,
  } = useQuery<PrayerRequest>({
    queryKey: [`/api/requests/${requestId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/requests/${requestId}`);
      if (!res.ok) throw new Error('Failed to fetch prayer request');
      return res.json();
    },
  });

  // Fetch comments
  const {
    data: comments,
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useQuery<Comment[]>({
    queryKey: [`/api/requests/${requestId}/comments`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/requests/${requestId}/comments`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/requests/${requestId}/comments`, { content });
      if (!res.ok) throw new Error('Failed to add comment');
      return res.json();
    },
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}`] });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      const res = await apiRequest('PUT', `/api/comments/${commentId}`, { content });
      if (!res.ok) throw new Error('Failed to update comment');
      return res.json();
    },
    onSuccess: () => {
      setEditingCommentId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}/comments`] });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await apiRequest('DELETE', `/api/comments/${commentId}`);
      if (!res.ok) throw new Error('Failed to delete comment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}`] });
    },
  });

  // Update prayer request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest('PUT', `/api/requests/${requestId}/status`, { status });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/requests/user/recent'] });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${request?.groupId}/requests`] });
    },
  });

  // Delete prayer request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/api/requests/${requestId}`);
      if (!res.ok) throw new Error('Failed to delete prayer request');
      return res.json();
    },
    onSuccess: () => {
      navigation.goBack();
      queryClient.invalidateQueries({ queryKey: ['/api/requests/user/recent'] });
      if (request?.groupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${request.groupId}/requests`] });
      }
    },
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchRequest(),
        refetchComments(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchRequest, refetchComments]);

  const handleAddComment = () => {
    if (comment.trim()) {
      addCommentMutation.mutate(comment.trim());
    }
  };

  const handleEditComment = (commentId: number, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditedCommentContent(currentContent);
  };

  const handleUpdateComment = () => {
    if (editingCommentId && editedCommentContent.trim()) {
      updateCommentMutation.mutate({
        commentId: editingCommentId,
        content: editedCommentContent.trim(),
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
  };

  const openDeleteDialog = (id: number, type: 'request' | 'comment') => {
    setDeleteTargetId(id);
    setDeleteType(type);
    setDeleteDialogVisible(true);
  };

  const handleDelete = () => {
    if (deleteType === 'comment' && deleteTargetId) {
      deleteCommentMutation.mutate(deleteTargetId);
    } else if (deleteType === 'request') {
      deleteRequestMutation.mutate();
    }
    setDeleteDialogVisible(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#3b82f6'; // blue
      case 'in-progress':
        return '#f59e0b'; // amber
      case 'answered':
        return '#10b981'; // green
      default:
        return theme.colors.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return 'prayer';
      case 'in-progress':
        return 'clock-outline';
      case 'answered':
        return 'check-circle';
      default:
        return 'prayer';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low':
        return '#22c55e'; // green
      case 'medium':
        return '#f59e0b'; // amber
      case 'high':
        return '#ef4444'; // red
      default:
        return undefined;
    }
  };

  if (isRequestLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="headlineSmall">Prayer request not found</Text>
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
        {/* Prayer Request Card */}
        <Card style={styles.requestCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.metaInfo}>
                <Text variant="bodySmall" style={styles.groupName}>
                  {request.groupName}
                </Text>
                <Text variant="bodySmall">
                  {formatDate(request.createdAt)}
                </Text>
              </View>
              
              {request.isOwner && (
                <Menu
                  visible={statusMenuVisible}
                  onDismiss={() => setStatusMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      icon={getStatusIcon(request.status)}
                      textColor={getStatusColor(request.status)}
                      style={[styles.statusButton, { borderColor: getStatusColor(request.status) }]}
                      onPress={() => setStatusMenuVisible(true)}
                    >
                      {request.status === 'new'
                        ? 'New'
                        : request.status === 'in-progress'
                        ? 'In Progress'
                        : 'Answered'}
                    </Button>
                  }
                >
                  <Menu.Item
                    title="Mark as New"
                    leadingIcon="prayer"
                    onPress={() => {
                      updateStatusMutation.mutate('new');
                      setStatusMenuVisible(false);
                    }}
                  />
                  <Menu.Item
                    title="Mark In Progress"
                    leadingIcon="clock-outline"
                    onPress={() => {
                      updateStatusMutation.mutate('in-progress');
                      setStatusMenuVisible(false);
                    }}
                  />
                  <Menu.Item
                    title="Mark as Answered"
                    leadingIcon="check-circle"
                    onPress={() => {
                      updateStatusMutation.mutate('answered');
                      setStatusMenuVisible(false);
                    }}
                  />
                  <Divider />
                  <Menu.Item
                    title="Edit Request"
                    leadingIcon="pencil"
                    onPress={() => {
                      setStatusMenuVisible(false);
                      /* Navigate to edit request screen */
                    }}
                  />
                  <Menu.Item
                    title="Delete Request"
                    leadingIcon="delete"
                    onPress={() => {
                      setStatusMenuVisible(false);
                      openDeleteDialog(request.id, 'request');
                    }}
                  />
                </Menu>
              )}
            </View>
            
            <Text variant="headlineSmall" style={styles.title}>
              {request.title}
            </Text>
            
            <View style={styles.userInfo}>
              <Avatar.Text
                size={24}
                label={request.userName.substring(0, 2).toUpperCase()}
                style={styles.avatar}
              />
              <Text variant="bodyMedium">{request.userName}</Text>
            </View>
            
            <View style={styles.tagsContainer}>
              <Chip
                style={[styles.urgencyChip, { borderColor: getUrgencyColor(request.urgency) }]}
                textStyle={{ color: getUrgencyColor(request.urgency) }}
                mode="outlined"
              >
                {request.urgency === 'high'
                  ? 'Urgent'
                  : request.urgency === 'medium'
                  ? 'Medium'
                  : 'Low'} Priority
              </Chip>
              
              <Chip
                style={[styles.statusChip, { borderColor: getStatusColor(request.status) }]}
                textStyle={{ color: getStatusColor(request.status) }}
                mode="outlined"
                icon={getStatusIcon(request.status)}
              >
                {request.status === 'new'
                  ? 'New'
                  : request.status === 'in-progress'
                  ? 'In Progress'
                  : 'Answered'}
              </Chip>
            </View>
            
            <Text variant="bodyLarge" style={styles.content}>
              {request.content}
            </Text>
          </Card.Content>
        </Card>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text variant="titleMedium" style={styles.commentsHeader}>
            Comments ({request.commentCount})
          </Text>
          
          {isCommentsLoading ? (
            <ActivityIndicator style={styles.commentsLoader} />
          ) : comments && comments.length > 0 ? (
            comments.map((comment) => (
              <Card key={comment.id} style={styles.commentCard}>
                <Card.Content>
                  {editingCommentId === comment.id ? (
                    <View>
                      <TextInput
                        value={editedCommentContent}
                        onChangeText={setEditedCommentContent}
                        multiline
                        mode="outlined"
                        style={styles.editInput}
                      />
                      <View style={styles.editActions}>
                        <Button onPress={handleCancelEdit}>Cancel</Button>
                        <Button 
                          mode="contained"
                          onPress={handleUpdateComment}
                          disabled={!editedCommentContent.trim()}
                          loading={updateCommentMutation.isPending}
                        >
                          Save
                        </Button>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentUser}>
                          <Avatar.Text
                            size={24}
                            label={comment.userName.substring(0, 2).toUpperCase()}
                            style={styles.commentAvatar}
                          />
                          <Text variant="bodyMedium">{comment.userName}</Text>
                        </View>
                        
                        {comment.isOwner && (
                          <IconButton
                            icon="dots-vertical"
                            size={20}
                            onPress={() => {
                              setSelectedCommentId(comment.id);
                              setCommentMenuVisible(true);
                            }}
                          />
                        )}
                      </View>
                      
                      <Text variant="bodyMedium" style={styles.commentContent}>
                        {comment.content}
                      </Text>
                      
                      <Text variant="bodySmall" style={styles.commentDate}>
                        {formatDate(comment.createdAt)}
                      </Text>
                    </>
                  )}
                </Card.Content>
                
                {/* Comment Menu */}
                <Menu
                  visible={commentMenuVisible && selectedCommentId === comment.id}
                  onDismiss={() => setCommentMenuVisible(false)}
                  anchor={{ x: 0, y: 0 }}
                  style={styles.commentMenu}
                >
                  <Menu.Item
                    title="Edit"
                    leadingIcon="pencil"
                    onPress={() => {
                      setCommentMenuVisible(false);
                      handleEditComment(comment.id, comment.content);
                    }}
                  />
                  <Menu.Item
                    title="Delete"
                    leadingIcon="delete"
                    onPress={() => {
                      setCommentMenuVisible(false);
                      openDeleteDialog(comment.id, 'comment');
                    }}
                  />
                </Menu>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCommentsCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.emptyCommentsText}>
                  No comments yet. Be the first to add your thoughts or encouragement.
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <Card style={styles.commentInputCard}>
        <Card.Content style={styles.commentInputContent}>
          <TextInput
            ref={commentInputRef}
            placeholder="Add a comment..."
            value={comment}
            onChangeText={setComment}
            mode="outlined"
            multiline
            style={styles.commentInput}
          />
          <Button
            mode="contained"
            onPress={handleAddComment}
            disabled={!comment.trim()}
            loading={addCommentMutation.isPending}
            style={styles.sendButton}
            icon="send"
            contentStyle={styles.sendButtonContent}
          >
            Send
          </Button>
        </Card.Content>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>
            {deleteType === 'comment' ? 'Delete Comment?' : 'Delete Prayer Request?'}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {deleteType === 'comment'
                ? 'Are you sure you want to delete this comment? This action cannot be undone.'
                : 'Are you sure you want to delete this prayer request? All comments will also be deleted. This action cannot be undone.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleDelete}
              textColor="#ef4444"
              loading={
                (deleteType === 'comment' && deleteCommentMutation.isPending) ||
                (deleteType === 'request' && deleteRequestMutation.isPending)
              }
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
    paddingBottom: 100, // Add space for the comment input
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
  requestCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metaInfo: {
    flex: 1,
  },
  groupName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusButton: {
    height: 36,
  },
  title: {
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  urgencyChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  statusChip: {
    marginBottom: 8,
  },
  content: {
    lineHeight: 24,
  },
  commentsSection: {
    marginBottom: 16,
  },
  commentsHeader: {
    marginBottom: 12,
  },
  commentsLoader: {
    margin: 24,
  },
  commentCard: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    marginRight: 8,
  },
  commentContent: {
    marginBottom: 8,
  },
  commentDate: {
    opacity: 0.6,
  },
  emptyCommentsCard: {
    marginBottom: 12,
  },
  emptyCommentsText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  commentMenu: {
    position: 'absolute',
    right: 8,
    top: 40,
  },
  editInput: {
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  commentInputCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    borderRadius: 0,
  },
  commentInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    height: 40,
    width: 100,
  },
  sendButtonContent: {
    flexDirection: 'row-reverse',
  },
});