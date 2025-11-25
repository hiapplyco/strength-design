/**
 * AchievementSystem - Achievement tracking and display component
 * Shows unlocked achievements, badges, and progress towards new achievements
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'trophy' },
  { id: 'milestones', label: 'Milestones', icon: 'flag' },
  { id: 'consistency', label: 'Consistency', icon: 'calendar' },
  { id: 'mastery', label: 'Mastery', icon: 'star' },
];

const MOCK_ACHIEVEMENTS = [
  {
    id: 'first_analysis',
    title: 'First Steps',
    description: 'Complete your first pose analysis',
    icon: '🎯',
    category: 'milestones',
    unlocked: true,
    unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'perfect_form',
    title: 'Perfect Form',
    description: 'Score 95% or higher on an analysis',
    icon: '⭐',
    category: 'mastery',
    unlocked: true,
    unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '7_day_streak',
    title: 'Week Warrior',
    description: 'Maintain a 7-day analysis streak',
    icon: '🔥',
    category: 'consistency',
    unlocked: false,
    progress: 5,
    goal: 7,
  },
  {
    id: '10_analyses',
    title: 'Dedicated Trainer',
    description: 'Complete 10 pose analyses',
    icon: '💪',
    category: 'milestones',
    unlocked: false,
    progress: 7,
    goal: 10,
  },
];

export default function AchievementSystem({
  userId,
  onAchievementUnlocked,
  onShareAchievement,
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

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [achievements, setAchievements] = useState(MOCK_ACHIEVEMENTS);

  const filteredAchievements = achievements.filter(
    achievement => selectedCategory === 'all' || achievement.category === selectedCategory
  );

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const handleShareAchievement = (achievement) => {
    if (onShareAchievement) {
      onShareAchievement(achievement);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Progress Overview */}
      <GlassContainer variant="medium" style={styles.overview}>
        <View style={styles.overviewHeader}>
          <View style={styles.trophyIcon}>
            <Ionicons name="trophy" size={32} color="#F59E0B" />
          </View>
          <View style={styles.overviewStats}>
            <Text style={[styles.overviewValue, { color: activeTheme.text }]}>
              {unlockedCount}/{totalCount}
            </Text>
            <Text style={[styles.overviewLabel, { color: activeTheme.textSecondary }]}>
              Achievements Unlocked
            </Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressBarTrack, { backgroundColor: activeTheme.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(unlockedCount / totalCount) * 100}%`,
                  backgroundColor: activeTheme.primary || '#FF6B35',
                },
              ]}
            />
          </View>
        </View>
      </GlassContainer>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categories}
      >
        {ACHIEVEMENT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              {
                backgroundColor: selectedCategory === category.id
                  ? `${activeTheme.primary || '#FF6B35'}20`
                  : 'transparent',
              },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon}
              size={18}
              color={
                selectedCategory === category.id
                  ? activeTheme.primary || '#FF6B35'
                  : activeTheme.textSecondary
              }
            />
            <Text
              style={[
                styles.categoryLabel,
                {
                  color: selectedCategory === category.id
                    ? activeTheme.primary || '#FF6B35'
                    : activeTheme.textSecondary,
                },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievement Cards */}
      <View style={styles.achievementsList}>
        {filteredAchievements.map((achievement) => (
          <GlassContainer
            key={achievement.id}
            variant={achievement.unlocked ? 'medium' : 'subtle'}
            style={[
              styles.achievementCard,
              !achievement.unlocked && styles.achievementCardLocked,
            ]}
          >
            <View style={styles.achievementContent}>
              <View
                style={[
                  styles.achievementIcon,
                  {
                    backgroundColor: achievement.unlocked
                      ? `${activeTheme.primary || '#FF6B35'}20`
                      : activeTheme.border,
                  },
                ]}
              >
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
              </View>

              <View style={styles.achievementInfo}>
                <Text
                  style={[
                    styles.achievementTitle,
                    {
                      color: achievement.unlocked
                        ? activeTheme.text
                        : activeTheme.textSecondary,
                    },
                  ]}
                >
                  {achievement.title}
                </Text>
                <Text style={[styles.achievementDescription, { color: activeTheme.textSecondary }]}>
                  {achievement.description}
                </Text>

                {/* Progress for locked achievements */}
                {!achievement.unlocked && achievement.progress !== undefined && (
                  <View style={styles.achievementProgress}>
                    <View style={[styles.achievementProgressBar, { backgroundColor: activeTheme.border }]}>
                      <View
                        style={[
                          styles.achievementProgressFill,
                          {
                            width: `${(achievement.progress / achievement.goal) * 100}%`,
                            backgroundColor: activeTheme.primary || '#FF6B35',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.achievementProgressText, { color: activeTheme.textSecondary }]}>
                      {achievement.progress}/{achievement.goal}
                    </Text>
                  </View>
                )}

                {/* Unlock date for unlocked achievements */}
                {achievement.unlocked && achievement.unlockedAt && (
                  <Text style={[styles.achievementDate, { color: activeTheme.textTertiary }]}>
                    Unlocked {formatDate(achievement.unlockedAt)}
                  </Text>
                )}
              </View>

              {achievement.unlocked && (
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShareAchievement(achievement)}
                  accessibilityLabel={`Share ${achievement.title} achievement`}
                  accessibilityRole="button"
                >
                  <Ionicons name="share-social" size={20} color={activeTheme.primary || '#FF6B35'} />
                </TouchableOpacity>
              )}
            </View>
          </GlassContainer>
        ))}
      </View>
    </ScrollView>
  );
}

function formatDate(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overview: {
    padding: 20,
    marginBottom: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trophyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  overviewStats: {
    flex: 1,
  },
  overviewValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  overviewLabel: {
    fontSize: 14,
  },
  progressBar: {
    marginTop: 8,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categories: {
    gap: 8,
    paddingHorizontal: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  achievementsList: {
    gap: 12,
    paddingBottom: 20,
  },
  achievementCard: {
    padding: 16,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  achievementProgress: {
    marginTop: 8,
  },
  achievementProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementProgressText: {
    fontSize: 12,
  },
  achievementDate: {
    fontSize: 12,
    marginTop: 4,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
