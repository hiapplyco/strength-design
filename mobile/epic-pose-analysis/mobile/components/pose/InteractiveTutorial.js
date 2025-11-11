/**
 * InteractiveTutorial Component
 * 
 * Step-by-step interactive tutorial component with guided instruction,
 * progress tracking, interactive elements, and personalized learning paths
 * 
 * Features:
 * - Progressive step-by-step guidance
 * - Interactive elements (quizzes, checkpoints, tips)
 * - Real-time progress tracking with analytics
 * - Personalized content adaptation
 * - Accessibility features for inclusive learning
 * - Integration with tutorial content manager
 * - Gamification elements (achievements, progress bars)
 * - Adaptive difficulty based on user performance
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassContainer, GlassCard, GlassButton } from '../GlassmorphismComponents';
import TutorialVideo from './TutorialVideo';
import tutorialService from '../../services/tutorialService';
import tutorialContentManager from '../../utils/tutorialContentManager';
import { useTheme } from '../../contexts/ThemeContext';
import { createThemedStyles, spacing, typography, borderRadius, colors } from '../../utils/designTokens';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Step types for different interaction modes
 */
const STEP_TYPES = {
  INTRO: 'introduction',
  VIDEO: 'video',
  TEXT: 'text',
  INTERACTIVE: 'interactive',
  QUIZ: 'quiz',
  CHECKLIST: 'checklist',
  TIP: 'tips',
  WARNING: 'warning',
  CHECKPOINT: 'checkpoint',
  COMPLETION: 'completion',
};

/**
 * Interactive element types
 */
const INTERACTION_TYPES = {
  BEFORE_AFTER: 'before-after',
  COMPARISON: 'comparison',
  HOTSPOT: 'hotspot',
  DRAG_DROP: 'drag-drop',
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  SLIDER: 'slider',
  DRAWING: 'drawing',
};

const InteractiveTutorial = memo(({
  tutorialId,
  tutorialContent,
  exerciseType,
  userLevel = 'beginner',
  enablePersonalization = true,
  showProgressBar = true,
  enableGamification = true,
  onStepComplete,
  onTutorialComplete,
  onProgress,
  onInteraction,
  onError,
  style,
  accessibilityLabel,
  testID,
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [stepProgress, setStepProgress] = useState({});
  const [totalProgress, setTotalProgress] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [personalizedContent, setPersonalizedContent] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Interaction state
  const [activeInteraction, setActiveInteraction] = useState(null);
  const [interactionResult, setInteractionResult] = useState(null);
  const [showHints, setShowHints] = useState(userLevel === 'beginner');
  const [hintUsed, setHintUsed] = useState(false);
  
  // Animation values
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const stepAnimation = useRef(new Animated.Value(0)).current;
  const achievementAnimation = useRef(new Animated.Value(0)).current;
  
  // Analytics tracking
  const startTime = useRef(Date.now());
  const stepStartTime = useRef(Date.now());
  const interactionCount = useRef(0);
  const hintsUsed = useRef(0);
  const errorsCount = useRef(0);
  
  // Theme
  const { isDarkMode } = useTheme();
  const styles = createThemedStyles(styleSheet, isDarkMode ? 'dark' : 'light');

  /**
   * Initialize tutorial content and personalization
   */
  useEffect(() => {
    initializeTutorial();
    return cleanup;
  }, [tutorialId, exerciseType, userLevel]);

  /**
   * Update progress animation when total progress changes
   */
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: totalProgress / 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [totalProgress]);

  /**
   * Animate step transitions
   */
  useEffect(() => {
    Animated.spring(stepAnimation, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  /**
   * Initialize tutorial with personalized content
   */
  const initializeTutorial = async () => {
    try {
      setIsLoading(true);
      stepStartTime.current = Date.now();
      
      let content = tutorialContent;
      if (!content && tutorialId) {
        content = await tutorialService.getTutorialContent(tutorialId);
      }
      
      if (!content) {
        throw new Error('No tutorial content available');
      }
      
      // Get personalized tutorial content if enabled
      if (enablePersonalization) {
        const userProfile = await getUserProfile();
        const personalizedTutorial = await tutorialContentManager.getPersonalizedTutorials(
          userProfile,
          { limit: 1, categories: [content.category] }
        );
        
        if (personalizedTutorial.recommendations.length > 0) {
          setPersonalizedContent(personalizedTutorial);
          content = personalizedTutorial.recommendations[0];
        }
      }
      
      // Process tutorial steps
      const processedSteps = await processTutorialSteps(content);
      setSteps(processedSteps);
      
      // Initialize progress tracking
      const initialProgress = processedSteps.reduce((acc, _, index) => {
        acc[index] = { completed: false, timeSpent: 0, interactions: 0 };
        return acc;
      }, {});
      setStepProgress(initialProgress);
      
      // Start tutorial progress tracking
      await tutorialService.startTutorial(tutorialId);
      
    } catch (error) {
      console.error('Error initializing interactive tutorial:', error);
      onError?.(error);
      Alert.alert(
        'Tutorial Error',
        'Unable to load tutorial content. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get user profile for personalization
   */
  const getUserProfile = async () => {
    try {
      const progress = await tutorialService.getUserProgress({ includeDetails: true });
      return {
        level: userLevel,
        completedTutorials: progress.summary?.totalCompleted || 0,
        averageScore: progress.summary?.averageScore || 0,
        preferences: {
          showHints: userLevel === 'beginner',
          preferredLearningStyle: 'visual', // Could be determined from user behavior
        }
      };
    } catch (error) {
      console.warn('Failed to get user profile for personalization:', error);
      return {
        level: userLevel,
        completedTutorials: 0,
        averageScore: 0,
        preferences: { showHints: userLevel === 'beginner' }
      };
    }
  };

  /**
   * Process tutorial content into interactive steps
   */
  const processTutorialSteps = async (content) => {
    try {
      const processedSteps = [];
      
      // Add introduction step
      processedSteps.push({
        id: 'intro',
        type: STEP_TYPES.INTRO,
        title: content.title || 'Tutorial Introduction',
        content: content.description || 'Welcome to this interactive tutorial',
        estimatedDuration: 30,
        required: true,
      });
      
      // Process content structure if available
      if (content.structure && Array.isArray(content.structure)) {
        for (const section of content.structure) {
          const step = await processContentSection(section);
          if (step) {
            processedSteps.push(step);
          }
        }
      }
      
      // Add video steps if media URLs are available
      if (content.mediaUrls) {
        processedSteps.push({
          id: 'main-video',
          type: STEP_TYPES.VIDEO,
          title: 'Video Demonstration',
          content: content,
          estimatedDuration: content.estimatedDuration || 300,
          required: true,
        });
      }
      
      // Add interactive elements based on content type
      if (content.interactiveElements) {
        const interactiveSteps = content.interactiveElements.map((element, index) => ({
          id: `interactive-${index}`,
          type: STEP_TYPES.INTERACTIVE,
          title: element.title || `Interactive Element ${index + 1}`,
          content: element,
          estimatedDuration: 120,
          required: true,
        }));
        processedSteps.push(...interactiveSteps);
      }
      
      // Add personalized tips if available
      if (personalizedContent?.personalizedTips) {
        personalizedContent.personalizedTips.forEach((tip, index) => {
          processedSteps.push({
            id: `tip-${index}`,
            type: STEP_TYPES.TIP,
            title: 'Personalized Tip',
            content: tip.message,
            priority: tip.priority,
            estimatedDuration: 60,
            required: tip.priority === 'high',
          });
        });
      }
      
      // Add completion step
      processedSteps.push({
        id: 'completion',
        type: STEP_TYPES.COMPLETION,
        title: 'Tutorial Complete',
        content: 'Congratulations! You have completed this tutorial.',
        estimatedDuration: 30,
        required: true,
      });
      
      return processedSteps;
    } catch (error) {
      console.error('Error processing tutorial steps:', error);
      return [];
    }
  };

  /**
   * Process individual content section
   */
  const processContentSection = async (section) => {
    try {
      const step = {
        id: section.section || `section-${Date.now()}`,
        type: section.type || STEP_TYPES.TEXT,
        title: section.title || section.section,
        content: section.content,
        estimatedDuration: section.estimatedDuration || 90,
        required: section.required !== false,
      };
      
      // Add interactive elements if present
      if (section.content?.interactions) {
        step.interactions = section.content.interactions;
      }
      
      // Add difficulty-specific modifications
      if (userLevel === 'beginner' && section.content?.hints) {
        step.hints = section.content.hints;
      }
      
      return step;
    } catch (error) {
      console.warn('Error processing content section:', error);
      return null;
    }
  };

  /**
   * Navigate to next step
   */
  const handleNextStep = async () => {
    try {
      // Mark current step as completed
      await markStepCompleted(currentStep);
      
      // Check if tutorial is complete
      if (currentStep >= steps.length - 1) {
        await handleTutorialCompletion();
        return;
      }
      
      // Move to next step
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      stepStartTime.current = Date.now();
      
      // Reset step animation
      stepAnimation.setValue(0);
      
      // Track step progression
      await trackStepProgression(currentStep, nextStep);
      
    } catch (error) {
      console.error('Error navigating to next step:', error);
      onError?.(error);
    }
  };

  /**
   * Navigate to previous step
   */
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      stepStartTime.current = Date.now();
      stepAnimation.setValue(0);
    }
  };

  /**
   * Jump to specific step
   */
  const jumpToStep = async (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      // Mark skipped steps if jumping forward
      if (stepIndex > currentStep) {
        for (let i = currentStep; i < stepIndex; i++) {
          await markStepCompleted(i, { skipped: true });
        }
      }
      
      setCurrentStep(stepIndex);
      stepStartTime.current = Date.now();
      stepAnimation.setValue(0);
    }
  };

  /**
   * Mark step as completed and update progress
   */
  const markStepCompleted = async (stepIndex, options = {}) => {
    try {
      const step = steps[stepIndex];
      if (!step) return;
      
      const timeSpent = Math.floor((Date.now() - stepStartTime.current) / 1000);
      const stepData = {
        completed: true,
        timeSpent,
        interactions: interactionCount.current,
        hintsUsed: hintsUsed.current,
        errors: errorsCount.current,
        skipped: options.skipped || false,
        completedAt: new Date(),
      };
      
      // Update step progress
      const updatedProgress = {
        ...stepProgress,
        [stepIndex]: stepData
      };
      setStepProgress(updatedProgress);
      
      // Calculate total progress
      const completedSteps = Object.values(updatedProgress).filter(p => p.completed).length;
      const newTotalProgress = (completedSteps / steps.length) * 100;
      setTotalProgress(newTotalProgress);
      
      // Update tutorial service
      await tutorialService.updateTutorialProgress(tutorialId, {
        progressPercentage: newTotalProgress,
        currentSection: stepIndex,
        timeSpent: Math.floor((Date.now() - startTime.current) / 1000),
        stepProgress: updatedProgress,
      });
      
      // Check for achievements
      if (enableGamification) {
        await checkAchievements(stepIndex, stepData);
      }
      
      // Trigger callbacks
      onStepComplete?.(stepIndex, stepData);
      onProgress?.(newTotalProgress, stepIndex, steps.length);
      
      // Reset step counters
      interactionCount.current = 0;
      hintsUsed.current = 0;
      errorsCount.current = 0;
      
    } catch (error) {
      console.error('Error marking step as completed:', error);
    }
  };

  /**
   * Handle tutorial completion
   */
  const handleTutorialCompletion = async () => {
    try {
      setIsCompleted(true);
      const totalTimeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      
      // Calculate completion score
      const completionScore = calculateCompletionScore();
      
      // Complete tutorial in service
      await tutorialService.completeTutorial(tutorialId, {
        timeSpent: totalTimeSpent,
        completionScore,
        stepProgress: stepProgress,
        achievements: achievements,
        completedAt: new Date(),
      });
      
      // Track engagement metrics
      await trackTutorialEngagement(completionScore);
      
      // Trigger completion callback
      onTutorialComplete?.({
        tutorialId,
        timeSpent: totalTimeSpent,
        completionScore,
        achievements: achievements.length,
      });
      
      // Show completion animation if gamification is enabled
      if (enableGamification) {
        await showCompletionAnimation();
      }
      
    } catch (error) {
      console.error('Error handling tutorial completion:', error);
      onError?.(error);
    }
  };

  /**
   * Calculate completion score based on performance
   */
  const calculateCompletionScore = () => {
    const steps = Object.values(stepProgress);
    const completedSteps = steps.filter(s => s.completed && !s.skipped);
    const totalInteractions = steps.reduce((sum, s) => sum + (s.interactions || 0), 0);
    const totalHints = steps.reduce((sum, s) => sum + (s.hintsUsed || 0), 0);
    const totalErrors = steps.reduce((sum, s) => sum + (s.errors || 0), 0);
    
    let score = 50; // Base score
    
    // Completion bonus
    score += (completedSteps.length / steps.length) * 30;
    
    // Interaction bonus
    score += Math.min(10, totalInteractions);
    
    // Penalty for hints (encouraging independent learning)
    score -= totalHints * 2;
    
    // Penalty for errors
    score -= totalErrors * 3;
    
    return Math.max(0, Math.min(100, score));
  };

  /**
   * Handle interactive element interaction
   */
  const handleInteraction = async (interactionType, data) => {
    try {
      interactionCount.current += 1;
      setActiveInteraction({ type: interactionType, data });
      
      // Process interaction based on type
      let result = null;
      switch (interactionType) {
        case INTERACTION_TYPES.MULTIPLE_CHOICE:
          result = await processMultipleChoiceInteraction(data);
          break;
        case INTERACTION_TYPES.TRUE_FALSE:
          result = await processTrueFalseInteraction(data);
          break;
        case INTERACTION_TYPES.BEFORE_AFTER:
          result = await processBeforeAfterInteraction(data);
          break;
        default:
          result = { success: true, feedback: 'Interaction completed' };
      }
      
      setInteractionResult(result);
      
      // Track analytics
      await trackInteractionAnalytics(interactionType, data, result);
      
      // Trigger callback
      onInteraction?.(interactionType, data, result);
      
    } catch (error) {
      console.error('Error handling interaction:', error);
      errorsCount.current += 1;
      setInteractionResult({ 
        success: false, 
        error: error.message,
        feedback: 'There was an error processing your response. Please try again.'
      });
    }
  };

  /**
   * Process multiple choice interaction
   */
  const processMultipleChoiceInteraction = async (data) => {
    const { question, options, selectedAnswer, correctAnswer } = data;
    const isCorrect = selectedAnswer === correctAnswer;
    
    if (!isCorrect) {
      errorsCount.current += 1;
    }
    
    return {
      success: isCorrect,
      feedback: isCorrect ? 'Correct! Great job!' : 'Not quite right. Try again!',
      explanation: options.find(opt => opt.value === correctAnswer)?.explanation,
    };
  };

  /**
   * Process true/false interaction
   */
  const processTrueFalseInteraction = async (data) => {
    const { question, selectedAnswer, correctAnswer, explanation } = data;
    const isCorrect = selectedAnswer === correctAnswer;
    
    if (!isCorrect) {
      errorsCount.current += 1;
    }
    
    return {
      success: isCorrect,
      feedback: isCorrect ? 'Correct!' : 'Incorrect.',
      explanation: explanation,
    };
  };

  /**
   * Process before/after comparison interaction
   */
  const processBeforeAfterInteraction = async (data) => {
    const { viewed } = data;
    return {
      success: true,
      feedback: 'Great! You can see the difference between incorrect and correct form.',
      engagement: true,
    };
  };

  /**
   * Show hint for current step
   */
  const showHint = () => {
    const currentStepData = steps[currentStep];
    if (currentStepData?.hints) {
      setShowHints(true);
      setHintUsed(true);
      hintsUsed.current += 1;
      
      Alert.alert(
        'Hint',
        currentStepData.hints[0] || 'Focus on the key points and take your time.',
        [{ text: 'Got it!' }]
      );
    }
  };

  /**
   * Check for achievements and unlock them
   */
  const checkAchievements = async (stepIndex, stepData) => {
    try {
      const newAchievements = [];
      
      // First step achievement
      if (stepIndex === 0) {
        newAchievements.push({
          id: 'first_step',
          title: 'Getting Started',
          description: 'Completed your first tutorial step',
          icon: 'play-circle',
          unlockedAt: new Date(),
        });
      }
      
      // No hints used achievement
      if (stepData.hintsUsed === 0 && stepIndex > 2) {
        newAchievements.push({
          id: 'independent_learner',
          title: 'Independent Learner',
          description: 'Completed multiple steps without using hints',
          icon: 'star',
          unlockedAt: new Date(),
        });
      }
      
      // Perfect score achievement
      if (stepData.errors === 0 && stepData.interactions > 0) {
        newAchievements.push({
          id: 'perfect_step',
          title: 'Perfect Step',
          description: 'Completed a step with no errors',
          icon: 'checkmark-circle',
          unlockedAt: new Date(),
        });
      }
      
      // Update achievements
      if (newAchievements.length > 0) {
        const updatedAchievements = [...achievements, ...newAchievements];
        setAchievements(updatedAchievements);
        
        // Show achievement animation
        await showAchievementAnimation(newAchievements);
      }
      
    } catch (error) {
      console.warn('Error checking achievements:', error);
    }
  };

  /**
   * Show achievement unlock animation
   */
  const showAchievementAnimation = async (newAchievements) => {
    return new Promise((resolve) => {
      Animated.sequence([
        Animated.timing(achievementAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(achievementAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        resolve();
      });
    });
  };

  /**
   * Show completion animation
   */
  const showCompletionAnimation = async () => {
    return new Promise((resolve) => {
      Animated.spring(achievementAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(achievementAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(resolve);
        }, 3000);
      });
    });
  };

  /**
   * Track step progression analytics
   */
  const trackStepProgression = async (fromStep, toStep) => {
    try {
      await tutorialService.trackTutorialEvent('step_progression', {
        tutorialId,
        fromStep,
        toStep,
        timestamp: new Date(),
        userId: 'current_user', // This would come from auth context
      });
    } catch (error) {
      console.warn('Failed to track step progression:', error);
    }
  };

  /**
   * Track interaction analytics
   */
  const trackInteractionAnalytics = async (interactionType, data, result) => {
    try {
      await tutorialService.trackTutorialEvent('interaction', {
        tutorialId,
        stepIndex: currentStep,
        interactionType,
        success: result.success,
        timestamp: new Date(),
        userId: 'current_user',
      });
    } catch (error) {
      console.warn('Failed to track interaction analytics:', error);
    }
  };

  /**
   * Track overall tutorial engagement
   */
  const trackTutorialEngagement = async (completionScore) => {
    try {
      const totalTimeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      const totalInteractions = Object.values(stepProgress).reduce((sum, s) => sum + (s.interactions || 0), 0);
      
      await tutorialService.trackEngagementMetrics(tutorialId, {
        timeSpent: totalTimeSpent,
        interactionCount: totalInteractions,
        completionPercentage: 100,
        hintsUsed: Object.values(stepProgress).reduce((sum, s) => sum + (s.hintsUsed || 0), 0),
        errorsCount: Object.values(stepProgress).reduce((sum, s) => sum + (s.errors || 0), 0),
        achievementsUnlocked: achievements.length,
        completionScore,
      });
    } catch (error) {
      console.warn('Failed to track tutorial engagement:', error);
    }
  };

  /**
   * Cleanup function
   */
  const cleanup = () => {
    // Clean up any timers, listeners, etc.
  };

  // Render current step content
  const renderStepContent = () => {
    const step = steps[currentStep];
    if (!step) return null;

    switch (step.type) {
      case STEP_TYPES.VIDEO:
        return (
          <TutorialVideo
            tutorialContent={step.content}
            contentId={step.id}
            autoplay={false}
            onProgress={(progress) => {
              // Update step progress based on video progress
              const videoProgress = progress.percentage;
              if (videoProgress > 80) {
                // Consider video mostly watched
                setTimeout(() => handleNextStep(), 1000);
              }
            }}
            onComplete={() => {
              setTimeout(() => handleNextStep(), 1000);
            }}
            style={styles.videoPlayer}
          />
        );
        
      case STEP_TYPES.INTERACTIVE:
        return renderInteractiveContent(step);
        
      case STEP_TYPES.QUIZ:
        return renderQuizContent(step);
        
      case STEP_TYPES.CHECKLIST:
        return renderChecklistContent(step);
        
      case STEP_TYPES.TIP:
        return renderTipContent(step);
        
      case STEP_TYPES.WARNING:
        return renderWarningContent(step);
        
      case STEP_TYPES.COMPLETION:
        return renderCompletionContent(step);
        
      default:
        return renderTextContent(step);
    }
  };

  /**
   * Render interactive content
   */
  const renderInteractiveContent = (step) => {
    if (!step.content?.interactions) return renderTextContent(step);
    
    return (
      <View style={styles.interactiveContainer}>
        {step.content.interactions.map((interaction, index) => (
          <View key={index} style={styles.interactionItem}>
            {renderInteractionElement(interaction, index)}
          </View>
        ))}
      </View>
    );
  };

  /**
   * Render individual interaction element
   */
  const renderInteractionElement = (interaction, index) => {
    switch (interaction.type) {
      case INTERACTION_TYPES.MULTIPLE_CHOICE:
        return renderMultipleChoiceInteraction(interaction, index);
      case INTERACTION_TYPES.TRUE_FALSE:
        return renderTrueFalseInteraction(interaction, index);
      case INTERACTION_TYPES.BEFORE_AFTER:
        return renderBeforeAfterInteraction(interaction, index);
      default:
        return (
          <Text style={styles.interactionText}>
            Interactive element: {interaction.type}
          </Text>
        );
    }
  };

  /**
   * Render multiple choice interaction
   */
  const renderMultipleChoiceInteraction = (interaction, index) => (
    <GlassCard style={styles.quizCard}>
      <Text style={styles.questionText}>{interaction.question}</Text>
      <View style={styles.optionsContainer}>
        {interaction.options.map((option, optionIndex) => (
          <TouchableOpacity
            key={optionIndex}
            style={[
              styles.optionButton,
              userResponses[index] === option.value && styles.selectedOption
            ]}
            onPress={() => {
              const newResponses = { ...userResponses, [index]: option.value };
              setUserResponses(newResponses);
              handleInteraction(INTERACTION_TYPES.MULTIPLE_CHOICE, {
                question: interaction.question,
                options: interaction.options,
                selectedAnswer: option.value,
                correctAnswer: interaction.correctAnswer,
              });
            }}
            accessibilityLabel={`Option ${optionIndex + 1}: ${option.text}`}
            accessibilityRole="button"
          >
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {interactionResult && (
        <View style={styles.feedbackContainer}>
          <Text style={[
            styles.feedbackText,
            { color: interactionResult.success ? colors.semantic.success.light.primary : colors.semantic.error.light.primary }
          ]}>
            {interactionResult.feedback}
          </Text>
          {interactionResult.explanation && (
            <Text style={styles.explanationText}>
              {interactionResult.explanation}
            </Text>
          )}
        </View>
      )}
    </GlassCard>
  );

  /**
   * Render true/false interaction
   */
  const renderTrueFalseInteraction = (interaction, index) => (
    <GlassCard style={styles.quizCard}>
      <Text style={styles.questionText}>{interaction.statement}</Text>
      <View style={styles.trueFalseContainer}>
        <TouchableOpacity
          style={[
            styles.trueFalseButton,
            userResponses[index] === true && styles.selectedOption
          ]}
          onPress={() => {
            const newResponses = { ...userResponses, [index]: true };
            setUserResponses(newResponses);
            handleInteraction(INTERACTION_TYPES.TRUE_FALSE, {
              question: interaction.statement,
              selectedAnswer: true,
              correctAnswer: interaction.correctAnswer,
              explanation: interaction.explanation,
            });
          }}
          accessibilityLabel="True"
        >
          <Ionicons name="checkmark" size={24} color={colors.semantic.success.light.primary} />
          <Text style={styles.trueFalseText}>True</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.trueFalseButton,
            userResponses[index] === false && styles.selectedOption
          ]}
          onPress={() => {
            const newResponses = { ...userResponses, [index]: false };
            setUserResponses(newResponses);
            handleInteraction(INTERACTION_TYPES.TRUE_FALSE, {
              question: interaction.statement,
              selectedAnswer: false,
              correctAnswer: interaction.correctAnswer,
              explanation: interaction.explanation,
            });
          }}
          accessibilityLabel="False"
        >
          <Ionicons name="close" size={24} color={colors.semantic.error.light.primary} />
          <Text style={styles.trueFalseText}>False</Text>
        </TouchableOpacity>
      </View>
      {interactionResult && (
        <View style={styles.feedbackContainer}>
          <Text style={[
            styles.feedbackText,
            { color: interactionResult.success ? colors.semantic.success.light.primary : colors.semantic.error.light.primary }
          ]}>
            {interactionResult.feedback}
          </Text>
          {interactionResult.explanation && (
            <Text style={styles.explanationText}>
              {interactionResult.explanation}
            </Text>
          )}
        </View>
      )}
    </GlassCard>
  );

  /**
   * Render before/after interaction
   */
  const renderBeforeAfterInteraction = (interaction, index) => (
    <GlassCard style={styles.comparisonCard}>
      <Text style={styles.comparisonTitle}>{interaction.title}</Text>
      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Before (Incorrect)</Text>
          <View style={styles.mediaPlaceholder}>
            <Ionicons name="image" size={48} color={isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary} />
          </View>
        </View>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>After (Correct)</Text>
          <View style={styles.mediaPlaceholder}>
            <Ionicons name="image" size={48} color={colors.semantic.success.light.primary} />
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.comparisonButton}
        onPress={() => {
          handleInteraction(INTERACTION_TYPES.BEFORE_AFTER, {
            viewed: true,
            comparison: interaction.title,
          });
        }}
        accessibilityLabel="Mark as viewed"
      >
        <Text style={styles.comparisonButtonText}>I can see the difference</Text>
      </TouchableOpacity>
    </GlassCard>
  );

  /**
   * Render quiz content
   */
  const renderQuizContent = (step) => (
    <GlassCard style={styles.quizContainer}>
      <Text style={styles.stepTitle}>{step.title}</Text>
      <Text style={styles.stepDescription}>{step.content}</Text>
      {/* Quiz implementation would go here */}
    </GlassCard>
  );

  /**
   * Render checklist content
   */
  const renderChecklistContent = (step) => (
    <GlassCard style={styles.checklistContainer}>
      <Text style={styles.stepTitle}>{step.title}</Text>
      {step.content.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.checklistItem}
          onPress={() => {
            // Toggle checklist item
            const key = `checklist_${currentStep}_${index}`;
            const newResponses = { 
              ...userResponses, 
              [key]: !userResponses[key] 
            };
            setUserResponses(newResponses);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: userResponses[`checklist_${currentStep}_${index}`] }}
        >
          <Ionicons
            name={userResponses[`checklist_${currentStep}_${index}`] ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={userResponses[`checklist_${currentStep}_${index}`] ? colors.semantic.success.light.primary : isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary}
          />
          <Text style={styles.checklistText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </GlassCard>
  );

  /**
   * Render tip content
   */
  const renderTipContent = (step) => (
    <GlassCard style={styles.tipContainer}>
      <View style={styles.tipHeader}>
        <Ionicons name="bulb" size={24} color={colors.semantic.info.light.primary} />
        <Text style={styles.tipTitle}>Tip</Text>
      </View>
      <Text style={styles.tipText}>{step.content}</Text>
    </GlassCard>
  );

  /**
   * Render warning content
   */
  const renderWarningContent = (step) => (
    <GlassCard style={styles.warningContainer}>
      <View style={styles.warningHeader}>
        <Ionicons name="warning" size={24} color={colors.semantic.warning.light.primary} />
        <Text style={styles.warningTitle}>Important</Text>
      </View>
      <Text style={styles.warningText}>{step.content}</Text>
    </GlassCard>
  );

  /**
   * Render completion content
   */
  const renderCompletionContent = (step) => (
    <GlassCard style={styles.completionContainer}>
      <View style={styles.completionHeader}>
        <Ionicons name="checkmark-circle" size={48} color={colors.semantic.success.light.primary} />
        <Text style={styles.completionTitle}>Tutorial Complete!</Text>
      </View>
      <Text style={styles.completionText}>{step.content}</Text>
      {achievements.length > 0 && (
        <View style={styles.achievementsContainer}>
          <Text style={styles.achievementsTitle}>Achievements Unlocked</Text>
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <Ionicons name={achievement.icon} size={20} color={colors.primary.DEFAULT} />
              <View style={styles.achievementText}>
                <Text style={styles.achievementName}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );

  /**
   * Render text content (default)
   */
  const renderTextContent = (step) => (
    <GlassCard style={styles.textContainer}>
      <Text style={styles.stepTitle}>{step.title}</Text>
      <Text style={styles.stepContent}>{step.content}</Text>
    </GlassCard>
  );

  // Loading state
  if (isLoading) {
    return (
      <GlassContainer style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading interactive tutorial...</Text>
        </View>
      </GlassContainer>
    );
  }

  // No steps available
  if (steps.length === 0) {
    return (
      <GlassContainer style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No tutorial content available</Text>
        </View>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer 
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel || "Interactive tutorial"}
      testID={testID}
    >
      {/* Progress Bar */}
      {showProgressBar && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(totalProgress)}% Complete ({currentStep + 1} of {steps.length})
          </Text>
        </View>
      )}

      {/* Main Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: stepAnimation,
            transform: [
              {
                translateY: stepAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          style={styles.stepScrollView}
          contentContainerStyle={styles.stepScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>
      </Animated.View>

      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={handlePreviousStep}
          disabled={currentStep === 0}
          accessibilityLabel="Previous step"
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={currentStep === 0 ? (isDarkMode ? colors.dark.text.disabled : colors.light.text.disabled) : colors.primary.DEFAULT} 
          />
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        {/* Hint Button */}
        {steps[currentStep]?.hints && showHints && (
          <TouchableOpacity
            style={styles.hintButton}
            onPress={showHint}
            accessibilityLabel="Show hint"
          >
            <Ionicons name="help-circle" size={24} color={colors.semantic.info.light.primary} />
            <Text style={styles.hintButtonText}>Hint</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextStep}
          accessibilityLabel={currentStep >= steps.length - 1 ? "Complete tutorial" : "Next step"}
        >
          <Text style={styles.navButtonText}>
            {currentStep >= steps.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={24} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
      </View>

      {/* Achievement Animation */}
      {achievements.length > 0 && (
        <Animated.View
          style={[
            styles.achievementOverlay,
            {
              opacity: achievementAnimation,
              transform: [
                {
                  scale: achievementAnimation,
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.achievementBadge}>
            <Ionicons name="star" size={32} color={colors.semantic.warning.light.primary} />
            <Text style={styles.achievementOverlayText}>Achievement Unlocked!</Text>
          </View>
        </Animated.View>
      )}
    </GlassContainer>
  );
});

/**
 * Component styles
 */
const styleSheet = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[4],
    backgroundColor: 'transparent',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  
  loadingText: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  
  errorText: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  
  progressBarContainer: {
    marginBottom: spacing[5],
  },
  
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.border.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.full,
  },
  
  progressText: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing[2],
    fontWeight: typography.fontWeight.medium,
  },
  
  contentContainer: {
    flex: 1,
    marginBottom: spacing[4],
  },
  
  stepScrollView: {
    flex: 1,
  },
  
  stepScrollContent: {
    paddingBottom: spacing[4],
  },
  
  videoPlayer: {
    marginBottom: spacing[4],
  },
  
  textContainer: {
    padding: spacing[5],
  },
  
  stepTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[3],
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
  },
  
  stepContent: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  
  interactiveContainer: {
    gap: spacing[4],
  },
  
  interactionItem: {
    marginBottom: spacing[3],
  },
  
  interactionText: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.base,
    fontStyle: 'italic',
  },
  
  quizCard: {
    padding: spacing[5],
  },
  
  questionText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[4],
    lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
  },
  
  optionsContainer: {
    gap: spacing[2],
  },
  
  optionButton: {
    padding: spacing[3],
    borderRadius: borderRadius.base,
    backgroundColor: theme.background.secondary,
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  
  selectedOption: {
    backgroundColor: colors.primary.light + '20',
    borderColor: colors.primary.DEFAULT,
  },
  
  optionText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  
  trueFalseContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'center',
  },
  
  trueFalseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.base,
    backgroundColor: theme.background.secondary,
    borderWidth: 1,
    borderColor: theme.border.light,
    gap: spacing[2],
  },
  
  trueFalseText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  
  feedbackContainer: {
    marginTop: spacing[4],
    padding: spacing[3],
    borderRadius: borderRadius.base,
    backgroundColor: theme.background.tertiary,
  },
  
  feedbackText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[1],
  },
  
  explanationText: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  
  comparisonCard: {
    padding: spacing[5],
  },
  
  comparisonTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  
  comparisonContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  comparisonLabel: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[2],
  },
  
  mediaPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.background.secondary,
    borderRadius: borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  
  comparisonButton: {
    padding: spacing[3],
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.base,
    alignItems: 'center',
  },
  
  comparisonButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  
  quizContainer: {
    padding: spacing[5],
  },
  
  checklistContainer: {
    padding: spacing[5],
  },
  
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    gap: spacing[3],
  },
  
  checklistText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  
  tipContainer: {
    padding: spacing[5],
    backgroundColor: colors.semantic.info.light.background + (theme.isDark ? '40' : ''),
    borderWidth: 1,
    borderColor: colors.semantic.info.light.border + (theme.isDark ? '60' : ''),
  },
  
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  
  tipTitle: {
    color: colors.semantic.info.light.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  
  tipText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  
  warningContainer: {
    padding: spacing[5],
    backgroundColor: colors.semantic.warning.light.background + (theme.isDark ? '40' : ''),
    borderWidth: 1,
    borderColor: colors.semantic.warning.light.border + (theme.isDark ? '60' : ''),
  },
  
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  
  warningTitle: {
    color: colors.semantic.warning.light.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  
  warningText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  
  completionContainer: {
    padding: spacing[6],
    alignItems: 'center',
    backgroundColor: colors.semantic.success.light.background + (theme.isDark ? '40' : ''),
    borderWidth: 1,
    borderColor: colors.semantic.success.light.border + (theme.isDark ? '60' : ''),
  },
  
  completionHeader: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  
  completionTitle: {
    color: colors.semantic.success.light.primary,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  
  completionText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    marginBottom: spacing[4],
  },
  
  achievementsContainer: {
    alignSelf: 'stretch',
  },
  
  achievementsTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    gap: spacing[3],
  },
  
  achievementText: {
    flex: 1,
  },
  
  achievementName: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  
  achievementDescription: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.border.light,
  },
  
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.base,
    gap: spacing[2],
  },
  
  navButtonDisabled: {
    backgroundColor: theme.background.secondary,
  },
  
  navButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  
  navButtonTextDisabled: {
    color: theme.text.disabled,
  },
  
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    backgroundColor: colors.semantic.info.light.background,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.semantic.info.light.border,
    gap: spacing[1],
  },
  
  hintButtonText: {
    color: colors.semantic.info.light.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  
  achievementOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    zIndex: 1000,
  },
  
  achievementBadge: {
    backgroundColor: colors.semantic.warning.light.background,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.semantic.warning.light.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  achievementOverlayText: {
    color: colors.semantic.warning.light.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});

InteractiveTutorial.displayName = 'InteractiveTutorial';

export default InteractiveTutorial;