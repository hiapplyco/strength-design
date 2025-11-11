/**
 * Feedback Cards Component
 * Displays detailed form feedback sections organized by priority and body region
 * 
 * Features:
 * - Priority-based feedback organization (critical, moderate, minor)
 * - Body region grouping for targeted corrections
 * - Swipeable card interface for easy navigation
 * - Visual indicators for form issues (red/yellow/green)
 * - User-friendly coaching language for all fitness levels
 * - Integration with glassmorphism design system
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { GlassContainer, BlurWrapper } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';
import { createThemedStyles } from '../../utils/designTokens';
import ActionItemCard from './ActionItemCard';
import ImprovementTip from './ImprovementTip';

const { width: screenWidth } = Dimensions.get('window');

// Priority levels for feedback organization
const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  MODERATE: 'moderate', 
  MINOR: 'minor'
};

// Priority configurations with colors and descriptions
const PRIORITY_CONFIG = {
  [PRIORITY_LEVELS.CRITICAL]: {
    color: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    icon: 'alert-circle',
    label: 'Critical',
    description: 'Address immediately to prevent injury'
  },
  [PRIORITY_LEVELS.MODERATE]: {
    color: '#D97706',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    icon: 'warning',
    label: 'Moderate',
    description: 'Important improvements for better form'
  },
  [PRIORITY_LEVELS.MINOR]: {
    color: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
    icon: 'checkmark-circle',
    label: 'Minor',
    description: 'Fine-tuning for optimal performance'
  }
};

// Body regions for organizing feedback
const BODY_REGIONS = {
  UPPER_BODY: 'upper_body',
  CORE: 'core',
  LOWER_BODY: 'lower_body',
  OVERALL: 'overall'
};

const REGION_CONFIG = {
  [BODY_REGIONS.UPPER_BODY]: {
    label: 'Upper Body',
    icon: 'body-outline',
    areas: ['shoulders', 'arms', 'chest', 'upper_back']
  },
  [BODY_REGIONS.CORE]: {
    label: 'Core & Posture',
    icon: 'fitness-outline',
    areas: ['spine', 'core', 'posture', 'balance']
  },
  [BODY_REGIONS.LOWER_BODY]: {
    label: 'Lower Body',
    icon: 'walk-outline',
    areas: ['hips', 'knees', 'ankles', 'feet']
  },
  [BODY_REGIONS.OVERALL]: {
    label: 'Overall Technique',
    icon: 'analytics-outline',
    areas: ['timing', 'rhythm', 'coordination']
  }
};

const FeedbackCards = memo(function FeedbackCards({
  analysisResult,
  exerciseType,
  onFeedbackPress,
  onImprovementSelect,
  showSwipeHint = true,
  maxCardsVisible = 3,
  style,
}) {
  const { theme, isDarkMode } = useTheme();
  const styles = createThemedStyles(getStyles, isDarkMode ? 'dark' : 'light');

  // State management
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [swipeHintDismissed, setSwipeHintDismissed] = useState(!showSwipeHint);

  // Animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Process analysis data into organized feedback
  const organizedFeedback = useMemo(() => {
    if (!analysisResult?.analysis) return { cards: [], totalIssues: 0 };

    const { criticalErrors = [], improvements = [] } = analysisResult.analysis;
    const feedbackItems = [];

    // Process critical errors
    criticalErrors.forEach(error => {
      const priority = error.severity === 'high' ? PRIORITY_LEVELS.CRITICAL : 
                     error.severity === 'medium' ? PRIORITY_LEVELS.MODERATE : 
                     PRIORITY_LEVELS.MINOR;

      const bodyRegion = determineBodyRegion(error.affectedLandmarks || [], error.type);
      
      feedbackItems.push({
        id: `error-${error.type}`,
        type: 'error',
        priority,
        bodyRegion,
        title: formatErrorTitle(error.type),
        description: error.description || 'Form issue detected',
        correction: error.correction || 'Focus on proper technique',
        timeRange: error.timeRange,
        affectedLandmarks: error.affectedLandmarks,
        severity: error.severity,
        exercisePhase: error.exercisePhase || 'overall'
      });
    });

    // Process improvement suggestions
    improvements.forEach(improvement => {
      const priority = improvement.priority === 'high' ? PRIORITY_LEVELS.MODERATE :
                     improvement.priority === 'medium' ? PRIORITY_LEVELS.MINOR :
                     PRIORITY_LEVELS.MINOR;

      const bodyRegion = determineBodyRegionFromCategory(improvement.category);

      feedbackItems.push({
        id: `improvement-${improvement.category}`,
        type: 'improvement',
        priority,
        bodyRegion,
        title: formatImprovementTitle(improvement.category),
        description: improvement.suggestion,
        expectedImprovement: improvement.expectedImprovement,
        category: improvement.category
      });
    });

    // Group by priority and body region
    const groupedFeedback = groupFeedbackByPriorityAndRegion(feedbackItems);
    
    // Create cards from grouped feedback
    const cards = createFeedbackCards(groupedFeedback, exerciseType);

    return {
      cards,
      totalIssues: feedbackItems.length,
      breakdown: {
        critical: feedbackItems.filter(item => item.priority === PRIORITY_LEVELS.CRITICAL).length,
        moderate: feedbackItems.filter(item => item.priority === PRIORITY_LEVELS.MODERATE).length,
        minor: feedbackItems.filter(item => item.priority === PRIORITY_LEVELS.MINOR).length
      }
    };
  }, [analysisResult, exerciseType]);

  // Gesture handler for swipe navigation
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event, context) => {
      const { translationX, velocityX } = event;
      const cardWidth = screenWidth - 32; // Account for padding
      const threshold = cardWidth * 0.25;

      let targetIndex = currentCardIndex;
      
      if (translationX < -threshold || velocityX < -500) {
        // Swipe left - next card
        targetIndex = Math.min(currentCardIndex + 1, organizedFeedback.cards.length - 1);
      } else if (translationX > threshold || velocityX > 500) {
        // Swipe right - previous card
        targetIndex = Math.max(currentCardIndex - 1, 0);
      }

      translateX.value = withSpring(-targetIndex * cardWidth, {
        damping: 20,
        stiffness: 300,
      });

      if (targetIndex !== currentCardIndex) {
        runOnJS(setCurrentCardIndex)(targetIndex);
        runOnJS(setSwipeHintDismissed)(true);
      }
    },
  });

  // Animated styles for card container
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  // Navigate to specific card
  const navigateToCard = useCallback((index) => {
    if (index < 0 || index >= organizedFeedback.cards.length) return;
    
    const cardWidth = screenWidth - 32;
    translateX.value = withSpring(-index * cardWidth, {
      damping: 20,
      stiffness: 300,
    });
    setCurrentCardIndex(index);
  }, [organizedFeedback.cards.length, translateX]);

  // Handle feedback item press
  const handleFeedbackPress = useCallback((feedback) => {
    if (onFeedbackPress) {
      onFeedbackPress(feedback);
    }
  }, [onFeedbackPress]);

  // Handle improvement selection
  const handleImprovementSelect = useCallback((improvement) => {
    if (onImprovementSelect) {
      onImprovementSelect(improvement);
    }
  }, [onImprovementSelect]);

  // Render priority indicator
  const renderPriorityIndicator = useCallback(({ priority, count }) => {
    const config = PRIORITY_CONFIG[priority];
    if (!config || count === 0) return null;

    return (
      <View style={[styles.priorityBadge, { backgroundColor: config.backgroundColor }]}>
        <Ionicons 
          name={config.icon} 
          size={16} 
          color={config.color} 
        />
        <Text style={[styles.priorityText, { color: config.color }]}>
          {count} {config.label.toLowerCase()}
        </Text>
      </View>
    );
  }, [styles]);

  // Render card indicators (dots)
  const renderCardIndicators = useCallback(() => {
    if (organizedFeedback.cards.length <= 1) return null;

    return (
      <View style={styles.cardIndicators}>
        {organizedFeedback.cards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor: index === currentCardIndex 
                  ? theme.primary 
                  : theme.textTertiary + '40',
              }
            ]}
          />
        ))}
      </View>
    );
  }, [organizedFeedback.cards.length, currentCardIndex, styles, theme]);

  // Render swipe hint
  const renderSwipeHint = useCallback(() => {
    if (swipeHintDismissed || organizedFeedback.cards.length <= 1) return null;

    return (
      <BlurWrapper intensity="medium" style={styles.swipeHint}>
        <View style={styles.swipeHintContent}>
          <Ionicons name="swap-horizontal" size={20} color={theme.textSecondary} />
          <Text style={[styles.swipeHintText, { color: theme.textSecondary }]}>
            Swipe to view more feedback
          </Text>
        </View>
      </BlurWrapper>
    );
  }, [swipeHintDismissed, organizedFeedback.cards.length, styles, theme]);

  if (!analysisResult?.analysis || organizedFeedback.cards.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <GlassContainer variant="medium" style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="checkmark-circle" size={48} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Excellent Form!
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              No significant issues detected. Keep up the great work!
            </Text>
          </View>
        </GlassContainer>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Summary Header */}
      <View style={styles.summaryHeader}>
        <Text style={[styles.summaryTitle, { color: theme.text }]}>
          Form Analysis
        </Text>
        <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
          {organizedFeedback.totalIssues} areas identified
        </Text>
        
        {/* Priority Badges */}
        <View style={styles.priorityBadges}>
          {renderPriorityIndicator({ 
            priority: PRIORITY_LEVELS.CRITICAL, 
            count: organizedFeedback.breakdown.critical 
          })}
          {renderPriorityIndicator({ 
            priority: PRIORITY_LEVELS.MODERATE, 
            count: organizedFeedback.breakdown.moderate 
          })}
          {renderPriorityIndicator({ 
            priority: PRIORITY_LEVELS.MINOR, 
            count: organizedFeedback.breakdown.minor 
          })}
        </View>
      </View>

      {/* Feedback Cards */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.cardsContainer, animatedCardStyle]}>
          {organizedFeedback.cards.map((card, index) => (
            <View key={card.id} style={styles.cardWrapper}>
              <GlassContainer 
                variant="elevated" 
                style={[
                  styles.feedbackCard,
                  {
                    borderColor: PRIORITY_CONFIG[card.priority]?.borderColor,
                    backgroundColor: isDarkMode 
                      ? PRIORITY_CONFIG[card.priority]?.backgroundColor 
                      : PRIORITY_CONFIG[card.priority]?.backgroundColor,
                  }
                ]}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons 
                      name={PRIORITY_CONFIG[card.priority]?.icon} 
                      size={20} 
                      color={PRIORITY_CONFIG[card.priority]?.color}
                    />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      {card.title}
                    </Text>
                  </View>
                  <View style={[
                    styles.priorityLabel,
                    { backgroundColor: PRIORITY_CONFIG[card.priority]?.backgroundColor }
                  ]}>
                    <Text style={[
                      styles.priorityLabelText,
                      { color: PRIORITY_CONFIG[card.priority]?.color }
                    ]}>
                      {PRIORITY_CONFIG[card.priority]?.label}
                    </Text>
                  </View>
                </View>

                {/* Card Content */}
                <ScrollView 
                  style={styles.cardContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {/* Action Items */}
                  {card.actionItems.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Action Items
                      </Text>
                      {card.actionItems.map((item, itemIndex) => (
                        <ActionItemCard
                          key={itemIndex}
                          item={item}
                          onPress={() => handleFeedbackPress(item)}
                          style={styles.actionItem}
                        />
                      ))}
                    </View>
                  )}

                  {/* Improvement Tips */}
                  {card.improvements.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        How to Improve
                      </Text>
                      {card.improvements.map((tip, tipIndex) => (
                        <ImprovementTip
                          key={tipIndex}
                          tip={tip}
                          onPress={() => handleImprovementSelect(tip)}
                          style={styles.improvementTip}
                        />
                      ))}
                    </View>
                  )}
                </ScrollView>
              </GlassContainer>
            </View>
          ))}
        </Animated.View>
      </PanGestureHandler>

      {/* Card Indicators */}
      {renderCardIndicators()}

      {/* Swipe Hint */}
      {renderSwipeHint()}
    </View>
  );
});

// Helper functions

function determineBodyRegion(affectedLandmarks = [], errorType = '') {
  const upperBodyLandmarks = [
    'LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_ELBOW', 'RIGHT_ELBOW',
    'LEFT_WRIST', 'RIGHT_WRIST', 'LEFT_PINKY', 'RIGHT_PINKY',
    'LEFT_INDEX', 'RIGHT_INDEX', 'LEFT_THUMB', 'RIGHT_THUMB'
  ];
  
  const coreLandmarks = [
    'NOSE', 'LEFT_EYE', 'RIGHT_EYE', 'LEFT_EAR', 'RIGHT_EAR',
    'MOUTH_LEFT', 'MOUTH_RIGHT'
  ];
  
  const lowerBodyLandmarks = [
    'LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE',
    'LEFT_ANKLE', 'RIGHT_ANKLE', 'LEFT_HEEL', 'RIGHT_HEEL',
    'LEFT_FOOT_INDEX', 'RIGHT_FOOT_INDEX'
  ];

  const hasUpperBody = affectedLandmarks.some(landmark => 
    upperBodyLandmarks.includes(landmark)
  );
  const hasCore = affectedLandmarks.some(landmark => 
    coreLandmarks.includes(landmark)
  );
  const hasLowerBody = affectedLandmarks.some(landmark => 
    lowerBodyLandmarks.includes(landmark)
  );

  if (hasUpperBody && hasLowerBody) return BODY_REGIONS.OVERALL;
  if (hasUpperBody) return BODY_REGIONS.UPPER_BODY;
  if (hasCore) return BODY_REGIONS.CORE;
  if (hasLowerBody) return BODY_REGIONS.LOWER_BODY;

  // Fallback based on error type
  if (errorType.includes('spine') || errorType.includes('posture')) {
    return BODY_REGIONS.CORE;
  }
  if (errorType.includes('knee') || errorType.includes('hip') || errorType.includes('depth')) {
    return BODY_REGIONS.LOWER_BODY;
  }

  return BODY_REGIONS.OVERALL;
}

function determineBodyRegionFromCategory(category = '') {
  const categoryMap = {
    depth: BODY_REGIONS.LOWER_BODY,
    'knee_alignment': BODY_REGIONS.LOWER_BODY,
    'spinal_alignment': BODY_REGIONS.CORE,
    balance: BODY_REGIONS.CORE,
    timing: BODY_REGIONS.OVERALL,
    consistency: BODY_REGIONS.OVERALL,
  };

  return categoryMap[category] || BODY_REGIONS.OVERALL;
}

function formatErrorTitle(errorType) {
  const titleMap = {
    shallow_depth: 'Squat Depth',
    knee_valgus: 'Knee Alignment',
    forward_lean: 'Posture',
    heel_lift: 'Foot Position',
    uneven_weight: 'Balance',
  };

  return titleMap[errorType] || errorType.replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatImprovementTitle(category) {
  const titleMap = {
    depth: 'Increase Range of Motion',
    knee_alignment: 'Improve Knee Tracking',
    spinal_alignment: 'Enhance Posture',
    balance: 'Better Stability',
    timing: 'Movement Timing',
    consistency: 'Form Consistency',
  };

  return titleMap[category] || category.replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function groupFeedbackByPriorityAndRegion(feedbackItems) {
  const groups = {};

  feedbackItems.forEach(item => {
    const key = `${item.priority}-${item.bodyRegion}`;
    if (!groups[key]) {
      groups[key] = {
        priority: item.priority,
        bodyRegion: item.bodyRegion,
        items: []
      };
    }
    groups[key].items.push(item);
  });

  return Object.values(groups).sort((a, b) => {
    // Sort by priority first (critical > moderate > minor)
    const priorityOrder = {
      [PRIORITY_LEVELS.CRITICAL]: 3,
      [PRIORITY_LEVELS.MODERATE]: 2,
      [PRIORITY_LEVELS.MINOR]: 1
    };
    
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by body region
    const regionOrder = {
      [BODY_REGIONS.UPPER_BODY]: 4,
      [BODY_REGIONS.CORE]: 3,
      [BODY_REGIONS.LOWER_BODY]: 2,
      [BODY_REGIONS.OVERALL]: 1
    };

    return regionOrder[b.bodyRegion] - regionOrder[a.bodyRegion];
  });
}

function createFeedbackCards(groupedFeedback, exerciseType) {
  return groupedFeedback.map((group, index) => {
    const regionConfig = REGION_CONFIG[group.bodyRegion];
    const title = `${regionConfig.label} Feedback`;

    const actionItems = group.items
      .filter(item => item.type === 'error')
      .map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        correction: item.correction,
        priority: item.priority,
        timeRange: item.timeRange,
        severity: item.severity,
        exercisePhase: item.exercisePhase
      }));

    const improvements = group.items
      .filter(item => item.type === 'improvement')
      .map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        expectedImprovement: item.expectedImprovement,
        category: item.category,
        priority: item.priority
      }));

    return {
      id: `card-${index}`,
      title,
      priority: group.priority,
      bodyRegion: group.bodyRegion,
      regionIcon: regionConfig.icon,
      actionItems,
      improvements,
      totalItems: group.items.length
    };
  });
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  summaryHeader: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  priorityBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing['1'],
  },
  priorityText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  cardsContainer: {
    flexDirection: 'row',
    width: screenWidth * 10, // Accommodate multiple cards
  },
  cardWrapper: {
    width: screenWidth - (theme.spacing.md * 2),
    marginRight: theme.spacing.md,
  },
  feedbackCard: {
    minHeight: 400,
    borderWidth: 1.5,
  },
  cardHeader: {
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.light,
    marginBottom: theme.spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    flex: 1,
  },
  priorityLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  priorityLabelText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  actionItem: {
    marginBottom: theme.spacing.sm,
  },
  improvementTip: {
    marginBottom: theme.spacing.sm,
  },
  cardIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  swipeHint: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
  },
  swipeHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  swipeHintText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyCard: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.normal,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
});

FeedbackCards.displayName = 'FeedbackCards';

export default FeedbackCards;