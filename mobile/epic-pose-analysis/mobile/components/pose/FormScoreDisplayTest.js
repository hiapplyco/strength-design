/**
 * Form Score Display Test Component
 * Test and demonstration component for form score visualization
 * Validates integration with PoseAnalysisService data structures
 * 
 * Features:
 * - Mock data generation matching PoseAnalysisService structure
 * - Component integration testing
 * - Accessibility validation testing
 * - Performance testing with various score ranges
 * - Real-time data simulation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';
import { createThemedStyles } from '../../utils/designTokens';
import FormScoreDisplay from './FormScoreDisplay';
import AccessibilityValidator from './AccessibilityValidator';
import poseAnalysisService from '../../services/poseDetection/PoseAnalysisService';
import { ExerciseType } from '../../services/poseDetection/types';

// Mock analysis results for different score ranges
const generateMockAnalysisResult = (overallScore, exerciseType = ExerciseType.SQUAT) => {
  const phases = exerciseType === ExerciseType.SQUAT
    ? ['descent', 'bottom', 'ascent']
    : exerciseType === ExerciseType.BASEBALL_PITCH
    ? ['windup', 'stride', 'cocking', 'acceleration', 'follow_through']
    : ['preparation', 'execution', 'recovery'];

  const criticalErrors = overallScore < 60 ? [
    {
      type: 'shallow_depth',
      severity: 'medium',
      timeRange: [1000, 2000],
      description: 'Squat depth insufficient - hip crease did not reach below knee level',
      correction: 'Focus on sitting back and down, engage glutes to reach proper depth',
      affectedLandmarks: [23, 24], // Hip landmarks
    },
    ...(overallScore < 40 ? [{
      type: 'knee_cave',
      severity: 'high',
      timeRange: [1500, 2500],
      description: 'Knees caving inward during descent',
      correction: 'Focus on pushing knees out in line with toes',
      affectedLandmarks: [25, 26], // Knee landmarks
    }] : []),
  ] : [];

  const improvements = [
    {
      category: 'depth',
      priority: overallScore < 80 ? 'high' : 'medium',
      suggestion: 'Work on ankle and hip mobility to achieve greater squat depth',
      expectedImprovement: 'Better muscle activation and improved strength development',
    },
    {
      category: 'balance',
      priority: 'medium',
      suggestion: 'Focus on maintaining centered weight distribution',
      expectedImprovement: 'Improved stability and reduced injury risk',
    },
  ];

  const keyPhases = phases.map((phaseType, index) => ({
    type: phaseType,
    startFrame: index * 15,
    endFrame: (index + 1) * 15,
    duration: 1500,
    keyMetrics: {
      [`${phaseType}Score`]: Math.max(40, Math.min(100, overallScore + (Math.random() * 20 - 10))),
    },
  }));

  const analysisData = {
    overallScore,
    criticalErrors,
    improvements,
    keyPhases,
    timing: {
      totalDuration: 4500,
      phaseTimings: {
        descent: 1500,
        bottom: 500,
        ascent: 1500,
      },
      tempoScore: Math.max(60, overallScore),
      rhythmConsistency: 0.85,
    },
    jointAngles: [], // Would be populated with actual joint angle data
    movementPattern: {
      phases: keyPhases,
      tempo: {
        descendDuration: 1500,
        ascentDuration: 1500,
        totalDuration: 3500,
      },
      consistency: 0.85,
      smoothness: 0.9,
    },
    confidenceScore: 0.85,
    
    // Exercise-specific metrics (squat example)
    depth: {
      maxDepth: Math.max(60, overallScore),
      reachedParallel: overallScore >= 60,
      belowParallel: overallScore >= 80,
      depthScore: Math.max(60, overallScore),
      consistency: 0.9,
    },
    kneeAlignment: {
      kneeTrackingScore: Math.max(50, overallScore - 10),
      valgusCollapse: overallScore < 60,
      maxInwardDeviation: overallScore < 60 ? 15 : 8,
      consistencyScore: 0.85,
    },
    spinalAlignment: {
      neutralSpine: overallScore >= 70,
      forwardLean: overallScore >= 70 ? 10 : 25,
      lateralDeviation: 2,
      alignmentScore: Math.max(60, overallScore),
    },
    balanceAnalysis: {
      weightDistribution: 'centered',
      stabilityScore: Math.max(70, overallScore - 5),
      sway: overallScore >= 80 ? 3 : 8,
    },
  };

  return {
    success: true,
    analysis: analysisData,
    errors: [],
    warnings: overallScore < 70 ? ['Lower confidence in some movement phases due to lighting conditions'] : [],
    processingTime: 2500,
    framesProcessed: 90,
    confidenceMetrics: {
      averageLandmarkConfidence: 0.85,
      framesCoverage: 0.95,
      analysisReliability: 0.85,
      qualityIndicators: {
        lighting: overallScore >= 80 ? 'good' : 'fair',
        visibility: 'clear',
        stability: 'stable',
      },
    },
  };
};

const TEST_SCENARIOS = [
  { name: 'Excellent Form', score: 95, exerciseType: ExerciseType.SQUAT },
  { name: 'Good Form', score: 82, exerciseType: ExerciseType.SQUAT },
  { name: 'Fair Form', score: 68, exerciseType: ExerciseType.SQUAT },
  { name: 'Poor Form', score: 45, exerciseType: ExerciseType.SQUAT },
  { name: 'Baseball Pitch - Good', score: 88, exerciseType: ExerciseType.BASEBALL_PITCH },
  { name: 'Push-up - Fair', score: 72, exerciseType: ExerciseType.PUSH_UP },
];

const FormScoreDisplayTest = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = createThemedStyles(getStyles, isDarkMode ? 'dark' : 'light');

  // State management
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accessibilityReport, setAccessibilityReport] = useState(null);
  const [showAccessibilityReport, setShowAccessibilityReport] = useState(false);
  const [liveScore, setLiveScore] = useState(85);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  const liveScoreInterval = useRef(null);

  // Initialize with first scenario
  useEffect(() => {
    loadTestScenario(0);
  }, []);

  // Live score simulation
  useEffect(() => {
    if (isLiveMode) {
      liveScoreInterval.current = setInterval(() => {
        setLiveScore(prev => {
          const variation = (Math.random() - 0.5) * 10;
          return Math.max(30, Math.min(100, prev + variation));
        });
      }, 1000);
    } else {
      if (liveScoreInterval.current) {
        clearInterval(liveScoreInterval.current);
      }
    }

    return () => {
      if (liveScoreInterval.current) {
        clearInterval(liveScoreInterval.current);
      }
    };
  }, [isLiveMode]);

  // Load test scenario
  const loadTestScenario = async (scenarioIndex) => {
    setIsLoading(true);
    setSelectedScenario(scenarioIndex);
    
    // Simulate loading delay
    setTimeout(() => {
      const scenario = TEST_SCENARIOS[scenarioIndex];
      const mockResult = generateMockAnalysisResult(scenario.score, scenario.exerciseType);
      setAnalysisResult(mockResult);
      setIsLoading(false);
    }, 500);
  };

  // Test with PoseAnalysisService
  const testWithPoseService = async () => {
    setIsLoading(true);
    
    try {
      // Initialize the service
      await poseAnalysisService.initialize();
      
      // This would normally use a real video file
      const mockVideoUri = 'mock://video/squat-analysis.mp4';
      const result = await poseAnalysisService.analyzeVideoFile(
        mockVideoUri,
        ExerciseType.SQUAT,
        { saveToHistory: false }
      );
      
      setAnalysisResult(result);
      Alert.alert('Success', 'Analysis completed with PoseAnalysisService');
    } catch (error) {
      console.error('PoseAnalysisService test error:', error);
      Alert.alert('Error', `PoseAnalysisService test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Run accessibility validation
  const runAccessibilityValidation = async () => {
    if (!analysisResult) return;

    const scenario = TEST_SCENARIOS[selectedScenario];
    const validationProps = {
      scoreColor: theme.primary,
      backgroundColor: theme.background.primary,
      textColor: theme.text.primary,
      fontSize: 32,
      descriptionFontSize: 16,
      touchTargetWidth: 160,
      touchTargetHeight: 160,
      accessibilityLabel: `Form score ${analysisResult.analysis.overallScore} out of 100`,
    };

    const report = AccessibilityValidator.validatePoseAnalysisAccessibility(
      'FormScoreDisplay',
      validationProps
    );

    // Get device accessibility settings
    const deviceSettings = await AccessibilityValidator.getAccessibilitySettings();
    const recommendations = AccessibilityValidator.generateAccessibilityRecommendations(deviceSettings);

    setAccessibilityReport({
      ...report,
      deviceSettings,
      recommendations,
    });
    setShowAccessibilityReport(true);
  };

  // Handle score press
  const handleScorePress = (score, category) => {
    Alert.alert(
      'Score Details',
      `Overall Score: ${score}%\nCategory: ${category.label}\n\n${category.description}`,
      [{ text: 'OK' }]
    );
  };

  // Handle phase press
  const handlePhasePress = (phase, score) => {
    Alert.alert(
      'Phase Details',
      `Phase: ${phase}\nScore: ${score}%`,
      [{ text: 'OK' }]
    );
  };

  // Toggle live mode
  const toggleLiveMode = () => {
    if (isLiveMode) {
      setIsLiveMode(false);
      loadTestScenario(selectedScenario);
    } else {
      setIsLiveMode(true);
      setAnalysisResult(generateMockAnalysisResult(liveScore, ExerciseType.SQUAT));
    }
  };

  // Update live mode analysis
  useEffect(() => {
    if (isLiveMode) {
      setAnalysisResult(generateMockAnalysisResult(liveScore, ExerciseType.SQUAT));
    }
  }, [liveScore, isLiveMode]);

  const currentScenario = TEST_SCENARIOS[selectedScenario];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text.primary }]}>
            Form Score Display Test
          </Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
            Testing integration with PoseAnalysisService
          </Text>
        </View>

        {/* Test Scenario Selector */}
        <GlassContainer variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Test Scenarios
          </Text>
          <View style={styles.scenarioGrid}>
            {TEST_SCENARIOS.map((scenario, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.scenarioButton,
                  selectedScenario === index && {
                    backgroundColor: theme.primary + '20',
                    borderColor: theme.primary,
                  }
                ]}
                onPress={() => loadTestScenario(index)}
                disabled={isLoading}
              >
                <Text style={[
                  styles.scenarioText,
                  { color: selectedScenario === index ? theme.primary : theme.text.primary }
                ]}>
                  {scenario.name}
                </Text>
                <Text style={[styles.scenarioScore, { color: theme.text.secondary }]}>
                  {scenario.score}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassContainer>

        {/* Control Panel */}
        <GlassContainer variant="default" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Controls
          </Text>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.primary + '20' }]}
              onPress={testWithPoseService}
              disabled={isLoading}
            >
              <Ionicons name="flask" size={20} color={theme.primary} />
              <Text style={[styles.controlButtonText, { color: theme.primary }]}>
                Test Service
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.semantic.info.background }]}
              onPress={runAccessibilityValidation}
              disabled={!analysisResult}
            >
              <Ionicons name="accessibility" size={20} color={theme.semantic.info.primary} />
              <Text style={[styles.controlButtonText, { color: theme.semantic.info.primary }]}>
                Accessibility
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton, 
                { backgroundColor: isLiveMode ? theme.semantic.success.background : theme.semantic.warning.background }
              ]}
              onPress={toggleLiveMode}
            >
              <Ionicons 
                name={isLiveMode ? "stop" : "play"} 
                size={20} 
                color={isLiveMode ? theme.semantic.success.primary : theme.semantic.warning.primary} 
              />
              <Text style={[
                styles.controlButtonText, 
                { color: isLiveMode ? theme.semantic.success.primary : theme.semantic.warning.primary }
              ]}>
                {isLiveMode ? 'Stop Live' : 'Live Mode'}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassContainer>

        {/* Current Scenario Info */}
        {!isLiveMode && (
          <GlassContainer variant="default" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Current Test: {currentScenario?.name}
            </Text>
            <Text style={[styles.scenarioInfo, { color: theme.text.secondary }]}>
              Exercise: {currentScenario?.exerciseType} | Target Score: {currentScenario?.score}%
            </Text>
          </GlassContainer>
        )}

        {/* Live Mode Info */}
        {isLiveMode && (
          <GlassContainer variant="default" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Live Simulation Mode
            </Text>
            <Text style={[styles.scenarioInfo, { color: theme.text.secondary }]}>
              Real-time score updates: {Math.round(liveScore)}%
            </Text>
          </GlassContainer>
        )}

        {/* Main Component Test */}
        {analysisResult && !isLoading && (
          <View style={styles.componentTest}>
            <FormScoreDisplay
              analysisResult={analysisResult}
              exerciseType={currentScenario?.exerciseType || ExerciseType.SQUAT}
              showBreakdown={true}
              showPhaseScores={true}
              animated={!isLiveMode}
              size="normal"
              onScorePress={handleScorePress}
              onPhasePress={handlePhasePress}
              accessibilityLabel={`Test form score ${analysisResult.analysis.overallScore} out of 100`}
            />
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <GlassContainer variant="default" style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.text.primary }]}>
              Loading analysis result...
            </Text>
          </GlassContainer>
        )}

        {/* Accessibility Report */}
        {showAccessibilityReport && accessibilityReport && (
          <GlassContainer variant="elevated" style={styles.accessibilityReport}>
            <View style={styles.reportHeader}>
              <Text style={[styles.reportTitle, { color: theme.text.primary }]}>
                Accessibility Validation Report
              </Text>
              <TouchableOpacity
                onPress={() => setShowAccessibilityReport(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reportSummary}>
              <Text style={[styles.summaryText, { color: theme.text.primary }]}>
                Issues: {accessibilityReport.summary.totalIssues} | 
                Warnings: {accessibilityReport.summary.totalWarnings}
              </Text>
              <Text style={[
                styles.complianceStatus,
                { color: accessibilityReport.passes ? theme.semantic.success.primary : theme.semantic.error.primary }
              ]}>
                {accessibilityReport.passes ? '✅ WCAG AA Compliant' : '❌ Issues Found'}
              </Text>
            </View>

            {accessibilityReport.issues.length > 0 && (
              <View style={styles.issuesList}>
                <Text style={[styles.issuesTitle, { color: theme.semantic.error.primary }]}>
                  Issues:
                </Text>
                {accessibilityReport.issues.map((issue, index) => (
                  <Text key={index} style={[styles.issueText, { color: theme.text.primary }]}>
                    • {issue.message}
                  </Text>
                ))}
              </View>
            )}
          </GlassContainer>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
  },
  section: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  scenarioButton: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border.medium,
    backgroundColor: theme.background.secondary,
  },
  scenarioText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  scenarioScore: {
    fontSize: theme.typography.fontSize.xs,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  controlButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  scenarioInfo: {
    fontSize: theme.typography.fontSize.sm,
  },
  componentTest: {
    margin: theme.spacing.md,
  },
  loadingContainer: {
    margin: theme.spacing.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
  },
  accessibilityReport: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  reportTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  reportSummary: {
    marginBottom: theme.spacing.md,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.base,
    marginBottom: theme.spacing.xs,
  },
  complianceStatus: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  issuesList: {
    marginTop: theme.spacing.md,
  },
  issuesTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  issueText: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
});

export default FormScoreDisplayTest;