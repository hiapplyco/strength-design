/**
 * Score Breakdown Chart Component
 * Interactive chart showing phase-specific scoring with detailed breakdowns
 * 
 * Features:
 * - Phase-specific scoring with visual progress bars
 * - Interactive phases with tap-to-expand functionality
 * - Error indicators for phases with form issues
 * - Animated reveals with staggered timeline effect
 * - Exercise-specific phase labeling and coloring
 * - Accessibility compliant with proper roles and labels
 * - Responsive design for different screen sizes
 */

import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer, BlurWrapper } from '../GlassmorphismComponents';
import { createThemedStyles, accessibility } from '../../utils/designTokens';

const { width: screenWidth } = Dimensions.get('window');

// Phase color mappings based on exercise type
const PHASE_COLORS = {
  // Squat phases
  'descent': '#3B82F6',
  'bottom': '#F59E0B',
  'ascent': '#10B981',
  'standing': '#6B7280',
  
  // Baseball pitch phases
  'windup': '#8B5CF6',
  'stride': '#EF4444',
  'cocking': '#F97316',
  'acceleration': '#14B8A6',
  'follow_through': '#84CC16',
  
  // Default/other phases
  'preparation': '#6366F1',
  'execution': '#EC4899',
  'recovery': '#22D3EE',
  'overall': '#6B7280',
};

// Exercise-specific phase labels
const PHASE_LABELS = {
  'descent': 'Descent',
  'bottom': 'Bottom Position',
  'ascent': 'Ascent',
  'standing': 'Starting Position',
  'windup': 'Wind-up',
  'stride': 'Stride',
  'cocking': 'Arm Cocking',
  'acceleration': 'Acceleration',
  'follow_through': 'Follow Through',
  'preparation': 'Preparation',
  'execution': 'Execution',
  'recovery': 'Recovery',
  'overall': 'Overall Form',
};

// Score threshold for visual indicators
const SCORE_THRESHOLDS = {
  excellent: 90,
  good: 75,
  fair: 60,
  poor: 40,
};

const getScoreColor = (score, theme) => {
  if (score >= SCORE_THRESHOLDS.excellent) return theme.semantic.success.primary;
  if (score >= SCORE_THRESHOLDS.good) return theme.primary;
  if (score >= SCORE_THRESHOLDS.fair) return theme.semantic.warning.primary;
  return theme.semantic.error.primary;
};

const ScoreBreakdownChart = memo(function ScoreBreakdownChart({
  phaseScores = [],
  exerciseType,
  onPhasePress,
  animated = true,
  theme,
  style,
  accessibilityLabel,
}) {
  const styles = createThemedStyles(getStyles, theme?.isDark ? 'dark' : 'light');
  
  // Animation refs
  const slideAnimations = useRef([]).current;
  const progressAnimations = useRef([]).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // State management
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [animationsComplete, setAnimationsComplete] = useState(!animated);

  // Initialize animations for each phase
  useEffect(() => {
    phaseScores.forEach((_, index) => {
      if (!slideAnimations[index]) {
        slideAnimations[index] = new Animated.Value(0);
      }
      if (!progressAnimations[index]) {
        progressAnimations[index] = new Animated.Value(0);
      }
    });
  }, [phaseScores, slideAnimations, progressAnimations]);

  // Animate phase reveals with staggered timing
  useEffect(() => {
    if (!animated || animationsComplete) return;

    const staggeredAnimations = phaseScores.map((phase, index) => {
      return Animated.sequence([
        // Wait for stagger delay
        Animated.delay(index * 150),
        // Slide in animation
        Animated.parallel([
          Animated.timing(slideAnimations[index], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          // Progress bar animation with delay
          Animated.timing(progressAnimations[index], {
            toValue: phase.score,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
      ]);
    });

    // Run all animations in parallel
    Animated.parallel(staggeredAnimations).start(() => {
      setAnimationsComplete(true);
      
      // Success pulse animation
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.02,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      staggeredAnimations.forEach(animation => animation.stop());
    };
  }, [phaseScores, animated, animationsComplete, slideAnimations, progressAnimations, pulseAnimation]);

  // Handle phase press
  const handlePhasePress = (phase, score, index) => {
    // Toggle expanded state
    setExpandedPhase(expandedPhase === index ? null : index);
    
    // Call parent callback
    if (onPhasePress) {
      onPhasePress(phase, score);
    }

    // Haptic feedback would go here
    if (typeof Haptics !== 'undefined') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Calculate average score
  const averageScore = useMemo(() => {
    if (!phaseScores.length) return 0;
    const total = phaseScores.reduce((sum, phase) => sum + phase.score, 0);
    return Math.round(total / phaseScores.length);
  }, [phaseScores]);

  // Get phase color
  const getPhaseColor = (phaseType, score) => {
    const baseColor = PHASE_COLORS[phaseType] || PHASE_COLORS.overall;
    return baseColor;
  };

  // Format phase duration
  const formatDuration = (duration) => {
    return `${(duration / 1000).toFixed(1)}s`;
  };

  // If no phases, show placeholder
  if (!phaseScores.length) {
    return (
      <View style={[styles.container, style]}>
        <GlassContainer variant="default" style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
            No phase breakdown available
          </Text>
        </GlassContainer>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        { transform: [{ scale: pulseAnimation }] }
      ]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || `Score breakdown for ${phaseScores.length} phases`}
      accessibilityRole="list"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>
          Phase Breakdown
        </Text>
        {averageScore > 0 && (
          <View style={[styles.averageScore, { backgroundColor: getScoreColor(averageScore, theme) + '20' }]}>
            <Text style={[styles.averageText, { color: getScoreColor(averageScore, theme) }]}>
              Avg: {averageScore}%
            </Text>
          </View>
        )}
      </View>

      {/* Phase List */}
      <ScrollView 
        style={styles.phaseList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.phaseListContent}
      >
        {phaseScores.map((phase, index) => {
          const phaseColor = getPhaseColor(phase.phase, phase.score);
          const scoreColor = getScoreColor(phase.score, theme);
          const isExpanded = expandedPhase === index;
          
          // Animation values
          const slideAnimation = slideAnimations[index] || new Animated.Value(1);
          const progressAnimation = progressAnimations[index] || new Animated.Value(phase.score);
          
          return (
            <Animated.View
              key={`${phase.phase}-${index}`}
              style={[
                styles.phaseItem,
                {
                  opacity: slideAnimation,
                  transform: [{
                    translateY: slideAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.phaseCard}
                onPress={() => handlePhasePress(phase.phase, phase.score, index)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${PHASE_LABELS[phase.phase] || phase.phase}: ${phase.score} percent`}
                accessibilityHint="Double tap to expand details"
              >
                <GlassContainer 
                  variant="default" 
                  style={[
                    styles.phaseContainer,
                    { 
                      borderLeftColor: phaseColor,
                      borderLeftWidth: 4,
                    }
                  ]}
                >
                  {/* Phase Header */}
                  <View style={styles.phaseHeader}>
                    <View style={styles.phaseInfo}>
                      <Text style={[styles.phaseName, { color: theme.text.primary }]}>
                        {PHASE_LABELS[phase.phase] || phase.phase}
                      </Text>
                      {phase.duration && (
                        <Text style={[styles.phaseDuration, { color: theme.text.secondary }]}>
                          {formatDuration(phase.duration)}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.scoreSection}>
                      <Text style={[styles.phaseScore, { color: scoreColor }]}>
                        {Math.round(phase.score)}%
                      </Text>
                      {phase.errors && phase.errors.length > 0 && (
                        <Ionicons 
                          name="warning-outline" 
                          size={16} 
                          color={theme.semantic.warning.primary}
                          style={styles.warningIcon}
                        />
                      )}
                    </View>

                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={theme.text.tertiary}
                      style={styles.expandIcon}
                    />
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarBackground, { backgroundColor: theme.border.light }]}>
                      <Animated.View
                        style={[
                          styles.progressBar,
                          {
                            backgroundColor: scoreColor,
                            width: progressAnimation.interpolate({
                              inputRange: [0, 100],
                              outputRange: ['0%', '100%'],
                              extrapolate: 'clamp',
                            }),
                          }
                        ]}
                      />
                    </View>
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* Performance Indicator */}
                      <View style={styles.performanceIndicator}>
                        <Text style={[styles.performanceLabel, { color: theme.text.secondary }]}>
                          Performance
                        </Text>
                        <View style={[styles.performanceBadge, { backgroundColor: scoreColor + '20' }]}>
                          <Text style={[styles.performanceText, { color: scoreColor }]}>
                            {phase.score >= SCORE_THRESHOLDS.excellent ? 'Excellent' :
                             phase.score >= SCORE_THRESHOLDS.good ? 'Good' :
                             phase.score >= SCORE_THRESHOLDS.fair ? 'Fair' : 'Needs Work'}
                          </Text>
                        </View>
                      </View>

                      {/* Errors List */}
                      {phase.errors && phase.errors.length > 0 && (
                        <View style={styles.errorsSection}>
                          <Text style={[styles.errorsTitle, { color: theme.semantic.warning.primary }]}>
                            Issues Found ({phase.errors.length})
                          </Text>
                          {phase.errors.map((error, errorIndex) => (
                            <View key={errorIndex} style={styles.errorItem}>
                              <Ionicons 
                                name="alert-circle-outline" 
                                size={14} 
                                color={theme.semantic.error.primary}
                              />
                              <Text style={[styles.errorText, { color: theme.text.primary }]}>
                                {error.description || error.type}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Phase Timing */}
                      {phase.startTime !== undefined && (
                        <View style={styles.timingSection}>
                          <Text style={[styles.timingLabel, { color: theme.text.secondary }]}>
                            Timing: {(phase.startTime / 1000).toFixed(1)}s - {((phase.startTime + (phase.duration || 1000)) / 1000).toFixed(1)}s
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </GlassContainer>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
});

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  averageScore: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  averageText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  phaseList: {
    flex: 1,
  },
  phaseListContent: {
    paddingBottom: theme.spacing.lg,
  },
  phaseItem: {
    marginBottom: theme.spacing.sm,
  },
  phaseCard: {
    marginHorizontal: theme.spacing.xs,
  },
  phaseContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  phaseDuration: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  phaseScore: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    minWidth: 50,
    textAlign: 'right',
  },
  warningIcon: {
    marginLeft: theme.spacing.xs,
  },
  expandIcon: {
    marginLeft: theme.spacing.sm,
  },
  progressBarContainer: {
    marginBottom: theme.spacing.sm,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  expandedContent: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.border.light,
  },
  performanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  performanceLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  performanceBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  performanceText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorsSection: {
    marginBottom: theme.spacing.sm,
  },
  errorsTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.xs,
    flex: 1,
  },
  timingSection: {
    marginTop: theme.spacing.xs,
  },
  timingLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
  },

  // Accessibility enhancements
  phaseCardAccessible: {
    minHeight: accessibility.minTouchTarget.height,
  },
});

ScoreBreakdownChart.displayName = 'ScoreBreakdownChart';

export default ScoreBreakdownChart;