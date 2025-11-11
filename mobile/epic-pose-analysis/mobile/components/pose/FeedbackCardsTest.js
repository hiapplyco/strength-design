/**
 * Feedback Cards Test Component
 * Test integration with PoseAnalysisService data structures
 * 
 * This component demonstrates the FeedbackCards system with mock data
 * that matches the PoseAnalysisService structure
 */

import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { createThemedStyles } from '../../utils/designTokens';
import FeedbackCards from './FeedbackCards';

// Mock analysis result matching PoseAnalysisService structure
const mockAnalysisResult = {
  success: true,
  analysis: {
    overallScore: 72,
    criticalErrors: [
      {
        type: 'shallow_depth',
        severity: 'medium',
        timeRange: [1200, 2500],
        description: 'Squat depth insufficient - hip crease did not reach below knee level',
        correction: 'Focus on sitting back and down, engage glutes to reach proper depth',
        affectedLandmarks: ['LEFT_HIP', 'RIGHT_HIP'],
        exercisePhase: 'descent'
      },
      {
        type: 'knee_valgus',
        severity: 'high',
        timeRange: [1800, 2200],
        description: 'Knees caving inward during the movement',
        correction: 'Focus on pushing knees out in line with toes, strengthen hip abductors',
        affectedLandmarks: ['LEFT_KNEE', 'RIGHT_KNEE'],
        exercisePhase: 'bottom'
      },
      {
        type: 'forward_lean',
        severity: 'low',
        timeRange: [500, 3000],
        description: 'Slight forward torso lean throughout the movement',
        correction: 'Keep chest up and core engaged, focus on upright posture',
        affectedLandmarks: ['LEFT_SHOULDER', 'RIGHT_SHOULDER'],
        exercisePhase: 'overall'
      }
    ],
    improvements: [
      {
        category: 'depth',
        priority: 'high',
        suggestion: 'Work on ankle and hip mobility to achieve greater squat depth',
        expectedImprovement: 'Better muscle activation and improved strength development'
      },
      {
        category: 'knee_alignment',
        priority: 'high',
        suggestion: 'Incorporate hip strengthening exercises to improve knee tracking',
        expectedImprovement: 'Reduced injury risk and better power transfer'
      },
      {
        category: 'spinal_alignment',
        priority: 'medium',
        suggestion: 'Focus on thoracic spine mobility and core stability',
        expectedImprovement: 'Better posture and reduced back strain'
      },
      {
        category: 'balance',
        priority: 'low',
        suggestion: 'Practice single-leg exercises to improve overall stability',
        expectedImprovement: 'Enhanced body control and coordination'
      },
      {
        category: 'timing',
        priority: 'medium',
        suggestion: 'Work on controlled descent and explosive ascent phases',
        expectedImprovement: 'Better movement efficiency and power development'
      }
    ],
    keyPhases: [
      { type: 'descent', startFrame: 0, endFrame: 45, duration: 1500 },
      { type: 'bottom', startFrame: 45, endFrame: 60, duration: 500 },
      { type: 'ascent', startFrame: 60, endFrame: 105, duration: 1500 }
    ],
    depth: {
      depthScore: 65,
      reachedParallel: false,
      belowParallel: false
    },
    kneeAlignment: {
      kneeTrackingScore: 58,
      valgusCollapse: true,
      maxInwardDeviation: 15
    },
    spinalAlignment: {
      neutralSpine: false,
      forwardLean: 18,
      alignmentScore: 75
    },
    balanceAnalysis: {
      weightDistribution: 'slightly_forward',
      stabilityScore: 78
    }
  },
  processingTime: 2500,
  framesProcessed: 105,
  confidenceMetrics: {
    averageLandmarkConfidence: 0.87,
    framesCoverage: 0.95,
    analysisReliability: 0.82
  }
};

// Another mock for excellent form (empty feedback)
const excellentFormResult = {
  success: true,
  analysis: {
    overallScore: 95,
    criticalErrors: [],
    improvements: [],
    keyPhases: [
      { type: 'descent', startFrame: 0, endFrame: 40, duration: 1200 },
      { type: 'bottom', startFrame: 40, endFrame: 50, duration: 300 },
      { type: 'ascent', startFrame: 50, endFrame: 90, duration: 1200 }
    ]
  }
};

const FeedbackCardsTest = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = createThemedStyles(getStyles, isDarkMode ? 'dark' : 'light');

  // Toggle between different test scenarios
  const [currentScenario, setCurrentScenario] = React.useState('issues');
  
  const scenarios = {
    issues: mockAnalysisResult,
    excellent: excellentFormResult
  };

  const handleFeedbackPress = (feedback) => {
    console.log('Feedback pressed:', feedback);
    // In real implementation, this might navigate to detail view or show modal
  };

  const handleImprovementSelect = (improvement) => {
    console.log('Improvement selected:', improvement);
    // In real implementation, this might add to workout plan or show related exercises
  };

  const toggleScenario = () => {
    setCurrentScenario(prev => prev === 'issues' ? 'excellent' : 'issues');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Test Controls */}
        <View style={styles.testControls}>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: theme.primary }]}
            onPress={toggleScenario}
          >
            <Text style={[styles.toggleButtonText, { color: 'white' }]}>
              {currentScenario === 'issues' ? 'Show Excellent Form' : 'Show Form Issues'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Cards Component */}
        <FeedbackCards
          analysisResult={scenarios[currentScenario]}
          exerciseType="squat"
          onFeedbackPress={handleFeedbackPress}
          onImprovementSelect={handleImprovementSelect}
          showSwipeHint={true}
          maxCardsVisible={3}
          style={styles.feedbackCards}
        />

        {/* Debug Information */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={[styles.debugTitle, { color: theme.text }]}>
              Debug Information
            </Text>
            <Text style={[styles.debugText, { color: theme.textSecondary }]}>
              Current Scenario: {currentScenario}
            </Text>
            <Text style={[styles.debugText, { color: theme.textSecondary }]}>
              Overall Score: {scenarios[currentScenario].analysis.overallScore}
            </Text>
            <Text style={[styles.debugText, { color: theme.textSecondary }]}>
              Critical Errors: {scenarios[currentScenario].analysis.criticalErrors.length}
            </Text>
            <Text style={[styles.debugText, { color: theme.textSecondary }]}>
              Improvements: {scenarios[currentScenario].analysis.improvements.length}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  testControls: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  toggleButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  toggleButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  feedbackCards: {
    minHeight: 600,
  },
  debugInfo: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  debugTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  debugText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    marginBottom: theme.spacing.xs,
  },
});

export default FeedbackCardsTest;