import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { GlassContainer } from './GlassmorphismComponents';
import sessionContextManager from '../services/sessionContextManager';

const { width: screenWidth } = Dimensions.get('window');

/**
 * ContextSummaryWidget Component
 * 
 * A clean, minimal widget that shows the user's current context selections
 * at the top of screens. Each item is touchable and navigates to the relevant screen.
 * 
 * Features:
 * - Compact horizontal scrollable list
 * - Touch to navigate to specific context screens
 * - Updates automatically when context changes
 * - Clean design that doesn't obstruct content
 */
export default function ContextSummaryWidget({ navigation, style }) {
  const { theme, isDarkMode } = useTheme();
  const [contextSummary, setContextSummary] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load and monitor context
  useEffect(() => {
    loadContext();
    
    // Set up polling for context changes
    const interval = setInterval(loadContext, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadContext = async () => {
    try {
      await sessionContextManager.initialize();
      const summary = await sessionContextManager.getSummary();
      setContextSummary(summary);
    } catch (error) {
      console.error('Error loading context:', error);
    }
  };

  // Navigate to appropriate screen based on context type
  const handleItemPress = (item) => {
    const screenMap = {
      'Profile': 'Profile',
      'Fitness Level': 'Profile',
      'Goals': 'Profile',
      'Experience': 'Profile',
      'Exercises': 'Search',
      'Favorite Exercises': 'Search',
      'Workouts': 'Workouts',
      'Completed Workouts': 'Workouts',
      'Nutrition': 'Search',
      'Equipment': 'Profile',
      'Preferences': 'Profile',
    };
    
    const screen = screenMap[item.label] || 'Profile';
    navigation.navigate(screen);
  };

  // Always show the widget, even with empty context
  if (!contextSummary) {
    // Show loading state or empty state
    return (
      <GlassContainer 
        variant="subtle" 
        style={[styles.container, style]}
      >
        <View style={styles.scrollContent}>
          <Text style={[styles.emptyText, {
            color: isDarkMode ? '#999' : '#666'
          }]}>Loading context...</Text>
        </View>
      </GlassContainer>
    );
  }

  // Show all items, including empty ones
  const allItems = contextSummary.items || [];

  return (
    <GlassContainer 
      variant="subtle" 
      style={[styles.container, style]}
    >
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Badge */}
        <TouchableOpacity 
          style={[styles.summaryBadge, {
            backgroundColor: isDarkMode ? 'rgba(255, 107, 53, 0.15)' : 'rgba(255, 107, 53, 0.1)',
            borderColor: isDarkMode ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255, 107, 53, 0.2)',
          }]}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="analytics" 
            size={14} 
            color="#FF6B35" 
            style={styles.badgeIcon}
          />
          <Text style={[styles.summaryText, { color: '#FF6B35' }]}>
            {contextSummary.completionPercentage}%
          </Text>
        </TouchableOpacity>

        {/* Context Items - Show all including zeros */}
        {allItems.map((item, index) => {
          const hasData = (item.count !== undefined && item.count > 0) || 
                         (item.hasData !== undefined && item.hasData);
          const displayCount = item.count !== undefined ? item.count : (hasData ? 1 : 0);
          const displayText = item.count !== undefined 
            ? `${displayCount} ${item.label.split(' ')[0]}` 
            : `${hasData ? '✓' : '0'} ${item.label.split(' ')[0]}`;
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.contextItem, {
                backgroundColor: isDarkMode 
                  ? (hasData ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 255, 255, 0.05)')
                  : (hasData ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                borderColor: isDarkMode
                  ? (hasData ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)')
                  : (hasData ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 0, 0, 0.1)'),
              }]}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.itemEmoji}>{item.icon}</Text>
              <Text style={[styles.itemText, {
                color: hasData 
                  ? (isDarkMode ? '#4CAF50' : '#388E3C')
                  : (isDarkMode ? '#999' : '#666')
              }]}>
                {displayText}
              </Text>
              {hasData && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={10} 
                  color="#4CAF50" 
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Add More Button */}
        <TouchableOpacity
          style={[styles.addButton, {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }]}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={16} 
            color={isDarkMode ? '#999' : '#666'} 
          />
        </TouchableOpacity>
      </ScrollView>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 44,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 4,
  },
  badgeIcon: {
    marginRight: 4,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 50,
    position: 'relative',
  },
  itemEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  itemText: {
    fontSize: 11,
    fontWeight: '500',
  },
  checkIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
  },
});