import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../api/queryClient';

interface Organization {
  id: number;
  name: string;
  description: string;
  website: string;
}

const OrganizationOnboardingScreen: React.FC = () => {
  const { navigate } = useNavigation();
  const { user, refreshUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  // Handle creating a new organization
  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      Alert.alert('Error', 'Organization name is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const data = {
        name: orgName.trim(),
        description: orgDescription.trim(),
        website: orgWebsite.trim()
      };
      
      const response = await apiRequest('POST', '/api/organizations', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create organization');
      }
      
      await refreshUser();
      
      Alert.alert(
        'Success',
        `Organization "${orgName}" created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigate('Home')
          }
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create organization';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle joining with invite code
  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Invite code is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiRequest('POST', '/api/organizations/join', { code: inviteCode.trim() });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid invite code');
      }
      
      await refreshUser();
      
      Alert.alert(
        'Success',
        'Successfully joined the organization!',
        [
          {
            text: 'OK',
            onPress: () => navigate('Home')
          }
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid invite code';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Join a Community</Text>
        <Text style={styles.subtitle}>
          To use Prayer Pipeline, you need to be part of an organization.
          You can either create your own or join an existing one.
        </Text>
      </View>
      
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'create' && styles.activeTab
          ]}
          onPress={() => setActiveTab('create')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'create' && styles.activeTabText
            ]}
          >
            Create New
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'join' && styles.activeTab
          ]}
          onPress={() => setActiveTab('join')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'join' && styles.activeTabText
            ]}
          >
            Join Existing
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.separator} />
      
      {/* Create Organization Form */}
      {activeTab === 'create' && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Create a New Organization</Text>
          <Text style={styles.formDescription}>
            Start your own community and invite others to join.
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Organization Name *</Text>
            <TextInput
              style={styles.input}
              value={orgName}
              onChangeText={setOrgName}
              placeholder="Enter organization name"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={orgDescription}
              onChangeText={setOrgDescription}
              placeholder="Enter description"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Website</Text>
            <TextInput
              style={styles.input}
              value={orgWebsite}
              onChangeText={setOrgWebsite}
              placeholder="Enter website URL"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateOrg}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Create Organization</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {/* Join Organization Form */}
      {activeTab === 'join' && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Join an Existing Organization</Text>
          <Text style={styles.formDescription}>
            Enter the invite code provided by your organization administrator.
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Invite Code *</Text>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Enter invite code"
              autoCapitalize="none"
            />
          </View>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleJoinWithCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Join Organization</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      <Text style={styles.helpText}>
        Organizations help keep prayer requests organized and secure.
        Each organization can have multiple prayer groups.
      </Text>
      
      {/* Illustration */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/onboarding-illustration.svg')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  activeTab: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },
  formContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  image: {
    width: '100%',
    height: 200,
  },
});

export default OrganizationOnboardingScreen;