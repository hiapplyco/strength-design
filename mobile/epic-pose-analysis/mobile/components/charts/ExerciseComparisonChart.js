/**
 * Exercise Comparison Chart Component
 * Interactive bar chart for comparing progress across different exercises
 * 
 * Features:
 * - Horizontal bar chart with exercise-specific metrics
 * - Interactive bars with touch feedback and detailed breakdowns
 * - Progress indicators showing improvement trends
 * - Session count and consistency metrics
 * - Sorting capabilities (by score, sessions, improvement)
 * - Touch-friendly mobile interface with gesture support
 * - Accessibility-compliant with proper ARIA labels
 * - Glassmorphism design integration
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Rect,
  Text as SvgText,
  LinearGradient,
  Stop,
  Defs,
  G,
} from 'react-native-svg';
import { GlassContainer } from '../GlassmorphismComponents';
import { createThemedStyles } from '../../utils/designTokens';
import CircularProgressChart from './CircularProgressChart';

const { width: screenWidth } = Dimensions.get('window');

// Exercise metadata
const EXERCISE_META = {
  squat: { 
    name: 'Squat', 
    icon: 'barbell-outline', 
    color: '#3B82F6',
    difficulty: 'Intermediate'
  },
  deadlift: { 
    name: 'Deadlift', 
    icon: 'barbell-outline', 
    color: '#EF4444',
    difficulty: 'Advanced'
  },
  push_up: { 
    name: 'Push-up', 
    icon: 'hand-left-outline', 
    color: '#10B981',
    difficulty: 'Beginner'
  },
  baseball_pitch: { 
    name: 'Baseball Pitch', 
    icon: 'baseball-outline', 
    color: '#8B5CF6',
    difficulty: 'Advanced'
  },
  bench_press: { 
    name: 'Bench Press', 
    icon: 'barbell-outline', 
    color: '#F59E0B',
    difficulty: 'Intermediate'
  },
  overhead_press: { 
    name: 'Overhead Press', 
    icon: 'barbell-outline', 
    color: '#EC4899',
    difficulty: 'Intermediate'
  },
};

// Sort options
const SORT_OPTIONS = [
  { key: 'averageScore', label: 'Avg Score', icon: 'trending-up' },
  { key: 'totalSessions', label: 'Sessions', icon: 'calendar' },
  { key: 'improvement', label: 'Progress', icon: 'arrow-up' },
  { key: 'consistency', label: 'Consistency', icon: 'pulse' },
  { key: 'recentActivity', label: 'Recent', icon: 'time' },
];

// Performance thresholds
const PERFORMANCE_LEVELS = {
  excellent: { min: 90, label: 'Excellent', color: '#10B981' },
  good: { min: 75, label: 'Good', color: '#3B82F6' },
  fair: { min: 60, label: 'Fair', color: '#F59E0B' },
  poor: { min: 0, label: 'Needs Work', color: '#EF4444' },
};

const ExerciseComparisonChart = ({
  data,
  timePeriod = '30d',
  sortBy = 'averageScore',
  showMetrics = true,
  interactive = true,
  maxItems = 8,
  theme,
  onExercisePress,
  onSortChange,
  style,
  accessibilityLabel,
}) => {
  const styles = createThemedStyles(getStyles, theme?.isDark ? 'dark' : 'light');
  
  // State management
  const [currentSort, setCurrentSort] = useState(sortBy);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Animation values
  const sortMenuAnimation = useRef(new Animated.Value(0)).current;
  const barAnimations = useRef({}).current;

  // Process and sort exercise data
  const processedData = useMemo(() => {
    if (!data || typeof data !== 'object') {
      return [];
    }

    const exercises = Object.entries(data)
      .map(([exerciseType, exerciseData]) => {
        const meta = EXERCISE_META[exerciseType] || {
          name: exerciseType,
          icon: 'fitness-outline',
          color: '#6B7280',
          difficulty: 'Unknown'
        };

        const avgScore = exerciseData.averageScore || 0;
        const bestScore = exerciseData.bestScore || 0;
        const totalSessions = exerciseData.totalSessions || 0;
        const improvement = exerciseData.improvement || 0;
        const consistency = exerciseData.consistency || 0;
        const recentSessions = exerciseData.recentSessions || 0;
        
        // Calculate recent activity score (more recent = higher score)
        const daysSinceLastActivity = exerciseData.lastAnalysis 
          ? Math.floor((Date.now() - new Date(exerciseData.lastAnalysis)) / (1000 * 60 * 60 * 24))
          : 999;
        const recentActivity = Math.max(0, 100 - daysSinceLastActivity);

        // Determine performance level
        const performanceLevel = Object.entries(PERFORMANCE_LEVELS)
          .reverse()
          .find(([_, level]) => avgScore >= level.min)?.[0] || 'poor';

        return {
          exerciseType,
          ...meta,
          ...exerciseData,
          avgScore,
          bestScore,
          totalSessions,
          improvement,
          consistency,
          recentSessions,
          recentActivity,
          performanceLevel,
          daysSinceLastActivity,
        };
      })
      .filter(exercise => exercise.totalSessions > 0); // Only show exercises with data

    // Sort exercises
    const sorted = [...exercises].sort((a, b) => {
      switch (currentSort) {
        case 'averageScore':
          return b.avgScore - a.avgScore;
        case 'totalSessions':
          return b.totalSessions - a.totalSessions;
        case 'improvement':
          return b.improvement - a.improvement;
        case 'consistency':
          return b.consistency - a.consistency;
        case 'recentActivity':
          return b.recentActivity - a.recentActivity;
        default:
          return b.avgScore - a.avgScore;
      }
    });

    return sorted.slice(0, maxItems);
  }, [data, currentSort, maxItems]);

  /**
   * Get performance level info
   */
  const getPerformanceLevel = (score) => {
    return Object.values(PERFORMANCE_LEVELS)
      .reverse()
      .find(level => score >= level.min) || PERFORMANCE_LEVELS.poor;
  };

  /**
   * Handle sort selection
   */
  const handleSortSelect = (sortOption) => {
    if (sortOption !== currentSort) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentSort(sortOption);
      
      if (onSortChange) {
        onSortChange(sortOption);
      }
    }
    
    setShowSortMenu(false);
    Animated.timing(sortMenuAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Toggle sort menu
   */
  const toggleSortMenu = () => {
    const isOpening = !showSortMenu;
    setShowSortMenu(isOpening);
    
    Animated.timing(sortMenuAnimation, {
      toValue: isOpening ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Handle exercise press
   */
  const handleExercisePress = (exercise) => {
    if (!interactive) return;

    if (expandedExercise === exercise.exerciseType) {
      setExpandedExercise(null);
    } else {
      setExpandedExercise(exercise.exerciseType);
    }

    if (onExercisePress) {
      onExercisePress(exercise);
    }
  };

  /**
   * Initialize bar animation if needed
   */
  const getBarAnimation = (exerciseType) => {
    if (!barAnimations[exerciseType]) {
      barAnimations[exerciseType] = new Animated.Value(0);
      
      // Start animation
      Animated.timing(barAnimations[exerciseType], {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
    
    return barAnimations[exerciseType];
  };

  /**
   * Format last activity
   */
  const formatLastActivity = (lastAnalysis) => {
    if (!lastAnalysis) return 'Never';
    
    const days = Math.floor((Date.now() - new Date(lastAnalysis)) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  /**
   * Render sort selector
   */
  const renderSortSelector = () => {
    const currentSortOption = SORT_OPTIONS.find(opt => opt.key === currentSort);
    
    return (
      <View style={styles.sortSelectorContainer}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={toggleSortMenu}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${currentSortOption?.label}. Double tap to change.`}
          accessibilityHint="Shows sort options"
        >
          <Ionicons
            name={currentSortOption?.icon || 'funnel'}
            size={16}
            color={theme?.text?.secondary || '#495057'}
          />
          <Text style={[styles.sortText, { color: theme?.text?.secondary }]}>
            Sort by {currentSortOption?.label}
          </Text>
          <Ionicons
            name={showSortMenu ? "chevron-up" : "chevron-down"}
            size={16}
            color={theme?.text?.tertiary || '#6C757D'}
          />
        </TouchableOpacity>

        {showSortMenu && (
          <Animated.View
            style={[
              styles.sortMenu,
              {
                opacity: sortMenuAnimation,
                transform: [{
                  translateY: sortMenuAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                }],
              }
            ]}
          >
            <GlassContainer variant="elevated" style={styles.sortMenuContainer}>
              {SORT_OPTIONS.map((option) => {
                const isSelected = option.key === currentSort;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      isSelected && styles.sortOptionSelected,
                    ]}
                    onPress={() => handleSortSelect(option.key)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort by ${option.label}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Ionicons
                      name={option.icon}
                      size={16}
                      color={isSelected ? theme?.primary || '#FF6B35' : theme?.text?.tertiary || '#6C757D'}
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        {
                          color: isSelected 
                            ? theme?.primary || '#FF6B35' 
                            : theme?.text?.primary || '#000'
                        }
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={theme?.primary || '#FF6B35'}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </GlassContainer>
          </Animated.View>
        )}
      </View>
    );
  };

  /**
   * Render exercise bar
   */
  const renderExerciseBar = (exercise, index) => {
    const isExpanded = expandedExercise === exercise.exerciseType;
    const barAnimation = getBarAnimation(exercise.exerciseType);
    const performanceLevel = getPerformanceLevel(exercise.avgScore);
    const barWidth = 200; // Fixed width for consistent layout
    
    return (
      <TouchableOpacity
        key={exercise.exerciseType}
        style={styles.exerciseItem}
        onPress={() => handleExercisePress(exercise)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${exercise.name}: ${exercise.avgScore}% average score, ${exercise.totalSessions} sessions`}
        accessibilityHint="Double tap to see details"
        accessibilityState={{ expanded: isExpanded }}
      >
        <GlassContainer 
          variant="default" 
          style={[
            styles.exerciseCard,
            isExpanded && styles.exerciseCardExpanded,
          ]}
        >
          {/* Main Exercise Info */}
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseInfo}>
              <View style={styles.exerciseIconContainer}>
                <Ionicons
                  name={exercise.icon}
                  size={24}
                  color={exercise.color}
                />
              </View>
              <View style={styles.exerciseDetails}>
                <Text style={[styles.exerciseName, { color: theme?.text?.primary }]}>
                  {exercise.name}
                </Text>
                <View style={styles.exerciseMeta}>
                  <Text style={[styles.exerciseDifficulty, { color: theme?.text?.tertiary }]}>
                    {exercise.difficulty}
                  </Text>
                  <Text style={[styles.exerciseSession, { color: theme?.text?.tertiary }]}>
                    • {exercise.totalSessions} sessions
                  </Text>
                </View>
              </View>
            </View>

            {/* Score Display */}
            <View style={styles.scoreContainer}>
              <CircularProgressChart
                score={exercise.avgScore}
                size={40}
                strokeWidth={3}
                showPercentage={false}
                progressColor={exercise.color}
                backgroundColor={theme?.border?.light || '#E5E5E5'}
                animated={false}
              />
              <Text style={[styles.scoreText, { color: theme?.text?.primary }]}>
                {Math.round(exercise.avgScore)}%
              </Text>
            </View>

            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme?.text?.tertiary || '#6C757D'}
              style={styles.expandIcon}
            />
          </View>

          {/* Performance Bar */}
          <View style={styles.performanceBarContainer}>
            <View style={[styles.performanceBarBackground, { backgroundColor: theme?.border?.light || '#E5E5E5' }]}>
              <Animated.View
                style={[
                  styles.performanceBar,
                  {
                    backgroundColor: performanceLevel.color,
                    width: barAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (exercise.avgScore / 100) * barWidth],
                    }),
                  }
                ]}
              />
            </View>
            <View style={styles.performanceLabel}>
              <Text style={[styles.performanceText, { color: performanceLevel.color }]}>
                {performanceLevel.label}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme?.text?.primary }]}>
                {exercise.bestScore}%
              </Text>
              <Text style={[styles.statLabel, { color: theme?.text?.tertiary }]}>
                Best
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue, 
                { color: exercise.improvement >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {exercise.improvement >= 0 ? '+' : ''}{Math.round(exercise.improvement)}
              </Text>
              <Text style={[styles.statLabel, { color: theme?.text?.tertiary }]}>
                Change
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme?.text?.primary }]}>
                {Math.round(exercise.consistency)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme?.text?.tertiary }]}>
                Consistent
              </Text>
            </View>
          </View>

          {/* Expanded Details */}
          {isExpanded && (
            <View style={styles.expandedDetails}>
              <View style={styles.detailsDivider} />
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: theme?.text?.secondary }]}>
                    Recent Sessions
                  </Text>
                  <Text style={[styles.detailValue, { color: theme?.text?.primary }]}>
                    {exercise.recentSessions}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: theme?.text?.secondary }]}>
                    Last Activity
                  </Text>
                  <Text style={[styles.detailValue, { color: theme?.text?.primary }]}>
                    {formatLastActivity(exercise.lastAnalysis)}
                  </Text>
                </View>
              </View>

              {/* Performance Insights */}
              <View style={styles.insightsContainer}>
                <Text style={[styles.insightsTitle, { color: theme?.text?.primary }]}>
                  Performance Insights
                </Text>
                
                {exercise.improvement > 5 && (
                  <View style={styles.insightItem}>
                    <Ionicons name="trending-up" size={14} color="#10B981" />
                    <Text style={[styles.insightText, { color: theme?.text?.secondary }]}>
                      Strong improvement trend (+{Math.round(exercise.improvement)} points)
                    </Text>
                  </View>
                )}
                
                {exercise.consistency > 80 && (
                  <View style={styles.insightItem}>
                    <Ionicons name="pulse" size={14} color="#3B82F6" />
                    <Text style={[styles.insightText, { color: theme?.text?.secondary }]}>
                      Highly consistent performance ({Math.round(exercise.consistency)}%)
                    </Text>
                  </View>
                )}
                
                {exercise.daysSinceLastActivity > 7 && (
                  <View style={styles.insightItem}>
                    <Ionicons name="time" size={14} color="#F59E0B" />
                    <Text style={[styles.insightText, { color: theme?.text?.secondary }]}>
                      Consider practicing more regularly
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </GlassContainer>
      </TouchableOpacity>
    );
  };

  // Show empty state if no data
  if (!processedData.length) {
    return (
      <View style={[styles.container, style]}>
        <GlassContainer variant="default" style={styles.emptyContainer}>
          <Ionicons
            name="bar-chart-outline"
            size={32}
            color={theme?.text?.tertiary || '#6C757D'}
          />
          <Text style={[styles.emptyTitle, { color: theme?.text?.primary }]}>
            No Exercise Data
          </Text>
          <Text style={[styles.emptyDescription, { color: theme?.text?.secondary }]}>
            Complete pose analyses for different exercises to compare your progress
          </Text>
        </GlassContainer>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || `Exercise comparison chart with ${processedData.length} exercises`}
      accessibilityRole="region"
    >
      {/* Header with Sort Control */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme?.text?.primary }]}>
            Exercise Comparison
          </Text>
          <Text style={[styles.subtitle, { color: theme?.text?.secondary }]}>
            {processedData.length} exercises • {timePeriod} period
          </Text>
        </View>
        {renderSortSelector()}
      </View>

      {/* Exercise List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {processedData.map((exercise, index) => renderExerciseBar(exercise, index))}
      </ScrollView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[8],
    minHeight: 200,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[6],
    paddingHorizontal: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  sortSelectorContainer: {
    position: 'relative',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.background?.elevated || 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: theme.border?.light || 'rgba(0,0,0,0.1)',
  },
  sortText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[2],
    marginRight: theme.spacing[2],
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    zIndex: 1000,
    marginTop: theme.spacing[1],
  },
  sortMenuContainer: {
    minWidth: 140,
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.sm,
  },
  sortOptionSelected: {
    backgroundColor: theme.primary ? `${theme.primary}20` : 'rgba(255,107,53,0.2)',
  },
  sortOptionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[2],
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  exerciseItem: {
    marginBottom: theme.spacing[4],
  },
  exerciseCard: {
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  exerciseCardExpanded: {
    borderColor: theme?.primary || '#FF6B35',
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background?.elevated || 'rgba(255,255,255,0.1)',
    marginRight: theme.spacing[3],
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[1],
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseDifficulty: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  exerciseSession: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  scoreContainer: {
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  scoreText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing[1],
  },
  expandIcon: {
    opacity: 0.7,
  },
  performanceBarContainer: {
    marginBottom: theme.spacing[3],
  },
  performanceBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing[1],
  },
  performanceBar: {
    height: '100%',
    borderRadius: 3,
  },
  performanceLabel: {
    alignSelf: 'flex-start',
  },
  performanceText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[0.5],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.border?.light || 'rgba(0,0,0,0.1)',
  },
  expandedDetails: {
    marginTop: theme.spacing[4],
  },
  detailsDivider: {
    height: 1,
    backgroundColor: theme.border?.light || 'rgba(0,0,0,0.1)',
    marginBottom: theme.spacing[4],
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing[4],
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing[1],
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  insightsContainer: {
    backgroundColor: theme.background?.elevated || 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
  },
  insightsTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[2],
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  insightText: {
    fontSize: theme.typography.fontSize.xs,
    marginLeft: theme.spacing[2],
    flex: 1,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.xs,
  },
});

ExerciseComparisonChart.displayName = 'ExerciseComparisonChart';

export default ExerciseComparisonChart;