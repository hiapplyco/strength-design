/**
 * ProgressCharts - Visual progress analytics and trend charts
 * Displays score trends, exercise-specific progress, and improvement analytics
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressCharts({
  exerciseType = 'all',
  onExerciseSelect,
  onDataRefresh,
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

  const [chartData, setChartData] = useState({
    scores: [],
    dates: [],
    trend: 'improving',
    averageScore: 0,
  });

  useEffect(() => {
    loadChartData();
  }, [exerciseType]);

  const loadChartData = async () => {
    // Mock data - would fetch from poseProgressService
    const mockScores = [72, 75, 78, 76, 82, 85, 88, 87, 90, 92];
    const mockDates = mockScores.map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (mockScores.length - i));
      return date;
    });

    setChartData({
      scores: mockScores,
      dates: mockDates,
      trend: 'improving',
      averageScore: Math.round(mockScores.reduce((a, b) => a + b, 0) / mockScores.length),
    });
  };

  const renderSimpleLineChart = () => {
    const maxScore = Math.max(...chartData.scores, 100);
    const chartHeight = 200;
    const chartWidth = screenWidth - 80;

    return (
      <View style={styles.chartContainer}>
        <View style={[styles.chart, { height: chartHeight }]}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            <Text style={[styles.axisLabel, { color: activeTheme.textTertiary }]}>100</Text>
            <Text style={[styles.axisLabel, { color: activeTheme.textTertiary }]}>50</Text>
            <Text style={[styles.axisLabel, { color: activeTheme.textTertiary }]}>0</Text>
          </View>

          {/* Chart area */}
          <View style={[styles.chartArea, { width: chartWidth }]}>
            {/* Grid lines */}
            <View style={styles.gridLines}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.gridLine,
                    { backgroundColor: activeTheme.border || '#E5E5E5' },
                  ]}
                />
              ))}
            </View>

            {/* Data points and line */}
            <View style={styles.dataLayer}>
              {chartData.scores.map((score, index) => {
                const x = (index / (chartData.scores.length - 1)) * chartWidth;
                const y = chartHeight - (score / maxScore) * chartHeight;

                return (
                  <View
                    key={index}
                    style={[
                      styles.dataPoint,
                      {
                        left: x - 4,
                        top: y - 4,
                        backgroundColor: activeTheme.primary || '#FF6B35',
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* X-axis (simplified) */}
        <View style={styles.xAxis}>
          <Text style={[styles.axisLabel, { color: activeTheme.textTertiary }]}>
            {chartData.dates[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          <Text style={[styles.axisLabel, { color: activeTheme.textTertiary }]}>
            {chartData.dates[chartData.dates.length - 1]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Summary Stats */}
      <GlassContainer variant="medium" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: activeTheme.textSecondary }]}>
              Average Score
            </Text>
            <Text style={[styles.summaryValue, { color: activeTheme.text }]}>
              {chartData.averageScore}%
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: activeTheme.textSecondary }]}>
              Trend
            </Text>
            <View style={styles.trendIndicator}>
              <Ionicons
                name={chartData.trend === 'improving' ? 'trending-up' : 'trending-down'}
                size={20}
                color={chartData.trend === 'improving' ? '#10B981' : '#EF4444'}
              />
              <Text
                style={[
                  styles.summaryValue,
                  { color: chartData.trend === 'improving' ? '#10B981' : '#EF4444' },
                ]}
              >
                {chartData.trend === 'improving' ? 'Up' : 'Down'}
              </Text>
            </View>
          </View>
        </View>
      </GlassContainer>

      {/* Progress Chart */}
      <GlassContainer variant="medium" style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <Ionicons name="analytics" size={20} color={activeTheme.primary || '#FF6B35'} />
            <Text style={[styles.chartTitle, { color: activeTheme.text }]}>
              Score Progress
            </Text>
          </View>
          <Text style={[styles.chartSubtitle, { color: activeTheme.textSecondary }]}>
            Last {chartData.scores.length} analyses
          </Text>
        </View>

        {renderSimpleLineChart()}
      </GlassContainer>

      {/* Insights */}
      <GlassContainer variant="subtle" style={styles.insightsCard}>
        <View style={styles.insightHeader}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
          <Text style={[styles.insightTitle, { color: activeTheme.text }]}>
            Key Insights
          </Text>
        </View>
        <View style={styles.insightsList}>
          <View style={styles.insightItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={[styles.insightText, { color: activeTheme.textSecondary }]}>
              Your form has improved by 20% over the last 10 sessions
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="information-circle" size={16} color="#3B82F6" />
            <Text style={[styles.insightText, { color: activeTheme.textSecondary }]}>
              Most improvement seen in knee alignment and depth
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="trophy" size={16} color="#F59E0B" />
            <Text style={[styles.insightText, { color: activeTheme.textSecondary }]}>
              You're in the top 25% of users for consistency
            </Text>
          </View>
        </View>
      </GlassContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    padding: 20,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartCard: {
    padding: 20,
    marginBottom: 16,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  chartSubtitle: {
    fontSize: 14,
  },
  chartContainer: {
    marginTop: 8,
  },
  chart: {
    flexDirection: 'row',
    position: 'relative',
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  axisLabel: {
    fontSize: 12,
  },
  chartArea: {
    position: 'relative',
    marginLeft: 8,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    width: '100%',
  },
  dataLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingLeft: 38,
  },
  insightsCard: {
    padding: 20,
    marginBottom: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
