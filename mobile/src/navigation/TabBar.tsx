import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from './NavigationContext';

interface TabItem {
  name: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
}

const tabs: TabItem[] = [
  { name: 'Home', route: 'Home', icon: 'home' },
  { name: 'Groups', route: 'Groups', icon: 'users' },
  { name: 'Requests', route: 'PrayerRequests', icon: 'list' },
  { name: 'Organizations', route: 'Organizations', icon: 'briefcase' },
  { name: 'Profile', route: 'Profile', icon: 'user' },
];

const TabBar: React.FC = () => {
  const { currentRoute, navigate } = useNavigation();
  
  return (
    <SafeAreaView style={{ backgroundColor: '#ffffff' }}>
      <View style={styles.container}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.route}
            style={styles.tabButton}
            onPress={() => navigate(tab.route)}
            accessibilityRole="button"
            accessibilityLabel={tab.name}
          >
            <Feather
              name={tab.icon}
              size={22}
              color={currentRoute.name === tab.route ? '#3b82f6' : '#64748b'}
            />
            <Text
              style={[
                styles.tabText,
                { color: currentRoute.name === tab.route ? '#3b82f6' : '#64748b' }
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default TabBar;