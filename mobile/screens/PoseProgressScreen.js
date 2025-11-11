/**
 * Pose Progress Screen
 * 
 * Comprehensive dashboard for pose analysis progress tracking with:
 * - Visual progress analytics and trend charts
 * - Achievement system integration with milestone celebrations
 * - Exercise-specific form insights and improvement recommendations  
 * - Social sharing capabilities and progress comparison
 * - Glassmorphism design with smooth animations
 * - Real-time data sync with PoseProgressService
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  Share,
  Haptics,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import { GlassContainer, BlurWrapper } from '../components/GlassmorphismComponents';
import { createThemedStyles } from '../utils/designTokens';
import GlobalContextStatusLine from '../components/GlobalContextStatusLine';
import AchievementSystem from '../components/pose/AchievementSystem';
import ProgressCharts from '../components/pose/ProgressCharts';
import MilestoneCard from '../components/pose/MilestoneCard';
import ProgressComparison from '../components/pose/ProgressComparison';
import CircularProgressChart from '../components/charts/CircularProgressChart';
import poseProgressService from '../services/poseProgressService';
import { auth } from '../firebaseConfig';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Tab Navigation Options
const TABS = [
  { key: 'overview', label: 'Overview', icon: 'stats-chart' },
  { key: 'charts', label: 'Analytics', icon: 'analytics' },
  { key: 'achievements', label: 'Achievements', icon: 'trophy' },
  { key: 'milestones', label: 'Milestones', icon: 'flag' },
];

const PoseProgressScreen = ({ navigation, theme }) => {
  const styles = createThemedStyles(getStyles, theme?.isDark ? 'dark' : 'light');
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [progressData, setProgressData] = useState(null);
  const [overviewStats, setOverviewStats] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // User context
  const [currentUser, setCurrentUser] = useState(null);
  
  // Animation refs
  const scrollViewRef = useRef(null);
  const [selectedExerciseType, setSelectedExerciseType] = useState('all');

  // Initialize screen
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);
      initializeProgressData();
    } else {
      setError('Please sign in to view your progress');
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize all progress data
   */
  const initializeProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize pose progress service if needed
      if (!poseProgressService.isInitialized) {
        await poseProgressService.initialize();
      }
      
      // Load all data in parallel
      await Promise.all([
        loadOverviewStats(),
        loadRecentAchievements(),
        loadProgressData(),
      ]);
      
    } catch (error) {
      console.error('❌ Error initializing progress data:', error);
      setError('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load overview statistics
   */
  const loadOverviewStats = async () => {
    try {
      const allProgress = await poseProgressService.getAllUserProgress();
      
      if (!allProgress.length) {
        setOverviewStats({
          totalSessions: 0,
          averageScore: 0,
          bestScore: 0,
          improvementRate: 0,
          exerciseTypes: [],
          recentTrend: 'stable',
          consistencyScore: 0
        });
        return;
      }

      // Calculate overview metrics
      const totalSessions = allProgress.length;
      const scores = allProgress.map(p => p.overallScore || 0);
      const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      const bestScore = Math.max(...scores);
      
      // Get exercise types
      const exerciseTypes = [...new Set(allProgress.map(p => p.exerciseType))];
      
      // Calculate recent trend (last 10 vs previous 10)
      const recentSessions = allProgress.slice(0, Math.min(10, allProgress.length));
      const olderSessions = allProgress.slice(10, Math.min(20, allProgress.length));
      
      let recentTrend = 'stable';
      let improvementRate = 0;
      
      if (recentSessions.length >= 5 && olderSessions.length >= 5) {
        const recentAvg = recentSessions.reduce((sum, p) => sum + (p.overallScore || 0), 0) / recentSessions.length;
        const olderAvg = olderSessions.reduce((sum, p) => sum + (p.overallScore || 0), 0) / olderSessions.length;
        
        improvementRate = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
        
        if (improvementRate > 5) {
          recentTrend = 'improving';
        } else if (improvementRate < -5) {
          recentTrend = 'declining';
        }
      }
      
      // Calculate consistency
      const consistencyScore = calculateConsistency(scores);
      
      // Get exercise-specific summaries
      const exerciseSummaries = {};
      for (const exerciseType of exerciseTypes) {
        const exerciseData = allProgress.filter(p => p.exerciseType === exerciseType);
        const exerciseScores = exerciseData.map(p => p.overallScore || 0);
        
        exerciseSummaries[exerciseType] = {
          sessionCount: exerciseData.length,
          averageScore: Math.round(exerciseScores.reduce((sum, score) => sum + score, 0) / exerciseScores.length),
          bestScore: Math.max(...exerciseScores),
          lastAnalysis: exerciseData[0]?.analyzedAt,
          improvement: calculateExerciseImprovement(exerciseData)
        };
      }

      setOverviewStats({
        totalSessions,
        averageScore,
        bestScore,
        improvementRate,
        exerciseTypes,
        recentTrend,
        consistencyScore,
        exerciseSummaries,
        lastAnalysis: allProgress[0]?.analyzedAt
      });
      
    } catch (error) {
      console.error('❌ Error loading overview stats:', error);
    }
  };

  /**
   * Calculate consistency score
   */
  const calculateConsistency = (scores) => {
    if (scores.length < 2) return 100;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, Math.round(100 - (stdDev / mean) * 100));
  };

  /**
   * Calculate improvement for specific exercise
   */
  const calculateExerciseImprovement = (exerciseData) => {
    if (exerciseData.length < 6) return 0;
    
    const sortedData = [...exerciseData].sort((a, b) => new Date(a.analyzedAt) - new Date(b.analyzedAt));
    const recentSessions = sortedData.slice(-3);
    const olderSessions = sortedData.slice(-6, -3);
    
    const recentAvg = recentSessions.reduce((sum, p) => sum + (p.overallScore || 0), 0) / recentSessions.length;
    const olderAvg = olderSessions.reduce((sum, p) => sum + (p.overallScore || 0), 0) / olderSessions.length;
    
    return Math.round(recentAvg - olderAvg);
  };

  /**
   * Load recent achievements
   */
  const loadRecentAchievements = async () => {
    try {
      // This would typically come from a dedicated achievements service
      // For now, we'll use placeholder data based on progress
      const allProgress = await poseProgressService.getAllUserProgress();
      
      const achievements = [];
      
      // Check for recent personal bests
      const recentPersonalBests = allProgress
        .filter(p => p.isPersonalBest)
        .slice(0, 3)
        .map(p => ({
          id: `pb_${p.id}`,
          type: 'personal_best',
          title: 'Personal Best!',
          description: `New high score of ${p.overallScore} for ${getExerciseName(p.exerciseType)}`,
          icon: '🏆',
          earnedAt: p.analyzedAt,
          exerciseType: p.exerciseType
        }));
      
      achievements.push(...recentPersonalBests);
      
      // Check for consistency achievements
      if (overviewStats?.consistencyScore >= 90) {
        achievements.push({
          id: 'consistency_master',
          type: 'consistency',
          title: 'Consistency Master',
          description: 'Maintained excellent form consistency',
          icon: '🎯',
          earnedAt: new Date(),
        });
      }
      
      setRecentAchievements(achievements.slice(0, 5));
      
    } catch (error) {
      console.error('❌ Error loading recent achievements:', error);
    }
  };

  /**
   * Load detailed progress data
   */
  const loadProgressData = async () => {
    try {
      const data = await poseProgressService.getAllUserProgress();
      setProgressData(data);
    } catch (error) {
      console.error('❌ Error loading progress data:', error);
    }
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
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await initializeProgressData();
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Handle tab change
   */
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  };

  /**
   * Handle share progress
   */
  const handleShareProgress = async () => {
    try {
      if (!overviewStats) return;
      
      const message = `🏋️ My fitness form progress:\n\n` +
        `📊 Average Score: ${overviewStats.averageScore}%\n` +
        `🏆 Best Score: ${overviewStats.bestScore}%\n` +
        `📈 Sessions: ${overviewStats.totalSessions}\n` +
        `🎯 Consistency: ${overviewStats.consistencyScore}%\n\n` +
        `Keep pushing towards perfect form! #FitnessJourney #FormAnalysis`;
      
      const result = await Share.share({
        message,
        title: 'My Fitness Progress',
      });
      
      // Track sharing action
      console.log('📤 Progress shared:', result);
      
    } catch (error) {
      console.error('❌ Error sharing progress:', error);
    }
  };

  /**
   * Navigate to pose analysis
   */
  const handleStartAnalysis = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    navigation?.navigate('PoseAnalysisUpload');
  };

  /**
   * Render overview tab content
   */
  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme?.primary || '#FF6B35'}
        />
      }
    >
      {/* Progress Summary Cards */}
      <View style={styles.summaryGrid}>
        <GlassContainer variant="default" style={styles.summaryCard}>
          <CircularProgressChart
            score={overviewStats?.averageScore || 0}
            size={70}
            strokeWidth={8}
            showPercentage={true}
            progressColor={theme?.primary || '#FF6B35'}
            backgroundColor={theme?.border?.light || '#E5E5E5'}
            textColor={theme?.text?.primary || '#000000'}
            fontSize={16}
          />
          <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
            Average Score
          </Text>
        </GlassContainer>

        <GlassContainer variant="default" style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: theme?.text?.primary }]}>
            {overviewStats?.bestScore || 0}%
          </Text>
          <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
            Best Score
          </Text>
        </GlassContainer>
      </View>

      <View style={styles.summaryGrid}>
        <GlassContainer variant="default" style={styles.summaryCard}>
          <View style={styles.trendContainer}>
            <Text style={[styles.summaryValue, { color: theme?.text?.primary }]}>
              {overviewStats?.totalSessions || 0}
            </Text>
            {overviewStats?.recentTrend === 'improving' && (
              <Ionicons name="trending-up" size={20} color="#10B981" />
            )}
            {overviewStats?.recentTrend === 'declining' && (
              <Ionicons name="trending-down" size={20} color="#EF4444" />
            )}
          </View>
          <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
            Total Sessions
          </Text>
        </GlassContainer>

        <GlassContainer variant="default" style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: theme?.text?.primary }]}>
            {overviewStats?.consistencyScore || 0}%
          </Text>
          <Text style={[styles.summaryLabel, { color: theme?.text?.secondary }]}>
            Consistency
          </Text>
        </GlassContainer>
      </View>

      {/* Exercise Type Breakdown */}
      {overviewStats?.exerciseTypes?.length > 0 && (
        <GlassContainer variant="default" style={styles.exerciseBreakdown}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme?.text?.primary }]}>
              Exercise Breakdown
            </Text>
            <Ionicons
              name="fitness"
              size={20}
              color={theme?.text?.secondary || '#6C757D'}
            />
          </View>
          
          {overviewStats.exerciseTypes.map((exerciseType) => {
            const summary = overviewStats.exerciseSummaries?.[exerciseType];
            if (!summary) return null;
            
            return (
              <TouchableOpacity
                key={exerciseType}
                style={styles.exerciseItem}
                onPress={() => setSelectedExerciseType(exerciseType)}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: theme?.text?.primary }]}>
                    {getExerciseName(exerciseType)}
                  </Text>
                  <Text style={[styles.exerciseStats, { color: theme?.text?.secondary }]}>
                    {summary.sessionCount} sessions • Avg: {summary.averageScore}%
                  </Text>
                </View>
                
                <View style={styles.exerciseMetrics}>
                  {summary.improvement > 0 && (
                    <View style={[styles.improvementBadge, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.improvementText}>+{summary.improvement}</Text>
                    </View>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme?.text?.tertiary || '#9CA3AF'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </GlassContainer>
      )}

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <GlassContainer variant="default" style={styles.recentAchievements}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme?.text?.primary }]}>
              Recent Achievements
            </Text>
            <TouchableOpacity onPress={() => setActiveTab('achievements')}>
              <Text style={[styles.sectionLink, { color: theme?.primary || '#FF6B35' }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          {recentAchievements.slice(0, 3).map((achievement, index) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, { color: theme?.text?.primary }]}>
                  {achievement.title}
                </Text>
                <Text style={[styles.achievementDescription, { color: theme?.text?.secondary }]}>
                  {achievement.description}
                </Text>
              </View>
            </View>
          ))}
        </GlassContainer>
      )}

      {/* Quick Actions */}
      <GlassContainer variant="default" style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.primaryAction, { backgroundColor: theme?.primary || '#FF6B35' }]}
          onPress={handleStartAnalysis}
        >
          <Ionicons name="camera" size={24} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Start New Analysis</Text>
        </TouchableOpacity>
        
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={handleShareProgress}
          >
            <Ionicons name="share" size={20} color={theme?.primary || '#FF6B35'} />
            <Text style={[styles.secondaryActionText, { color: theme?.primary || '#FF6B35' }]}>
              Share Progress
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => setActiveTab('charts')}
          >
            <Ionicons name="analytics" size={20} color={theme?.primary || '#FF6B35'} />
            <Text style={[styles.secondaryActionText, { color: theme?.primary || '#FF6B35' }]}>
              View Analytics
            </Text>
          </TouchableOpacity>
        </View>
      </GlassContainer>
    </ScrollView>
  );

  /**
   * Render tab content based on active tab
   */
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <GlassContainer variant="default" style={styles.loadingContainer}>
          <Ionicons
            name="stats-chart"
            size={48}
            color={theme?.text?.tertiary || '#6C757D'}
          />
          <Text style={[styles.loadingText, { color: theme?.text?.secondary }]}>
            Loading your progress...
          </Text>
        </GlassContainer>
      );
    }

    if (error) {
      return (
        <GlassContainer variant="default" style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={theme?.semantic?.error?.primary || '#DC2626'}
          />
          <Text style={[styles.errorText, { color: theme?.semantic?.error?.primary || '#DC2626' }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme?.primary || '#FF6B35' }]}
            onPress={initializeProgressData}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </GlassContainer>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'charts':
        return (
          <ProgressCharts
            exerciseType={selectedExerciseType}
            onExerciseSelect={setSelectedExerciseType}
            onDataRefresh={handleRefresh}
            theme={theme}
          />
        );
      case 'achievements':
        return (
          <AchievementSystem
            userId={currentUser?.uid}
            onAchievementUnlocked={(achievement) => {
              console.log('🏆 Achievement unlocked:', achievement);
            }}
            onShareAchievement={(achievement) => {
              console.log('📤 Achievement shared:', achievement);
            }}
            theme={theme}
          />
        );
      case 'milestones':
        return (
          <View style={styles.tabContent}>
            <MilestoneCard
              progressData={progressData}
              onMilestoneShare={(milestone) => {
                console.log('📤 Milestone shared:', milestone);
              }}
              theme={theme}
            />
            <ProgressComparison
              progressData={progressData}
              onComparisonShare={(comparison) => {
                console.log('📤 Comparison shared:', comparison);
              }}
              theme={theme}
            />
          </View>
        );
      default:
        return renderOverviewTab();
    }
  };

  /**
   * Render tab bar
   */
  const renderTabBar = () => (
    <GlassContainer variant="navigation" style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              {
                backgroundColor: isActive 
                  ? `${theme?.primary || '#FF6B35'}15` 
                  : 'transparent'
              }
            ]}
            onPress={() => handleTabChange(tab.key)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${tab.label} tab`}
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? theme?.primary || '#FF6B35' : theme?.text?.secondary || '#6C757D'}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive 
                    ? theme?.primary || '#FF6B35' 
                    : theme?.text?.secondary || '#6C757D'
                }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </GlassContainer>
  );

  return (
    <SafeLinearGradient
      colors={theme?.isDarkMode 
        ? ['#000000', '#0A0A0A', '#141414'] 
        : ['#FFFFFF', '#F8F9FA', '#F0F1F3']
      }
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
            accessible={true}
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme?.text?.primary || '#000000'}
            />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme?.text?.primary || '#000000' }]}>
            Progress Dashboard
          </Text>
          
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleShareProgress}
            accessible={true}
            accessibilityLabel="Share progress"
          >
            <Ionicons
              name="share-outline"
              size={24}
              color={theme?.text?.primary || '#000000'}
            />
          </TouchableOpacity>
        </View>
        
        <GlobalContextStatusLine />
      </View>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </SafeLinearGradient>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: theme.spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[2],
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[1],
    borderRadius: theme.borderRadius.md,
  },
  tabLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing[1],
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing[4],
    marginHorizontal: theme.spacing[1],
    borderRadius: theme.borderRadius.lg,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[2],
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  exerciseBreakdown: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sectionLink: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.border?.light || '#E5E5E5',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing[1],
  },
  exerciseStats: {
    fontSize: theme.typography.fontSize.sm,
  },
  exerciseMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  improvementBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing[2],
  },
  improvementText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  recentAchievements: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
  },
  achievementEmoji: {
    fontSize: 24,
    marginRight: theme.spacing[3],
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing[1],
  },
  achievementDescription: {
    fontSize: theme.typography.fontSize.sm,
  },
  quickActions: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[4],
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing[2],
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    marginHorizontal: theme.spacing[1],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border?.light || '#E5E5E5',
  },
  secondaryActionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[1],
  },
  loadingContainer: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[8],
    marginHorizontal: theme.spacing[4],
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[6],
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
});

PoseProgressScreen.displayName = 'PoseProgressScreen';

export default PoseProgressScreen;