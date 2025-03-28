import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { buildApiUrl } from './api/queryClient';

type ApiTestResult = {
  endpoint: string;
  status: number;
  statusText: string;
  contentType: string | null;
  responseData?: any;
  error?: string;
};

const TestApiConnection = () => {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Test endpoints
  const endpoints = [
    '/api/test-connection', // Basic connectivity test (no auth)
    '/api/user',            // Current user (auth check)
    '/api/organizations',   // List organizations
    '/api/groups/user',     // User's groups
  ];

  const clearResults = () => setResults([]);

  const testEndpoint = async (endpoint: string) => {
    const url = buildApiUrl(endpoint);
    console.log(`Testing connection to: ${url}`);
    
    // First try with credentials included (for auth-based endpoints)
    try {
      console.log(`Testing ${endpoint} with credentials: include`);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      const contentType = res.headers.get('content-type');
      console.log(`Response status: ${res.status}, content-type: ${contentType}`);
      
      let responseData: any = null;
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await res.json();
          console.log(`Response data: ${JSON.stringify(responseData).substring(0, 100)}`);
        } catch (err) {
          responseData = 'Failed to parse JSON response';
          console.error('Failed to parse JSON response:', err);
        }
      } else {
        try {
          responseData = await res.text();
          console.log(`Response text: ${responseData.substring(0, 100)}`);
        } catch (err) {
          responseData = 'Failed to read response text';
          console.error('Failed to read response text:', err);
        }
      }
      
      return {
        endpoint,
        status: res.status,
        statusText: res.statusText,
        contentType,
        responseData,
      };
    } catch (error) {
      console.error(`Error testing ${endpoint} with credentials:`, error);
      
      // If that fails, try without credentials (for public endpoints)
      try {
        console.log(`Testing ${endpoint} without credentials`);
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // No credentials
        });
        
        const contentType = res.headers.get('content-type');
        console.log(`Response status: ${res.status}, content-type: ${contentType}`);
        
        let responseData: any = null;
        if (contentType && contentType.includes('application/json')) {
          responseData = await res.json();
        } else {
          responseData = await res.text();
        }
        
        return {
          endpoint,
          status: res.status,
          statusText: res.statusText,
          contentType,
          responseData,
          notes: "Connection succeeded without credentials",
        };
      } catch (secondError) {
        console.error(`Error testing ${endpoint} without credentials:`, secondError);
        return {
          endpoint,
          status: 0,
          statusText: 'Connection Failed',
          contentType: null,
          error: `Failed with both credentials approaches. Error: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);
    
    const newResults = [];
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      newResults.push(result);
      setResults([...newResults]); // Update results as they come in
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      <Text style={styles.baseUrl}>Base URL: {buildApiUrl('')}</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Run All Tests" 
          onPress={runAllTests} 
          disabled={loading} 
        />
        <Button 
          title="Clear Results" 
          onPress={clearResults} 
          disabled={loading} 
        />
      </View>
      
      {loading && <Text style={styles.loading}>Testing API connections...</Text>}
      
      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.endpoint}>{result.endpoint}</Text>
            <Text style={[
              styles.status, 
              result.status >= 200 && result.status < 300 ? styles.success : styles.error
            ]}>
              Status: {result.status} {result.statusText}
            </Text>
            {result.contentType && (
              <Text style={styles.contentType}>Content-Type: {result.contentType}</Text>
            )}
            {result.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{result.error}</Text>
              </View>
            )}
            {result.responseData && (
              <View style={styles.responseContainer}>
                <Text style={styles.responseTitle}>Response:</Text>
                <Text style={styles.responseData}>
                  {typeof result.responseData === 'object' 
                    ? JSON.stringify(result.responseData, null, 2) 
                    : result.responseData}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  baseUrl: {
    fontSize: 14,
    marginBottom: 16,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  loading: {
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic',
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  endpoint: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    marginBottom: 4,
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
  contentType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  errorContainer: {
    backgroundColor: '#ffeeee',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  errorText: {
    color: 'red',
  },
  responseContainer: {
    marginTop: 8,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  responseData: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
});

export default TestApiConnection;