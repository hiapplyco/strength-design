/**
 * Glassmorphism Components
 * Modern glass-effect UI components
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export function GlassContainer({ children, style, intensity = 20, tint = 'dark', ...props }) {
  if (Platform.OS === 'web') {
    // Fallback for web
    return (
      <View
        style={[
          styles.glassContainerWeb,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[styles.glassContainer, style]}
      {...props}
    >
      {children}
    </BlurView>
  );
}

export function GlassCard({ children, style, onPress, ...props }) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      style={[styles.glassCard, style]}
      {...props}
    >
      <GlassContainer style={styles.glassCardInner}>
        {children}
      </GlassContainer>
    </Container>
  );
}

export function GlassButton({ children, onPress, style, disabled, ...props }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.glassButton, disabled && styles.glassButtonDisabled, style]}
      activeOpacity={0.7}
      {...props}
    >
      <GlassContainer style={styles.glassButtonInner}>
        {children}
      </GlassContainer>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    overflow: 'hidden',
  },
  glassContainerWeb: {
    backgroundColor: 'rgba(28, 28, 30, 0.7)',
    backdropFilter: 'blur(20px)',
    overflow: 'hidden',
  },
  glassCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassCardInner: {
    padding: 16,
  },
  glassButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  glassButtonInner: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassButtonDisabled: {
    opacity: 0.5,
  },
});
