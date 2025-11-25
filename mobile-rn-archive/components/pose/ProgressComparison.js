/**
 * ProgressComparison - Compare progress across exercises and time periods
 * Provides side-by-side comparisons and trend analysis
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const TIME_PERIODS = [
  { id: 'week', label: 'This Week', days: 7 },
  { id: 'month', label: 'This Month', days: 30 },
  { id: 'all', label: 'All Time', days: null },
];

const EXERCISE_TYPES = [
  { id: 'squat', label: 'Squat', icon: 'fitness-outline' },
  { id: 'deadlift', label: 'Deadlift', icon: 'barbell-outline' },
  { id: 'push_up', label: 'Push-up', icon: 'body-outline' },
];

export default function ProgressComparison({
  progressData = [],
  onComparisonShare,
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

  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Calculate comparison data
  const calculateExerciseStats = (exerciseType) => {
    const exerciseData = progressData.filter(p => p.exerciseType === exerciseType);

    if (exerciseData.length === 0) {
      return { count: 0, avgScore: 0, bestScore: 0, improvement: 0 };
    }

    const scores = exerciseData.map(d => d.overallScore || 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);

    // Calculate improvement (last 3 vs first 3)
    let improvement = 0;
    if (exerciseData.length >= 6) {
      const recent = exerciseData.slice(0, 3);
      const older = exerciseData.slice(-3);
      const recentAvg = recent.reduce((a, b) => a + (b.overallScore || 0), 0) / 3;
      const olderAvg = older.reduce((a, b) => a + (b.overallScore || 0), 0) / 3;
      improvement = Math.round(recentAvg - olderAvg);
    }

    return { count: exerciseData.length, avgScore, bestScore, improvement };
  };

  return (
    <GlassContainer variant="medium" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="git-compare-outline" size={20} color={activeTheme.primary || '#FF6B35'} />
          <Text style={[styles.title, { color: activeTheme.text }]}>
            Exercise Comparison
          </Text>
        </View>
      </View>

      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        {TIME_PERIODS.map((period) => (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period.id
                  ? `${activeTheme.primary || '#FF6B35'}20`
                  : 'transparent',
              },
            ]}
            onPress={() => setSelectedPeriod(period.id)}
          >
            <Text
              style={[
                styles.periodLabel,
                {
                  color: selectedPeriod === period.id
                    ? activeTheme.primary || '#FF6B35'
                    : activeTheme.textSecondary,
                },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exercise Comparisons */}
      <View style={styles.comparisons}>
        {EXERCISE_TYPES.map((exercise) => {
          const stats = calculateExerciseStats(exercise.id);

          return (
            <View key={exercise.id} style={styles.comparisonCard}>
              <View style={styles.exerciseHeader}>
                <View style={[styles.exerciseIcon, { backgroundColor: `${activeTheme.primary || '#FF6B35'}15` }]}>
                  <Ionicons name={exercise.icon} size={20} color={activeTheme.primary || '#FF6B35'} />
                </View>
                <Text style={[styles.exerciseLabel, { color: activeTheme.text }]}>
                  {exercise.label}
                </Text>
                {stats.count > 0 && (
                  <Text style={[styles.exerciseCount, { color: activeTheme.textSecondary }]}>
                    {stats.count} sessions
                  </Text>
                )}
              </View>

              {stats.count > 0 ? (
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: activeTheme.textSecondary }]}>
                      Average
                    </Text>
                    <Text style={[styles.statValue, { color: activeTheme.text }]}>
                      {stats.avgScore}%
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: activeTheme.textSecondary }]}>
                      Best
                    </Text>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>
                      {stats.bestScore}%
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: activeTheme.textSecondary }]}>
                      Change
                    </Text>
                    <View style={styles.improvementRow}>
                      {stats.improvement !== 0 && (
                        <Ionicons
                          name={stats.improvement > 0 ? 'trending-up' : 'trending-down'}
                          size={14}
                          color={stats.improvement > 0 ? '#10B981' : '#EF4444'}
                        />
                      )}
                      <Text
                        style={[
                          styles.statValue,
                          {
                            color: stats.improvement > 0
                              ? '#10B981'
                              : stats.improvement < 0
                              ? '#EF4444'
                              : activeTheme.textSecondary,
                          },
                        ]}
                      >
                        {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.noData}>
                  <Text style={[styles.noDataText, { color: activeTheme.textSecondary }]}>
                    No data yet
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Insights */}
      <GlassContainer variant="subtle" style={styles.insights}>
        <View style={styles.insightHeader}>
          <Ionicons name="lightbulb" size={16} color="#F59E0B" />
          <Text style={[styles.insightTitle, { color: activeTheme.text }]}>
            Comparison Insights
          </Text>
        </View>
        <Text style={[styles.insightText, { color: activeTheme.textSecondary }]}>
          Focus on exercises where you have the most room for improvement to maximize your progress.
        </Text>
      </GlassContainer>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  comparisons: {
    gap: 12,
  },
  comparisonCard: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  exerciseCount: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  improvementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  noData: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
  },
  insights: {
    padding: 12,
    marginTop: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
