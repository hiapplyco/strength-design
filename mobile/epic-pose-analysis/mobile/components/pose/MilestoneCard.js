/**
 * Milestone Card Component
 * 
 * Interactive milestone celebration card with visual progress tracking
 * for pose analysis achievements. Features meaningful form improvement
 * milestones, celebration animations, and sharing capabilities.
 * 
 * Features:
 * - Progressive milestone tracking with visual indicators
 * - Form improvement celebration animations with haptic feedback
 * - Exercise-specific milestone definitions and rewards
 * - Social sharing with customizable milestone messages
 * - Glassmorphism design with accessibility support
 * - Smooth progress animations and transitions
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

const { width: screenWidth } = Dimensions.get('window');

// Milestone Definitions for Different Exercise Types
const MILESTONE_DEFINITIONS = {
  squat: [
    {
      id: 'squat_beginner',
      title: 'Squat Basics',
      description: 'First proper squat form analysis',
      threshold: 1,
      icon: '🏃‍♂️',
      scoreRequirement: 50,
      reward: 'Understanding squat fundamentals',
      tips: ['Focus on knee tracking', 'Keep chest up', 'Control the descent']
    },
    {
      id: 'squat_form_foundation',
      title: 'Form Foundation',
      description: 'Consistent 70+ form scores in squats',
      threshold: 5,
      icon: '🏗️',
      scoreRequirement: 70,
      reward: 'Solid squat technique established',
      tips: ['Work on depth consistency', 'Maintain balance', 'Focus on breathing']
    },
    {
      id: 'squat_intermediate',
      title: 'Squat Proficiency',
      description: 'Achieved 80+ form score in squats',
      threshold: 10,
      icon: '⚡',
      scoreRequirement: 80,
      reward: 'Advanced squat mechanics unlocked',
      tips: ['Perfect the eccentric phase', 'Work on explosive concentric', 'Fine-tune ankle mobility']
    },
    {
      id: 'squat_advanced',
      title: 'Squat Mastery',
      description: 'Consistent 90+ form scores',
      threshold: 20,
      icon: '🏆',
      scoreRequirement: 90,
      reward: 'Elite squat form achieved',
      tips: ['Focus on micro-adjustments', 'Maintain consistency under fatigue', 'Coach others']
    },
    {
      id: 'squat_expert',
      title: 'Squat Expert',
      description: 'Perfect 95+ form score achieved',
      threshold: 1,
      icon: '💎',
      scoreRequirement: 95,
      reward: 'Exceptional squat technique',
      tips: ['Biomechanical perfection', 'Movement efficiency mastery', 'Teaching capability']
    }
  ],

  deadlift: [
    {
      id: 'deadlift_beginner',
      title: 'Deadlift Basics',
      description: 'First proper deadlift form analysis',
      threshold: 1,
      icon: '💪',
      scoreRequirement: 50,
      reward: 'Understanding deadlift fundamentals',
      tips: ['Keep bar close to body', 'Engage core', 'Neutral spine']
    },
    {
      id: 'deadlift_form_foundation',
      title: 'Lifting Foundation',
      description: 'Consistent 70+ form scores in deadlifts',
      threshold: 5,
      icon: '🔩',
      scoreRequirement: 70,
      reward: 'Solid deadlift technique established',
      tips: ['Perfect hip hinge pattern', 'Strengthen posterior chain', 'Work on lockout']
    },
    {
      id: 'deadlift_intermediate',
      title: 'Deadlift Power',
      description: 'Achieved 80+ form score in deadlifts',
      threshold: 10,
      icon: '⚡',
      scoreRequirement: 80,
      reward: 'Advanced deadlift mechanics unlocked',
      tips: ['Optimize starting position', 'Perfect the pull', 'Master breathing technique']
    },
    {
      id: 'deadlift_advanced',
      title: 'Deadlift Mastery',
      description: 'Consistent 90+ form scores',
      threshold: 20,
      icon: '🏆',
      scoreRequirement: 90,
      reward: 'Elite deadlift form achieved',
      tips: ['Focus on speed and power', 'Maintain form under heavy loads', 'Teach perfect technique']
    }
  ],

  push_up: [
    {
      id: 'pushup_beginner',
      title: 'Push-up Basics',
      description: 'First proper push-up form analysis',
      threshold: 1,
      icon: '👐',
      scoreRequirement: 50,
      reward: 'Understanding push-up fundamentals',
      tips: ['Keep body straight', 'Full range of motion', 'Control the movement']
    },
    {
      id: 'pushup_form_foundation',
      title: 'Push-up Foundation',
      description: 'Consistent 70+ form scores in push-ups',
      threshold: 5,
      icon: '🏗️',
      scoreRequirement: 70,
      reward: 'Solid push-up technique established',
      tips: ['Perfect plank position', 'Engage core throughout', 'Focus on scapular control']
    },
    {
      id: 'pushup_intermediate',
      title: 'Push-up Proficiency',
      description: 'Achieved 80+ form score in push-ups',
      threshold: 10,
      icon: '⚡',
      scoreRequirement: 80,
      reward: 'Advanced push-up mechanics unlocked',
      tips: ['Work on tempo variations', 'Perfect hand placement', 'Maintain consistency']
    }
  ],

  // General milestones for all exercises
  general: [
    {
      id: 'first_analysis',
      title: 'First Steps',
      description: 'Completed your first pose analysis',
      threshold: 1,
      icon: '🎯',
      scoreRequirement: 0,
      reward: 'Welcome to form analysis journey',
      tips: ['Regular practice is key', 'Focus on consistency', 'Celebrate small wins']
    },
    {
      id: 'consistency_week',
      title: 'Week Warrior',
      description: 'Analyzed form 7 days in a row',
      threshold: 7,
      icon: '📅',
      scoreRequirement: 60,
      reward: 'Building healthy habits',
      tips: ['Keep the momentum going', 'Quality over quantity', 'Listen to your body']
    },
    {
      id: 'improvement_streak',
      title: 'Progress Streak',
      description: '5 consecutive improvements',
      threshold: 5,
      icon: '📈',
      scoreRequirement: 70,
      reward: 'Steady improvement achieved',
      tips: ['Maintain focus on weak points', 'Stay patient with progress', 'Track your improvements']
    },
    {
      id: 'consistency_master',
      title: 'Consistency Master',
      description: 'Maintained 85%+ consistency score',
      threshold: 15,
      icon: '🎯',
      scoreRequirement: 80,
      reward: 'Reliable form technique',
      tips: ['Consistency is excellence', 'Focus on repeatability', 'Perfect practice makes perfect']
    }
  ]
};

// Milestone Status Types
const MILESTONE_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

const MilestoneCard = ({
  progressData,
  exerciseType = 'general',
  onMilestoneShare,
  onMilestoneAchieved,
  theme,
  style,
}) => {
  const styles = createThemedStyles(getStyles, theme?.isDark ? 'dark' : 'light');
  
  // State management
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [celebrationMilestone, setCelebrationMilestone] = useState(null);
  
  // Animation refs
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const progressAnimations = useRef({}).current;

  // Calculate milestones based on progress data
  useEffect(() => {
    if (progressData) {
      calculateMilestones();
    }
  }, [progressData, exerciseType]);

  // Animate entrance
  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  /**
   * Calculate milestone progress and status
   */
  const calculateMilestones = () => {
    try {
      const exerciseMilestones = MILESTONE_DEFINITIONS[exerciseType] || MILESTONE_DEFINITIONS.general;
      const exerciseData = exerciseType === 'general' 
        ? progressData 
        : progressData.filter(p => p.exerciseType === exerciseType);

      if (!exerciseData.length) {
        // Set all milestones as locked if no data
        const lockedMilestones = exerciseMilestones.map(milestone => ({
          ...milestone,
          status: MILESTONE_STATUS.LOCKED,
          progress: 0,
          currentValue: 0,
          isNewlyUnlocked: false
        }));
        setMilestones(lockedMilestones);
        return;
      }

      const totalSessions = exerciseData.length;
      const scores = exerciseData.map(p => p.overallScore || 0);
      const bestScore = Math.max(...scores);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      // Calculate streaks and consistency
      const { consistentSessions, improvementStreak } = calculateStreaks(exerciseData);

      const calculatedMilestones = exerciseMilestones.map((milestone, index) => {
        let currentValue = 0;
        let progress = 0;
        let status = MILESTONE_STATUS.LOCKED;

        // Determine current value based on milestone type
        switch (milestone.id.split('_')[1]) {
          case 'beginner':
            currentValue = totalSessions;
            break;
          case 'foundation':
            currentValue = scores.filter(score => score >= milestone.scoreRequirement).length;
            break;
          case 'intermediate':
          case 'advanced':
          case 'expert':
            currentValue = scores.filter(score => score >= milestone.scoreRequirement).length;
            break;
          case 'analysis':
            currentValue = totalSessions;
            break;
          case 'warrior':
            currentValue = Math.min(7, totalSessions); // Max 7 for week warrior
            break;
          case 'streak':
            currentValue = improvementStreak;
            break;
          case 'master':
            currentValue = consistentSessions;
            break;
          default:
            currentValue = totalSessions;
        }

        // Calculate progress percentage
        progress = Math.min(100, (currentValue / milestone.threshold) * 100);

        // Determine status
        if (currentValue >= milestone.threshold && bestScore >= milestone.scoreRequirement) {
          status = MILESTONE_STATUS.COMPLETED;
        } else if (progress > 0 && (index === 0 || milestones[index - 1]?.status === MILESTONE_STATUS.COMPLETED)) {
          status = MILESTONE_STATUS.IN_PROGRESS;
        } else if (index === 0 || milestones[index - 1]?.status === MILESTONE_STATUS.COMPLETED) {
          status = MILESTONE_STATUS.AVAILABLE;
        }

        return {
          ...milestone,
          status,
          progress,
          currentValue,
          bestScore: Math.max(...scores.filter((_, i) => exerciseData[i].overallScore >= milestone.scoreRequirement)),
          isNewlyUnlocked: false // Will be calculated when comparing with previous state
        };
      });

      // Check for newly unlocked milestones
      const previousMilestones = milestones;
      calculatedMilestones.forEach((milestone, index) => {
        const previousMilestone = previousMilestones[index];
        if (
          previousMilestone && 
          previousMilestone.status !== MILESTONE_STATUS.COMPLETED &&
          milestone.status === MILESTONE_STATUS.COMPLETED
        ) {
          milestone.isNewlyUnlocked = true;
          
          // Show celebration
          setTimeout(() => {
            showMilestoneCelebration(milestone);
          }, 500);
        }
      });

      setMilestones(calculatedMilestones);
      
    } catch (error) {
      console.error('❌ Error calculating milestones:', error);
    }
  };

  /**
   * Calculate streaks and consistency metrics
   */
  const calculateStreaks = (exerciseData) => {
    const sortedData = [...exerciseData].sort((a, b) => 
      new Date(a.analyzedAt) - new Date(b.analyzedAt)
    );

    let improvementStreak = 0;
    let maxImprovementStreak = 0;
    let consistentSessions = 0;

    // Calculate improvement streak
    for (let i = 1; i < sortedData.length; i++) {
      const current = sortedData[i].overallScore || 0;
      const previous = sortedData[i - 1].overallScore || 0;
      
      if (current > previous) {
        improvementStreak++;
        maxImprovementStreak = Math.max(maxImprovementStreak, improvementStreak);
      } else {
        improvementStreak = 0;
      }
    }

    // Calculate consistent sessions (within 5 points of average)
    const averageScore = sortedData.reduce((sum, p) => sum + (p.overallScore || 0), 0) / sortedData.length;
    consistentSessions = sortedData.filter(p => 
      Math.abs((p.overallScore || 0) - averageScore) <= 5
    ).length;

    return {
      improvementStreak: maxImprovementStreak,
      consistentSessions
    };
  };

  /**
   * Show milestone celebration animation
   */
  const showMilestoneCelebration = (milestone) => {
    setCelebrationMilestone(milestone);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Animation sequence
    Animated.parallel([
      Animated.spring(celebrationScale, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Callback
    if (onMilestoneAchieved) {
      onMilestoneAchieved(milestone);
    }

    // Auto-hide after 4 seconds
    setTimeout(() => {
      hideCelebration();
    }, 4000);
  };

  /**
   * Hide milestone celebration
   */
  const hideCelebration = () => {
    Animated.parallel([
      Animated.timing(celebrationScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCelebrationMilestone(null);
      celebrationScale.setValue(0);
      celebrationOpacity.setValue(0);
    });
  };

  /**
   * Handle milestone sharing
   */
  const handleShareMilestone = async (milestone) => {
    try {
      const message = `🎯 Milestone Achieved!\n\n` +
        `${milestone.icon} ${milestone.title}\n` +
        `${milestone.description}\n\n` +
        `Reward: ${milestone.reward}\n\n` +
        `Keep pushing towards fitness excellence! #FitnessJourney #MilestoneAchieved`;
      
      const result = await Share.share({
        message,
        title: `Milestone: ${milestone.title}`,
      });

      if (onMilestoneShare) {
        onMilestoneShare(milestone, result);
      }
    } catch (error) {
      console.error('❌ Error sharing milestone:', error);
    }
  };

  /**
   * Get status color based on milestone status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case MILESTONE_STATUS.COMPLETED:
        return '#10B981';
      case MILESTONE_STATUS.IN_PROGRESS:
        return theme?.primary || '#FF6B35';
      case MILESTONE_STATUS.AVAILABLE:
        return '#3B82F6';
      case MILESTONE_STATUS.LOCKED:
      default:
        return theme?.text?.tertiary || '#6B7280';
    }
  };

  /**
   * Get status icon based on milestone status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case MILESTONE_STATUS.COMPLETED:
        return 'checkmark-circle';
      case MILESTONE_STATUS.IN_PROGRESS:
        return 'time';
      case MILESTONE_STATUS.AVAILABLE:
        return 'play-circle';
      case MILESTONE_STATUS.LOCKED:
      default:
        return 'lock-closed';
    }
  };

  /**
   * Render milestone card
   */
  const renderMilestoneCard = (milestone, index) => {
    const statusColor = getStatusColor(milestone.status);
    const statusIcon = getStatusIcon(milestone.status);
    const isCompleted = milestone.status === MILESTONE_STATUS.COMPLETED;
    const isLocked = milestone.status === MILESTONE_STATUS.LOCKED;

    return (
      <GlassContainer
        key={milestone.id}
        variant="default"
        style={[
          styles.milestoneCard,
          {
            borderColor: isCompleted ? '#10B981' : statusColor,
            opacity: isLocked ? 0.6 : 1,
          },
          isCompleted && styles.completedCard
        ]}
      >
        <TouchableOpacity
          style={styles.milestoneContent}
          onPress={() => {
            setSelectedMilestone(selectedMilestone === milestone.id ? null : milestone.id);
            if (Platform.OS === 'ios') {
              Haptics.selectionAsync();
            }
          }}
          disabled={isLocked}
          accessible={true}
          accessibilityLabel={`${milestone.title} milestone`}
          accessibilityHint={`${milestone.progress}% complete`}
        >
          {/* Milestone Icon & Status */}
          <View style={styles.milestoneHeader}>
            <View style={[styles.milestoneIcon, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.milestoneEmoji, { opacity: isLocked ? 0.5 : 1 }]}>
                {milestone.icon}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Ionicons
                  name={statusIcon}
                  size={12}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.milestoneInfo}>
              <Text style={[
                styles.milestoneTitle,
                {
                  color: isLocked ? theme?.text?.tertiary : theme?.text?.primary,
                }
              ]}>
                {milestone.title}
              </Text>
              <Text style={[
                styles.milestoneDescription,
                {
                  color: isLocked ? theme?.text?.tertiary : theme?.text?.secondary,
                }
              ]}>
                {milestone.description}
              </Text>
            </View>

            {isCompleted && (
              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: statusColor }]}
                onPress={() => handleShareMilestone(milestone)}
                accessible={true}
                accessibilityLabel="Share milestone"
              >
                <Ionicons name="share" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Progress Indicator */}
          {!isCompleted && milestone.progress > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressLabel, { color: theme?.text?.secondary }]}>
                  Progress: {milestone.currentValue} / {milestone.threshold}
                </Text>
                <Text style={[styles.progressPercentage, { color: statusColor }]}>
                  {Math.round(milestone.progress)}%
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme?.border?.light || '#E5E5E5' }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${milestone.progress}%`,
                      backgroundColor: statusColor,
                    }
                  ]}
                />
              </View>
            </View>
          )}

          {/* Expanded Details */}
          {selectedMilestone === milestone.id && (
            <View style={styles.expandedContent}>
              <View style={styles.rewardSection}>
                <Text style={[styles.rewardLabel, { color: theme?.text?.secondary }]}>
                  Reward
                </Text>
                <Text style={[styles.rewardText, { color: statusColor }]}>
                  {milestone.reward}
                </Text>
              </View>

              {milestone.tips && milestone.tips.length > 0 && (
                <View style={styles.tipsSection}>
                  <Text style={[styles.tipsLabel, { color: theme?.text?.secondary }]}>
                    Tips
                  </Text>
                  {milestone.tips.map((tip, tipIndex) => (
                    <View key={tipIndex} style={styles.tipItem}>
                      <Ionicons
                        name="bulb"
                        size={14}
                        color={theme?.primary || '#FF6B35'}
                        style={styles.tipIcon}
                      />
                      <Text style={[styles.tipText, { color: theme?.text?.secondary }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {milestone.bestScore && (
                <View style={styles.statsSection}>
                  <Text style={[styles.statsLabel, { color: theme?.text?.secondary }]}>
                    Best Score: {Math.round(milestone.bestScore)}%
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </GlassContainer>
    );
  };

  /**
   * Render celebration overlay
   */
  const renderCelebration = () => {
    if (!celebrationMilestone) return null;

    return (
      <Animated.View
        style={[
          styles.celebrationOverlay,
          {
            opacity: celebrationOpacity,
          }
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.celebrationContent,
            {
              transform: [{ scale: celebrationScale }],
            }
          ]}
        >
          <Text style={styles.celebrationEmoji}>
            {celebrationMilestone.icon}
          </Text>
          <Text style={[styles.celebrationTitle, { color: theme?.text?.primary }]}>
            Milestone Achieved!
          </Text>
          <Text style={[styles.celebrationName, { color: '#10B981' }]}>
            {celebrationMilestone.title}
          </Text>
          <Text style={[styles.celebrationDescription, { color: theme?.text?.secondary }]}>
            {celebrationMilestone.description}
          </Text>
          <Text style={[styles.celebrationReward, { color: theme?.primary || '#FF6B35' }]}>
            🎁 {celebrationMilestone.reward}
          </Text>
          <TouchableOpacity
            style={[styles.celebrationButton, { backgroundColor: '#10B981' }]}
            onPress={hideCelebration}
          >
            <Text style={styles.celebrationButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: slideAnimation,
          transform: [{
            translateY: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }
      ]}
    >
      {/* Header */}
      <GlassContainer variant="default" style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme?.text?.primary }]}>
            Milestones
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme?.text?.secondary }]}>
            Track your form improvement journey
          </Text>
        </View>
      </GlassContainer>

      {/* Milestone List */}
      <ScrollView
        style={styles.milestoneList}
        contentContainerStyle={styles.milestoneListContent}
        showsVerticalScrollIndicator={false}
      >
        {milestones.map(renderMilestoneCard)}
      </ScrollView>

      {/* Celebration Overlay */}
      {renderCelebration()}
    </Animated.View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
  },
  milestoneList: {
    flex: 1,
  },
  milestoneListContent: {
    paddingBottom: theme.spacing[8],
  },
  milestoneCard: {
    marginBottom: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  completedCard: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  milestoneContent: {
    padding: theme.spacing[4],
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  milestoneIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
    position: 'relative',
  },
  milestoneEmoji: {
    fontSize: 28,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[1],
  },
  milestoneDescription: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    marginTop: theme.spacing[4],
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressPercentage: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  expandedContent: {
    marginTop: theme.spacing[4],
    paddingTop: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.border?.light || '#E5E5E5',
  },
  rewardSection: {
    marginBottom: theme.spacing[4],
  },
  rewardLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing[1],
  },
  rewardText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tipsSection: {
    marginBottom: theme.spacing[4],
  },
  tipsLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing[2],
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
  },
  tipIcon: {
    marginRight: theme.spacing[2],
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  statsSection: {
    marginTop: theme.spacing[2],
  },
  statsLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  celebrationContent: {
    width: screenWidth * 0.85,
    alignItems: 'center',
    padding: theme.spacing[6],
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.surface?.primary || '#FFFFFF',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  celebrationEmoji: {
    fontSize: 60,
    marginBottom: theme.spacing[4],
  },
  celebrationTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  celebrationName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  celebrationDescription: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  celebrationReward: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  celebrationButton: {
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[8],
    borderRadius: theme.borderRadius.lg,
  },
  celebrationButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

MilestoneCard.displayName = 'MilestoneCard';

export default MilestoneCard;