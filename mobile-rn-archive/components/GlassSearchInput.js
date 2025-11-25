/**
 * Glass Search Input Component
 * Beautiful glassmorphism search input with icon
 */

import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';

export function GlassSearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
  autoFocus = false,
  onFocus,
  onBlur,
  ...props
}) {
  const theme = useTheme();

  const Container = Platform.OS === 'web' ? View : BlurView;
  const containerProps = Platform.OS === 'web'
    ? { style: styles.webContainer }
    : { intensity: 20, tint: theme.isDarkMode ? 'dark' : 'light' };

  return (
    <Container {...containerProps} style={[styles.container, style]}>
      <Ionicons
        name="search"
        size={20}
        color={theme.colors.textSecondary}
        style={styles.icon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.input, { color: theme.colors.text }]}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={onFocus}
        onBlur={onBlur}
        {...props}
      />
      {value ? (
        <Ionicons
          name="close-circle"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.clearIcon}
          onPress={() => onChangeText('')}
        />
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  webContainer: {
    backgroundColor: 'rgba(28, 28, 30, 0.7)',
    backdropFilter: 'blur(20px)',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  clearIcon: {
    marginLeft: 8,
    padding: 4,
  },
});

export default GlassSearchInput;
