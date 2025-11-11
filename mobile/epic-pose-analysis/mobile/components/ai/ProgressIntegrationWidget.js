/**
 * Progress Integration Widget Component
 * Issue #16 - Stream C: UI Integration & Seamless Experience
 * 
 * Widget that connects form analysis progress with AI coaching suggestions
 * Shows form improvement trends and AI-driven coaching recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const ProgressIntegrationWidget = ({
  formProgressData = null,
  aiRecommendations = null,
  exerciseType = null,
  timeRange = '30d',
  onViewFullProgress = null,
  onApplyRecommendation = null,
  style = {},
}) => {
  const [activeTab, setActiveTab] = useState('progress'); // 'progress', 'recommendations'
  const [animatedValue] = useState(new Animated.Value(0));
  const [progressAnimValue] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate widget entrance
    Animated.spring(animatedValue, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate progress bars
    if (formProgressData) {
      Animated.timing(progressAnimValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [formProgressData]);

  const getProgressColor = (improvement) => {
    if (improvement > 10) return '#4CAF50';
    if (improvement > 0) return '#FFB86B';
    return '#FF6B6B';
  };

  const getTrendIcon = (trend) => {
    if (trend > 5) return 'trending-up';
    if (trend > 0) return 'arrow-up';
    if (trend === 0) return 'remove';
    return 'trending-down';
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return '#4CAF50';
    if (trend === 0) return '#9CA3AF';
    return '#FF6B6B';
  };

  const renderProgressOverview = () => {
    if (!formProgressData) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={32} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No progress data available</Text>
          <Text style={styles.emptyStateSubtext}>
            Complete some form analysis sessions to see your progress
          </Text>
        </View>
      );
    }

    const { overallTrend, keyMetrics, recentSessions } = formProgressData;

    return (
      <View style={styles.progressContent}>
        {/* Overall Trend */}
        <View style={styles.trendContainer}>
          <View style={styles.trendHeader}>
            <Ionicons 
              name={getTrendIcon(overallTrend.improvement)} 
              size={20} 
              color={getTrendColor(overallTrend.improvement)} 
            />
            <Text style={styles.trendTitle}>Overall Progress</Text>
            <Text style={[styles.trendValue, { color: getTrendColor(overallTrend.improvement) }]}>
              {overallTrend.improvement > 0 ? '+' : ''}{overallTrend.improvement}%
            </Text>
          </View>
          
          <Text style={styles.trendDescription}>
            {overallTrend.description || 'Based on your recent form analysis sessions'}
          </Text>
        </View>

        {/* Key Metrics */}
        {keyMetrics && (
          <View style={styles.metricsContainer}>
            <Text style={styles.metricsTitle}>Key Improvements</Text>
            
            {Object.entries(keyMetrics).slice(0, 3).map(([metric, data], index) => (
              <View key={metric} style={styles.metricItem}>
                <Text style={styles.metricName}>{metric.replace(/([A-Z])/g, ' $1')}</Text>
                
                <View style={styles.metricProgress}>
                  <View style={styles.progressBar}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: getProgressColor(data.improvement),
                          width: progressAnimValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${Math.min(Math.abs(data.improvement) * 5, 100)}%`],
                          }),
                        }
                      ]}
                    />
                  </View>
                  
                  <Text style={[styles.metricValue, { color: getProgressColor(data.improvement) }]}>
                    {data.improvement > 0 ? '+' : ''}{data.improvement}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Sessions Summary */}
        {recentSessions?.length > 0 && (
          <View style={styles.sessionsContainer}>
            <Text style={styles.sessionsTitle}>Recent Sessions</Text>
            
            <View style={styles.sessionsList}>
              {recentSessions.slice(0, 5).map((session, index) => (
                <View key={index} style={styles.sessionItem}>
                  <View style={styles.sessionDot} />
                  <Text style={styles.sessionScore}>{Math.round(session.score)}</Text>
                  <Text style={styles.sessionDate}>
                    {new Date(session.date).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAIRecommendations = () => {
    if (!aiRecommendations) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="bulb-outline" size={32} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No recommendations yet</Text>
          <Text style={styles.emptyStateSubtext}>
            AI will provide suggestions based on your form analysis
          </Text>
        </View>
      );
    }

    const { workoutAdjustments, techniqueImprovements, focusAreas } = aiRecommendations;

    return (
      <ScrollView style={styles.recommendationsContent} showsVerticalScrollIndicator={false}>
        {/* Workout Adjustments */}
        {workoutAdjustments?.length > 0 && (
          <View style={styles.recommendationSection}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="fitness" size={18} color="#FFB86B" />
              <Text style={styles.recommendationTitle}>Workout Adjustments</Text>
            </View>
            
            {workoutAdjustments.map((adjustment, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationText}>{adjustment.suggestion}</Text>
                <Text style={styles.recommendationReason}>
                  Reason: {adjustment.reason}
                </Text>
                
                {onApplyRecommendation && (
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => onApplyRecommendation('workout', adjustment)}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                    <Ionicons name="checkmark" size={14} color="#00F0FF" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Technique Improvements */}
        {techniqueImprovements?.length > 0 && (
          <View style={styles.recommendationSection}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="construct" size={18} color="#4CAF50" />
              <Text style={styles.recommendationTitle}>Technique Focus</Text>
            </View>
            
            {techniqueImprovements.map((improvement, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationText}>{improvement.cue}</Text>
                <Text style={styles.recommendationReason}>
                  Impact: {improvement.expectedImprovement}
                </Text>
                
                {improvement.priority === 'high' && (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>High Priority</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Focus Areas */}
        {focusAreas?.length > 0 && (
          <View style={styles.recommendationSection}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="target" size={18} color="#00F0FF" />
              <Text style={styles.recommendationTitle}>Next Training Focus</Text>
            </View>
            
            <View style={styles.focusAreasGrid}>
              {focusAreas.map((area, index) => (
                <View key={index} style={styles.focusAreaItem}>
                  <Text style={styles.focusAreaText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
        onPress={() => setActiveTab('progress')}
      >
        <Ionicons 
          name="trending-up" 
          size={16} 
          color={activeTab === 'progress' ? '#00F0FF' : '#9CA3AF'} 
        />
        <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>
          Progress
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
        onPress={() => setActiveTab('recommendations')}
      >
        <Ionicons 
          name="bulb" 
          size={16} 
          color={activeTab === 'recommendations' ? '#00F0FF' : '#9CA3AF'} 
        />
        <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
          AI Tips
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animatedValue,
          transform: [{ translateY: Animated.multiply(animatedValue, -10) }],
        },
        style,
      ]}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(0, 240, 255, 0.1)', 'rgba(255, 184, 107, 0.05)']}
          style={styles.widgetGradient}
        >
          <View style={styles.widgetContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="analytics" size={20} color="#00F0FF" />
                <Text style={styles.headerTitle}>Form Progress Integration</Text>
              </View>
              
              {onViewFullProgress && (
                <TouchableOpacity
                  style={styles.fullViewButton}
                  onPress={onViewFullProgress}
                >
                  <Ionicons name="expand" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Exercise Type */}
            {exerciseType && (
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseType}>{exerciseType}</Text>
                <Text style={styles.timeRange}>Last {timeRange}</Text>
              </View>
            )}

            {/* Tab Bar */}
            {renderTabBar()}

            {/* Content */}
            <View style={styles.tabContent}>
              {activeTab === 'progress' ? renderProgressOverview() : renderAIRecommendations()}
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  widgetGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  widgetContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F8F9FA',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fullViewButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2E',
  },
  exerciseType: {
    color: '#FFB86B',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeRange: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#00F0FF',
  },
  tabContent: {
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#F8F9FA',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  progressContent: {},
  trendContainer: {
    marginBottom: 20,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendTitle: {
    color: '#F8F9FA',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  trendDescription: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricsTitle: {
    color: '#F8F9FA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  metricItem: {
    marginBottom: 12,
  },
  metricName: {
    color: '#F8F9FA',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  metricProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
  },
  sessionsContainer: {
    marginBottom: 16,
  },
  sessionsTitle: {
    color: '#F8F9FA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  sessionsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionItem: {
    alignItems: 'center',
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB86B',
    marginBottom: 4,
  },
  sessionScore: {
    color: '#F8F9FA',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDate: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
  },
  recommendationsContent: {
    maxHeight: 300,
  },
  recommendationSection: {
    marginBottom: 20,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationTitle: {
    color: '#F8F9FA',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  recommendationItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
  },
  recommendationText: {
    color: '#F8F9FA',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  recommendationReason: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
  },
  applyButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  applyButtonText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '500',
    marginRight: 4,
  },
  priorityBadge: {
    position: 'absolute',
    top: -4,
    left: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '600',
  },
  focusAreasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusAreaItem: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  focusAreaText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ProgressIntegrationWidget;