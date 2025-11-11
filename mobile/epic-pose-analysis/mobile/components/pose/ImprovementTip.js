/**
 * Improvement Tip Component
 * Displays coaching tips and improvement suggestions with expected benefits
 * 
 * Features:
 * - Positive coaching language optimized for motivation
 * - Expected improvement outcomes
 * - Progress indicators and difficulty levels
 * - Category-based styling and icons
 * - Expandable detailed information
 * - Glassmorphism design with accessibility
 */

import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';
import { createThemedStyles } from '../../utils/designTokens';

// Improvement categories with specific styling and icons
const CATEGORY_CONFIG = {
  depth: {
    color: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    icon: 'arrow-down-circle-outline',
    label: 'Range of Motion',
    description: 'Improving movement depth and flexibility'
  },
  knee_alignment: {
    color: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
    icon: 'trending-up-outline',
    label: 'Knee Tracking',
    description: 'Optimizing knee movement patterns'
  },
  spinal_alignment: {
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    icon: 'body-outline',
    label: 'Posture',
    description: 'Enhancing spinal positioning and core stability'
  },
  balance: {
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    icon: 'balance-outline',
    label: 'Balance & Stability',
    description: 'Improving weight distribution and control'
  },
  timing: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    icon: 'time-outline',
    label: 'Movement Timing',
    description: 'Optimizing movement rhythm and pace'
  },
  consistency: {
    color: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
    icon: 'repeat-outline',
    label: 'Consistency',
    description: 'Developing reliable movement patterns'
  },
  strength: {
    color: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderColor: 'rgba(220, 38, 38, 0.2)',
    icon: 'barbell-outline',
    label: 'Strength',
    description: 'Building muscular capacity and power'
  },
  mobility: {
    color: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderColor: 'rgba(5, 150, 105, 0.2)',
    icon: 'body-outline',
    label: 'Mobility',
    description: 'Increasing joint flexibility and movement quality'
  },
};

// Priority level configurations for tips
const PRIORITY_CONFIG = {
  high: {
    indicator: '🔥',
    label: 'High Impact',
    description: 'Focus on this for maximum improvement'
  },
  medium: {
    indicator: '⚡',
    label: 'Good Impact',
    description: 'Solid improvement opportunity'
  },
  low: {
    indicator: '✨',
    label: 'Fine-tuning',
    description: 'Polish your technique'
  },
};

// Difficulty levels for improvement tips
const DIFFICULTY_LEVELS = {
  beginner: {
    label: 'Beginner Friendly',
    color: '#10B981',
    icon: 'leaf-outline',
    description: 'Easy to implement'
  },
  intermediate: {
    label: 'Intermediate',
    color: '#F59E0B',
    icon: 'fitness-outline',
    description: 'Moderate challenge'
  },
  advanced: {
    label: 'Advanced',
    color: '#EF4444',
    icon: 'flame-outline',
    description: 'Requires practice'
  },
};

const ImprovementTip = memo(function ImprovementTip({
  tip,
  onPress,
  showExpectedImprovement = true,
  showDifficulty = true,
  showPriority = true,
  expandable = true,
  style,
}) {
  const { theme, isDarkMode } = useTheme();
  const styles = createThemedStyles(getStyles, isDarkMode ? 'dark' : 'light');

  // State for expansion
  const [isExpanded, setIsExpanded] = useState(!expandable);
  const [animationValue] = useState(new Animated.Value(expandable ? 0 : 1));

  // Extract tip properties with defaults
  const {
    id,
    title = 'Improvement Tip',
    description = 'Work on improving your technique',
    expectedImprovement = 'Better overall form and performance',
    category = 'consistency',
    priority = 'medium',
    difficulty = 'intermediate',
    timeToSee = '2-3 sessions',
    additionalInfo,
    relatedExercises = []
  } = tip;

  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.consistency;
  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const difficultyConfig = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS.intermediate;

  // Handle expansion toggle
  const handleExpand = useCallback(() => {
    if (!expandable) return;

    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.timing(animationValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, expandable, animationValue]);

  // Handle press action
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(tip);
    }
    
    if (expandable) {
      handleExpand();
    }
  }, [tip, onPress, expandable, handleExpand]);

  // Animated height for expansion
  const animatedHeight = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200], // Approximate expanded height
  });

  const animatedOpacity = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Render priority indicator
  const renderPriorityIndicator = () => {
    if (!showPriority) return null;

    return (
      <View style={styles.priorityIndicator}>
        <Text style={styles.priorityEmoji}>
          {priorityConfig.indicator}
        </Text>
        <Text style={[styles.priorityLabel, { color: theme.textSecondary }]}>
          {priorityConfig.label}
        </Text>
      </View>
    );
  };

  // Render difficulty badge
  const renderDifficultyBadge = () => {
    if (!showDifficulty) return null;

    return (
      <View 
        style={[
          styles.difficultyBadge,
          { backgroundColor: difficultyConfig.color + '15' }
        ]}
      >
        <Ionicons 
          name={difficultyConfig.icon} 
          size={12} 
          color={difficultyConfig.color}
        />
        <Text style={[styles.difficultyText, { color: difficultyConfig.color }]}>
          {difficultyConfig.label}
        </Text>
      </View>
    );
  };

  // Render expected improvement section
  const renderExpectedImprovement = () => {
    if (!showExpectedImprovement || !expectedImprovement) return null;

    return (
      <View style={styles.improvementSection}>
        <View style={styles.improvementHeader}>
          <Ionicons 
            name="trending-up" 
            size={16} 
            color={theme.primary}
          />
          <Text style={[styles.improvementLabel, { color: theme.primary }]}>
            Expected Benefit
          </Text>
        </View>
        <Text style={[styles.improvementText, { color: theme.text }]}>
          {expectedImprovement}
        </Text>
        {timeToSee && (
          <View style={styles.timeFrame}>
            <Ionicons 
              name="time-outline" 
              size={14} 
              color={theme.textSecondary}
            />
            <Text style={[styles.timeFrameText, { color: theme.textSecondary }]}>
              Results in {timeToSee}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render additional information
  const renderAdditionalInfo = () => {
    if (!additionalInfo && relatedExercises.length === 0) return null;

    return (
      <Animated.View 
        style={[
          styles.additionalInfo,
          { 
            height: animatedHeight, 
            opacity: animatedOpacity 
          }
        ]}
      >
        {additionalInfo && (
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>
              More Details
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              {additionalInfo}
            </Text>
          </View>
        )}
        
        {relatedExercises.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: theme.text }]}>
              Related Exercises
            </Text>
            <View style={styles.exerciseList}>
              {relatedExercises.slice(0, 3).map((exercise, index) => (
                <Text 
                  key={index} 
                  style={[styles.exerciseItem, { color: theme.primary }]}
                >
                  • {exercise}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={`Improvement tip: ${title}`}
      accessibilityHint={description}
      accessibilityRole="button"
    >
      <GlassContainer 
        variant="subtle" 
        style={[
          styles.container,
          {
            borderColor: categoryConfig.borderColor,
            backgroundColor: isDarkMode 
              ? categoryConfig.backgroundColor 
              : categoryConfig.backgroundColor,
          },
          style
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View 
              style={[
                styles.categoryIcon,
                { backgroundColor: categoryConfig.color + '20' }
              ]}
            >
              <Ionicons 
                name={categoryConfig.icon} 
                size={20} 
                color={categoryConfig.color}
              />
            </View>
            <View style={styles.titleContent}>
              <Text 
                style={[styles.title, { color: theme.text }]}
                numberOfLines={2}
              >
                {title}
              </Text>
              <Text 
                style={[styles.categoryLabel, { color: categoryConfig.color }]}
              >
                {categoryConfig.label}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerBadges}>
            {renderPriorityIndicator()}
            {renderDifficultyBadge()}
          </View>
        </View>

        {/* Description */}
        <Text 
          style={[styles.description, { color: theme.textSecondary }]}
          numberOfLines={3}
        >
          {description}
        </Text>

        {/* Expected Improvement */}
        {renderExpectedImprovement()}

        {/* Additional Information (Expandable) */}
        {renderAdditionalInfo()}

        {/* Footer */}
        {expandable && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={handleExpand}
              accessible={true}
              accessibilityLabel={isExpanded ? "Show less" : "Show more"}
            >
              <Text style={[styles.expandButtonText, { color: theme.primary }]}>
                {isExpanded ? 'Show Less' : 'Show More'}
              </Text>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </GlassContainer>
    </TouchableOpacity>
  );
});

const getStyles = (theme) => StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    minHeight: 140,
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.lineHeight.snug * theme.typography.fontSize.base,
    marginBottom: theme.spacing.xs,
  },
  categoryLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  priorityIndicator: {
    alignItems: 'center',
  },
  priorityEmoji: {
    fontSize: 16,
    marginBottom: theme.spacing['0.5'],
  },
  priorityLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['1'],
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing['0.5'],
    borderRadius: theme.borderRadius.md,
  },
  difficultyText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  improvementSection: {
    backgroundColor: theme.isDark 
      ? 'rgba(255, 255, 255, 0.03)' 
      : 'rgba(0, 0, 0, 0.03)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.primary + '15',
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  improvementLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  improvementText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  timeFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  timeFrameText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    fontStyle: 'italic',
  },
  additionalInfo: {
    overflow: 'hidden',
  },
  infoSection: {
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  exerciseList: {
    gap: theme.spacing.xs,
  },
  exerciseItem: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.border.light,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  expandButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

ImprovementTip.displayName = 'ImprovementTip';

export default ImprovementTip;