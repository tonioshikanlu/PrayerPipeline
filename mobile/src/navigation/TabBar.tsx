import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from './NavigationContext';

interface TabBarProps {
  activeColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
}

const TabBar: React.FC<TabBarProps> = ({ 
  activeColor = '#6366F1', 
  inactiveColor = '#9CA3AF',
  backgroundColor = '#FFFFFF'
}) => {
  const { currentScreen, navigate } = useNavigation();

  const tabs = [
    { name: 'Home', label: 'Home', icon: '🏠' },
    { name: 'ExploreGroups', label: 'Groups', icon: '👥' },
    { name: 'PrayerRequests', label: 'Prayers', icon: '🙏' },
    { name: 'Organizations', label: 'Orgs', icon: '🏢' },
    { name: 'Settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {tabs.map((tab) => {
        const isActive = currentScreen === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => navigate(tab.name)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? activeColor : inactiveColor }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TabBar;