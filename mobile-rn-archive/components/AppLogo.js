/**
 * App Logo Component
 * Displays the Strength.Design logo
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function AppLogo({ size = 120, showGlow = false, noCircle = false, style }) {
  const logoSize = { width: size, height: size };

  return (
    <View style={[styles.container, style]}>
      <View style={[
        !noCircle && styles.circle,
        !noCircle && logoSize,
        showGlow && styles.glow,
      ]}>
        <Text style={[styles.logoText, { fontSize: size * 0.2 }]}>SD</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    borderRadius: 1000,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  glow: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
});

export default AppLogo;
