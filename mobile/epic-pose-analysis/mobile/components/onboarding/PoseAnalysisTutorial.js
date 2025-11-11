/**
 * PoseAnalysisTutorial - Interactive Onboarding Flow
 * 
 * Comprehensive onboarding experience introducing users to pose analysis features.
 * Provides interactive tutorials, feature demonstrations, and guided first recording.
 * 
 * Features:
 * - Progressive onboarding steps with interactive elements
 * - Feature showcase with real demonstrations
 * - Guided first recording experience
 * - Personalized learning path based on user goals
 * - Progress tracking and milestone recognition
 * - Skip options for experienced users
 * - Integration with existing tutorial content system
 * - Accessibility support for inclusive onboarding
 * 
 * Integration Points:
 * - TutorialService for onboarding progress and analytics
 * - InteractiveTutorial component for guided experiences
 * - TutorialVideo component for feature demonstrations
 * - RecordingGuidance for first recording setup
 * - Existing onboarding patterns and navigation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  Image,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Tutorial Components
import InteractiveTutorial from '../pose/InteractiveTutorial';
import TutorialVideo from '../pose/TutorialVideo';
import RecordingGuidance from '../pose/RecordingGuidance';

// Services
import tutorialService from '../../services/tutorialService';
import tutorialContentManager from '../../utils/tutorialContentManager';

// Design System
import { createThemedStyles, colors, spacing, borderRadius, typography } from '../../utils/designTokens';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Onboarding flow steps and structure
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Pose Analysis',
    type: 'introduction',
    duration: 30,
    skippable: false,
    content: {
      headline: 'Perfect Your Form with AI',
      description: 'Get detailed feedback on your exercise technique to improve performance and prevent injuries.',
      features: [
        { icon: '🎯', title: 'Real-time Analysis', description: 'Instant feedback on your form' },
        { icon: '📊', title: 'Progress Tracking', description: 'See your improvement over time' },
        { icon: '🏆', title: 'Expert Insights', description: 'Professional coaching tips' }
      ]
    }
  },
  {
    id: 'goal_setting',
    title: 'What\'s Your Goal?',
    type: 'user_input',
    duration: 45,
    skippable: true,
    content: {
      headline: 'Let\'s Personalize Your Experience',
      goals: [
        { id: 'form_improvement', title: 'Perfect My Form', icon: 'fitness-outline', description: 'Focus on technique and movement quality' },
        { id: 'injury_prevention', title: 'Prevent Injuries', icon: 'shield-checkmark-outline', description: 'Identify risky movement patterns' },
        { id: 'performance_boost', title: 'Boost Performance', icon: 'trending-up-outline', description: 'Optimize for strength and power' },
        { id: 'general_fitness', title: 'General Fitness', icon: 'heart-outline', description: 'Overall health and wellness' }
      ]
    }
  },
  {
    id: 'exercise_selection',
    title: 'Choose Your Focus Exercise',
    type: 'user_input',
    duration: 30,
    skippable: true,
    content: {
      headline: 'Which Exercise Do You Want to Master First?',
      exercises: [
        { id: 'squat', title: 'Squat', icon: '🏋️‍♀️', difficulty: 'Beginner', description: 'Lower body strength and mobility' },
        { id: 'deadlift', title: 'Deadlift', icon: '🏋️‍♂️', difficulty: 'Intermediate', description: 'Full-body power movement' },
        { id: 'pushup', title: 'Push-up', icon: '💪', difficulty: 'Beginner', description: 'Upper body and core strength' },
        { id: 'overhead_press', title: 'Overhead Press', icon: '🤸‍♀️', difficulty: 'Intermediate', description: 'Shoulder stability and strength' }
      ]
    }
  },
  {
    id: 'feature_tour',
    title: 'Key Features',
    type: 'interactive_demo',
    duration: 120,
    skippable: true,
    content: {
      headline: 'Explore What You Can Do',
      demos: [
        { 
          id: 'analysis_results', 
          title: 'Analysis Results',
          description: 'See detailed breakdowns of your movement patterns',
          demoType: 'interactive_tutorial',
          contentId: 'analysis_results_demo'
        },
        { 
          id: 'progress_tracking', 
          title: 'Progress Charts',
          description: 'Track your improvement with visual progress indicators',
          demoType: 'interactive_tutorial',
          contentId: 'progress_tracking_demo'
        },
        { 
          id: 'recommendations', 
          title: 'Smart Recommendations',
          description: 'Get personalized tips to improve your technique',
          demoType: 'interactive_tutorial',
          contentId: 'recommendations_demo'
        }
      ]
    }
  },
  {
    id: 'recording_setup',
    title: 'Recording Setup Guide',
    type: 'guided_tutorial',
    duration: 180,
    skippable: false,
    content: {
      headline: 'Let\'s Set Up Your First Recording',
      description: 'We\'ll guide you through the optimal setup for accurate analysis results.',
      includeGuidance: true
    }
  },
  {
    id: 'first_recording',
    title: 'Your First Analysis',
    type: 'guided_recording',
    duration: 300,
    skippable: false,
    content: {
      headline: 'Time for Your First Recording!',
      description: 'Follow along as we capture and analyze your movement.',
      recordingType: 'guided'
    }
  },
  {
    id: 'results_walkthrough',
    title: 'Understanding Your Results',
    type: 'tutorial_explanation',
    duration: 120,
    skippable: true,
    content: {
      headline: 'Let\'s Explore Your Analysis',
      description: 'Learn how to read and act on your pose analysis results.'
    }
  },
  {
    id: 'completion',
    title: 'You\'re All Set!',
    type: 'completion',
    duration: 30,
    skippable: false,
    content: {
      headline: 'Congratulations!',
      description: 'You\'ve completed the pose analysis onboarding. Ready to start improving your form?',
      nextSteps: [
        { title: 'Record more exercises', action: 'navigate_to_camera' },
        { title: 'View your progress', action: 'navigate_to_progress' },
        { title: 'Explore tutorials', action: 'navigate_to_tutorials' }
      ]
    }
  }
];

export default function PoseAnalysisTutorial({
  navigation,
  onComplete = () => {},
  onSkip = () => {},
  initialStep = 'welcome',
  userProfile = {},
  style = {}
}) {
  const { theme, isDarkMode } = useTheme();
  const [currentStepIndex, setCurrentStepIndex] = useState(
    ONBOARDING_STEPS.findIndex(step => step.id === initialStep) || 0
  );
  const [userSelections, setUserSelections] = useState({
    goal: null,
    focusExercise: null,
    experienceLevel: userProfile.experienceLevel || 'beginner'
  });
  const [tutorialContent, setTutorialContent] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [onboardingProgress, setOnboardingProgress] = useState({});

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const progressPercentage = (currentStepIndex / (ONBOARDING_STEPS.length - 1)) * 100;

  useEffect(() => {
    loadTutorialContent();
    initializeOnboarding();
    setupAnimations();
  }, []);

  useEffect(() => {
    // Update progress animation when step changes
    Animated.timing(progressAnim, {
      toValue: progressPercentage / 100,
      duration: 500,
      useNativeDriver: false
    }).start();
  }, [currentStepIndex]);

  const setupAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  };

  const loadTutorialContent = async () => {
    try {
      // Load onboarding-specific tutorial content
      const content = await tutorialContentManager.getTutorialsByCategory('onboarding');
      setTutorialContent(content);
    } catch (error) {
      console.error('Failed to load tutorial content:', error);
    }
  };

  const initializeOnboarding = async () => {
    try {
      // Initialize onboarding tracking
      await tutorialService.trackUserEngagement('pose_onboarding_started', {
        initialStep,
        userProfile: userProfile,
        totalSteps: ONBOARDING_STEPS.length
      });

      // Load existing progress if any
      const progress = await tutorialService.getUserProgress('onboarding');
      setOnboardingProgress(progress);
    } catch (error) {
      console.error('Failed to initialize onboarding:', error);
    }
  };

  const handleStepComplete = useCallback(async (stepData = {}) => {
    const step = currentStep;
    
    // Track step completion
    await tutorialService.trackUserEngagement('onboarding_step_completed', {
      stepId: step.id,
      stepType: step.type,
      duration: stepData.duration || step.duration,
      userSelections: stepData.selections || userSelections
    });

    // Update selections if provided
    if (stepData.selections) {
      setUserSelections(prev => ({ ...prev, ...stepData.selections }));
    }

    // Move to next step or complete
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      handleNextStep();
    } else {
      handleOnboardingComplete();
    }
  }, [currentStep, currentStepIndex, userSelections]);

  const handleNextStep = () => {
    // Animate out current step
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: -screenWidth,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      // Update step
      setCurrentStepIndex(prev => prev + 1);
      
      // Reset animations for next step
      slideAnim.setValue(screenWidth);
      
      // Animate in new step
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: screenWidth,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        setCurrentStepIndex(prev => prev - 1);
        slideAnim.setValue(-screenWidth);
        
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ]).start();
      });
    }
  };

  const handleSkipStep = async () => {
    if (currentStep.skippable) {
      await tutorialService.trackUserEngagement('onboarding_step_skipped', {
        stepId: currentStep.id,
        stepType: currentStep.type
      });
      handleNextStep();
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      // Track completion
      await tutorialService.trackUserEngagement('pose_onboarding_completed', {
        totalDuration: ONBOARDING_STEPS.reduce((sum, step) => sum + step.duration, 0),
        userSelections,
        completedSteps: ONBOARDING_STEPS.length
      });

      // Create personalized learning path based on selections
      const learningPath = await tutorialContentManager.createLearningPath({
        goal: userSelections.goal,
        focusExercise: userSelections.focusExercise,
        experienceLevel: userSelections.experienceLevel
      });

      onComplete({
        userSelections,
        learningPath,
        onboardingProgress: {
          completed: true,
          completedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      onComplete({ userSelections });
    }
  };

  const handleSkipOnboarding = async () => {
    await tutorialService.trackUserEngagement('pose_onboarding_skipped', {
      atStep: currentStep.id,
      completedSteps: currentStepIndex
    });
    onSkip();
  };

  const styles = createStyleSheet(theme);

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <Animated.View 
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
      </Text>
    </View>
  );

  const renderWelcomeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.headline}>{currentStep.content.headline}</Text>
      <Text style={styles.description}>{currentStep.content.description}</Text>
      
      <View style={styles.featuresGrid}>
        {currentStep.content.features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <BlurView intensity={10} style={styles.featureBlur}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </BlurView>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleStepComplete}>
        <LinearGradient colors={[colors.primary.DEFAULT, colors.primary.light]} style={styles.buttonGradient}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderGoalSelectionStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.headline}>{currentStep.content.headline}</Text>
      
      <View style={styles.goalsGrid}>
        {currentStep.content.goals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.goalCard,
              userSelections.goal === goal.id && styles.goalCardSelected
            ]}
            onPress={() => setUserSelections(prev => ({ ...prev, goal: goal.id }))}
          >
            <BlurView intensity={userSelections.goal === goal.id ? 20 : 10} style={styles.goalBlur}>
              <Ionicons 
                name={goal.icon} 
                size={32} 
                color={userSelections.goal === goal.id ? colors.primary.DEFAULT : theme.text.secondary} 
              />
              <Text style={[
                styles.goalTitle,
                userSelections.goal === goal.id && styles.goalTitleSelected
              ]}>
                {goal.title}
              </Text>
              <Text style={styles.goalDescription}>{goal.description}</Text>
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stepNavigation}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkipStep}>
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryButton, !userSelections.goal && styles.primaryButtonDisabled]}
          onPress={() => handleStepComplete({ selections: userSelections })}
          disabled={!userSelections.goal}
        >
          <LinearGradient colors={[colors.primary.DEFAULT, colors.primary.light]} style={styles.buttonGradient}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExerciseSelectionStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.headline}>{currentStep.content.headline}</Text>
      
      <View style={styles.exerciseGrid}>
        {currentStep.content.exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[
              styles.exerciseCard,
              userSelections.focusExercise === exercise.id && styles.exerciseCardSelected
            ]}
            onPress={() => setUserSelections(prev => ({ ...prev, focusExercise: exercise.id }))}
          >
            <BlurView intensity={userSelections.focusExercise === exercise.id ? 20 : 10} style={styles.exerciseBlur}>
              <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
              <Text style={[
                styles.exerciseTitle,
                userSelections.focusExercise === exercise.id && styles.exerciseTitleSelected
              ]}>
                {exercise.title}
              </Text>
              <Text style={styles.exerciseDifficulty}>{exercise.difficulty}</Text>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stepNavigation}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkipStep}>
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryButton, !userSelections.focusExercise && styles.primaryButtonDisabled]}
          onPress={() => handleStepComplete({ selections: userSelections })}
          disabled={!userSelections.focusExercise}
        >
          <LinearGradient colors={[colors.primary.DEFAULT, colors.primary.light]} style={styles.buttonGradient}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeatureTourStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.headline}>{currentStep.content.headline}</Text>
      
      <ScrollView style={styles.demosContainer} showsVerticalScrollIndicator={false}>
        {currentStep.content.demos.map((demo, index) => (
          <TouchableOpacity
            key={demo.id}
            style={styles.demoCard}
            onPress={() => {
              setModalContent(demo);
              setShowModal(true);
            }}
          >
            <BlurView intensity={10} style={styles.demoBlur}>
              <View style={styles.demoHeader}>
                <Text style={styles.demoTitle}>{demo.title}</Text>
                <Ionicons name="play-circle-outline" size={24} color={colors.primary.DEFAULT} />
              </View>
              <Text style={styles.demoDescription}>{demo.description}</Text>
            </BlurView>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.stepNavigation}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkipStep}>
          <Text style={styles.secondaryButtonText}>Skip Tour</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleStepComplete}>
          <LinearGradient colors={[colors.primary.DEFAULT, colors.primary.light]} style={styles.buttonGradient}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecordingSetupStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.headline}>{currentStep.content.headline}</Text>
      <Text style={styles.description}>{currentStep.content.description}</Text>
      
      <RecordingGuidance
        exercise={userSelections.focusExercise || 'general'}
        recordingPhase="pre_setup"
        onSetupComplete={() => handleStepComplete()}
        minimized={false}
        autoHide={false}
        recordingContext={{
          userLevel: userSelections.experienceLevel,
          isOnboarding: true
        }}
        style={styles.recordingGuidance}
      />
    </View>
  );

  const renderCompletionStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.completionHeader}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        <Text style={styles.headline}>{currentStep.content.headline}</Text>
        <Text style={styles.description}>{currentStep.content.description}</Text>
      </View>
      
      <View style={styles.nextStepsContainer}>
        <Text style={styles.nextStepsTitle}>What's Next?</Text>
        {currentStep.content.nextSteps.map((step, index) => (
          <TouchableOpacity key={index} style={styles.nextStepCard}>
            <BlurView intensity={10} style={styles.nextStepBlur}>
              <Text style={styles.nextStepTitle}>{step.title}</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.primary.DEFAULT} />
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleStepComplete}>
        <LinearGradient colors={[colors.primary.DEFAULT, colors.primary.light]} style={styles.buttonGradient}>
          <Text style={styles.primaryButtonText}>Start Analyzing!</Text>
          <Ionicons name="rocket" size={20} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep.type) {
      case 'introduction':
        return renderWelcomeStep();
      case 'user_input':
        return currentStep.id === 'goal_setting' ? renderGoalSelectionStep() : renderExerciseSelectionStep();
      case 'interactive_demo':
        return renderFeatureTourStep();
      case 'guided_tutorial':
        return renderRecordingSetupStep();
      case 'completion':
        return renderCompletionStep();
      default:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.headline}>Step not implemented</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleStepComplete}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        {currentStepIndex > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
            <Ionicons name="chevron-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
        )}
        
        <Text style={styles.headerTitle}>{currentStep.title}</Text>
        
        {currentStep.skippable && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipOnboarding}>
            <Text style={styles.skipButtonText}>Skip All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Step Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {renderCurrentStep()}
        </ScrollView>
      </Animated.View>

      {/* Demo Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalContent?.title}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={theme.text.primary} />
            </TouchableOpacity>
          </View>
          
          {modalContent && (
            <InteractiveTutorial
              tutorialId={modalContent.contentId}
              onComplete={() => setShowModal(false)}
              style={styles.modalTutorial}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyleSheet = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border.light
  },
  backButton: {
    padding: spacing.xs,
    width: 60
  },
  headerTitle: {
    ...typography.h3,
    color: theme.text.primary,
    flex: 1,
    textAlign: 'center'
  },
  skipButton: {
    padding: spacing.xs,
    width: 60,
    alignItems: 'flex-end'
  },
  skipButtonText: {
    ...typography.button,
    color: theme.text.secondary
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center'
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 2,
    marginBottom: spacing.sm
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 2
  },
  progressText: {
    ...typography.caption,
    color: theme.text.secondary
  },
  contentContainer: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg
  },
  stepContent: {
    flex: 1,
    alignItems: 'center'
  },
  headline: {
    ...typography.h1,
    color: theme.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  description: {
    ...typography.body,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg
  },
  featuresGrid: {
    width: '100%',
    marginBottom: spacing.xl
  },
  featureCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  featureBlur: {
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.lg
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: spacing.md
  },
  featureTitle: {
    ...typography.h4,
    color: theme.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  featureDescription: {
    ...typography.body,
    color: theme.text.secondary,
    textAlign: 'center'
  },
  goalsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl
  },
  goalCard: {
    width: '48%',
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  goalCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT
  },
  goalBlur: {
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.lg
  },
  goalTitle: {
    ...typography.h4,
    color: theme.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  goalTitleSelected: {
    color: colors.primary.DEFAULT
  },
  goalDescription: {
    ...typography.caption,
    color: theme.text.secondary,
    textAlign: 'center'
  },
  exerciseGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl
  },
  exerciseCard: {
    width: '48%',
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  exerciseCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT
  },
  exerciseBlur: {
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.lg
  },
  exerciseIcon: {
    fontSize: 32,
    marginBottom: spacing.sm
  },
  exerciseTitle: {
    ...typography.h4,
    color: theme.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  exerciseTitleSelected: {
    color: colors.primary.DEFAULT
  },
  exerciseDifficulty: {
    ...typography.caption,
    color: colors.primary.DEFAULT,
    marginBottom: spacing.xs,
    fontWeight: 'bold'
  },
  exerciseDescription: {
    ...typography.caption,
    color: theme.text.secondary,
    textAlign: 'center'
  },
  demosContainer: {
    width: '100%',
    marginBottom: spacing.xl
  },
  demoCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  demoBlur: {
    padding: spacing.md,
    borderRadius: borderRadius.lg
  },
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  demoTitle: {
    ...typography.h4,
    color: theme.text.primary
  },
  demoDescription: {
    ...typography.body,
    color: theme.text.secondary
  },
  recordingGuidance: {
    position: 'relative',
    width: '100%',
    height: 300
  },
  completionHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  nextStepsContainer: {
    width: '100%',
    marginBottom: spacing.xl
  },
  nextStepsTitle: {
    ...typography.h3,
    color: theme.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  nextStepCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  nextStepBlur: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg
  },
  nextStepTitle: {
    ...typography.h4,
    color: theme.text.primary
  },
  stepNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.lg
  },
  primaryButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    minWidth: 140
  },
  primaryButtonDisabled: {
    opacity: 0.5
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  primaryButtonText: {
    ...typography.button,
    color: 'white',
    marginRight: spacing.sm
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: theme.border.medium,
    borderRadius: borderRadius.lg
  },
  secondaryButtonText: {
    ...typography.button,
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
    ...typography.h3,
    color: theme.text.primary
  },
  modalTutorial: {
    flex: 1
  }
});