/**
 * CustomNeonTabBar - Neon glow tab bar with per-tab colors
 * Based on epic-memory-system tab bar with React Navigation integration
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Neon colors for each tab - matches Strength.Design brand
const NEON_COLORS = {
  Home: '#00F0FF',       // Cyan
  Workouts: '#FFD700',   // Gold
  Search: '#FF00F0',     // Magenta
  Generator: '#00FF88',  // Green (special rainbow effect)
  Profile: '#FF6B35',    // Orange
};

// Icon mapping for each tab
const TAB_ICONS = {
  Home: 'home',
  Workouts: 'calendar',
  Search: 'search',
  Generator: 'sparkles',
  Profile: 'person',
};

/**
 * Custom tab bar with neon glow effects
 * @param {object} state - Navigation state
 * @param {object} descriptors - Screen descriptors
 * @param {object} navigation - Navigation object
 */
export default function CustomNeonTabBar({ state, descriptors, navigation }) {
  const inactiveColor = '#8E8E93';

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        const isFocused = state.index === index;
        const neonColor = NEON_COLORS[route.name] || '#FF6B35';
        const iconName = TAB_ICONS[route.name] || 'help-outline';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Generator tab gets special treatment
        const isGenerator = route.name === 'Generator';

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.8}
            style={[
              styles.tab,
              isGenerator && styles.generatorTab,
            ]}
          >
            {/* Rainbow Neon Glow for Generator (active only) */}
            {isFocused && isGenerator && (
              <View style={styles.rainbowGlowContainer}>
                <View style={[styles.rainbowGlowBase, { backgroundColor: neonColor }]} />
                {/* Rainbow gradient overlay */}
                <View style={styles.rainbowGradient}>
                  <View style={[styles.rainbowSegment, { backgroundColor: '#FF0000' }]} />
                  <View style={[styles.rainbowSegment, { backgroundColor: '#FF7F00' }]} />
                  <View style={[styles.rainbowSegment, { backgroundColor: '#FFFF00' }]} />
                  <View style={[styles.rainbowSegment, { backgroundColor: '#00FF00' }]} />
                  <View style={[styles.rainbowSegment, { backgroundColor: '#0000FF' }]} />
                  <View style={[styles.rainbowSegment, { backgroundColor: '#4B0082' }]} />
                  <View style={[styles.rainbowSegment, { backgroundColor: '#9400D3' }]} />
                </View>
              </View>
            )}

            {/* Standard Neon Glow for other tabs (active only) */}
            {isFocused && !isGenerator && (
              <View style={[styles.neonGlow, {
                backgroundColor: neonColor,
                shadowColor: neonColor,
              }]} />
            )}

            {/* Icon + Label */}
            <View style={[styles.iconContainer, isGenerator && styles.generatorIconContainer]}>
              <Ionicons
                name={isFocused ? iconName : `${iconName}-outline`}
                size={isGenerator ? 26 : 22}
                color={isFocused && isGenerator ? '#FFFFFF' : (isFocused ? neonColor : inactiveColor)}
                style={[
                  styles.icon,
                  isFocused && {
                    shadowColor: neonColor,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  }
                ]}
              />
              <Text
                style={[
                  styles.label,
                  isGenerator && styles.generatorLabel,
                  {
                    color: isFocused && isGenerator ? '#FFFFFF' : (isFocused ? neonColor : inactiveColor),
                    fontWeight: isFocused ? (isGenerator ? '700' : '600') : '400',
                  },
                  isFocused && {
                    textShadowColor: neonColor,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 3,
                  }
                ]}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Platform.OS === 'ios' ? '#000000' : '#1C1C1E',
    borderTopColor: '#2C2C2E',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
    height: Platform.OS === 'ios' ? 85 : 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  generatorTab: {
    flex: 1.2, // Slightly larger for emphasis
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatorIconContainer: {
    transform: [{ scale: 1.1 }],
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
  },
  generatorLabel: {
    fontSize: 11,
  },
  // Rainbow glow for Generator tab
  rainbowGlowContainer: {
    position: 'absolute',
    top: -3,
    width: '90%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  rainbowGlowBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
  },
  rainbowGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  rainbowSegment: {
    flex: 1,
    opacity: 0.8,
  },
  // Standard neon glow for other tabs
  neonGlow: {
    position: 'absolute',
    top: -2,
    width: '80%',
    height: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },
});
