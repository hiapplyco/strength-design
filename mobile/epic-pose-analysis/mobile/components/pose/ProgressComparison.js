/**
 * Progress Comparison Component
 * 
 * Interactive progress comparison tool for pose analysis with advanced
 * visualization and social sharing capabilities. Enables users to compare
 * their form improvement over time, across exercises, and with others.
 * 
 * Features:
 * - Time-period progress comparisons with visual charts
 * - Exercise-to-exercise form analysis comparison
 * - Before/after progress visualization with animations
 * - Social sharing with customizable progress reports
 * - Peer comparison (anonymous) for motivation
 * - Glassmorphism design with accessibility support
 * - Interactive charts with touch gestures
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Share,
  Haptics,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer, BlurWrapper } from '../GlassmorphismComponents';
import { createThemedStyles } from '../../utils/designTokens';
import CircularProgressChart from '../charts/CircularProgressChart';
import FormTrendChart from '../charts/FormTrendChart';

const { width: screenWidth } = Dimensions.get('window');

// Comparison Types
const COMPARISON_TYPES = [
  { key: 'time_periods', label: 'Time Periods', icon: 'time', description: 'Compare different time periods' },
  { key: 'exercises', label: 'Exercises', icon: 'fitness', description: 'Compare across exercise types' },
  { key: 'before_after', label: 'Before & After', icon: 'swap-horizontal', description: 'See your transformation' },
  { key: 'peer_comparison', label: 'Community', icon: 'people', description: 'Anonymous peer comparison' },
];

// Time period options for comparison
const TIME_PERIODS = [
  { key: 'last_week', label: 'Last Week', days: 7 },
  { key: 'last_month', label: 'Last Month', days: 30 },
  { key: 'last_3_months', label: 'Last 3 Months', days: 90 },
  { key: 'last_6_months', label: 'Last 6 Months', days: 180 },
  { key: 'last_year', label: 'Last Year', days: 365 },
];

const ProgressComparison = ({
  progressData,
  onComparisonShare,
  onPeerComparisonRequest,
  theme,
  style,
}) => {
  const styles = createThemedStyles(getStyles, theme?.isDark ? 'dark' : 'light');
  
  // State management
  const [selectedComparison, setSelectedComparison] = useState('time_periods');
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriods, setSelectedPeriods] = useState(['last_month', 'last_3_months']);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [peerData, setPeerData] = useState(null);
  
  // Animation refs
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;

  // Initialize component
  useEffect(() => {
    if (progressData && progressData.length > 0) {
      const exerciseTypes = [...new Set(progressData.map(p => p.exerciseType))];
      setSelectedExercises(exerciseTypes.slice(0, 2)); // Select first two exercises by default
      performComparison();
    }
    
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [progressData]);

  // Perform comparison when selection changes
  useEffect(() => {
    if (progressData && progressData.length > 0) {
      performComparison();
    }
  }, [selectedComparison, selectedPeriods, selectedExercises]);

  /**
   * Perform comparison based on selected type
   */
  const performComparison = async () => {
    setIsLoading(true);
    
    try {
      let results = {};
      
      switch (selectedComparison) {
        case 'time_periods':
          results = await compareTimePeriods();
          break;
        case 'exercises':
          results = await compareExercises();
          break;
        case 'before_after':
          results = await compareBeforeAfter();
          break;
        case 'peer_comparison':
          results = await compareToPeers();
          break;
        default:
          results = await compareTimePeriods();
      }
      
      setComparisonResults(results);
      
    } catch (error) {
      console.error('❌ Error performing comparison:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Compare different time periods
   */
  const compareTimePeriods = async () => {
    const comparisons = [];
    
    for (const periodKey of selectedPeriods) {
      const period = TIME_PERIODS.find(p => p.key === periodKey);
      if (!period) continue;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - period.days);
      
      const periodData = progressData.filter(p => 
        new Date(p.analyzedAt) >= cutoffDate
      );
      
      if (periodData.length === 0) {
        comparisons.push({
          period: period.label,
          periodKey,
          sessions: 0,
          averageScore: 0,
          bestScore: 0,
          improvement: 0,
          consistency: 0,
          trend: 'stable'
        });
        continue;
      }
      
      const scores = periodData.map(p => p.overallScore || 0);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const bestScore = Math.max(...scores);
      const consistency = calculateConsistency(scores);
      
      // Calculate improvement over the period
      const sortedPeriodData = [...periodData].sort((a, b) => 
        new Date(a.analyzedAt) - new Date(b.analyzedAt)
      );
      
      let improvement = 0;
      let trend = 'stable';
      
      if (sortedPeriodData.length >= 4) {
        const firstHalf = sortedPeriodData.slice(0, Math.floor(sortedPeriodData.length / 2));
        const secondHalf = sortedPeriodData.slice(Math.floor(sortedPeriodData.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, p) => sum + (p.overallScore || 0), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, p) => sum + (p.overallScore || 0), 0) / secondHalf.length;
        
        improvement = secondHalfAvg - firstHalfAvg;
        
        if (improvement > 2) trend = 'improving';
        else if (improvement < -2) trend = 'declining';
      }
      
      comparisons.push({
        period: period.label,
        periodKey,
        sessions: periodData.length,
        averageScore: Math.round(averageScore),
        bestScore: Math.round(bestScore),
        improvement: Math.round(improvement),
        consistency: Math.round(consistency),
        trend,
        data: periodData
      });
    }
    
    return {
      type: 'time_periods',
      comparisons,
      insights: generateTimePeriodInsights(comparisons)
    };
  };

  /**
   * Compare different exercises
   */
  const compareExercises = async () => {
    const comparisons = [];
    
    for (const exerciseType of selectedExercises) {
      const exerciseData = progressData.filter(p => p.exerciseType === exerciseType);
      
      if (exerciseData.length === 0) {
        comparisons.push({
          exerciseType,
          exerciseName: getExerciseName(exerciseType),
          sessions: 0,
          averageScore: 0,
          bestScore: 0,
          improvement: 0,
          consistency: 0,
          lastAnalysis: null
        });
        continue;
      }
      
      const scores = exerciseData.map(p => p.overallScore || 0);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const bestScore = Math.max(...scores);
      const consistency = calculateConsistency(scores);
      
      // Calculate improvement trend
      const improvement = calculateImprovementTrend(exerciseData);
      
      comparisons.push({
        exerciseType,
        exerciseName: getExerciseName(exerciseType),
        sessions: exerciseData.length,
        averageScore: Math.round(averageScore),
        bestScore: Math.round(bestScore),
        improvement: Math.round(improvement),
        consistency: Math.round(consistency),
        lastAnalysis: exerciseData[0]?.analyzedAt,
        data: exerciseData
      });
    }
    
    return {
      type: 'exercises',
      comparisons,
      insights: generateExerciseInsights(comparisons)
    };
  };

  /**
   * Compare before and after progress
   */
  const compareBeforeAfter = async () => {
    if (progressData.length < 10) {
      return {
        type: 'before_after',
        error: 'Need at least 10 sessions for before/after comparison',
        comparisons: []
      };
    }
    
    const sortedData = [...progressData].sort((a, b) => 
      new Date(a.analyzedAt) - new Date(b.analyzedAt)
    );
    
    const splitPoint = Math.floor(sortedData.length / 2);
    const beforeData = sortedData.slice(0, splitPoint);
    const afterData = sortedData.slice(splitPoint);
    
    const beforeStats = calculatePeriodStats(beforeData, 'Before');
    const afterStats = calculatePeriodStats(afterData, 'After');
    
    // Calculate transformation metrics
    const scoreImprovement = afterStats.averageScore - beforeStats.averageScore;
    const consistencyImprovement = afterStats.consistency - beforeStats.consistency;
    const transformationScore = calculateTransformationScore(beforeStats, afterStats);
    
    return {
      type: 'before_after',
      comparisons: [beforeStats, afterStats],
      transformation: {
        scoreImprovement: Math.round(scoreImprovement),
        consistencyImprovement: Math.round(consistencyImprovement),
        transformationScore: Math.round(transformationScore),
        totalImprovement: Math.round((scoreImprovement + consistencyImprovement) / 2)
      },
      insights: generateBeforeAfterInsights(beforeStats, afterStats, transformationScore)
    };
  };

  /**
   * Compare to anonymous peer data
   */
  const compareToPeers = async () => {
    // This would typically make an API call to get anonymized peer data
    // For now, we'll generate simulated peer data based on the user's progress
    
    const userStats = calculateOverallStats(progressData);
    const peerData = generateSimulatedPeerData(userStats);
    
    return {
      type: 'peer_comparison',
      userStats,
      peerData,
      insights: generatePeerInsights(userStats, peerData)
    };
  };

  /**
   * Calculate consistency score
   */
  const calculateConsistency = (scores) => {
    if (scores.length < 2) return 100;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 100 - (stdDev / mean) * 100);
  };

  /**
   * Calculate improvement trend
   */
  const calculateImprovementTrend = (exerciseData) => {
    if (exerciseData.length < 6) return 0;
    
    const sortedData = [...exerciseData].sort((a, b) => 
      new Date(a.analyzedAt) - new Date(b.analyzedAt)
    );
    
    const recentSessions = sortedData.slice(-3);
    const olderSessions = sortedData.slice(-6, -3);
    
    const recentAvg = recentSessions.reduce((sum, p) => sum + (p.overallScore || 0), 0) / recentSessions.length;
    const olderAvg = olderSessions.reduce((sum, p) => sum + (p.overallScore || 0), 0) / olderSessions.length;
    
    return recentAvg - olderAvg;
  };

  /**
   * Calculate period statistics
   */
  const calculatePeriodStats = (data, label) => {
    if (!data.length) return null;
    
    const scores = data.map(p => p.overallScore || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const consistency = calculateConsistency(scores);
    
    return {
      label,
      sessions: data.length,
      averageScore: Math.round(averageScore),
      bestScore: Math.round(bestScore),
      consistency: Math.round(consistency),
      dateRange: {
        start: data[data.length - 1]?.analyzedAt,
        end: data[0]?.analyzedAt
      }
    };
  };

  /**
   * Calculate transformation score
   */
  const calculateTransformationScore = (beforeStats, afterStats) => {
    const scoreWeight = 0.6;
    const consistencyWeight = 0.4;
    
    const scoreImprovement = afterStats.averageScore - beforeStats.averageScore;
    const consistencyImprovement = afterStats.consistency - beforeStats.consistency;
    
    return (scoreImprovement * scoreWeight) + (consistencyImprovement * consistencyWeight);
  };

  /**
   * Calculate overall user statistics
   */
  const calculateOverallStats = (data) => {
    const scores = data.map(p => p.overallScore || 0);
    const exerciseTypes = [...new Set(data.map(p => p.exerciseType))];
    
    return {
      totalSessions: data.length,
      averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      bestScore: Math.max(...scores),
      consistency: Math.round(calculateConsistency(scores)),
      exerciseVariety: exerciseTypes.length,
      improvementRate: Math.round(calculateImprovementTrend(data))
    };
  };

  /**
   * Generate simulated peer data for comparison
   */
  const generateSimulatedPeerData = (userStats) => {
    // Generate realistic peer data based on user stats
    const peerCount = 1000; // Simulated peer group size
    
    return {
      totalUsers: peerCount,
      averageStats: {
        sessions: Math.round(userStats.totalSessions * 0.85),
        averageScore: Math.round(userStats.averageScore * 0.92),
        bestScore: Math.round(userStats.bestScore * 0.88),
        consistency: Math.round(userStats.consistency * 0.90),
        exerciseVariety: Math.round(userStats.exerciseVariety * 0.80)
      },
      userPercentile: {
        sessions: Math.min(95, Math.max(5, 50 + (userStats.totalSessions - 20) * 2)),
        averageScore: Math.min(95, Math.max(5, 50 + (userStats.averageScore - 75) * 2)),
        bestScore: Math.min(95, Math.max(5, 50 + (userStats.bestScore - 85) * 1.5)),
        consistency: Math.min(95, Math.max(5, 50 + (userStats.consistency - 80) * 2.5)),
        exerciseVariety: Math.min(95, Math.max(5, 50 + (userStats.exerciseVariety - 3) * 8))
      }
    };
  };

  /**
   * Get exercise display name
   */
  const getExerciseName = (exerciseType) => {
    const names = {
      'squat': 'Squat',
      'deadlift': 'Deadlift', 
      'push_up': 'Push-up',
      'bench_press': 'Bench Press',
      'baseball_pitch': 'Baseball Pitch'
    };
    return names[exerciseType] || exerciseType;
  };

  /**
   * Generate insights for time period comparisons
   */
  const generateTimePeriodInsights = (comparisons) => {
    const insights = [];
    
    if (comparisons.length >= 2) {
      const recent = comparisons[0];
      const older = comparisons[1];
      
      if (recent.averageScore > older.averageScore) {
        insights.push({
          type: 'improvement',
          icon: '📈',
          message: `Your form has improved by ${recent.averageScore - older.averageScore} points from ${older.period} to ${recent.period}!`
        });
      }
      
      if (recent.consistency > older.consistency + 5) {
        insights.push({
          type: 'consistency',
          icon: '🎯',
          message: `Great consistency improvement! You're ${Math.round(recent.consistency - older.consistency)} points more consistent.`
        });
      }
      
      if (recent.trend === 'improving') {
        insights.push({
          type: 'trend',
          icon: '🚀',
          message: `You're on a positive trend with consistent improvements in your recent sessions.`
        });
      }
    }
    
    return insights;
  };

  /**
   * Generate insights for exercise comparisons
   */
  const generateExerciseInsights = (comparisons) => {
    const insights = [];
    
    if (comparisons.length >= 2) {
      const sortedByScore = [...comparisons].sort((a, b) => b.averageScore - a.averageScore);
      const strongest = sortedByScore[0];
      const needsWork = sortedByScore[sortedByScore.length - 1];
      
      if (strongest.averageScore - needsWork.averageScore > 10) {
        insights.push({
          type: 'strength',
          icon: '💪',
          message: `${strongest.exerciseName} is your strongest exercise with ${strongest.averageScore}% average form score.`
        });
        
        insights.push({
          type: 'opportunity',
          icon: '🎯',
          message: `Focus on ${needsWork.exerciseName} - there's room for ${strongest.averageScore - needsWork.averageScore} points of improvement.`
        });
      }
    }
    
    return insights;
  };

  /**
   * Generate insights for before/after comparison
   */
  const generateBeforeAfterInsights = (beforeStats, afterStats, transformationScore) => {
    const insights = [];
    
    if (transformationScore > 10) {
      insights.push({
        type: 'transformation',
        icon: '🌟',
        message: `Amazing transformation! Your form has improved significantly with a ${Math.round(transformationScore)} point overall improvement.`
      });
    } else if (transformationScore > 5) {
      insights.push({
        type: 'progress',
        icon: '📈',
        message: `Solid progress! You've made meaningful improvements in your form analysis scores.`
      });
    }
    
    if (afterStats.consistency > beforeStats.consistency + 10) {
      insights.push({
        type: 'consistency',
        icon: '🎯',
        message: `Your consistency has improved dramatically! You're now ${Math.round(afterStats.consistency - beforeStats.consistency)} points more consistent.`
      });
    }
    
    return insights;
  };

  /**
   * Generate insights for peer comparison
   */
  const generatePeerInsights = (userStats, peerData) => {
    const insights = [];
    
    Object.entries(peerData.userPercentile).forEach(([metric, percentile]) => {
      if (percentile > 80) {
        insights.push({
          type: 'excellence',
          icon: '🏆',
          message: `You're in the top ${100 - Math.round(percentile)}% for ${metric.replace(/([A-Z])/g, ' $1').toLowerCase()}!`
        });
      } else if (percentile < 30) {
        insights.push({
          type: 'opportunity',
          icon: '📊',
          message: `Room for growth in ${metric.replace(/([A-Z])/g, ' $1').toLowerCase()} - you're currently at the ${Math.round(percentile)}th percentile.`
        });
      }
    });
    
    return insights;
  };

  /**
   * Handle comparison sharing
   */
  const handleShareComparison = async () => {
    try {
      if (!comparisonResults) return;
      
      let message = '';
      
      switch (comparisonResults.type) {
        case 'time_periods':
          const periods = comparisonResults.comparisons.map(c => 
            `${c.period}: ${c.averageScore}% avg`
          ).join(', ');
          message = `📊 My fitness form progress comparison:\n\n${periods}\n\n`;
          break;
          
        case 'exercises':
          const exercises = comparisonResults.comparisons.map(c => 
            `${c.exerciseName}: ${c.averageScore}%`
          ).join(', ');
          message = `🏋️ Exercise form comparison:\n\n${exercises}\n\n`;
          break;
          
        case 'before_after':
          const improvement = comparisonResults.transformation.scoreImprovement;
          message = `✨ My fitness transformation:\n\n📈 ${improvement > 0 ? '+' : ''}${improvement} points improvement!\n\n`;
          break;
          
        case 'peer_comparison':
          const topMetrics = Object.entries(comparisonResults.peerData.userPercentile)
            .filter(([_, percentile]) => percentile > 70)
            .map(([metric, percentile]) => `${metric}: ${Math.round(percentile)}th percentile`)
            .slice(0, 2)
            .join(', ');
          message = `🏆 Community comparison:\n\n${topMetrics}\n\n`;
          break;
      }
      
      message += '#FitnessProgress #FormAnalysis #FitnessJourney';
      
      const result = await Share.share({
        message,
        title: 'My Progress Comparison',
      });

      if (onComparisonShare) {
        onComparisonShare(comparisonResults, result);
      }
      
    } catch (error) {
      console.error('❌ Error sharing comparison:', error);
    }
  };

  /**
   * Handle comparison type change
   */
  const handleComparisonTypeChange = (type) => {
    setSelectedComparison(type);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  };

  /**
   * Render comparison type selector
   */
  const renderComparisonSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.selectorScrollContent}
      style={styles.comparisonSelector}
    >
      {COMPARISON_TYPES.map((type) => {
        const isSelected = selectedComparison === type.key;
        
        return (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.selectorButton,
              {
                backgroundColor: isSelected ? theme?.primary || '#FF6B35' : 'transparent',
                borderColor: isSelected ? 'transparent' : theme?.border?.light || '#E5E5E5',
              }
            ]}
            onPress={() => handleComparisonTypeChange(type.key)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${type.label} comparison`}
            accessibilityHint={type.description}
            accessibilityState={{ selected: isSelected }}
          >
            <Ionicons
              name={type.icon}
              size={20}
              color={isSelected ? '#FFFFFF' : theme?.text?.secondary || '#495057'}
              style={styles.selectorIcon}
            />
            <Text
              style={[
                styles.selectorText,
                { color: isSelected ? '#FFFFFF' : theme?.text?.secondary || '#495057' }
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  /**
   * Render comparison results based on type
   */
  const renderComparisonResults = () => {
    if (isLoading) {
      return (
        <GlassContainer variant="default" style={styles.loadingContainer}>
          <Ionicons
            name="analytics"
            size={32}
            color={theme?.text?.tertiary || '#6C757D'}
          />
          <Text style={[styles.loadingText, { color: theme?.text?.secondary }]}>
            Analyzing your progress...
          </Text>
        </GlassContainer>
      );
    }

    if (!comparisonResults) {
      return (
        <GlassContainer variant="default" style={styles.emptyContainer}>
          <Ionicons
            name="bar-chart"
            size={32}
            color={theme?.text?.tertiary || '#6C757D'}
          />
          <Text style={[styles.emptyText, { color: theme?.text?.secondary }]}>
            Select a comparison type to analyze your progress
          </Text>
        </GlassContainer>
      );
    }

    switch (comparisonResults.type) {
      case 'time_periods':
        return renderTimePeriodComparison();
      case 'exercises':
        return renderExerciseComparison();
      case 'before_after':
        return renderBeforeAfterComparison();
      case 'peer_comparison':
        return renderPeerComparison();
      default:
        return null;
    }
  };

  /**
   * Render time period comparison
   */
  const renderTimePeriodComparison = () => {
    const { comparisons, insights } = comparisonResults;
    
    return (
      <View style={styles.comparisonResults}>
        {/* Period Comparison Cards */}
        <View style={styles.comparisonGrid}>
          {comparisons.map((comparison, index) => (
            <GlassContainer
              key={comparison.periodKey}
              variant="default"
              style={styles.comparisonCard}
            >
              <Text style={[styles.comparisonTitle, { color: theme?.text?.primary }]}>
                {comparison.period}
              </Text>
              
              <View style={styles.comparisonStats}>
                <CircularProgressChart
                  score={comparison.averageScore}
                  size={60}
                  strokeWidth={6}
                  showPercentage={true}
                  progressColor={index === 0 ? theme?.primary || '#FF6B35' : '#10B981'}
                  backgroundColor={theme?.border?.light || '#E5E5E5'}
                  textColor={theme?.text?.primary || '#000000'}
                  fontSize={14}
                />
                
                <View style={styles.statsColumn}>
                  <Text style={[styles.statValue, { color: theme?.text?.primary }]}>
                    {comparison.sessions}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme?.text?.secondary }]}>
                    Sessions
                  </Text>
                </View>
                
                <View style={styles.statsColumn}>
                  <View style={styles.trendContainer}>
                    <Text style={[styles.statValue, { color: theme?.text?.primary }]}>
                      {comparison.improvement > 0 ? '+' : ''}{comparison.improvement}
                    </Text>
                    <Ionicons
                      name={comparison.trend === 'improving' ? 'trending-up' : 
                            comparison.trend === 'declining' ? 'trending-down' : 'remove'}
                      size={16}
                      color={comparison.trend === 'improving' ? '#10B981' : 
                             comparison.trend === 'declining' ? '#EF4444' : theme?.text?.tertiary}
                    />
                  </View>
                  <Text style={[styles.statLabel, { color: theme?.text?.secondary }]}>
                    Change
                  </Text>
                </View>
              </View>
            </GlassContainer>
          ))}
        </View>

        {/* Insights */}
        {renderInsights(insights)}
      </View>
    );
  };

  /**
   * Render exercise comparison
   */
  const renderExerciseComparison = () => {
    const { comparisons, insights } = comparisonResults;
    
    return (
      <View style={styles.comparisonResults}>
        {comparisons.map((comparison, index) => (
          <GlassContainer
            key={comparison.exerciseType}
            variant="default"
            style={styles.exerciseComparisonCard}
          >
            <View style={styles.exerciseHeader}>
              <Text style={[styles.exerciseTitle, { color: theme?.text?.primary }]}>
                {comparison.exerciseName}
              </Text>
              <Text style={[styles.exerciseSubtitle, { color: theme?.text?.secondary }]}>
                {comparison.sessions} sessions
              </Text>
            </View>
            
            <View style={styles.exerciseStats}>
              <View style={styles.exerciseMetric}>
                <Text style={[styles.metricValue, { color: theme?.text?.primary }]}>
                  {comparison.averageScore}%
                </Text>
                <Text style={[styles.metricLabel, { color: theme?.text?.secondary }]}>
                  Average
                </Text>
              </View>
              
              <View style={styles.exerciseMetric}>
                <Text style={[styles.metricValue, { color: theme?.text?.primary }]}>
                  {comparison.bestScore}%
                </Text>
                <Text style={[styles.metricLabel, { color: theme?.text?.secondary }]}>
                  Best
                </Text>
              </View>
              
              <View style={styles.exerciseMetric}>
                <Text style={[styles.metricValue, { color: theme?.text?.primary }]}>
                  {comparison.consistency}%
                </Text>
                <Text style={[styles.metricLabel, { color: theme?.text?.secondary }]}>
                  Consistency
                </Text>
              </View>
              
              <View style={styles.exerciseMetric}>
                <View style={styles.improvementContainer}>
                  <Text style={[
                    styles.metricValue,
                    {
                      color: comparison.improvement > 0 ? '#10B981' : 
                             comparison.improvement < 0 ? '#EF4444' : theme?.text?.primary
                    }
                  ]}>
                    {comparison.improvement > 0 ? '+' : ''}{comparison.improvement}
                  </Text>
                  <Ionicons
                    name={comparison.improvement > 0 ? 'trending-up' : 
                          comparison.improvement < 0 ? 'trending-down' : 'remove'}
                    size={16}
                    color={comparison.improvement > 0 ? '#10B981' : 
                           comparison.improvement < 0 ? '#EF4444' : theme?.text?.tertiary}
                  />
                </View>
                <Text style={[styles.metricLabel, { color: theme?.text?.secondary }]}>
                  Trend
                </Text>
              </View>
            </View>
          </GlassContainer>
        ))}

        {renderInsights(insights)}
      </View>
    );
  };

  /**
   * Render before/after comparison
   */
  const renderBeforeAfterComparison = () => {
    const { comparisons, transformation, insights } = comparisonResults;
    
    if (comparisonResults.error) {
      return (
        <GlassContainer variant="default" style={styles.errorContainer}>
          <Ionicons
            name="information-circle"
            size={32}
            color={theme?.text?.tertiary || '#6C757D'}
          />
          <Text style={[styles.errorText, { color: theme?.text?.secondary }]}>
            {comparisonResults.error}
          </Text>
        </GlassContainer>
      );
    }
    
    const [beforeStats, afterStats] = comparisons;
    
    return (
      <View style={styles.comparisonResults}>
        {/* Before/After Cards */}
        <View style={styles.beforeAfterContainer}>
          <GlassContainer variant="default" style={styles.beforeAfterCard}>
            <Text style={[styles.beforeAfterLabel, { color: theme?.text?.secondary }]}>
              {beforeStats.label}
            </Text>
            <CircularProgressChart
              score={beforeStats.averageScore}
              size={80}
              strokeWidth={8}
              showPercentage={true}
              progressColor="#6B7280"
              backgroundColor={theme?.border?.light || '#E5E5E5'}
              textColor={theme?.text?.primary || '#000000'}
              fontSize={16}
            />
            <Text style={[styles.beforeAfterSessions, { color: theme?.text?.tertiary }]}>
              {beforeStats.sessions} sessions
            </Text>
          </GlassContainer>

          <View style={styles.transformationArrow}>
            <Ionicons
              name="arrow-forward"
              size={24}
              color={theme?.primary || '#FF6B35'}
            />
            <Text style={[styles.transformationScore, { color: theme?.primary || '#FF6B35' }]}>
              +{transformation.totalImprovement}%
            </Text>
          </View>

          <GlassContainer variant="default" style={styles.beforeAfterCard}>
            <Text style={[styles.beforeAfterLabel, { color: theme?.text?.secondary }]}>
              {afterStats.label}
            </Text>
            <CircularProgressChart
              score={afterStats.averageScore}
              size={80}
              strokeWidth={8}
              showPercentage={true}
              progressColor="#10B981"
              backgroundColor={theme?.border?.light || '#E5E5E5'}
              textColor={theme?.text?.primary || '#000000'}
              fontSize={16}
            />
            <Text style={[styles.beforeAfterSessions, { color: theme?.text?.tertiary }]}>
              {afterStats.sessions} sessions
            </Text>
          </GlassContainer>
        </View>

        {/* Transformation Details */}
        <GlassContainer variant="default" style={styles.transformationDetails}>
          <Text style={[styles.transformationTitle, { color: theme?.text?.primary }]}>
            Transformation Summary
          </Text>
          
          <View style={styles.transformationStats}>
            <View style={styles.transformationStat}>
              <Text style={[styles.transformationValue, { color: '#10B981' }]}>
                +{transformation.scoreImprovement}
              </Text>
              <Text style={[styles.transformationLabel, { color: theme?.text?.secondary }]}>
                Score Improvement
              </Text>
            </View>
            
            <View style={styles.transformationStat}>
              <Text style={[styles.transformationValue, { color: '#3B82F6' }]}>
                +{transformation.consistencyImprovement}
              </Text>
              <Text style={[styles.transformationLabel, { color: theme?.text?.secondary }]}>
                Consistency Gain
              </Text>
            </View>
            
            <View style={styles.transformationStat}>
              <Text style={[styles.transformationValue, { color: theme?.primary || '#FF6B35' }]}>
                {Math.round(transformation.transformationScore)}
              </Text>
              <Text style={[styles.transformationLabel, { color: theme?.text?.secondary }]}>
                Transform Score
              </Text>
            </View>
          </View>
        </GlassContainer>

        {renderInsights(insights)}
      </View>
    );
  };

  /**
   * Render peer comparison
   */
  const renderPeerComparison = () => {
    const { userStats, peerData, insights } = comparisonResults;
    
    return (
      <View style={styles.comparisonResults}>
        <GlassContainer variant="default" style={styles.peerComparisonContainer}>
          <Text style={[styles.peerTitle, { color: theme?.text?.primary }]}>
            Community Comparison
          </Text>
          <Text style={[styles.peerSubtitle, { color: theme?.text?.secondary }]}>
            Anonymous comparison with {peerData.totalUsers} users
          </Text>
          
          {Object.entries(peerData.userPercentile).map(([metric, percentile]) => (
            <View key={metric} style={styles.peerMetric}>
              <Text style={[styles.peerMetricLabel, { color: theme?.text?.secondary }]}>
                {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              
              <View style={styles.peerMetricBar}>
                <View style={[styles.peerProgressBar, { backgroundColor: theme?.border?.light || '#E5E5E5' }]}>
                  <View
                    style={[
                      styles.peerProgressFill,
                      {
                        width: `${percentile}%`,
                        backgroundColor: percentile > 70 ? '#10B981' : 
                                       percentile > 40 ? theme?.primary || '#FF6B35' : '#EF4444'
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.peerPercentile, { color: theme?.text?.primary }]}>
                  {Math.round(percentile)}th
                </Text>
              </View>
              
              <Text style={[styles.peerComparison, { color: theme?.text?.tertiary }]}>
                You: {userStats[metric]} • Avg: {peerData.averageStats[metric.replace(/([A-Z])/g, s => s.toLowerCase()).replace(' ', '')]}
              </Text>
            </View>
          ))}
        </GlassContainer>

        {renderInsights(insights)}
      </View>
    );
  };

  /**
   * Render insights section
   */
  const renderInsights = (insights) => {
    if (!insights || !insights.length) return null;
    
    return (
      <GlassContainer variant="default" style={styles.insightsContainer}>
        <Text style={[styles.insightsTitle, { color: theme?.text?.primary }]}>
          Key Insights
        </Text>
        
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Text style={styles.insightIcon}>{insight.icon}</Text>
            <Text style={[styles.insightMessage, { color: theme?.text?.secondary }]}>
              {insight.message}
            </Text>
          </View>
        ))}
      </GlassContainer>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnimation,
          transform: [{ translateY: slideAnimation }],
        }
      ]}
    >
      {/* Header */}
      <GlassContainer variant="default" style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme?.text?.primary }]}>
            Progress Comparison
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme?.text?.secondary }]}>
            Analyze your improvement journey
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme?.primary || '#FF6B35' }]}
          onPress={handleShareComparison}
          accessible={true}
          accessibilityLabel="Share comparison"
        >
          <Ionicons name="share" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </GlassContainer>

      {/* Comparison Type Selector */}
      {renderComparisonSelector()}

      {/* Comparison Results */}
      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {renderComparisonResults()}
      </ScrollView>
    </Animated.View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonSelector: {
    marginBottom: theme.spacing[4],
  },
  selectorScrollContent: {
    paddingHorizontal: theme.spacing[4],
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing[3],
    borderWidth: 1,
  },
  selectorIcon: {
    marginRight: theme.spacing[2],
  },
  selectorText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: theme.spacing[8],
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
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[8],
    marginHorizontal: theme.spacing[4],
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
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
  },
  comparisonResults: {
    paddingHorizontal: theme.spacing[4],
  },
  comparisonGrid: {
    marginBottom: theme.spacing[6],
  },
  comparisonCard: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  comparisonTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  comparisonStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsColumn: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  exerciseComparisonCard: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  exerciseHeader: {
    marginBottom: theme.spacing[3],
  },
  exerciseTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  exerciseSubtitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  improvementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  beforeAfterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
    paddingHorizontal: theme.spacing[2],
  },
  beforeAfterCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  beforeAfterLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing[3],
  },
  beforeAfterSessions: {
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing[2],
  },
  transformationArrow: {
    alignItems: 'center',
    marginHorizontal: theme.spacing[3],
  },
  transformationScore: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing[1],
  },
  transformationDetails: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[6],
    borderRadius: theme.borderRadius.lg,
  },
  transformationTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[4],
    textAlign: 'center',
  },
  transformationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transformationStat: {
    alignItems: 'center',
    flex: 1,
  },
  transformationValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  transformationLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  peerComparisonContainer: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[6],
    borderRadius: theme.borderRadius.lg,
  },
  peerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
  },
  peerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  peerMetric: {
    marginBottom: theme.spacing[4],
  },
  peerMetricLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing[2],
  },
  peerMetricBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  peerProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing[3],
  },
  peerProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  peerPercentile: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    minWidth: 40,
    textAlign: 'right',
  },
  peerComparison: {
    fontSize: theme.typography.fontSize.xs,
  },
  insightsContainer: {
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  insightsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[4],
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  insightIcon: {
    fontSize: 20,
    marginRight: theme.spacing[3],
    marginTop: 2,
  },
  insightMessage: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
});

ProgressComparison.displayName = 'ProgressComparison';

export default ProgressComparison;