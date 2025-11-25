/**
 * MilestoneCard - Display and celebrate achievement milestones
 * Shows major milestones and progress towards next milestone
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const MILESTONES = [
  { threshold: 1, title: 'First Analysis', icon: '🎯', color: '#10B981' },
  { threshold: 5, title: 'Getting Started', icon: '🌱', color: '#3B82F6' },
  { threshold: 10, title: 'Dedicated Trainer', icon: '💪', color: '#F59E0B' },
  { threshold: 25, title: 'Form Expert', icon: '⭐', color: '#8B5CF6' },
  { threshold: 50, title: 'Master of Movement', icon: '🏆', color: '#EF4444' },
  { threshold: 100, title: 'Legend', icon: '👑', color: '#F59E0B' },
];

export default function MilestoneCard({
  progressData = [],
  onMilestoneShare,
  theme: propTheme
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

  const activeTheme = propTheme || theme;

  const totalAnalyses = progressData.length || 0;

  // Find current and next milestone
  const currentMilestone = [...MILESTONES]
    .reverse()
    .find(m => totalAnalyses >= m.threshold) || MILESTONES[0];

  const nextMilestone = MILESTONES.find(m => m.threshold > totalAnalyses);

  const progressToNext = nextMilestone
    ? ((totalAnalyses - currentMilestone.threshold) / (nextMilestone.threshold - currentMilestone.threshold)) * 100
    : 100;

  const handleShare = () => {
    if (onMilestoneShare) {
      onMilestoneShare(currentMilestone);
    }
  };

  return (
    <View style={styles.container}>
      {/* Current Milestone */}
      <GlassContainer variant="medium" style={styles.currentMilestone}>
        <View style={styles.milestoneHeader}>
          <View style={[styles.milestoneIcon, { backgroundColor: `${currentMilestone.color}20` }]}>
            <Text style={styles.milestoneEmoji}>{currentMilestone.icon}</Text>
          </View>
          <View style={styles.milestoneInfo}>
            <Text style={[styles.milestoneLabel, { color: activeTheme.textSecondary }]}>
              Current Milestone
            </Text>
            <Text style={[styles.milestoneTitle, { color: activeTheme.text }]}>
              {currentMilestone.title}
            </Text>
            <Text style={[styles.milestoneCount, { color: currentMilestone.color }]}>
              {totalAnalyses} analyses completed
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: currentMilestone.color }]}
          onPress={handleShare}
          accessibilityLabel="Share milestone"
          accessibilityRole="button"
        >
          <Ionicons name="share-social" size={18} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share Achievement</Text>
        </TouchableOpacity>
      </GlassContainer>

      {/* Next Milestone Progress */}
      {nextMilestone && (
        <GlassContainer variant="subtle" style={styles.nextMilestone}>
          <View style={styles.nextHeader}>
            <View style={styles.nextIconSmall}>
              <Text style={styles.nextEmoji}>{nextMilestone.icon}</Text>
            </View>
            <View style={styles.nextInfo}>
              <Text style={[styles.nextLabel, { color: activeTheme.textSecondary }]}>
                Next Milestone
              </Text>
              <Text style={[styles.nextTitle, { color: activeTheme.text }]}>
                {nextMilestone.title}
              </Text>
            </View>
            <Text style={[styles.nextTarget, { color: activeTheme.textSecondary }]}>
              {totalAnalyses}/{nextMilestone.threshold}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: activeTheme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progressToNext, 100)}%`,
                    backgroundColor: nextMilestone.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: activeTheme.textSecondary }]}>
              {nextMilestone.threshold - totalAnalyses} more to go
            </Text>
          </View>
        </GlassContainer>
      )}

      {/* All Milestones Overview */}
      <GlassContainer variant="subtle" style={styles.allMilestones}>
        <Text style={[styles.sectionTitle, { color: activeTheme.text }]}>
          All Milestones
        </Text>
        <View style={styles.milestoneGrid}>
          {MILESTONES.map((milestone) => {
            const achieved = totalAnalyses >= milestone.threshold;
            return (
              <View
                key={milestone.threshold}
                style={[
                  styles.milestoneGridItem,
                  { backgroundColor: achieved ? `${milestone.color}15` : 'transparent' },
                ]}
              >
                <View
                  style={[
                    styles.gridIconContainer,
                    {
                      backgroundColor: achieved ? milestone.color : activeTheme.border,
                    },
                  ]}
                >
                  <Text style={[styles.gridEmoji, { opacity: achieved ? 1 : 0.5 }]}>
                    {milestone.icon}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.gridTitle,
                    {
                      color: achieved ? activeTheme.text : activeTheme.textSecondary,
                    },
                  ]}
                >
                  {milestone.title}
                </Text>
                <Text style={[styles.gridThreshold, { color: activeTheme.textTertiary }]}>
                  {milestone.threshold}
                </Text>
                {achieved && (
                  <View style={styles.achievedBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </GlassContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  currentMilestone: {
    padding: 20,
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  milestoneEmoji: {
    fontSize: 36,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  milestoneCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 20,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextMilestone: {
    padding: 16,
    marginBottom: 16,
  },
  nextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextIconSmall: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextEmoji: {
    fontSize: 24,
  },
  nextInfo: {
    flex: 1,
  },
  nextLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextTarget: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  allMilestones: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  milestoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  milestoneGridItem: {
    width: '31%',
    aspectRatio: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gridIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridEmoji: {
    fontSize: 20,
  },
  gridTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  gridThreshold: {
    fontSize: 10,
  },
  achievedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
