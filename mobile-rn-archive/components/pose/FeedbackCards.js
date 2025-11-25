/**
 * FeedbackCards - Priority-based feedback card system
 * Displays actionable feedback items organized by priority
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const PRIORITY_COLORS = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

const PRIORITY_ICONS = {
  critical: 'alert-circle',
  high: 'warning',
  medium: 'information-circle',
  low: 'checkmark-circle',
};

export default function FeedbackCards({
  analysisResult,
  exerciseType,
  showAdvancedInsights = false,
  advancedMode = false,
  onActionItemPress,
  onImprovementTipPress
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

  const feedbackItems = analysisResult?.feedback || [];
  const improvements = analysisResult?.improvements || [];

  const sortedFeedback = [...feedbackItems].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (!showAdvancedInsights && advancedMode) {
    return (
      <GlassContainer variant="medium" style={styles.premiumPlaceholder}>
        <Ionicons name="lock-closed" size={48} color={theme.textSecondary} />
        <Text style={[styles.premiumTitle, { color: theme.text }]}>
          Advanced Insights Available
        </Text>
        <Text style={[styles.premiumDescription, { color: theme.textSecondary }]}>
          Upgrade to unlock detailed biomechanical analysis
        </Text>
      </GlassContainer>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Feedback Items */}
      {sortedFeedback.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Form Feedback
            </Text>
          </View>

          {sortedFeedback.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onActionItemPress?.(item)}
              activeOpacity={0.7}
            >
              <GlassContainer variant="subtle" style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <View style={styles.priorityBadge}>
                    <Ionicons
                      name={PRIORITY_ICONS[item.priority] || 'information-circle'}
                      size={20}
                      color={PRIORITY_COLORS[item.priority] || theme.primary}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: PRIORITY_COLORS[item.priority] || theme.primary }
                      ]}
                    >
                      {item.priority?.toUpperCase() || 'INFO'}
                    </Text>
                  </View>
                  {item.phase && (
                    <Text style={[styles.phaseLabel, { color: theme.textSecondary }]}>
                      {item.phase}
                    </Text>
                  )}
                </View>
                <Text style={[styles.feedbackTitle, { color: theme.text }]}>
                  {item.title || item.message}
                </Text>
                {item.description && (
                  <Text style={[styles.feedbackDescription, { color: theme.textSecondary }]}>
                    {item.description}
                  </Text>
                )}
              </GlassContainer>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Improvement Tips */}
      {improvements.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Improvement Tips
            </Text>
          </View>

          {improvements.map((tip, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onImprovementTipPress?.(tip)}
              activeOpacity={0.7}
            >
              <GlassContainer variant="subtle" style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <Ionicons name="bulb" size={20} color="#F59E0B" />
                  <Text style={[styles.tipTitle, { color: theme.text }]}>
                    {tip.title || tip.suggestion}
                  </Text>
                </View>
                {tip.details && (
                  <Text style={[styles.tipDetails, { color: theme.textSecondary }]}>
                    {tip.details}
                  </Text>
                )}
              </GlassContainer>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Advanced Insights */}
      {showAdvancedInsights && advancedMode && (
        <GlassContainer variant="medium" style={styles.advancedSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flask-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Advanced Biomechanical Analysis
            </Text>
          </View>
          <Text style={[styles.advancedText, { color: theme.textSecondary }]}>
            Detailed movement patterns, force distribution, and injury risk assessment
            would appear here for premium users.
          </Text>
        </GlassContainer>
      )}

      {/* Empty State */}
      {sortedFeedback.length === 0 && improvements.length === 0 && (
        <GlassContainer variant="medium" style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Excellent Form!
          </Text>
          <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
            No major issues detected. Keep up the great work!
          </Text>
        </GlassContainer>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackCard: {
    padding: 16,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipCard: {
    padding: 16,
    marginBottom: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  tipDetails: {
    fontSize: 14,
    lineHeight: 20,
  },
  advancedSection: {
    padding: 20,
    marginBottom: 24,
  },
  advancedText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  premiumPlaceholder: {
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  premiumDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
});
