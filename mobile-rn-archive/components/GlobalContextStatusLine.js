/**
 * Global Context Status Line
 * Displays active context status at top of screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function GlobalContextStatusLine({ navigation, style }) {
  const theme = useTheme();

  // This would normally check for active context
  // For now, returning null (hidden)
  const hasActiveContext = false;

  if (!hasActiveContext) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      activeOpacity={0.8}
    >
      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
      <Text style={styles.text}>Context Active</Text>
      <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
