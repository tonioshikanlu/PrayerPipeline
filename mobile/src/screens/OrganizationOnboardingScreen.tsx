import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/queryClient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

type CreateOrganizationData = {
  name: string;
  description: string;
};

const OrganizationOnboardingScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({});
  
  const { navigate } = useNavigation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Mutation for creating organization
  const createOrganizationMutation = useMutation({
    mutationFn: async (data: CreateOrganizationData) => {
      const res = await apiRequest('POST', '/api/organizations', data);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to create organization');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      navigate('Home');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const validateForm = () => {
    let errors: { name?: string; description?: string } = {};
    let isValid = true;

    if (!name.trim()) {
      errors.name = 'Organization name is required';
      isValid = false;
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleCreateOrganization = async () => {
    if (!validateForm()) return;

    try {
      await createOrganizationMutation.mutateAsync({ name, description });
    } catch (err) {
      // Error is handled in mutation
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Organization</Text>
          <Text style={styles.subtitle}>Set up your prayer community</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Organization Name</Text>
            <TextInput
              style={[styles.input, formErrors.name ? styles.inputError : null]}
              placeholder="Enter organization name"
              placeholderTextColor="#a3a3a3"
              value={name}
              onChangeText={setName}
            />
            {formErrors.name && (
              <Text style={styles.fieldError}>{formErrors.name}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textArea, formErrors.description ? styles.inputError : null]}
              placeholder="Describe your organization..."
              placeholderTextColor="#a3a3a3"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {formErrors.description && (
              <Text style={styles.fieldError}>{formErrors.description}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateOrganization}
            disabled={createOrganizationMutation.isPending}
          >
            {createOrganizationMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.createButtonText}>Create Organization</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigate('Login')}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#334155',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#334155',
    minHeight: 120,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  fieldError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});

export default OrganizationOnboardingScreen;