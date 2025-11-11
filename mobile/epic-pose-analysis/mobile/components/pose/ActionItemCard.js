/**
 * Action Item Card Component
 * Displays specific form corrections as actionable items with clear instructions
 * 
 * Features:
 * - Clear form issue identification
 * - Specific correction instructions
 * - Visual priority indicators
 * - Time range display for video context
 * - Exercise phase information
 * - Glassmorphism design with accessibility support
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';
import { createThemedStyles } from '../../utils/designTokens';

// Severity level configurations
const SEVERITY_CONFIG = {
  high: {
    color: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderColor: 'rgba(220, 38, 38, 0.2)',
    icon: 'alert-circle',
    label: 'High Priority',
    description: 'Address immediately'
  },
  medium: {
    color: '#D97706',
    backgroundColor: 'rgba(217, 119, 6, 0.05)',
    borderColor: 'rgba(217, 119, 6, 0.2)',
    icon: 'warning-outline',
    label: 'Medium Priority',
    description: 'Important to fix'
  },
  low: {
    color: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
    borderColor: 'rgba(5, 150, 105, 0.2)',
    icon: 'information-circle-outline',
    label: 'Low Priority',
    description: 'Minor adjustment'
  }
};

// Exercise phase icons and labels
const PHASE_CONFIG = {
  setup: { icon: 'play-circle-outline', label: 'Setup' },
  descent: { icon: 'arrow-down-circle-outline', label: 'Descent' },
  bottom: { icon: 'pause-circle-outline', label: 'Bottom Position' },
  ascent: { icon: 'arrow-up-circle-outline', label: 'Ascent' },
  completion: { icon: 'checkmark-circle-outline', label: 'Completion' },
  overall: { icon: 'analytics-outline', label: 'Overall' },
  windup: { icon: 'refresh-circle-outline', label: 'Wind-up' },
  stride: { icon: 'walk-outline', label: 'Stride' },
  cocking: { icon: 'hand-left-outline', label: 'Cocking' },
  acceleration: { icon: 'rocket-outline', label: 'Acceleration' },
  follow_through: { icon: 'trending-up-outline', label: 'Follow Through' },
};

const ActionItemCard = memo(function ActionItemCard({
  item,
  onPress,
  showPhaseInfo = true,
  showTimeRange = true,
  showSeverity = true,
  style,
}) {
  const { theme, isDarkMode } = useTheme();
  const styles = createThemedStyles(getStyles, isDarkMode ? 'dark' : 'light');

  // Extract item properties with defaults
  const {
    id,
    title = 'Form Issue',
    description = 'Form correction needed',
    correction = 'Focus on proper technique',
    severity = 'medium',
    timeRange,
    exercisePhase = 'overall',
    priority
  } = item;

  const severityConfig = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
  const phaseConfig = PHASE_CONFIG[exercisePhase] || PHASE_CONFIG.overall;

  // Handle press action
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(item);
    }
  }, [item, onPress]);

  // Format time range for display
  const formatTimeRange = useCallback((timeRange) => {
    if (!timeRange || !Array.isArray(timeRange) || timeRange.length !== 2) {
      return null;
    }

    const [start, end] = timeRange;
    const formatTime = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return minutes > 0 
        ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
        : `${remainingSeconds}s`;
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
  }, []);

  // Render severity indicator
  const renderSeverityIndicator = () => {
    if (!showSeverity) return null;

    return (
      <View 
        style={[
          styles.severityBadge,
          {
            backgroundColor: severityConfig.backgroundColor,
            borderColor: severityConfig.borderColor,
          }
        ]}
      >
        <Ionicons 
          name={severityConfig.icon} 
          size={12} 
          color={severityConfig.color}
        />
        <Text style={[styles.severityText, { color: severityConfig.color }]}>
          {severityConfig.label}
        </Text>
      </View>
    );
  };

  // Render phase information
  const renderPhaseInfo = () => {
    if (!showPhaseInfo) return null;

    return (
      <View style={styles.phaseInfo}>
        <Ionicons 
          name={phaseConfig.icon} 
          size={14} 
          color={theme.textSecondary}
        />
        <Text style={[styles.phaseText, { color: theme.textSecondary }]}>
          {phaseConfig.label}
        </Text>
      </View>
    );
  };

  // Render time range
  const renderTimeRange = () => {
    if (!showTimeRange || !timeRange) return null;

    const formattedTime = formatTimeRange(timeRange);
    if (!formattedTime) return null;

    return (
      <View style={styles.timeInfo}>
        <Ionicons 
          name="time-outline" 
          size={14} 
          color={theme.textSecondary}
        />
        <Text style={[styles.timeText, { color: theme.textSecondary }]}>
          {formattedTime}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={`Action item: ${title}`}
      accessibilityHint={`${description}. ${correction}`}
      accessibilityRole="button"
    >
      <GlassContainer 
        variant="subtle" 
        style={[
          styles.container,
          {
            borderColor: severityConfig.borderColor,
            backgroundColor: isDarkMode 
              ? severityConfig.backgroundColor 
              : severityConfig.backgroundColor,
          },
          style
        ]}
      >
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons 
              name={severityConfig.icon} 
              size={20} 
              color={severityConfig.color}
            />
            <Text 
              style={[styles.title, { color: theme.text }]}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
          {renderSeverityIndicator()}
        </View>

        {/* Description */}
        <Text 
          style={[styles.description, { color: theme.textSecondary }]}
          numberOfLines={3}
        >
          {description}
        </Text>

        {/* Correction Instructions */}
        <View style={styles.correctionContainer}>
          <View style={styles.correctionHeader}>
            <Ionicons 
              name="bulb-outline" 
              size={16} 
              color={theme.primary}
            />
            <Text style={[styles.correctionLabel, { color: theme.primary }]}>
              How to Fix
            </Text>
          </View>
          <Text 
            style={[styles.correction, { color: theme.text }]}
            numberOfLines={4}
          >
            {correction}
          </Text>
        </View>

        {/* Footer Information */}
        <View style={styles.footer}>
          {renderPhaseInfo()}
          {renderTimeRange()}
          <View style={styles.footerSpacer} />
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handlePress}
            accessible={true}
            accessibilityLabel="View details"
          >
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              View Details
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      </GlassContainer>
    </TouchableOpacity>
  );
});

const getStyles = (theme) => StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.lineHeight.snug * theme.typography.fontSize.base,
    flex: 1,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['1'],
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing['0.5'],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  severityText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  correctionContainer: {
    backgroundColor: theme.isDark 
      ? 'rgba(255, 255, 255, 0.02)' 
      : 'rgba(0, 0, 0, 0.02)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.primary + '20',
  },
  correctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  correctionLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  correction: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  phaseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  phaseText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footerSpacer: {
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

ActionItemCard.displayName = 'ActionItemCard';

export default ActionItemCard;