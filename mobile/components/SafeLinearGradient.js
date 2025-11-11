/**
 * Safe Linear Gradient Component
 * Wrapper around expo-linear-gradient with fallback
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function SafeLinearGradient({ colors, style, children, ...props }) {
  try {
    return (
      <LinearGradient
        colors={colors || ['#000000', '#1C1C1E']}
        style={[styles.container, style]}
        {...props}
      >
        {children}
      </LinearGradient>
    );
  } catch (error) {
    console.warn('LinearGradient error, using fallback', error);
    return (
      <View style={[styles.container, style, { backgroundColor: colors?.[0] || '#000000' }]}>
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeLinearGradient;
