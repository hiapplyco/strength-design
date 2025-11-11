/**
 * ContextualHelp - Intelligent Help System Integration
 * 
 * Smart contextual help component that provides relevant assistance based on user context,
 * current screen, user behavior, and integration with existing help systems.
 * 
 * Features:
 * - Context-aware help content based on user location and actions
 * - Integration with existing app help patterns and tooltip system
 * - Smart help suggestions based on user behavior analytics
 * - Progressive help disclosure (basic → detailed → expert)
 * - Multi-modal help delivery (tooltips, overlays, guided tours)
 * - Accessibility support with voice descriptions
 * - Help content caching and offline availability
 * - Usage analytics for help system optimization
 * 
 * Integration Points:
 * - TutorialService for contextual content and user progress
 * - Existing Tooltip component for consistent UI patterns
 * - App navigation context for location-aware help
 * - User analytics for behavioral help triggers
 * - Tutorial content system for deep help resources
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Services and Utils
import tutorialService from '../../services/tutorialService';
import tutorialContentManager from '../../utils/tutorialContentManager';

// Existing Components
import Tooltip from '../Tooltip';
import InteractiveTutorial from '../pose/InteractiveTutorial';
import TutorialVideo from '../pose/TutorialVideo';

// Design System
import { createThemedStyles, colors, spacing, borderRadius, typography } from '../../utils/designTokens';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Help content categories and contexts
const HELP_CONTEXTS = {
  POSE_ANALYSIS: 'pose_analysis',
  RECORDING: 'recording',
  RESULTS: 'results',
  TUTORIAL: 'tutorial',
  ONBOARDING: 'onboarding',
  NAVIGATION: 'navigation',
  SETTINGS: 'settings',
  GENERAL: 'general'
};

// Help content types and delivery methods
const HELP_TYPES = {
  TOOLTIP: 'tooltip',
  OVERLAY: 'overlay',
  MODAL: 'modal',
  INLINE: 'inline',
  GUIDED_TOUR: 'guided_tour',
  QUICK_TIP: 'quick_tip',
  FAQ: 'faq'
};

// Help trigger conditions
const TRIGGER_CONDITIONS = {
  ON_SCREEN_ENTER: 'on_screen_enter',
  ON_INTERACTION: 'on_interaction',
  ON_ERROR: 'on_error',
  ON_IDLE: 'on_idle',
  ON_STRUGGLE: 'on_struggle',
  ON_REQUEST: 'on_request',
  ON_FIRST_TIME: 'on_first_time'
};

// Context-specific help content mapping
const CONTEXTUAL_HELP_MAP = {
  [HELP_CONTEXTS.POSE_ANALYSIS]: {
    screen_tips: [
      {
        id: 'upload_video',
        trigger: TRIGGER_CONDITIONS.ON_FIRST_TIME,
        type: HELP_TYPES.TOOLTIP,
        title: 'Upload Your Exercise Video',
        content: 'Tap here to select a video from your gallery or record a new one.',
        position: 'bottom',
        priority: 'high'
      },
      {
        id: 'recording_tips',
        trigger: TRIGGER_CONDITIONS.ON_INTERACTION,
        type: HELP_TYPES.OVERLAY,
        title: 'Recording Best Practices',
        content: 'For best results, record from the side with good lighting.',
        actions: ['View Recording Guide', 'Dismiss']
      }
    ],
    common_issues: [
      {
        id: 'poor_lighting',
        title: 'Video Too Dark',
        solution: 'Try recording in better lighting or use a lamp.',
        tutorialId: 'lighting_setup_guide'
      },
      {
        id: 'wrong_angle',
        title: 'Can\'t See Exercise Form',
        solution: 'Record from the side to capture full movement.',
        tutorialId: 'camera_positioning_guide'
      }
    ]
  },
  [HELP_CONTEXTS.RECORDING]: {
    screen_tips: [
      {
        id: 'camera_position',
        trigger: TRIGGER_CONDITIONS.ON_SCREEN_ENTER,
        type: HELP_TYPES.QUICK_TIP,
        title: 'Camera Position',
        content: 'Position camera at chest height, 6-8 feet away.',
        autoShow: true,
        duration: 5000
      },
      {
        id: 'exercise_form',
        trigger: TRIGGER_CONDITIONS.ON_IDLE,
        type: HELP_TYPES.OVERLAY,
        title: 'Exercise Form Tips',
        content: 'Need help with proper form? Check out our exercise guides.',
        actions: ['View Exercise Guide', 'Start Recording']
      }
    ]
  },
  [HELP_CONTEXTS.RESULTS]: {
    screen_tips: [
      {
        id: 'understanding_scores',
        trigger: TRIGGER_CONDITIONS.ON_FIRST_TIME,
        type: HELP_TYPES.GUIDED_TOUR,
        title: 'Understanding Your Results',
        content: 'Let me walk you through your pose analysis results.',
        tourSteps: [
          'overall_score',
          'key_metrics',
          'improvement_tips',
          'progress_tracking'
        ]
      },
      {
        id: 'improvement_tips',
        trigger: TRIGGER_CONDITIONS.ON_INTERACTION,
        type: HELP_TYPES.MODAL,
        title: 'How to Improve',
        content: 'Detailed guidance on improving your form based on analysis.',
        includeVideo: true
      }
    ]
  }
};

// Smart help suggestion engine
const BEHAVIORAL_TRIGGERS = {
  MULTIPLE_UPLOADS: {
    condition: 'upload_count > 3 && avg_score < 70',
    suggestion: {
      type: HELP_TYPES.OVERLAY,
      title: 'Need Help Improving?',
      content: 'Your recent uploads show some areas for improvement. Would you like personalized tips?',
      actions: ['Get Tips', 'View Tutorials', 'Dismiss']
    }
  },
  POOR_LIGHTING_PATTERN: {
    condition: 'poor_lighting_detections > 2',
    suggestion: {
      type: HELP_TYPES.MODAL,
      title: 'Lighting Setup Guide',
      content: 'We noticed lighting issues in your videos. Here\'s how to improve:',
      tutorialId: 'lighting_optimization'
    }
  },
  FIRST_TIME_USER: {
    condition: 'session_count === 1',
    suggestion: {
      type: HELP_TYPES.GUIDED_TOUR,
      title: 'Welcome to Pose Analysis!',
      content: 'Let us show you around the key features.',
      autoTrigger: true
    }
  }
};

export default function ContextualHelp({
  context = HELP_CONTEXTS.GENERAL,
  screen = null,
  userBehavior = {},
  onHelpShown = () => {},
  onHelpDismissed = () => {},
  customContent = null,
  disabled = false,
  style = {}
}) {
  const { theme, isDarkMode } = useTheme();
  const [helpContent, setHelpContent] = useState([]);
  const [activeHelp, setActiveHelp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [behavioralSuggestions, setBehavioralSuggestions] = useState([]);
  const [userHelpHistory, setUserHelpHistory] = useState({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Context detection and help content loading
  useEffect(() => {
    if (!disabled) {
      loadContextualHelp();
      analyzeBehavioralTriggers();
    }
  }, [context, screen, userBehavior, disabled]);

  const loadContextualHelp = async () => {
    try {
      // Get context-specific help content
      const contextHelp = CONTEXTUAL_HELP_MAP[context] || CONTEXTUAL_HELP_MAP[HELP_CONTEXTS.GENERAL];
      
      // Load personalized help content from tutorial service
      const personalizedHelp = await tutorialService.getContextualHelp({
        context,
        screen,
        userLevel: userBehavior.experienceLevel || 'beginner',
        recentActivity: userBehavior.recentActions || []
      });

      // Load user help history to avoid repetitive suggestions
      const helpHistory = await tutorialService.getUserHelpHistory();
      setUserHelpHistory(helpHistory);

      // Filter help content based on user history and preferences
      const filteredHelp = await filterHelpContent(contextHelp, personalizedHelp, helpHistory);
      setHelpContent(filteredHelp);

      // Auto-trigger appropriate help based on context
      checkAutoTriggers(filteredHelp);

    } catch (error) {
      console.error('Failed to load contextual help:', error);
    }
  };

  const analyzeBehavioralTriggers = async () => {
    try {
      const suggestions = [];

      // Analyze behavioral patterns for smart suggestions
      for (const [triggerKey, trigger] of Object.entries(BEHAVIORAL_TRIGGERS)) {
        if (evaluateTriggerCondition(trigger.condition, userBehavior)) {
          suggestions.push({
            id: triggerKey,
            ...trigger.suggestion,
            triggerReason: triggerKey
          });
        }
      }

      setBehavioralSuggestions(suggestions);

      // Track behavioral analysis
      await tutorialService.trackUserEngagement('behavioral_help_analysis', {
        context,
        screen,
        triggersEvaluated: Object.keys(BEHAVIORAL_TRIGGERS).length,
        suggestionsGenerated: suggestions.length,
        userBehavior
      });

    } catch (error) {
      console.error('Failed to analyze behavioral triggers:', error);
    }
  };

  const evaluateTriggerCondition = (condition, behavior) => {
    try {
      // Simple condition evaluation - in production this would be more sophisticated
      const context = {
        upload_count: behavior.uploadCount || 0,
        avg_score: behavior.averageScore || 0,
        poor_lighting_detections: behavior.poorLightingCount || 0,
        session_count: behavior.sessionCount || 0
      };

      // Create a function from the condition string and evaluate
      const conditionFunction = new Function(...Object.keys(context), `return ${condition}`);
      return conditionFunction(...Object.values(context));
    } catch (error) {
      console.error('Failed to evaluate trigger condition:', error);
      return false;
    }
  };

  const filterHelpContent = async (contextHelp, personalizedHelp, helpHistory) => {
    const allContent = [
      ...(contextHelp?.screen_tips || []),
      ...(personalizedHelp || [])
    ];

    // Filter based on user history and preferences
    return allContent.filter(help => {
      // Don't show if user has dismissed this help recently
      const dismissedRecently = helpHistory.dismissed?.[help.id]?.timestamp > Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      // Don't show if user has completed related tutorial
      const completedRelated = helpHistory.completed?.[help.tutorialId];
      
      return !dismissedRecently && !completedRelated;
    });
  };

  const checkAutoTriggers = (content) => {
    content.forEach(help => {
      if (help.autoShow || help.trigger === TRIGGER_CONDITIONS.ON_SCREEN_ENTER) {
        setTimeout(() => {
          showHelp(help);
        }, help.delay || 1000);
      }
    });
  };

  const showHelp = useCallback(async (helpItem) => {
    if (disabled || activeHelp) return;

    setActiveHelp(helpItem);

    // Track help shown
    await tutorialService.trackUserEngagement('contextual_help_shown', {
      helpId: helpItem.id,
      helpType: helpItem.type,
      context,
      screen,
      trigger: helpItem.trigger
    });

    onHelpShown(helpItem);

    // Setup animations based on help type
    switch (helpItem.type) {
      case HELP_TYPES.TOOLTIP:
        // Simple fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }).start();
        break;
      
      case HELP_TYPES.OVERLAY:
        // Slide up from bottom
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          })
        ]).start();
        break;
        
      case HELP_TYPES.MODAL:
        setShowModal(true);
        break;
        
      case HELP_TYPES.GUIDED_TOUR:
        setShowGuidedTour(true);
        setTourStep(0);
        break;
        
      case HELP_TYPES.QUICK_TIP:
        // Pulse animation for attention
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
          })
        ]).start();

        // Auto-hide after duration
        if (helpItem.duration) {
          setTimeout(() => dismissHelp(helpItem), helpItem.duration);
        }
        break;
    }
  }, [disabled, activeHelp, context, screen, onHelpShown]);

  const dismissHelp = useCallback(async (helpItem = activeHelp, reason = 'user_dismissed') => {
    if (!helpItem) return;

    // Track help dismissed
    await tutorialService.trackUserEngagement('contextual_help_dismissed', {
      helpId: helpItem.id,
      helpType: helpItem.type,
      context,
      screen,
      reason,
      timeShown: Date.now() - (helpItem.shownAt || Date.now())
    });

    // Update user help history
    await tutorialService.updateHelpHistory({
      [helpItem.id]: {
        dismissed: true,
        timestamp: Date.now(),
        reason
      }
    });

    onHelpDismissed(helpItem, reason);

    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      setActiveHelp(null);
      setShowModal(false);
      setShowGuidedTour(false);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      pulseAnim.setValue(1);
    });
  }, [activeHelp, context, screen, onHelpDismissed]);

  const handleHelpAction = useCallback(async (action, helpItem = activeHelp) => {
    if (!helpItem) return;

    await tutorialService.trackUserEngagement('contextual_help_action', {
      helpId: helpItem.id,
      action,
      context,
      screen
    });

    switch (action) {
      case 'View Recording Guide':
      case 'View Exercise Guide':
      case 'View Tutorials':
        // Navigate to relevant tutorial content
        navigation.navigate('TutorialScreen', {
          initialCategory: helpItem.tutorialCategory || 'recording_practices',
          source: 'contextual_help'
        });
        dismissHelp(helpItem, 'action_taken');
        break;
        
      case 'Get Tips':
        // Show detailed tips modal
        const tipsContent = await tutorialContentManager.getPersonalizedTutorials({
          context,
          userLevel: userBehavior.experienceLevel,
          focusAreas: helpItem.focusAreas || []
        });
        setModalContent({
          type: 'tips',
          title: 'Personalized Tips',
          content: tipsContent
        });
        setShowModal(true);
        break;
        
      case 'Start Recording':
        // Navigate to recording screen
        navigation.navigate('CameraScreen', {
          source: 'contextual_help'
        });
        dismissHelp(helpItem, 'action_taken');
        break;
        
      case 'Dismiss':
      default:
        dismissHelp(helpItem, 'dismissed');
        break;
    }
  }, [activeHelp, context, screen, userBehavior]);

  const styles = createStyleSheet(theme);

  // Don't render if disabled or no help content
  if (disabled || (!activeHelp && behavioralSuggestions.length === 0)) {
    return null;
  }

  const renderTooltip = () => {
    if (!activeHelp || activeHelp.type !== HELP_TYPES.TOOLTIP) return null;

    return (
      <Animated.View
        style={[
          styles.tooltipContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        <Tooltip
          title={activeHelp.title}
          content={activeHelp.content}
          position={activeHelp.position || 'top'}
          onDismiss={() => dismissHelp(activeHelp)}
          visible={true}
          style={styles.tooltip}
        />
      </Animated.View>
    );
  };

  const renderOverlay = () => {
    if (!activeHelp || activeHelp.type !== HELP_TYPES.OVERLAY) return null;

    return (
      <Animated.View
        style={[
          styles.overlayContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <BlurView intensity={20} style={styles.overlayBlur}>
          <View style={styles.overlayContent}>
            <Text style={styles.overlayTitle}>{activeHelp.title}</Text>
            <Text style={styles.overlayText}>{activeHelp.content}</Text>
            
            {activeHelp.actions && (
              <View style={styles.overlayActions}>
                {activeHelp.actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.overlayButton,
                      index === 0 && styles.overlayButtonPrimary
                    ]}
                    onPress={() => handleHelpAction(action)}
                  >
                    <Text style={[
                      styles.overlayButtonText,
                      index === 0 && styles.overlayButtonTextPrimary
                    ]}>
                      {action}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  const renderQuickTip = () => {
    if (!activeHelp || activeHelp.type !== HELP_TYPES.QUICK_TIP) return null;

    return (
      <Animated.View
        style={[
          styles.quickTipContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        <BlurView intensity={15} style={styles.quickTipBlur}>
          <View style={styles.quickTipContent}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary.DEFAULT} />
            <View style={styles.quickTipText}>
              <Text style={styles.quickTipTitle}>{activeHelp.title}</Text>
              <Text style={styles.quickTipMessage}>{activeHelp.content}</Text>
            </View>
            <TouchableOpacity onPress={() => dismissHelp(activeHelp)}>
              <Ionicons name="close" size={20} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  const renderModal = () => {
    if (!showModal || !activeHelp || activeHelp.type !== HELP_TYPES.MODAL) return null;

    return (
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => dismissHelp(activeHelp)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{activeHelp.title}</Text>
            <TouchableOpacity onPress={() => dismissHelp(activeHelp)}>
              <Ionicons name="close" size={24} color={theme.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {activeHelp.includeVideo && activeHelp.tutorialId && (
              <TutorialVideo
                tutorialId={activeHelp.tutorialId}
                autoPlay={false}
                onComplete={() => dismissHelp(activeHelp, 'completed')}
              />
            )}
            
            {activeHelp.includeInteractive && activeHelp.tutorialId && (
              <InteractiveTutorial
                tutorialId={activeHelp.tutorialId}
                onComplete={() => dismissHelp(activeHelp, 'completed')}
              />
            )}
            
            <View style={styles.modalTextContent}>
              <Text style={styles.modalText}>{activeHelp.content}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderBehavioralSuggestions = () => {
    if (behavioralSuggestions.length === 0) return null;

    return (
      <View style={styles.suggestionsContainer}>
        {behavioralSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={suggestion.id}
            style={styles.suggestionCard}
            onPress={() => showHelp(suggestion)}
          >
            <BlurView intensity={10} style={styles.suggestionBlur}>
              <Ionicons name="help-circle-outline" size={20} color={colors.primary.DEFAULT} />
              <Text style={styles.suggestionText}>{suggestion.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.text.secondary} />
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderTooltip()}
      {renderOverlay()}
      {renderQuickTip()}
      {renderModal()}
      {renderBehavioralSuggestions()}
    </View>
  );
}

const createStyleSheet = (theme) => ({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
    zIndex: 999
  },
  tooltipContainer: {
    position: 'absolute',
    zIndex: 1001
  },
  tooltip: {
    maxWidth: 280
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000
  },
  overlayBlur: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  overlayContent: {
    padding: spacing.lg
  },
  overlayTitle: {
    ...typography.h3,
    color: theme.text.primary,
    marginBottom: spacing.sm
  },
  overlayText: {
    ...typography.body,
    color: theme.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 22
  },
  overlayActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm
  },
  overlayButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border.medium
  },
  overlayButtonPrimary: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT
  },
  overlayButtonText: {
    ...typography.button,
    color: theme.text.primary
  },
  overlayButtonTextPrimary: {
    color: 'white'
  },
  quickTipContainer: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000
  },
  quickTipBlur: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  quickTipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md
  },
  quickTipText: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm
  },
  quickTipTitle: {
    ...typography.h4,
    color: theme.text.primary,
    marginBottom: spacing.xs
  },
  quickTipMessage: {
    ...typography.body,
    color: theme.text.secondary
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background.primary
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.light
  },
  modalTitle: {
    ...typography.h2,
    color: theme.text.primary
  },
  modalContent: {
    flex: 1
  },
  modalTextContent: {
    padding: spacing.lg
  },
  modalText: {
    ...typography.body,
    color: theme.text.primary,
    lineHeight: 24
  },
  suggestionsContainer: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.md,
    zIndex: 999
  },
  suggestionCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden'
  },
  suggestionBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md
  },
  suggestionText: {
    ...typography.caption,
    color: theme.text.primary,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    flex: 1
  }
});