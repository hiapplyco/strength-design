/**
 * Achievement System Component
 * 
 * Comprehensive gamification system for pose analysis with meaningful milestones,
 * progressive challenges, and social sharing capabilities.
 * 
 * Features:
 * - Milestone-based achievements for form improvement
 * - Consistency tracking and streak rewards
 * - Exercise mastery progression system  
 * - Visual celebration animations with haptic feedback
 * - Social sharing and progress comparison
 * - Glassmorphism design with accessibility support
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
  Alert,
  Share,
  Haptics,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer, BlurWrapper } from '../GlassmorphismComponents';
import { createThemedStyles } from '../../utils/designTokens';
import CircularProgressChart from '../charts/CircularProgressChart';
import poseProgressService from '../../services/poseProgressService';

const { width: screenWidth } = Dimensions.get('window');

// Achievement Types and Categories
const ACHIEVEMENT_CATEGORIES = {
  FORM_MASTERY: 'form_mastery',
  CONSISTENCY: 'consistency', 
  PERSONAL_BESTS: 'personal_bests',
  DEDICATION: 'dedication',
  EXPERTISE: 'expertise',
  SOCIAL: 'social'
};

// Achievement Definitions with progressive milestones
const ACHIEVEMENTS = {
  // Form Mastery Achievements
  first_analysis: {
    id: 'first_analysis',
    category: ACHIEVEMENT_CATEGORIES.FORM_MASTERY,
    title: 'First Steps',
    description: 'Completed your first pose analysis',
    icon: '🎯',
    points: 10,
    rarity: 'common',
    requirements: { totalSessions: 1 }
  },
  good_form_milestone: {
    id: 'good_form_milestone',
    category: ACHIEVEMENT_CATEGORIES.FORM_MASTERY,
    title: 'Good Form',
    description: 'Achieved 70+ form score',
    icon: '✅',
    points: 25,
    rarity: 'common',
    requirements: { minScore: 70 }
  },
  great_form_milestone: {
    id: 'great_form_milestone',
    category: ACHIEVEMENT_CATEGORIES.FORM_MASTERY,
    title: 'Great Form',
    description: 'Achieved 80+ form score',
    icon: '⭐',
    points: 50,
    rarity: 'uncommon',
    requirements: { minScore: 80 }
  },
  excellent_form_milestone: {
    id: 'excellent_form_milestone',
    category: ACHIEVEMENT_CATEGORIES.FORM_MASTERY,
    title: 'Excellent Form',
    description: 'Achieved 90+ form score',
    icon: '🌟',
    points: 100,
    rarity: 'rare',
    requirements: { minScore: 90 }
  },
  perfect_form_milestone: {
    id: 'perfect_form_milestone',
    category: ACHIEVEMENT_CATEGORIES.FORM_MASTERY,
    title: 'Perfect Form',
    description: 'Achieved 95+ form score',
    icon: '💎',
    points: 200,
    rarity: 'legendary',
    requirements: { minScore: 95 }
  },

  // Personal Best Achievements
  first_personal_best: {
    id: 'first_personal_best',
    category: ACHIEVEMENT_CATEGORIES.PERSONAL_BESTS,
    title: 'Personal Best',
    description: 'Set your first personal best score',
    icon: '🏆',
    points: 30,
    rarity: 'common',
    requirements: { personalBests: 1 }
  },
  improvement_streak_3: {
    id: 'improvement_streak_3',
    category: ACHIEVEMENT_CATEGORIES.PERSONAL_BESTS,
    title: 'On Fire',
    description: '3 consecutive improvements',
    icon: '🔥',
    points: 50,
    rarity: 'uncommon',
    requirements: { improvementStreak: 3 }
  },
  improvement_streak_5: {
    id: 'improvement_streak_5',
    category: ACHIEVEMENT_CATEGORIES.PERSONAL_BESTS,
    title: 'Unstoppable',
    description: '5 consecutive improvements',
    icon: '🚀',
    points: 100,
    rarity: 'rare',
    requirements: { improvementStreak: 5 }
  },

  // Consistency Achievements
  consistent_performer: {
    id: 'consistent_performer',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    title: 'Consistent Performer',
    description: 'Maintained 85%+ consistency score',
    icon: '🎯',
    points: 75,
    rarity: 'uncommon',
    requirements: { consistencyScore: 85 }
  },
  daily_streak_7: {
    id: 'daily_streak_7',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    title: 'Week Warrior',
    description: '7 days in a row of analysis',
    icon: '📅',
    points: 100,
    rarity: 'rare',
    requirements: { dailyStreak: 7 }
  },
  daily_streak_30: {
    id: 'daily_streak_30',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    title: 'Monthly Master',
    description: '30 days in a row of analysis',
    icon: '🏅',
    points: 300,
    rarity: 'legendary',
    requirements: { dailyStreak: 30 }
  },

  // Exercise Expertise
  squat_specialist: {
    id: 'squat_specialist',
    category: ACHIEVEMENT_CATEGORIES.EXPERTISE,
    title: 'Squat Specialist',
    description: 'Completed 20+ squat analyses',
    icon: '🏋️',
    points: 100,
    rarity: 'rare',
    requirements: { exerciseType: 'squat', sessionCount: 20 }
  },
  deadlift_expert: {
    id: 'deadlift_expert',
    category: ACHIEVEMENT_CATEGORIES.EXPERTISE,
    title: 'Deadlift Expert',
    description: 'Completed 20+ deadlift analyses',
    icon: '💪',
    points: 100,
    rarity: 'rare',
    requirements: { exerciseType: 'deadlift', sessionCount: 20 }
  },
  multi_exercise_master: {
    id: 'multi_exercise_master',
    category: ACHIEVEMENT_CATEGORIES.EXPERTISE,
    title: 'Multi-Exercise Master',
    description: 'Analyzed 5+ different exercise types',
    icon: '🎖️',
    points: 150,
    rarity: 'epic',
    requirements: { uniqueExercises: 5 }
  },

  // Volume Achievements
  century_club: {
    id: 'century_club',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    title: 'Century Club',
    description: 'Completed 100 analyses',
    icon: '💯',
    points: 500,
    rarity: 'legendary',
    requirements: { totalSessions: 100 }
  },
};

// Rarity Colors and Effects
const RARITY_STYLES = {
  common: {
    color: '#6B7280',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: '#6B7280',
    glow: false
  },
  uncommon: {
    color: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: '#059669',
    glow: false
  },
  rare: {
    color: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: '#2563EB',
    glow: true
  },
  epic: {
    color: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderColor: '#7C3AED',
    glow: true
  },
  legendary: {
    color: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: '#DC2626',
    glow: true
  }
};

const AchievementSystem = ({
  userId,
  onAchievementUnlocked,
  onShareAchievement,
  theme,
  style,
}) => {
  const styles = createThemedStyles(getStyles, theme?.isDark ? 'dark' : 'light');
  
  // State management
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [celebrationAnimation, setCelebrationAnimation] = useState(null);
  
  // Animation values
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const achievementListAnimation = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  // Load achievement data on mount
  useEffect(() => {
    loadAchievementData();
  }, [userId]);

  // Start pulse animation for new achievements
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  /**
   * Load user achievement data and progress
   */
  const loadAchievementData = async () => {
    try {
      setIsLoading(true);
      
      // Get user progress data
      const allProgress = await poseProgressService.getAllUserProgress();
      const stats = calculateUserStats(allProgress);
      setUserStats(stats);
      
      // Evaluate achievements
      const evaluatedAchievements = evaluateAllAchievements(stats);
      setAchievements(evaluatedAchievements);
      
      // Animate list entrance
      Animated.timing(achievementListAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('❌ Error loading achievement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calculate comprehensive user statistics
   */
  const calculateUserStats = (progressData) => {
    if (!progressData.length) return null;

    const exerciseTypes = [...new Set(progressData.map(p => p.exerciseType))];
    const scores = progressData.map(p => p.overallScore || 0);
    
    // Calculate streaks
    const streaks = calculateStreaks(progressData);
    
    // Calculate consistency
    const consistency = calculateConsistency(scores);
    
    // Personal bests count
    const personalBests = progressData.filter(p => p.isPersonalBest).length;
    
    // Exercise-specific stats
    const exerciseStats = {};
    exerciseTypes.forEach(type => {
      const exerciseData = progressData.filter(p => p.exerciseType === type);
      exerciseStats[type] = {
        sessionCount: exerciseData.length,
        averageScore: exerciseData.reduce((sum, p) => sum + (p.overallScore || 0), 0) / exerciseData.length,
        bestScore: Math.max(...exerciseData.map(p => p.overallScore || 0))
      };
    });

    return {
      totalSessions: progressData.length,
      uniqueExercises: exerciseTypes.length,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      bestScore: Math.max(...scores),
      personalBests,
      consistencyScore: consistency,
      dailyStreak: streaks.current,
      longestStreak: streaks.longest,
      improvementStreak: calculateImprovementStreak(progressData),
      exerciseStats,
      lastAnalysis: progressData[0]?.analyzedAt
    };
  };

  /**
   * Calculate current and longest streaks
   */
  const calculateStreaks = (progressData) => {
    const sortedData = [...progressData].sort((a, b) => 
      new Date(b.analyzedAt) - new Date(a.analyzedAt)
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    const today = new Date();
    let lastDate = null;

    for (const session of sortedData) {
      const sessionDate = new Date(session.analyzedAt);
      
      if (lastDate) {
        const dayDiff = Math.floor((lastDate - sessionDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else if (dayDiff > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        // Check if today or yesterday for current streak
        const daysSinceToday = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
        if (daysSinceToday <= 1) {
          currentStreak = 1;
        }
      }
      
      lastDate = sessionDate;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Calculate current streak more precisely
    if (sortedData.length > 0) {
      const recentSessions = sortedData.slice(0, 30); // Last 30 sessions
      currentStreak = 1;
      
      for (let i = 1; i < recentSessions.length; i++) {
        const prevDate = new Date(recentSessions[i-1].analyzedAt);
        const currDate = new Date(recentSessions[i].analyzedAt);
        const dayDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { current: currentStreak, longest: longestStreak };
  };

  /**
   * Calculate improvement streak
   */
  const calculateImprovementStreak = (progressData) => {
    const sortedData = [...progressData].sort((a, b) => 
      new Date(a.analyzedAt) - new Date(b.analyzedAt)
    );

    let streak = 0;
    let maxStreak = 0;

    for (let i = 1; i < sortedData.length; i++) {
      const currentScore = sortedData[i].overallScore || 0;
      const previousScore = sortedData[i-1].overallScore || 0;
      
      if (currentScore > previousScore) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }

    return maxStreak;
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
   * Evaluate all achievements against user stats
   */
  const evaluateAllAchievements = (stats) => {
    if (!stats) return [];

    return Object.values(ACHIEVEMENTS).map(achievement => {
      const isUnlocked = checkAchievementRequirements(achievement.requirements, stats);
      const progress = calculateAchievementProgress(achievement.requirements, stats);
      
      return {
        ...achievement,
        isUnlocked,
        progress,
        unlockedAt: isUnlocked ? stats.lastAnalysis : null
      };
    }).sort((a, b) => {
      // Sort by: unlocked first, then by rarity, then by points
      if (a.isUnlocked !== b.isUnlocked) {
        return b.isUnlocked - a.isUnlocked;
      }
      
      const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
      const aRarityIndex = rarityOrder.indexOf(a.rarity);
      const bRarityIndex = rarityOrder.indexOf(b.rarity);
      
      if (aRarityIndex !== bRarityIndex) {
        return aRarityIndex - bRarityIndex;
      }
      
      return b.points - a.points;
    });
  };

  /**
   * Check if achievement requirements are met
   */
  const checkAchievementRequirements = (requirements, stats) => {
    for (const [key, value] of Object.entries(requirements)) {
      switch (key) {
        case 'totalSessions':
          if (stats.totalSessions < value) return false;
          break;
        case 'minScore':
          if (stats.bestScore < value) return false;
          break;
        case 'personalBests':
          if (stats.personalBests < value) return false;
          break;
        case 'consistencyScore':
          if (stats.consistencyScore < value) return false;
          break;
        case 'dailyStreak':
          if (stats.dailyStreak < value) return false;
          break;
        case 'improvementStreak':
          if (stats.improvementStreak < value) return false;
          break;
        case 'uniqueExercises':
          if (stats.uniqueExercises < value) return false;
          break;
        case 'exerciseType':
          const exerciseStats = stats.exerciseStats[value];
          const sessionCount = requirements.sessionCount || 1;
          if (!exerciseStats || exerciseStats.sessionCount < sessionCount) return false;
          break;
        default:
          break;
      }
    }
    return true;
  };

  /**
   * Calculate achievement progress percentage
   */
  const calculateAchievementProgress = (requirements, stats) => {
    let totalProgress = 0;
    let requirementCount = 0;

    for (const [key, value] of Object.entries(requirements)) {
      requirementCount++;
      
      switch (key) {
        case 'totalSessions':
          totalProgress += Math.min(1, stats.totalSessions / value);
          break;
        case 'minScore':
          totalProgress += Math.min(1, stats.bestScore / value);
          break;
        case 'personalBests':
          totalProgress += Math.min(1, stats.personalBests / value);
          break;
        case 'consistencyScore':
          totalProgress += Math.min(1, stats.consistencyScore / value);
          break;
        case 'dailyStreak':
          totalProgress += Math.min(1, stats.dailyStreak / value);
          break;
        case 'improvementStreak':
          totalProgress += Math.min(1, stats.improvementStreak / value);
          break;
        case 'uniqueExercises':
          totalProgress += Math.min(1, stats.uniqueExercises / value);
          break;
        case 'exerciseType':
          const exerciseStats = stats.exerciseStats[value];
          const sessionCount = requirements.sessionCount || 1;
          const currentCount = exerciseStats ? exerciseStats.sessionCount : 0;
          totalProgress += Math.min(1, currentCount / sessionCount);
          break;
        case 'sessionCount':
          // This is handled as part of exerciseType
          requirementCount--;
          break;
        default:
          requirementCount--;
          break;
      }
    }

    return requirementCount > 0 ? (totalProgress / requirementCount) * 100 : 0;
  };

  /**
   * Show achievement celebration
   */
  const showAchievementCelebration = (achievement) => {
    setCelebrationAnimation(achievement);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Animation sequence
    Animated.parallel([
      Animated.spring(celebrationScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after 3 seconds
    setTimeout(() => {
      hideCelebration();
    }, 3000);
  };

  /**
   * Hide achievement celebration
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
      setCelebrationAnimation(null);
      celebrationScale.setValue(0);
      celebrationOpacity.setValue(0);
    });
  };

  /**
   * Handle achievement sharing
   */
  const handleShareAchievement = async (achievement) => {
    try {
      const message = `🎉 Just unlocked "${achievement.title}" in my fitness journey! ${achievement.description} #FitnessAchievement #PoseAnalysis`;
      
      const result = await Share.share({
        message,
        title: 'Fitness Achievement Unlocked!',
      });

      if (onShareAchievement) {
        onShareAchievement(achievement, result);
      }
    } catch (error) {
      console.error('❌ Error sharing achievement:', error);
    }
  };

  /**
   * Filter achievements by category
   */
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(achievement => achievement.category === selectedCategory);
  }, [achievements, selectedCategory]);

  /**
   * Get category display info
   */
  const getCategoryInfo = (category) => {
    const categoryMap = {
      all: { name: 'All', icon: 'trophy' },
      [ACHIEVEMENT_CATEGORIES.FORM_MASTERY]: { name: 'Form', icon: 'checkmark-circle' },
      [ACHIEVEMENT_CATEGORIES.PERSONAL_BESTS]: { name: 'Records', icon: 'trending-up' },
      [ACHIEVEMENT_CATEGORIES.CONSISTENCY]: { name: 'Consistency', icon: 'repeat' },
      [ACHIEVEMENT_CATEGORIES.DEDICATION]: { name: 'Dedication', icon: 'calendar' },
      [ACHIEVEMENT_CATEGORIES.EXPERTISE]: { name: 'Expertise', icon: 'school' },
    };
    
    return categoryMap[category] || { name: category, icon: 'star' };
  };

  /**
   * Render achievement card
   */
  const renderAchievementCard = (achievement) => {
    const rarityStyle = RARITY_STYLES[achievement.rarity] || RARITY_STYLES.common;
    const progressPercentage = Math.round(achievement.progress);

    return (
      <GlassContainer
        key={achievement.id}
        variant="default"
        style={[
          styles.achievementCard,
          {
            borderColor: rarityStyle.borderColor,
            backgroundColor: achievement.isUnlocked ? rarityStyle.backgroundColor : 'rgba(0, 0, 0, 0.05)',
          },
          rarityStyle.glow && achievement.isUnlocked && styles.glowEffect
        ]}
      >
        <TouchableOpacity
          style={styles.achievementContent}
          onPress={() => {
            if (achievement.isUnlocked) {
              showAchievementCelebration(achievement);
            }
          }}
          accessible={true}
          accessibilityLabel={`${achievement.title} achievement`}
          accessibilityHint={achievement.isUnlocked ? 'Unlocked achievement' : `${progressPercentage}% progress`}
        >
          {/* Achievement Icon */}
          <View style={[
            styles.achievementIcon,
            { backgroundColor: rarityStyle.backgroundColor }
          ]}>
            <Text style={[styles.achievementEmoji, { opacity: achievement.isUnlocked ? 1 : 0.3 }]}>
              {achievement.icon}
            </Text>
            {achievement.isUnlocked && (
              <Animated.View
                style={[
                  styles.achievementBadge,
                  {
                    backgroundColor: rarityStyle.color,
                    transform: [{ scale: pulseAnimation }]
                  }
                ]}
              >
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </Animated.View>
            )}
          </View>

          {/* Achievement Info */}
          <View style={styles.achievementInfo}>
            <View style={styles.achievementHeader}>
              <Text style={[
                styles.achievementTitle,
                {
                  color: achievement.isUnlocked ? theme?.text?.primary || '#000000' : theme?.text?.tertiary || '#6C757D',
                  opacity: achievement.isUnlocked ? 1 : 0.6
                }
              ]}>
                {achievement.title}
              </Text>
              <Text style={[styles.achievementPoints, { color: rarityStyle.color }]}>
                +{achievement.points}
              </Text>
            </View>
            
            <Text style={[
              styles.achievementDescription,
              { color: theme?.text?.secondary || '#495057', opacity: achievement.isUnlocked ? 1 : 0.6 }
            ]}>
              {achievement.description}
            </Text>

            {/* Progress Bar */}
            {!achievement.isUnlocked && achievement.progress > 0 && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme?.border?.light || '#E5E5E5' }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progressPercentage}%`,
                        backgroundColor: rarityStyle.color
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: theme?.text?.tertiary }]}>
                  {progressPercentage}%
                </Text>
              </View>
            )}

            {/* Unlocked Date */}
            {achievement.isUnlocked && achievement.unlockedAt && (
              <Text style={[styles.unlockedDate, { color: theme?.text?.tertiary }]}>
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Share Button */}
          {achievement.isUnlocked && (
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: rarityStyle.color }]}
              onPress={() => handleShareAchievement(achievement)}
              accessible={true}
              accessibilityLabel="Share achievement"
            >
              <Ionicons name="share" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </GlassContainer>
    );
  };

  /**
   * Render category selector
   */
  const renderCategorySelector = () => {
    const categories = ['all', ...Object.values(ACHIEVEMENT_CATEGORIES)];
    
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
        style={styles.categoryContainer}
      >
        {categories.map((category) => {
          const categoryInfo = getCategoryInfo(category);
          const isSelected = selectedCategory === category;
          
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: isSelected ? theme?.primary || '#FF6B35' : 'transparent',
                  borderColor: isSelected ? 'transparent' : theme?.border?.light || '#E5E5E5',
                }
              ]}
              onPress={() => setSelectedCategory(category)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${categoryInfo.name}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Ionicons
                name={categoryInfo.icon}
                size={16}
                color={isSelected ? '#FFFFFF' : theme?.text?.secondary || '#495057'}
                style={styles.categoryIcon}
              />
              <Text
                style={[
                  styles.categoryText,
                  { color: isSelected ? '#FFFFFF' : theme?.text?.secondary || '#495057' }
                ]}
              >
                {categoryInfo.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  /**
   * Render achievement summary stats
   */
  const renderAchievementSummary = () => {
    if (!userStats) return null;

    const unlockedCount = achievements.filter(a => a.isUnlocked).length;
    const totalPoints = achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0);
    
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryGrid}>
          <GlassContainer variant="default" style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: theme?.text?.primary }]}>
              {unlockedCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
              Unlocked
            </Text>
          </GlassContainer>
          
          <GlassContainer variant="default" style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: theme?.text?.primary }]}>
              {totalPoints}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
              Points
            </Text>
          </GlassContainer>
          
          <GlassContainer variant="default" style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: theme?.text?.primary }]}>
              {userStats.dailyStreak}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
              Day Streak
            </Text>
          </GlassContainer>
        </View>
      </View>
    );
  };

  /**
   * Render celebration overlay
   */
  const renderCelebration = () => {
    if (!celebrationAnimation) return null;

    const rarityStyle = RARITY_STYLES[celebrationAnimation.rarity] || RARITY_STYLES.common;

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
              backgroundColor: rarityStyle.backgroundColor,
              borderColor: rarityStyle.color,
            }
          ]}
        >
          <Text style={styles.celebrationEmoji}>
            {celebrationAnimation.icon}
          </Text>
          <Text style={[styles.celebrationTitle, { color: theme?.text?.primary }]}>
            Achievement Unlocked!
          </Text>
          <Text style={[styles.celebrationName, { color: rarityStyle.color }]}>
            {celebrationAnimation.title}
          </Text>
          <Text style={[styles.celebrationDescription, { color: theme?.text?.secondary }]}>
            {celebrationAnimation.description}
          </Text>
          <TouchableOpacity
            style={[styles.celebrationButton, { backgroundColor: rarityStyle.color }]}
            onPress={hideCelebration}
          >
            <Text style={styles.celebrationButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <GlassContainer variant="default" style={styles.loadingContainer}>
        <Animated.View
          style={{
            transform: [{
              rotate: achievementListAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              })
            }]
          }}
        >
          <Ionicons
            name="trophy"
            size={32}
            color={theme?.text?.tertiary || '#6C757D'}
          />
        </Animated.View>
        <Text style={[styles.loadingText, { color: theme?.text?.secondary }]}>
          Loading achievements...
        </Text>
      </GlassContainer>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Achievement Summary */}
      {renderAchievementSummary()}

      {/* Category Selector */}
      {renderCategorySelector()}

      {/* Achievement List */}
      <Animated.View
        style={[
          styles.achievementList,
          {
            opacity: achievementListAnimation,
            transform: [{
              translateY: achievementListAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredAchievements.map(renderAchievementCard)}
        </ScrollView>
      </Animated.View>

      {/* Celebration Overlay */}
      {renderCelebration()}
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[8],
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    marginTop: theme.spacing[4],
  },
  summaryContainer: {
    marginBottom: theme.spacing[4],
  },
  summaryGrid: {
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
  },
  categoryContainer: {
    marginBottom: theme.spacing[4],
  },
  categoryScrollContent: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing[2],
    borderWidth: 1,
  },
  categoryIcon: {
    marginRight: theme.spacing[1],
  },
  categoryText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  achievementList: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  achievementCard: {
    marginBottom: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glowEffect: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
    position: 'relative',
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[1],
  },
  achievementTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    flex: 1,
  },
  achievementPoints: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: theme.spacing[2],
  },
  achievementDescription: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    marginBottom: theme.spacing[2],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: theme.spacing[2],
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    minWidth: 35,
    textAlign: 'right',
  },
  unlockedDate: {
    fontSize: theme.typography.fontSize.xs,
    fontStyle: 'italic',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing[2],
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
    width: screenWidth * 0.8,
    alignItems: 'center',
    padding: theme.spacing[6],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
  },
  celebrationEmoji: {
    fontSize: 48,
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
    marginBottom: theme.spacing[6],
  },
  celebrationButton: {
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
    borderRadius: theme.borderRadius.md,
  },
  celebrationButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

AchievementSystem.displayName = 'AchievementSystem';

export default AchievementSystem;