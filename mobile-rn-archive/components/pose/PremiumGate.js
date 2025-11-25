/**
 * PremiumGate - Premium feature gate component
 * Wraps premium content and shows upgrade prompts for non-premium users
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

export default function PremiumGate({
  children,
  feature,
  variant = 'card',
  upgradeContext,
  onUpgrade,
  customMessage
}) {
  const themeContext = useTheme();
  const { colors: themeColors, isDarkMode } = themeContext;

  // Defensive: ensure colors are available
  const theme = themeColors || {
    primary: '#FF6B35',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#6E6E73',
    surface: '#1C1C1E',
    border: '#38383A',
    success: '#34C759',
    error: '#DC2626',
  };

  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Check if user has access to this feature
    checkFeatureAccess();
  }, [feature]);

  const checkFeatureAccess = async () => {
    // Placeholder - would check actual subscription status
    // For now, default to false to show premium gate
    setHasAccess(false);
  };

  const handleUpgradePress = () => {
    if (onUpgrade) {
      onUpgrade({ feature, context: upgradeContext });
    }
  };

  if (hasAccess) {
    return children;
  }

  if (variant === 'card') {
    return (
      <GlassContainer variant="medium" style={styles.gateCard}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.gateTitle, { color: theme.text }]}>
          Premium Feature
        </Text>
        <Text style={[styles.gateMessage, { color: theme.textSecondary }]}>
          {customMessage || 'Upgrade to unlock this feature'}
        </Text>
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: theme.primary }]}
          onPress={handleUpgradePress}
          accessibilityLabel="Upgrade to premium"
          accessibilityRole="button"
        >
          <Ionicons name="star" size={20} color="#FFFFFF" />
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </TouchableOpacity>
      </GlassContainer>
    );
  }

  if (variant === 'overlay') {
    return (
      <View style={styles.overlayContainer}>
        {children}
        <View style={styles.overlay}>
          <GlassContainer variant="strong" style={styles.overlayContent}>
            <Ionicons name="lock-closed" size={40} color={theme.primary} />
            <Text style={[styles.overlayTitle, { color: theme.text }]}>
              Premium Feature
            </Text>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: theme.primary }]}
              onPress={handleUpgradePress}
            >
              <Text style={styles.upgradeButtonText}>Unlock</Text>
            </TouchableOpacity>
          </GlassContainer>
        </View>
      </View>
    );
  }

  return (
    <GlassContainer variant="subtle" style={styles.inlineGate}>
      <Ionicons name="lock-closed" size={20} color={theme.primary} />
      <Text style={[styles.inlineText, { color: theme.textSecondary }]}>
        Premium feature
      </Text>
      <TouchableOpacity onPress={handleUpgradePress}>
        <Text style={[styles.inlineLink, { color: theme.primary }]}>
          Upgrade
        </Text>
      </TouchableOpacity>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  gateCard: {
    padding: 32,
    alignItems: 'center',
    marginVertical: 16,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  gateMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlayContainer: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  overlayContent: {
    padding: 24,
    alignItems: 'center',
    maxWidth: 280,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  inlineGate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginVertical: 8,
  },
  inlineText: {
    fontSize: 14,
    flex: 1,
  },
  inlineLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
