/**
 * RecordingGuidance - Context-Sensitive Recording Help
 * 
 * Intelligent guidance component that appears during video recording to help users
 * optimize their setup and technique for accurate pose analysis results.
 * 
 * Features:
 * - Real-time camera positioning feedback
 * - Lighting condition detection and guidance
 * - Exercise-specific setup recommendations
 * - Pre-recording checklist and validation
 * - Dynamic help content based on recording context
 * - Integration with tutorial services for personalized tips
 * - Accessibility support with voice guidance options
 * - Performance optimized for real-time feedback
 * 
 * Integration Points:
 * - TutorialService for contextual content delivery
 * - ContentDeliveryService for optimized media loading
 * - Video recording interface for real-time feedback
 * - Pose analysis pipeline for setup validation
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Services
import tutorialService from '../../services/tutorialService';
import contentDeliveryService from '../../services/contentDeliveryService';

// Design System
import { createThemedStyles, colors, spacing, borderRadius, typography } from '../../utils/designTokens';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Recording setup criteria and validation
const SETUP_CRITERIA = {
  camera: {
    distance: {
      min: 6, // feet
      max: 10,
      optimal: 8
    },
    height: {
      squat: 'waist-level',
      deadlift: 'waist-level',
      pushup: 'ground-level',
      default: 'chest-level'
    },
    angle: {
      primary: 'side-view',
      secondary: 'front-view',
      avoid: '45-degree'
    }
  },
  lighting: {
    conditions: ['natural', 'overhead', 'front-lit'],
    avoid: ['backlit', 'shadowy', 'mixed'],
    minLux: 300
  },
  environment: {
    background: ['solid-wall', 'contrasting'],
    avoid: ['busy', 'similar-color', 'moving'],
    space: {
      width: 6, // feet minimum
      depth: 4
    }
  }
};

// Exercise-specific guidance content
const EXERCISE_GUIDANCE = {
  squat: {
    title: 'Squat Recording Setup',
    primaryView: 'Side view captures depth and knee tracking',
    keyPoints: [
      'Camera at waist height',
      'Full body visible in frame',
      'Side angle shows knee/hip movement',
      'Stable, contrasting background'
    ],
    commonMistakes: [
      'Camera too high or low',
      'Not enough side clearance',
      'Poor lighting on legs'
    ],
    tips: [
      'Mark your starting position',
      'Test recording range of motion',
      'Ensure feet are visible'
    ]
  },
  deadlift: {
    title: 'Deadlift Recording Setup',
    primaryView: 'Side view captures bar path and hip hinge',
    keyPoints: [
      'Camera at hip height',
      'Full bar path visible',
      'Side angle shows hip movement',
      'Stable floor reference'
    ],
    commonMistakes: [
      'Camera too close to bar',
      'Missing foot position',
      'Poor back visibility'
    ],
    tips: [
      'Show full bar from floor to lockout',
      'Include foot position in frame',
      'Ensure back is clearly visible'
    ]
  },
  pushup: {
    title: 'Push-up Recording Setup',
    primaryView: 'Side view captures body alignment',
    keyPoints: [
      'Camera at floor level',
      'Full body profile visible',
      'Side angle shows body line',
      'Clear hand position'
    ],
    commonMistakes: [
      'Camera too high above',
      'Missing hand/feet reference',
      'Poor lighting on torso'
    ],
    tips: [
      'Phone on floor or low surface',
      'Show full body from head to feet',
      'Ensure hands are clearly visible'
    ]
  }
};

// Guidance states and phases
const GUIDANCE_PHASES = {
  PRE_SETUP: 'pre_setup',
  CAMERA_POSITIONING: 'camera_positioning', 
  LIGHTING_CHECK: 'lighting_check',
  EXERCISE_PREP: 'exercise_prep',
  READY_CHECK: 'ready_check',
  RECORDING: 'recording',
  POST_RECORDING: 'post_recording'
};

export default function RecordingGuidance({
  exercise = 'general',
  recordingPhase = GUIDANCE_PHASES.PRE_SETUP,
  cameraFeed = null,
  onSetupComplete = () => {},
  onDismiss = () => {},
  style = {},
  minimized = false,
  autoHide = false,
  recordingContext = {}
}) {
  const { theme, isDarkMode } = useTheme();
  const [currentPhase, setCurrentPhase] = useState(recordingPhase);
  const [setupChecklist, setSetupChecklist] = useState({});
  const [guidanceContent, setGuidanceContent] = useState(null);
  const [showDetailed, setShowDetailed] = useState(!minimized);
  const [environmentAnalysis, setEnvironmentAnalysis] = useState({});
  const [personalizedTips, setPersonalizedTips] = useState([]);

  // Animation values
  const slideAnim = useRef(new Animated.Value(minimized ? screenHeight - 100 : screenHeight - 300)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadGuidanceContent();
    initializeChecklist();
    setupAnimations();
  }, [exercise, currentPhase]);

  useEffect(() => {
    setCurrentPhase(recordingPhase);
  }, [recordingPhase]);

  useEffect(() => {
    if (cameraFeed) {
      analyzeEnvironment(cameraFeed);
    }
  }, [cameraFeed]);

  const setupAnimations = () => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: minimized ? screenHeight - 100 : screenHeight - 300,
      useNativeDriver: false,
      tension: 100,
      friction: 8
    }).start();

    // Pulse animation for important tips
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const loadGuidanceContent = async () => {
    try {
      // Get exercise-specific guidance
      const exerciseGuidance = EXERCISE_GUIDANCE[exercise] || EXERCISE_GUIDANCE.general;
      
      // Load personalized tips from tutorial service
      const personalizedContent = await tutorialService.getPersonalizedContent({
        category: 'recording_practices',
        exercise,
        context: 'real_time_guidance',
        userLevel: recordingContext.userLevel || 'beginner'
      });

      // Get content optimized for current device/network
      const optimizedContent = await contentDeliveryService.getOptimizedContent({
        contentType: 'guidance',
        category: 'recording_setup',
        exercise,
        includeVideo: false // Text-based for performance
      });

      setGuidanceContent({
        ...exerciseGuidance,
        ...optimizedContent
      });

      setPersonalizedTips(personalizedContent.tips || []);

      // Track guidance content loaded
      await tutorialService.trackUserEngagement('recording_guidance_loaded', {
        exercise,
        phase: currentPhase,
        userLevel: recordingContext.userLevel,
        contentSource: 'real_time'
      });

    } catch (error) {
      console.error('Failed to load guidance content:', error);
    }
  };

  const initializeChecklist = () => {
    const checklist = {
      cameraDistance: false,
      cameraHeight: false,
      cameraAngle: false,
      lighting: false,
      background: false,
      frameComposition: false,
      exerciseSetup: false
    };

    setSetupChecklist(checklist);
  };

  const analyzeEnvironment = useCallback(async (cameraData) => {
    try {
      // Simulate environment analysis (in production, this would use actual computer vision)
      const analysis = {
        lighting: {
          level: 'good', // good, fair, poor
          direction: 'front', // front, side, back, mixed
          contrast: 'sufficient' // sufficient, low, high
        },
        background: {
          type: 'solid', // solid, busy, mixed
          contrast: 'good', // good, fair, poor
          stability: 'stable' // stable, moving
        },
        framing: {
          bodyVisible: true,
          cropLevel: 'full', // full, partial, cropped
          angle: 'side' // front, side, angled
        },
        space: {
          width: 'adequate', // adequate, narrow, wide
          depth: 'sufficient' // sufficient, shallow, deep
        }
      };

      setEnvironmentAnalysis(analysis);
      updateChecklistFromAnalysis(analysis);

    } catch (error) {
      console.error('Environment analysis failed:', error);
    }
  }, []);

  const updateChecklistFromAnalysis = (analysis) => {
    const updatedChecklist = {
      cameraDistance: analysis.framing.bodyVisible && analysis.framing.cropLevel === 'full',
      cameraHeight: analysis.framing.angle === SETUP_CRITERIA.camera.height[exercise]?.includes('level'),
      cameraAngle: analysis.framing.angle === 'side',
      lighting: analysis.lighting.level === 'good' && analysis.lighting.contrast === 'sufficient',
      background: analysis.background.type === 'solid' && analysis.background.contrast === 'good',
      frameComposition: analysis.framing.bodyVisible && analysis.space.width === 'adequate',
      exerciseSetup: currentPhase === GUIDANCE_PHASES.READY_CHECK
    };

    setSetupChecklist(updatedChecklist);

    // Check if setup is complete
    const isComplete = Object.values(updatedChecklist).every(check => check === true);
    if (isComplete && currentPhase === GUIDANCE_PHASES.READY_CHECK) {
      onSetupComplete();
    }
  };

  const handleChecklistItemToggle = async (item) => {
    const updated = {
      ...setupChecklist,
      [item]: !setupChecklist[item]
    };
    setSetupChecklist(updated);

    // Track user interaction
    await tutorialService.trackUserEngagement('setup_checklist_interaction', {
      item,
      checked: updated[item],
      exercise,
      phase: currentPhase
    });
  };

  const handleNextPhase = () => {
    const phases = Object.values(GUIDANCE_PHASES);
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex < phases.length - 1) {
      setCurrentPhase(phases[currentIndex + 1]);
    }
  };

  const toggleMinimized = () => {
    const newMinimized = !minimized;
    setShowDetailed(!newMinimized);
    
    Animated.spring(slideAnim, {
      toValue: newMinimized ? screenHeight - 100 : screenHeight - 300,
      useNativeDriver: false,
      tension: 100,
      friction: 8
    }).start();
  };

  const styles = createStyleSheet(theme);

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case GUIDANCE_PHASES.PRE_SETUP:
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>Let's Set Up Your Recording</Text>
            <Text style={styles.phaseDescription}>
              Follow these steps to get the best pose analysis results for your {exercise}.
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={handleNextPhase}>
              <Text style={styles.startButtonText}>Start Setup Guide</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        );

      case GUIDANCE_PHASES.CAMERA_POSITIONING:
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>Camera Positioning</Text>
            {guidanceContent && (
              <View style={styles.guidanceDetails}>
                <Text style={styles.primaryView}>{guidanceContent.primaryView}</Text>
                <View style={styles.keyPoints}>
                  {guidanceContent.keyPoints?.map((point, index) => (
                    <View key={index} style={styles.keyPoint}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary.DEFAULT} />
                      <Text style={styles.keyPointText}>{point}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      case GUIDANCE_PHASES.LIGHTING_CHECK:
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>Lighting Check</Text>
            <View style={styles.environmentFeedback}>
              <View style={styles.feedbackItem}>
                <Ionicons 
                  name={environmentAnalysis.lighting?.level === 'good' ? 'sunny' : 'cloudy'} 
                  size={20} 
                  color={environmentAnalysis.lighting?.level === 'good' ? '#4CAF50' : '#FF9800'} 
                />
                <Text style={styles.feedbackText}>
                  Lighting: {environmentAnalysis.lighting?.level || 'checking...'}
                </Text>
              </View>
              <View style={styles.feedbackItem}>
                <Ionicons 
                  name={environmentAnalysis.background?.contrast === 'good' ? 'contrast' : 'warning'} 
                  size={20} 
                  color={environmentAnalysis.background?.contrast === 'good' ? '#4CAF50' : '#FF9800'} 
                />
                <Text style={styles.feedbackText}>
                  Background: {environmentAnalysis.background?.contrast || 'analyzing...'}
                </Text>
              </View>
            </View>
          </View>
        );

      case GUIDANCE_PHASES.EXERCISE_PREP:
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>Exercise Preparation</Text>
            {personalizedTips.length > 0 && (
              <View style={styles.personalizedTips}>
                {personalizedTips.slice(0, 3).map((tip, index) => (
                  <Animated.View 
                    key={index} 
                    style={[
                      styles.tipItem,
                      index === 0 ? { transform: [{ scale: pulseAnim }] } : {}
                    ]}
                  >
                    <Ionicons name="bulb-outline" size={16} color={colors.primary.DEFAULT} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        );

      case GUIDANCE_PHASES.READY_CHECK:
        return (
          <View style={styles.phaseContent}>
            <Text style={styles.phaseTitle}>Final Setup Check</Text>
            <View style={styles.checklist}>
              {Object.entries(setupChecklist).map(([key, checked]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.checklistItem, checked && styles.checklistItemCompleted]}
                  onPress={() => handleChecklistItemToggle(key)}
                >
                  <Ionicons 
                    name={checked ? 'checkmark-circle' : 'ellipse-outline'} 
                    size={20} 
                    color={checked ? '#4CAF50' : theme.text.secondary} 
                  />
                  <Text style={[styles.checklistText, checked && styles.checklistTextCompleted]}>
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderMinimizedView = () => (
    <View style={styles.minimizedContent}>
      <TouchableOpacity style={styles.expandButton} onPress={toggleMinimized}>
        <Ionicons name="chevron-up" size={20} color={theme.text.primary} />
        <Text style={styles.minimizedText}>Recording Tips</Text>
      </TouchableOpacity>
      <View style={styles.minimizedStatus}>
        {Object.values(setupChecklist).filter(Boolean).length > 0 && (
          <Text style={styles.minimizedProgress}>
            {Object.values(setupChecklist).filter(Boolean).length}/{Object.keys(setupChecklist).length}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { top: slideAnim }, style]}>
      <BlurView intensity={20} style={styles.blur}>
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.8)',
            'rgba(0, 0, 0, 0.6)'
          ]}
          style={styles.gradient}
        >
          {!showDetailed && renderMinimizedView()}
          
          {showDetailed && (
            <View style={styles.detailedContent}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.minimizeButton} onPress={toggleMinimized}>
                  <Ionicons name="chevron-down" size={20} color={theme.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Recording Guidance</Text>
                <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
                  <Ionicons name="close" size={20} color={theme.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Phase Progress Indicator */}
              <View style={styles.progressIndicator}>
                {Object.values(GUIDANCE_PHASES).slice(0, 5).map((phase, index) => (
                  <View 
                    key={phase}
                    style={[
                      styles.progressDot,
                      currentPhase === phase && styles.progressDotActive,
                      Object.values(GUIDANCE_PHASES).indexOf(currentPhase) > index && styles.progressDotCompleted
                    ]}
                  />
                ))}
              </View>

              {/* Phase Content */}
              {renderPhaseContent()}

              {/* Navigation */}
              {currentPhase !== GUIDANCE_PHASES.PRE_SETUP && currentPhase !== GUIDANCE_PHASES.READY_CHECK && (
                <View style={styles.navigation}>
                  <TouchableOpacity style={styles.nextButton} onPress={handleNextPhase}>
                    <Text style={styles.nextButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

const createStyleSheet = (theme) => ({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    maxHeight: 400
  },
  blur: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden'
  },
  gradient: {
    minHeight: 100,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl
  },
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 60
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  minimizedText: {
    ...typography.body,
    color: theme.text.primary,
    marginLeft: spacing.sm
  },
  minimizedStatus: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  minimizedProgress: {
    ...typography.caption,
    color: colors.primary.DEFAULT,
    fontWeight: 'bold'
  },
  detailedContent: {
    padding: spacing.lg,
    minHeight: 200
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  minimizeButton: {
    padding: spacing.xs
  },
  headerTitle: {
    ...typography.h4,
    color: theme.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm
  },
  dismissButton: {
    padding: spacing.xs
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  progressDotActive: {
    backgroundColor: colors.primary.DEFAULT,
    width: 12,
    height: 12,
    borderRadius: 6
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50'
  },
  phaseContent: {
    marginBottom: spacing.lg
  },
  phaseTitle: {
    ...typography.h3,
    color: theme.text.primary,
    marginBottom: spacing.sm
  },
  phaseDescription: {
    ...typography.body,
    color: theme.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 22
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start'
  },
  startButtonText: {
    ...typography.button,
    color: 'white',
    marginRight: spacing.sm
  },
  guidanceDetails: {
    marginTop: spacing.md
  },
  primaryView: {
    ...typography.body,
    color: colors.primary.DEFAULT,
    marginBottom: spacing.md,
    fontStyle: 'italic'
  },
  keyPoints: {
    marginTop: spacing.sm
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  keyPointText: {
    ...typography.body,
    color: theme.text.primary,
    marginLeft: spacing.sm,
    flex: 1
  },
  environmentFeedback: {
    marginTop: spacing.md
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md
  },
  feedbackText: {
    ...typography.body,
    color: theme.text.primary,
    marginLeft: spacing.sm
  },
  personalizedTips: {
    marginTop: spacing.md
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.DEFAULT
  },
  tipText: {
    ...typography.body,
    color: theme.text.primary,
    marginLeft: spacing.sm,
    flex: 1
  },
  checklist: {
    marginTop: spacing.md
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md
  },
  checklistItemCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)'
  },
  checklistText: {
    ...typography.body,
    color: theme.text.primary,
    marginLeft: spacing.sm
  },
  checklistTextCompleted: {
    color: '#4CAF50'
  },
  navigation: {
    alignItems: 'center',
    marginTop: spacing.md
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg
  },
  nextButtonText: {
    ...typography.button,
    color: 'white',
    marginRight: spacing.sm
  }
});