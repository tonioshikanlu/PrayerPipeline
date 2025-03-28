import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ExploreGroupsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Groups</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Discover prayer groups to join</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    padding: 16,
  },
  text: {
    fontSize: 16,
    color: '#4a5568',
  },
});