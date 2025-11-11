/**
 * Progress Charts Component
 * Main container for pose analysis progress visualization with interactive charts
 * 
 * Features:
 * - Time-series form score trends with interactive timeline
 * - Exercise-specific progress breakdown and comparison
 * - Performance correlation visualization
 * - Touch-friendly mobile interactions with gestures
 * - Glassmorphism design with accessibility compliance
 * - Real-time data integration with PoseProgressService
 * - Customizable time periods and chart types
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer, BlurWrapper } from '../GlassmorphismComponents';
import { createThemedStyles, accessibility } from '../../utils/designTokens';
import FormTrendChart from '../charts/FormTrendChart';
import ExerciseComparisonChart from '../charts/ExerciseComparisonChart';
import CircularProgressChart from '../charts/CircularProgressChart';
import poseProgressService from '../../services/poseProgressService';

const { width: screenWidth } = Dimensions.get('window');

// Time period options for chart filtering
const TIME_PERIODS = [
  { key: '7d', label: '7 Days', icon: 'calendar-outline' },
  { key: '30d', label: '30 Days', icon: 'calendar-outline' },
  { key: '90d', label: '90 Days', icon: 'calendar-clear-outline' },
  { key: '1y', label: '1 Year', icon: 'calendar-clear-outline' },
  { key: 'all', label: 'All Time', icon: 'infinite-outline' },
];

// Chart type options
const CHART_TYPES = [
  { key: 'trend', label: 'Trend', icon: 'trending-up', description: 'Form score over time' },
  { key: 'comparison', label: 'Compare', icon: 'bar-chart', description: 'Exercise comparison' },
  { key: 'correlation', label: 'Insights', icon: 'analytics', description: 'Performance insights' },
];

// Exercise type options for filtering
const EXERCISE_TYPES = [
  { key: 'all', label: 'All Exercises', icon: 'fitness' },
  { key: 'squat', label: 'Squat', icon: 'barbell' },
  { key: 'deadlift', label: 'Deadlift', icon: 'barbell' },
  { key: 'push_up', label: 'Push-up', icon: 'hand-left' },
  { key: 'baseball_pitch', label: 'Baseball Pitch', icon: 'baseball' },
];

const ProgressCharts = ({
  exerciseType = 'all',
  initialTimePeriod = '30d',
  onExerciseSelect,
  onDataRefresh,
  theme,
  style,
  accessibilityLabel,
}) => {
  const styles = createThemedStyles(getStyles, theme?.isDark ? 'dark' : 'light');
  
  // State management
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(initialTimePeriod);
  const [selectedChartType, setSelectedChartType] = useState('trend');
  const [selectedExercise, setSelectedExercise] = useState(exerciseType);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Chart data state
  const [trendData, setTrendData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [progressSummary, setProgressSummary] = useState(null);
  
  // Animation values
  const chartAnimation = useRef(new Animated.Value(0)).current;
  const periodSelectorAnimation = useRef(new Animated.Value(1)).current;

  // Initialize service and load data
  useEffect(() => {
    initializeData();
  }, []);

  // Reload data when filters change
  useEffect(() => {
    if (!isLoading) {
      loadChartData();
    }
  }, [selectedTimePeriod, selectedExercise, selectedChartType]);

  /**
   * Initialize pose progress service and load initial data
   */
  const initializeData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize service if needed
      if (!poseProgressService.isInitialized) {
        await poseProgressService.initialize();
      }
      
      await loadChartData();
      
      // Animate chart entrance
      Animated.timing(chartAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('❌ Error initializing progress charts:', error);
      setError('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load chart data based on current filters
   */
  const loadChartData = async () => {
    try {
      const isAllExercises = selectedExercise === 'all';
      
      // Load data in parallel for better performance
      const dataPromises = [];
      
      if (selectedChartType === 'trend' || selectedChartType === 'all') {
        if (isAllExercises) {
          // Load data for all exercise types
          dataPromises.push(loadAllExercisesTrendData());
        } else {
          // Load specific exercise trend data
          dataPromises.push(loadTrendDataForExercise(selectedExercise));
        }
      }
      
      if (selectedChartType === 'comparison' || selectedChartType === 'all') {
        dataPromises.push(loadComparisonData());
      }
      
      if (selectedChartType === 'correlation' || selectedChartType === 'all') {
        dataPromises.push(loadCorrelationData());
      }
      
      // Load progress summary for overview
      dataPromises.push(loadProgressSummary());
      
      await Promise.allSettled(dataPromises);
      
    } catch (error) {
      console.error('❌ Error loading chart data:', error);
      setError('Failed to refresh chart data');
    }
  };

  /**
   * Load trend data for a specific exercise
   */
  const loadTrendDataForExercise = async (exerciseType) => {
    try {
      const trends = await poseProgressService.getFormScoreTrends(
        exerciseType,
        selectedTimePeriod
      );
      setTrendData(trends);
      return trends;
    } catch (error) {
      console.error('❌ Error loading trend data:', error);
      return null;
    }
  };

  /**
   * Load trend data for all exercises
   */
  const loadAllExercisesTrendData = async () => {
    try {
      // Get available exercise types from recent sessions
      const allProgress = await poseProgressService.getAllUserProgress();
      const exerciseTypes = [...new Set(allProgress.map(p => p.exerciseType))];
      
      const allTrends = {};
      await Promise.all(
        exerciseTypes.map(async (type) => {
          const trends = await poseProgressService.getFormScoreTrends(
            type,
            selectedTimePeriod
          );
          if (trends.data.length > 0) {
            allTrends[type] = trends;
          }
        })
      );
      
      setTrendData(allTrends);
      return allTrends;
    } catch (error) {
      console.error('❌ Error loading all exercises trend data:', error);
      return null;
    }
  };

  /**
   * Load comparison data across exercises
   */
  const loadComparisonData = async () => {
    try {
      // Get progress for multiple exercise types
      const allProgress = await poseProgressService.getAllUserProgress();
      const exerciseTypes = [...new Set(allProgress.map(p => p.exerciseType))];
      
      const comparisonResults = {};
      await Promise.all(
        exerciseTypes.map(async (type) => {
          const summary = await poseProgressService.getProgressSummary(type);
          comparisonResults[type] = {
            exerciseType: type,
            exerciseName: summary.exerciseName,
            averageScore: summary.averageScore,
            bestScore: summary.bestScore,
            totalSessions: summary.totalSessions,
            improvement: summary.improvement,
            consistency: summary.consistency,
            recentSessions: summary.recentSessions,
            lastAnalysis: summary.lastAnalysis,
          };
        })
      );
      
      setComparisonData(comparisonResults);
      return comparisonResults;
    } catch (error) {
      console.error('❌ Error loading comparison data:', error);
      return null;
    }
  };

  /**
   * Load correlation and insights data
   */
  const loadCorrelationData = async () => {
    try {
      const exerciseType = selectedExercise === 'all' ? null : selectedExercise;
      const progressData = await poseProgressService.getExerciseProgress(
        exerciseType,
        { 
          timeRange: selectedTimePeriod, 
          limit: 100,
          includeDetails: true 
        }
      );
      
      // Analyze correlations and patterns
      const correlations = analyzeCorrelations(progressData);
      setCorrelationData(correlations);
      return correlations;
    } catch (error) {
      console.error('❌ Error loading correlation data:', error);
      return null;
    }
  };

  /**
   * Load progress summary for overview stats
   */
  const loadProgressSummary = async () => {
    try {
      if (selectedExercise === 'all') {
        // Aggregate summary across all exercises
        const allProgress = await poseProgressService.getAllUserProgress();
        const summary = aggregateProgressSummary(allProgress);
        setProgressSummary(summary);
        return summary;
      } else {
        const summary = await poseProgressService.getProgressSummary(selectedExercise);
        setProgressSummary(summary);
        return summary;
      }
    } catch (error) {
      console.error('❌ Error loading progress summary:', error);
      return null;
    }
  };

  /**
   * Analyze correlations between different metrics
   */
  const analyzeCorrelations = (progressData) => {
    if (!progressData.length) return null;

    // Analyze relationship between confidence and scores
    const confidenceScoreCorr = calculateCorrelation(
      progressData.map(p => p.confidence || 0),
      progressData.map(p => p.overallScore || 0)
    );

    // Analyze improvement patterns over time
    const timeBasedPatterns = analyzeTimePatterns(progressData);

    // Identify consistent performance indicators
    const consistencyMetrics = analyzeConsistency(progressData);

    return {
      confidenceScoreCorrelation: confidenceScoreCorr,
      timePatterns: timeBasedPatterns,
      consistencyMetrics,
      dataQuality: {
        totalSessions: progressData.length,
        averageConfidence: progressData.reduce((sum, p) => sum + (p.confidence || 0), 0) / progressData.length,
        scoreVariance: calculateVariance(progressData.map(p => p.overallScore || 0)),
      },
    };
  };

  /**
   * Calculate correlation coefficient between two arrays
   */
  const calculateCorrelation = (x, y) => {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
    const sumX2 = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
    const sumY2 = y.map(yi => yi * yi).reduce((a, b) => a + b, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  /**
   * Calculate variance of an array
   */
  const calculateVariance = (values) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  };

  /**
   * Analyze time-based patterns
   */
  const analyzeTimePatterns = (progressData) => {
    const sortedData = [...progressData].sort((a, b) => 
      new Date(a.analyzedAt) - new Date(b.analyzedAt)
    );

    // Calculate moving average
    const movingAverage = [];
    const windowSize = 3;
    
    for (let i = windowSize - 1; i < sortedData.length; i++) {
      const window = sortedData.slice(i - windowSize + 1, i + 1);
      const avg = window.reduce((sum, item) => sum + (item.overallScore || 0), 0) / windowSize;
      movingAverage.push({
        date: sortedData[i].analyzedAt,
        movingAverage: avg,
        actualScore: sortedData[i].overallScore || 0,
      });
    }

    return {
      movingAverage,
      trend: calculateTrend(sortedData),
      volatility: calculateVariance(sortedData.map(d => d.overallScore || 0)),
    };
  };

  /**
   * Calculate overall trend direction
   */
  const calculateTrend = (sortedData) => {
    if (sortedData.length < 2) return 0;
    
    const first = sortedData[0]?.overallScore || 0;
    const last = sortedData[sortedData.length - 1]?.overallScore || 0;
    
    return last - first;
  };

  /**
   * Analyze consistency patterns
   */
  const analyzeConsistency = (progressData) => {
    const scores = progressData.map(p => p.overallScore || 0);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = calculateVariance(scores);
    const stdDev = Math.sqrt(variance);
    
    return {
      mean,
      variance,
      standardDeviation: stdDev,
      consistencyScore: Math.max(0, 100 - (stdDev / mean) * 100),
      outliers: scores.filter(score => Math.abs(score - mean) > 2 * stdDev).length,
    };
  };

  /**
   * Aggregate progress summary across all exercises
   */
  const aggregateProgressSummary = (allProgress) => {
    if (!allProgress.length) return null;

    const totalSessions = allProgress.length;
    const averageScore = allProgress.reduce((sum, p) => sum + (p.overallScore || 0), 0) / totalSessions;
    const bestScore = Math.max(...allProgress.map(p => p.overallScore || 0));
    
    const recentSessions = allProgress
      .sort((a, b) => new Date(b.analyzedAt) - new Date(a.analyzedAt))
      .slice(0, 10);

    return {
      exerciseType: 'all',
      exerciseName: 'All Exercises',
      totalSessions,
      averageScore: Math.round(averageScore),
      bestScore,
      recentSessions: recentSessions.length,
      lastAnalysis: recentSessions[0]?.analyzedAt,
      exerciseTypes: [...new Set(allProgress.map(p => p.exerciseType))],
    };
  };

  /**
   * Handle refresh action
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadChartData();
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Handle time period selection
   */
  const handleTimePeriodSelect = (period) => {
    if (period !== selectedTimePeriod) {
      setSelectedTimePeriod(period);
      
      // Animate period selector feedback
      Animated.sequence([
        Animated.timing(periodSelectorAnimation, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(periodSelectorAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  /**
   * Handle chart type selection
   */
  const handleChartTypeSelect = (chartType) => {
    if (chartType !== selectedChartType) {
      setSelectedChartType(chartType);
      
      // Animate chart transition
      Animated.sequence([
        Animated.timing(chartAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(chartAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  /**
   * Handle exercise selection
   */
  const handleExerciseSelect = (exercise) => {
    if (exercise !== selectedExercise) {
      setSelectedExercise(exercise);
      if (onExerciseSelect) {
        onExerciseSelect(exercise);
      }
    }
  };

  /**
   * Render overview summary cards
   */
  const renderOverviewSummary = () => {
    if (!progressSummary) return null;

    return (
      <View style={styles.overviewContainer}>
        <View style={styles.overviewGrid}>
          <GlassContainer variant="default" style={styles.summaryCard}>
            <CircularProgressChart
              score={progressSummary.averageScore || 0}
              size={60}
              strokeWidth={6}
              showPercentage={true}
              progressColor={theme?.primary || '#FF6B35'}
              backgroundColor={theme?.border?.light || '#E5E5E5'}
              textColor={theme?.text?.primary || '#000000'}
              fontSize={14}
              accessibilityLabel={`Average score ${progressSummary.averageScore}%`}
            />
            <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
              Avg Score
            </Text>
          </GlassContainer>

          <GlassContainer variant="default" style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: theme?.text?.primary }]}>
              {progressSummary.bestScore || 0}%
            </Text>
            <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
              Best Score
            </Text>
          </GlassContainer>

          <GlassContainer variant="default" style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: theme?.text?.primary }]}>
              {progressSummary.totalSessions || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
              Sessions
            </Text>
          </GlassContainer>

          <GlassContainer variant="default" style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: theme?.text?.primary }]}>
              {progressSummary.recentSessions || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
              Recent
            </Text>
          </GlassContainer>
        </View>
      </View>
    );
  };

  /**
   * Render time period selector
   */
  const renderTimePeriodSelector = () => (
    <Animated.View 
      style={[
        styles.periodSelectorContainer,
        { transform: [{ scale: periodSelectorAnimation }] }
      ]}
    >
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodScrollContent}
      >
        {TIME_PERIODS.map((period) => {
          const isSelected = selectedTimePeriod === period.key;
          return (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                isSelected && styles.periodButtonSelected,
                { backgroundColor: isSelected ? theme?.primary || '#FF6B35' : 'transparent' }
              ]}
              onPress={() => handleTimePeriodSelect(period.key)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Select ${period.label} time period`}
              accessibilityState={{ selected: isSelected }}
            >
              <Ionicons
                name={period.icon}
                size={16}
                color={isSelected ? '#FFFFFF' : theme?.text?.tertiary || '#6C757D'}
                style={styles.periodIcon}
              />
              <Text
                style={[
                  styles.periodText,
                  { color: isSelected ? '#FFFFFF' : theme?.text?.secondary || '#495057' }
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );

  /**
   * Render chart type selector
   */
  const renderChartTypeSelector = () => (
    <View style={styles.chartTypeSelectorContainer}>
      {CHART_TYPES.map((chartType) => {
        const isSelected = selectedChartType === chartType.key;
        return (
          <TouchableOpacity
            key={chartType.key}
            style={[
              styles.chartTypeButton,
              isSelected && styles.chartTypeButtonSelected,
              { borderColor: isSelected ? theme?.primary || '#FF6B35' : theme?.border?.light || '#E5E5E5' }
            ]}
            onPress={() => handleChartTypeSelect(chartType.key)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Select ${chartType.label} chart type`}
            accessibilityHint={chartType.description}
            accessibilityState={{ selected: isSelected }}
          >
            <Ionicons
              name={chartType.icon}
              size={20}
              color={isSelected ? theme?.primary || '#FF6B35' : theme?.text?.tertiary || '#6C757D'}
            />
            <Text
              style={[
                styles.chartTypeText,
                { color: isSelected ? theme?.primary || '#FF6B35' : theme?.text?.secondary || '#495057' }
              ]}
            >
              {chartType.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  /**
   * Render main chart content
   */
  const renderChartContent = () => {
    if (isLoading) {
      return (
        <GlassContainer variant="default" style={styles.loadingContainer}>
          <Animated.View
            style={{
              transform: [{
                rotate: chartAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }}
          >
            <Ionicons
              name="analytics"
              size={32}
              color={theme?.text?.tertiary || '#6C757D'}
            />
          </Animated.View>
          <Text style={[styles.loadingText, { color: theme?.text?.secondary }]}>
            Loading progress data...
          </Text>
        </GlassContainer>
      );
    }

    if (error) {
      return (
        <GlassContainer variant="default" style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={32}
            color={theme?.semantic?.error?.primary || '#DC2626'}
          />
          <Text style={[styles.errorText, { color: theme?.semantic?.error?.primary || '#DC2626' }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme?.primary || '#FF6B35' }]}
            onPress={initializeData}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </GlassContainer>
      );
    }

    return (
      <Animated.View
        style={[
          styles.chartContainer,
          {
            opacity: chartAnimation,
            transform: [{
              translateY: chartAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }
        ]}
      >
        {selectedChartType === 'trend' && (
          <FormTrendChart
            data={trendData}
            exerciseType={selectedExercise}
            timePeriod={selectedTimePeriod}
            theme={theme}
            onDataPointPress={(point) => console.log('Data point pressed:', point)}
          />
        )}

        {selectedChartType === 'comparison' && (
          <ExerciseComparisonChart
            data={comparisonData}
            timePeriod={selectedTimePeriod}
            theme={theme}
            onExercisePress={handleExerciseSelect}
          />
        )}

        {selectedChartType === 'correlation' && correlationData && (
          <View style={styles.correlationContainer}>
            <Text style={[styles.correlationTitle, { color: theme?.text?.primary }]}>
              Performance Insights
            </Text>
            
            <GlassContainer variant="default" style={styles.insightCard}>
              <Text style={[styles.insightLabel, { color: theme?.text?.secondary }]}>
                Confidence-Score Correlation
              </Text>
              <Text style={[styles.insightValue, { color: theme?.text?.primary }]}>
                {(correlationData.confidenceScoreCorrelation * 100).toFixed(1)}%
              </Text>
              <Text style={[styles.insightDescription, { color: theme?.text?.tertiary }]}>
                Higher confidence typically indicates better form scores
              </Text>
            </GlassContainer>

            <GlassContainer variant="default" style={styles.insightCard}>
              <Text style={[styles.insightLabel, { color: theme?.text?.secondary }]}>
                Consistency Score
              </Text>
              <Text style={[styles.insightValue, { color: theme?.text?.primary }]}>
                {correlationData.consistencyMetrics.consistencyScore.toFixed(1)}%
              </Text>
              <Text style={[styles.insightDescription, { color: theme?.text?.tertiary }]}>
                Measures how consistent your form performance is
              </Text>
            </GlassContainer>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || "Progress charts showing pose analysis trends"}
      accessibilityRole="region"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme?.primary || '#FF6B35'}
            colors={[theme?.primary || '#FF6B35']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Summary */}
        {renderOverviewSummary()}

        {/* Time Period Selector */}
        {renderTimePeriodSelector()}

        {/* Chart Type Selector */}
        {renderChartTypeSelector()}

        {/* Main Chart Content */}
        {renderChartContent()}
      </ScrollView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing[8],
  },
  overviewContainer: {
    marginBottom: theme.spacing[6],
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing[3],
    marginHorizontal: theme.spacing[1],
    borderRadius: theme.borderRadius.md,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  periodSelectorContainer: {
    marginBottom: theme.spacing[4],
  },
  periodScrollContent: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.border?.light || 'transparent',
  },
  periodButtonSelected: {
    borderColor: 'transparent',
  },
  periodIcon: {
    marginRight: theme.spacing[1],
  },
  periodText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  chartTypeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  chartTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[2],
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing[1],
  },
  chartTypeButtonSelected: {
    borderWidth: 2,
  },
  chartTypeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing[1],
    textAlign: 'center',
  },
  chartContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[8],
    marginHorizontal: theme.spacing[4],
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    marginTop: theme.spacing[4],
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[8],
    marginHorizontal: theme.spacing[4],
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  retryButton: {
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  correlationContainer: {
    flex: 1,
  },
  correlationTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[4],
    textAlign: 'center',
  },
  insightCard: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  insightLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing[2],
  },
  insightValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[2],
  },
  insightDescription: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.xs,
  },
});

ProgressCharts.displayName = 'ProgressCharts';

export default ProgressCharts;