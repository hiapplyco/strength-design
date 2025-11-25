/**
 * FormScoreDisplay - Advanced form score visualization with progress charts
 * Shows overall score, component breakdowns, and improvement trends
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

export default function FormScoreDisplay({
  analysisResult,
  exerciseType,
  exerciseName,
  animated = true
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

  const overallScore = analysisResult?.analysis?.overallScore || 0;
  const components = analysisResult?.analysis?.components || {};

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overall Score */}
      <GlassContainer variant="medium" style={styles.scoreCard}>
        <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
          Overall Form Score
        </Text>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
            {overallScore}%
          </Text>
          <Text style={[styles.scoreStatus, { color: theme.textSecondary }]}>
            {getScoreLabel(overallScore)}
          </Text>
        </View>
        <Text style={[styles.exerciseTitle, { color: theme.text }]}>
          {exerciseName}
        </Text>
      </GlassContainer>

      {/* Component Breakdown */}
      <GlassContainer variant="medium" style={styles.breakdownCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="analytics-outline" size={20} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Component Analysis
          </Text>
        </View>

        {Object.entries(components).map(([key, value]) => (
          <View key={key} style={styles.componentRow}>
            <Text style={[styles.componentLabel, { color: theme.text }]}>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
            </Text>
            <View style={styles.componentScore}>
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${value}%`,
                      backgroundColor: getScoreColor(value)
                    }
                  ]}
                />
              </View>
              <Text style={[styles.componentValue, { color: getScoreColor(value) }]}>
                {value}%
              </Text>
            </View>
          </View>
        ))}
      </GlassContainer>

      {/* Key Insights */}
      <GlassContainer variant="subtle" style={styles.insightsCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb-outline" size={20} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Key Insights
          </Text>
        </View>
        <Text style={[styles.insightText, { color: theme.textSecondary }]}>
          {analysisResult?.analysis?.summary || 'Form analysis completed successfully.'}
        </Text>
      </GlassContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scoreCard: {
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '700',
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  breakdownCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  componentRow: {
    marginBottom: 16,
  },
  componentLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  componentScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  componentValue: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  insightsCard: {
    padding: 20,
    marginBottom: 16,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
