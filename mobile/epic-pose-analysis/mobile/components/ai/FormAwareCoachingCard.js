/**
 * Form-Aware Coaching Card Component
 * Issue #16 - Stream C: UI Integration & Seamless Experience
 * 
 * Visual indicator component that displays form context status and coaching insights
 * Provides seamless integration between pose analysis and AI chat experience
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const FormAwareCoachingCard = ({
  formMetrics = null,
  coachingInsights = null,
  isActive = false,
  exerciseType = null,
  coachingStyle = 'supportive',
  onViewDetails = null,
  onAdjustSettings = null,
  style = {},
}) => {
  const [expanded, setExpanded] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [pulseValue] = useState(new Animated.Value(1));

  useEffect(() => {
    // Animate card entrance when activated
    if (isActive) {
      Animated.spring(animatedValue, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Start pulse animation for active state
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      animatedValue.setValue(0);
      pulseValue.setValue(1);
    }
  }, [isActive]);

  const getFormScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFB86B';
    return '#FF6B6B';
  };

  const getCoachingStyleIcon = (style) => {
    switch (style) {
      case 'technical':
        return 'construct';
      case 'direct':
        return 'flash';
      case 'supportive':
      default:
        return 'heart';
    }
  };

  const renderFormMetrics = () => {
    if (!formMetrics) return null;

    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Form Analysis</Text>
        
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreText, { color: getFormScoreColor(formMetrics.overallScore) }]}>
              {Math.round(formMetrics.overallScore)}
            </Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
          
          <View style={styles.scoreDetails}>
            <Text style={styles.exerciseType}>{exerciseType}</Text>
            <Text style={styles.timestamp}>
              {new Date(formMetrics.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {formMetrics.keyErrors?.length > 0 && (
          <View style={styles.errorsContainer}>
            <Text style={styles.errorTitle}>Key Areas to Improve:</Text>
            {formMetrics.keyErrors.slice(0, 2).map((error, index) => (
              <View key={index} style={styles.errorItem}>
                <Ionicons name="warning" size={14} color="#FFB86B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ))}
          </View>
        )}

        {formMetrics.improvements?.length > 0 && (
          <View style={styles.improvementsContainer}>
            <Text style={styles.improvementTitle}>Improvements Detected:</Text>
            {formMetrics.improvements.slice(0, 2).map((improvement, index) => (
              <View key={index} style={styles.improvementItem}>
                <Ionicons name="trending-up" size={14} color="#4CAF50" />
                <Text style={styles.improvementText}>{improvement}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderCoachingInsights = () => {
    if (!coachingInsights) return null;

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>AI Coaching Insights</Text>
        
        {coachingInsights.keyPoints?.map((point, index) => (
          <View key={index} style={styles.insightItem}>
            <Ionicons name="bulb" size={14} color="#00F0FF" />
            <Text style={styles.insightText}>{point}</Text>
          </View>
        ))}

        {coachingInsights.nextFocus && (
          <View style={styles.nextFocusContainer}>
            <Text style={styles.nextFocusTitle}>Next Training Focus:</Text>
            <Text style={styles.nextFocusText}>{coachingInsights.nextFocus}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderActiveIndicator = () => (
    <Animated.View 
      style={[
        styles.activeIndicator,
        {
          transform: [{ scale: pulseValue }],
          opacity: animatedValue,
        }
      ]}
    >
      <LinearGradient
        colors={['#00F0FF40', '#FFB86B40']}
        style={styles.indicatorGradient}
      >
        <Ionicons name="analytics" size={20} color="#00F0FF" />
        <Text style={styles.activeText}>Form-Aware AI Active</Text>
        <View style={styles.statusDot} />
      </LinearGradient>
    </Animated.View>
  );

  if (!isActive && !formMetrics) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animatedValue,
          transform: [{ translateY: Animated.multiply(animatedValue, 10) }],
        },
        style,
      ]}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(255, 184, 107, 0.1)', 'rgba(0, 240, 255, 0.05)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            {/* Active Indicator */}
            {isActive && renderActiveIndicator()}

            {/* Coaching Style Indicator */}
            <View style={styles.coachingStyleContainer}>
              <Ionicons 
                name={getCoachingStyleIcon(coachingStyle)} 
                size={16} 
                color="#FFB86B" 
              />
              <Text style={styles.coachingStyleText}>
                {coachingStyle.charAt(0).toUpperCase() + coachingStyle.slice(1)} Coaching
              </Text>
            </View>

            {/* Form Metrics */}
            {renderFormMetrics()}

            {/* Coaching Insights */}
            {expanded && renderCoachingInsights()}

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              {coachingInsights && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setExpanded(!expanded)}
                >
                  <Text style={styles.expandButtonText}>
                    {expanded ? 'Show Less' : 'View Insights'}
                  </Text>
                  <Ionicons 
                    name={expanded ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color="#00F0FF" 
                  />
                </TouchableOpacity>
              )}

              {onAdjustSettings && (
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={onAdjustSettings}
                >
                  <Ionicons name="settings" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
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
  cardGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 107, 0.2)',
  },
  cardContent: {
    padding: 16,
  },
  activeIndicator: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeText: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F0FF',
  },
  coachingStyleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coachingStyleText: {
    color: '#FFB86B',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  sectionTitle: {
    color: '#F8F9FA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  metricsContainer: {
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
  },
  scoreDetails: {
    flex: 1,
  },
  exerciseType: {
    color: '#F8F9FA',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  errorsContainer: {
    marginTop: 12,
  },
  errorTitle: {
    color: '#FFB86B',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  errorText: {
    color: '#F8F9FA',
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  improvementsContainer: {
    marginTop: 12,
  },
  improvementTitle: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  improvementText: {
    color: '#F8F9FA',
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  insightsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2B2E',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightText: {
    color: '#F8F9FA',
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  nextFocusContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  nextFocusTitle: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  nextFocusText: {
    color: '#F8F9FA',
    fontSize: 13,
    lineHeight: 18,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2B2E',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  expandButtonText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  settingsButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default FormAwareCoachingCard;