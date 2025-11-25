/**
 * UsageTracker - Display user's quota usage and analytics
 * Shows remaining analyses, usage statistics, and upgrade prompts
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

export default function UsageTracker({
  variant = 'compact',
  showUpgradePrompt = true,
  showAnalytics = false,
  onUpgrade,
  style
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

  const [usageData, setUsageData] = useState({
    used: 0,
    limit: 5,
    percentage: 0,
    resetDate: null,
  });

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    // Placeholder - would fetch from usageTrackingService
    const mockData = {
      used: 3,
      limit: 5,
      percentage: 60,
      resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };
    setUsageData(mockData);
  };

  const getUsageColor = () => {
    if (usageData.percentage >= 90) return '#EF4444';
    if (usageData.percentage >= 70) return '#F59E0B';
    return '#10B981';
  };

  const formatResetDate = () => {
    if (!usageData.resetDate) return '';
    const days = Math.ceil((usageData.resetDate - new Date()) / (1000 * 60 * 60 * 24));
    return `Resets in ${days} day${days !== 1 ? 's' : ''}`;
  };

  if (variant === 'compact') {
    return (
      <GlassContainer variant="subtle" style={[styles.compactContainer, style]}>
        <View style={styles.compactHeader}>
          <View style={styles.compactInfo}>
            <Ionicons name="analytics-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.compactLabel, { color: theme.textSecondary }]}>
              Analyses Used
            </Text>
          </View>
          <Text style={[styles.compactValue, { color: getUsageColor() }]}>
            {usageData.used}/{usageData.limit}
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(usageData.percentage, 100)}%`,
                  backgroundColor: getUsageColor(),
                },
              ]}
            />
          </View>
        </View>

        {showUpgradePrompt && usageData.percentage >= 60 && (
          <TouchableOpacity
            style={styles.upgradeLink}
            onPress={onUpgrade}
            accessibilityLabel="Upgrade for unlimited analyses"
            accessibilityRole="button"
          >
            <Ionicons name="star" size={14} color={theme.primary} />
            <Text style={[styles.upgradeLinkText, { color: theme.primary }]}>
              Upgrade for unlimited
            </Text>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </TouchableOpacity>
        )}
      </GlassContainer>
    );
  }

  if (variant === 'detailed') {
    return (
      <GlassContainer variant="medium" style={[styles.detailedContainer, style]}>
        <View style={styles.detailedHeader}>
          <Text style={[styles.detailedTitle, { color: theme.text }]}>
            Usage Statistics
          </Text>
          <Text style={[styles.resetDate, { color: theme.textSecondary }]}>
            {formatResetDate()}
          </Text>
        </View>

        <View style={styles.usageCircle}>
          <View style={styles.usageCircleInner}>
            <Text style={[styles.usageValue, { color: getUsageColor() }]}>
              {usageData.used}
            </Text>
            <Text style={[styles.usageLimit, { color: theme.textSecondary }]}>
              of {usageData.limit}
            </Text>
          </View>
        </View>

        {showAnalytics && (
          <View style={styles.analytics}>
            <View style={styles.analyticItem}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={[styles.analyticLabel, { color: theme.textSecondary }]}>
                Avg Score
              </Text>
              <Text style={[styles.analyticValue, { color: theme.text }]}>
                85%
              </Text>
            </View>
            <View style={styles.analyticItem}>
              <Ionicons name="flame" size={20} color="#F59E0B" />
              <Text style={[styles.analyticLabel, { color: theme.textSecondary }]}>
                Streak
              </Text>
              <Text style={[styles.analyticValue, { color: theme.text }]}>
                7 days
              </Text>
            </View>
          </View>
        )}

        {showUpgradePrompt && (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: theme.primary }]}
            onPress={onUpgrade}
            accessibilityLabel="Upgrade to premium"
            accessibilityRole="button"
          >
            <Ionicons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </GlassContainer>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Compact variant
  compactContainer: {
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  compactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  upgradeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  upgradeLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Detailed variant
  detailedContainer: {
    padding: 20,
  },
  detailedHeader: {
    marginBottom: 20,
  },
  detailedTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  resetDate: {
    fontSize: 12,
  },
  usageCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  usageCircleInner: {
    alignItems: 'center',
  },
  usageValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  usageLimit: {
    fontSize: 16,
    fontWeight: '500',
  },
  analytics: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  analyticItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  analyticLabel: {
    fontSize: 12,
    flex: 1,
  },
  analyticValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
