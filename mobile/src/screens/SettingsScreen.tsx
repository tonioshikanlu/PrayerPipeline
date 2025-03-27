import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@navigation/MainNavigator';
import {
  Text,
  List,
  Switch,
  Avatar,
  Divider,
  Button,
  TextInput,
  Card,
  useTheme,
  Surface,
  SegmentedButtons,
} from 'react-native-paper';
import { useAuth } from '@hooks/useAuth';
import { useNotifications } from '@hooks/useNotifications';
import { useForm, Controller } from 'react-hook-form';

type ProfileFormInputs = {
  name: string;
  email: string;
  phone: string;
  bio: string;
};

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const theme = useTheme();
  const { user, logoutMutation } = useAuth();
  const { isNotificationsEnabled, enableNotifications, disableNotifications } = useNotifications();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('profile');
  
  // State for notification settings
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(isNotificationsEnabled);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [newRequestNotifications, setNewRequestNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  
  // Sync the push notification toggle with the notification system
  useEffect(() => {
    setPushNotificationsEnabled(isNotificationsEnabled);
  }, [isNotificationsEnabled]);
  
  // Form for profile editing
  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormInputs>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    },
  });
  
  const onSubmitProfile = (data: ProfileFormInputs) => {
    console.log('Profile update data:', data);
    // Would typically call an API to update the profile here
  };
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const navigateToOrganizations = () => {
    navigation.navigate('Organizations');
  };
  
  return (
    <View style={styles.container}>
      {/* Tab Selection */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'profile', label: 'Profile' },
          { value: 'notifications', label: 'Notifications' },
          { value: 'reminders', label: 'Reminders' },
          { value: 'account', label: 'Account' },
        ]}
        style={styles.tabs}
      />
      
      <ScrollView style={styles.content}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <View>
            <Surface style={styles.profileHeader}>
              <Avatar.Text
                size={80}
                label={user?.name?.substring(0, 2) || 'U'}
                style={styles.avatar}
              />
              <Text variant="headlineSmall" style={styles.profileName}>
                {user?.name}
              </Text>
              <Text variant="bodyMedium" style={styles.profileUsername}>
                @{user?.username}
              </Text>
            </Surface>
            
            <Card style={styles.profileForm}>
              <Card.Content>
                <Controller
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Name"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={!!errors.name}
                      style={styles.input}
                    />
                  )}
                  name="name"
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name.message}</Text>
                )}
                
                <Controller
                  control={control}
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Email"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={!!errors.email}
                      style={styles.input}
                      keyboardType="email-address"
                    />
                  )}
                  name="email"
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
                
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Phone"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={!!errors.phone}
                      style={styles.input}
                      keyboardType="phone-pad"
                    />
                  )}
                  name="phone"
                />
                
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Bio"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={!!errors.bio}
                      style={styles.input}
                      multiline
                      numberOfLines={4}
                    />
                  )}
                  name="bio"
                />
                
                <Button
                  mode="contained"
                  onPress={handleSubmit(onSubmitProfile)}
                  style={styles.submitButton}
                >
                  Update Profile
                </Button>
              </Card.Content>
            </Card>
          </View>
        )}
        
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Notification Preferences
              </Text>
              
              <List.Item
                title="Push Notifications"
                description="Receive notifications on your device"
                right={() => (
                  <Switch
                    value={pushNotificationsEnabled}
                    onValueChange={(value) => {
                      setPushNotificationsEnabled(value);
                      if (value) {
                        enableNotifications();
                      } else {
                        disableNotifications();
                      }
                    }}
                    color={theme.colors.primary}
                  />
                )}
              />
              <Divider />
              
              <List.Item
                title="Email Notifications"
                description="Receive notifications via email"
                right={() => (
                  <Switch
                    value={emailNotificationsEnabled}
                    onValueChange={setEmailNotificationsEnabled}
                    color={theme.colors.primary}
                  />
                )}
              />
              <Divider />
              
              <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 20 }]}>
                Notification Types
              </Text>
              
              <List.Item
                title="New Prayer Requests"
                description="When new prayer requests are added to your groups"
                right={() => (
                  <Switch
                    value={newRequestNotifications}
                    onValueChange={setNewRequestNotifications}
                    color={theme.colors.primary}
                  />
                )}
              />
              <Divider />
              
              <List.Item
                title="Comments"
                description="When someone comments on your prayer requests"
                right={() => (
                  <Switch
                    value={commentNotifications}
                    onValueChange={setCommentNotifications}
                    color={theme.colors.primary}
                  />
                )}
              />
              <Divider />
              
              <List.Item
                title="Prayer Reminders"
                description="Get reminders for your scheduled prayers"
                right={() => (
                  <Switch
                    value={reminderNotifications}
                    onValueChange={setReminderNotifications}
                    color={theme.colors.primary}
                  />
                )}
              />
            </Card.Content>
          </Card>
        )}
        
        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Prayer Reminders
              </Text>
              
              <Text variant="bodyMedium" style={styles.reminderDescription}>
                Set up scheduled reminders to pray for specific requests or groups.
              </Text>
              
              {/* This would typically display a list of existing reminders */}
              <View style={styles.emptyReminders}>
                <Text variant="bodyLarge" style={{ textAlign: 'center' }}>
                  You don't have any prayer reminders yet
                </Text>
                <Button
                  mode="contained"
                  onPress={() => {/* Navigate to create reminder */}}
                  style={styles.addReminderButton}
                >
                  Create Reminder
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
        
        {/* Account Tab */}
        {activeTab === 'account' && (
          <View>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Organizations
                </Text>
                
                <List.Item
                  title="Manage Organizations"
                  description="Create, join, or leave organizations"
                  left={props => <List.Icon {...props} icon="office-building" />}
                  onPress={navigateToOrganizations}
                />
                <Divider />
                
                <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 20 }]}>
                  Account Security
                </Text>
                
                <List.Item
                  title="Change Password"
                  description="Update your account password"
                  left={props => <List.Icon {...props} icon="lock" />}
                  onPress={() => {/* Navigate to change password */}}
                />
                <Divider />
                
                <List.Item
                  title="Delete Account"
                  description="Permanently delete your account and data"
                  left={props => <List.Icon {...props} icon="delete" color="red" />}
                  onPress={() => {/* Show delete account confirmation */}}
                />
              </Card.Content>
            </Card>
            
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              icon="logout"
            >
              Log Out
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    margin: 16,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  avatar: {
    marginBottom: 16,
  },
  profileName: {
    marginBottom: 4,
  },
  profileUsername: {
    opacity: 0.6,
  },
  profileForm: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    marginTop: -12,
    marginBottom: 16,
    fontSize: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  card: {
    margin: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  reminderDescription: {
    marginBottom: 24,
  },
  emptyReminders: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  addReminderButton: {
    marginTop: 16,
  },
  logoutButton: {
    margin: 16,
  },
});