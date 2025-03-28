import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '../navigation/NavigationContext';

interface PlaceholderScreenProps {
  title: string;
  icon: keyof typeof Feather.glyphMap;
}

const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ title, icon }) => {
  const { goBack, canGoBack } = useNavigation();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {canGoBack() && (
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#3b82f6" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerText}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name={icon} size={60} color="#3b82f6" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>This screen is under construction</Text>
        <Text style={styles.description}>
          We're working hard to bring you the best prayer experience. 
          This feature will be available soon!
        </Text>
        
        {canGoBack() && (
          <TouchableOpacity style={styles.button} onPress={goBack}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const GroupsScreen: React.FC = () => (
  <PlaceholderScreen title="Prayer Groups" icon="users" />
);

export const PrayerRequestsScreen: React.FC = () => (
  <PlaceholderScreen title="Prayer Requests" icon="list" />
);

export const ProfileScreen: React.FC = () => (
  <PlaceholderScreen title="My Profile" icon="user" />
);

export const OrganizationsScreen: React.FC = () => (
  <PlaceholderScreen title="Organizations" icon="briefcase" />
);

export const RequestDetailsScreen: React.FC = () => (
  <PlaceholderScreen title="Request Details" icon="file-text" />
);

export const MeetingsScreen: React.FC = () => (
  <PlaceholderScreen title="Meetings" icon="calendar" />
);

export const ForgotPasswordScreen: React.FC = () => (
  <PlaceholderScreen title="Forgot Password" icon="key" />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ebf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#3b82f6',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});