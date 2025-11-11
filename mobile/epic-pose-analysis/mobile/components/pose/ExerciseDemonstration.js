/**
 * ExerciseDemonstration Component
 * 
 * Visual exercise technique demonstration component with before/after comparisons,
 * common mistake identification, progressive movement patterns, and form analysis
 * 
 * Features:
 * - Professional exercise technique demonstrations
 * - Before/after form comparison views
 * - Common mistakes identification with corrections
 * - Progressive skill level tutorials (beginner to advanced)
 * - Interactive form analysis with pose landmarks
 * - Recording best practices guidance
 * - Accessibility features for diverse user needs
 * - Real-time feedback and coaching tips
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassContainer, GlassCard, GlassButton } from '../GlassmorphismComponents';
import TutorialVideo from './TutorialVideo';
import tutorialService from '../../services/tutorialService';
import tutorialContentManager, { EXERCISE_TYPES } from '../../utils/tutorialContentManager';
import contentDeliveryService from '../../services/contentDeliveryService';
import { useTheme } from '../../contexts/ThemeContext';
import { createThemedStyles, spacing, typography, borderRadius, colors } from '../../utils/designTokens';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Demonstration modes
 */
const DEMO_MODES = {
  CORRECT_FORM: 'correct-form',
  COMMON_MISTAKES: 'common-mistakes',
  BEFORE_AFTER: 'before-after',
  PROGRESSIVE: 'progressive',
  RECORDING_SETUP: 'recording-setup',
  FORM_ANALYSIS: 'form-analysis',
};

/**
 * Skill levels for progressive demonstrations
 */
const SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
};

/**
 * Common mistake categories
 */
const MISTAKE_CATEGORIES = {
  FORM: 'form-errors',
  RANGE_OF_MOTION: 'range-of-motion',
  BREATHING: 'breathing-technique',
  TEMPO: 'tempo-control',
  SETUP: 'setup-positioning',
};

const ExerciseDemonstration = memo(({
  exerciseType = EXERCISE_TYPES.SQUAT,
  skillLevel = SKILL_LEVELS.BEGINNER,
  mode = DEMO_MODES.CORRECT_FORM,
  showProgressiveSteps = true,
  showCommonMistakes = true,
  showRecordingTips = true,
  enableFormAnalysis = true,
  onMistakeIdentified,
  onProgressionCompleted,
  onFormAnalyzed,
  onError,
  style,
  accessibilityLabel,
  testID,
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [demonstrationContent, setDemonstrationContent] = useState(null);
  const [currentView, setCurrentView] = useState(mode);
  const [selectedMistake, setSelectedMistake] = useState(null);
  const [currentProgression, setCurrentProgression] = useState(0);
  const [formAnalysisData, setFormAnalysisData] = useState(null);
  
  // Progressive demonstrations
  const [progressions, setProgressions] = useState([]);
  const [currentSkillLevel, setCurrentSkillLevel] = useState(skillLevel);
  
  // Common mistakes data
  const [commonMistakes, setCommonMistakes] = useState([]);
  const [mistakeAnalysis, setMistakeAnalysis] = useState({});
  
  // Recording guidance
  const [recordingTips, setRecordingTips] = useState([]);
  const [cameraAngles, setCameraAngles] = useState([]);
  
  // Animation values
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const mistakeHighlightAnimation = useRef(new Animated.Value(0)).current;
  
  // Analytics
  const viewStartTime = useRef(Date.now());
  const mistakeViewCount = useRef(0);
  const progressionCompletions = useRef(0);
  
  // Theme
  const { isDarkMode } = useTheme();
  const styles = createThemedStyles(styleSheet, isDarkMode ? 'dark' : 'light');

  /**
   * Initialize exercise demonstration content
   */
  useEffect(() => {
    initializeDemonstration();
    return cleanup;
  }, [exerciseType, skillLevel, mode]);

  /**
   * Update view when mode changes
   */
  useEffect(() => {
    handleViewChange(currentView);
  }, [currentView]);

  /**
   * Initialize demonstration with comprehensive content
   */
  const initializeDemonstration = async () => {
    try {
      setIsLoading(true);
      viewStartTime.current = Date.now();
      
      // Get exercise technique tutorial from content manager
      const techniqueContent = await tutorialContentManager.getExerciseTechniqueTutorial(
        exerciseType,
        {
          includeCommonMistakes: showCommonMistakes,
          includeProgressions: showProgressiveSteps,
          userLevel: skillLevel,
        }
      );
      
      setDemonstrationContent(techniqueContent);
      
      // Load progressive demonstrations if enabled
      if (showProgressiveSteps) {
        const progressiveContent = await loadProgressiveDemonstrations();
        setProgressions(progressiveContent);
      }
      
      // Load common mistakes if enabled
      if (showCommonMistakes && techniqueContent.commonMistakes) {
        setCommonMistakes(techniqueContent.commonMistakes);
        await analyzeCommonMistakes(techniqueContent.commonMistakes);
      }
      
      // Load recording guidance if enabled
      if (showRecordingTips) {
        const recordingContent = await loadRecordingGuidance();
        setRecordingTips(recordingContent.tips);
        setCameraAngles(recordingContent.angles);
      }
      
      // Track demonstration view
      await tutorialService.trackContentView(`demo_${exerciseType}_${mode}`);
      
    } catch (error) {
      console.error('Error initializing exercise demonstration:', error);
      onError?.(error);
      Alert.alert(
        'Demonstration Error',
        'Unable to load exercise demonstration. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load progressive skill demonstrations
   */
  const loadProgressiveDemonstrations = async () => {
    try {
      const progressions = await tutorialContentManager.getProgressionContent(
        exerciseType,
        skillLevel
      );
      
      return progressions.map((progression, index) => ({
        ...progression,
        index,
        completed: false,
        keyPoints: generateProgressionKeyPoints(progression, exerciseType),
      }));
    } catch (error) {
      console.warn('Failed to load progressive demonstrations:', error);
      return [];
    }
  };

  /**
   * Generate key learning points for each progression
   */
  const generateProgressionKeyPoints = (progression, exercise) => {
    const keyPointsMap = {
      [EXERCISE_TYPES.SQUAT]: {
        'bodyweight-squat': [
          'Feet shoulder-width apart',
          'Weight on heels',
          'Knees track over toes',
          'Chest up, core engaged'
        ],
        'goblet-squat': [
          'Hold weight at chest level',
          'Elbows pointing down',
          'Same squat mechanics',
          'Control the weight'
        ],
        'back-squat': [
          'Bar placement on traps',
          'Tight upper back',
          'Drive through heels',
          'Maintain neutral spine'
        ]
      },
      [EXERCISE_TYPES.PUSH_UP]: {
        'wall-pushup': [
          'Arms length from wall',
          'Straight body line',
          'Controlled movement',
          'Full range of motion'
        ],
        'knee-pushup': [
          'Knees on ground',
          'Straight line from knees to head',
          'Hands under shoulders',
          'Lower chest to ground'
        ],
        'standard-pushup': [
          'Plank position',
          'Full body tension',
          'Chest to ground',
          'Push up explosively'
        ]
      },
      [EXERCISE_TYPES.DEADLIFT]: {
        'romanian-deadlift': [
          'Hip hinge movement',
          'Keep bar close',
          'Straight legs',
          'Feel hamstring stretch'
        ],
        'conventional-deadlift': [
          'Bar over mid-foot',
          'Shoulders over bar',
          'Drive through heels',
          'Lock out hips and knees'
        ]
      }
    };
    
    const exerciseProgressions = keyPointsMap[exercise];
    return exerciseProgressions?.[progression.id] || [
      'Focus on form',
      'Control the movement',
      'Progress gradually',
      'Listen to your body'
    ];
  };

  /**
   * Analyze common mistakes for detailed feedback
   */
  const analyzeCommonMistakes = async (mistakes) => {
    try {
      const analysis = {};
      
      for (const mistake of mistakes) {
        analysis[mistake.mistake] = {
          severity: mistake.severity,
          bodyRegions: identifyAffectedBodyRegions(mistake, exerciseType),
          correctionSteps: generateCorrectionSteps(mistake, exerciseType),
          preventionTips: generatePreventionTips(mistake, exerciseType),
          visualCues: generateVisualCues(mistake, exerciseType),
        };
      }
      
      setMistakeAnalysis(analysis);
    } catch (error) {
      console.warn('Failed to analyze common mistakes:', error);
    }
  };

  /**
   * Identify body regions affected by common mistakes
   */
  const identifyAffectedBodyRegions = (mistake, exercise) => {
    const regionMap = {
      [EXERCISE_TYPES.SQUAT]: {
        'knees-caving-in': ['knees', 'ankles', 'hips'],
        'forward-lean': ['spine', 'core', 'shoulders'],
        'heel-lift': ['ankles', 'calves', 'feet'],
        'incomplete-range': ['hips', 'glutes', 'thighs'],
      },
      [EXERCISE_TYPES.PUSH_UP]: {
        'sagging-hips': ['core', 'lower back', 'hips'],
        'partial-range': ['chest', 'shoulders', 'triceps'],
        'head-position': ['neck', 'cervical spine'],
        'hand-placement': ['wrists', 'shoulders'],
      },
      [EXERCISE_TYPES.DEADLIFT]: {
        'rounded-back': ['spine', 'lower back', 'core'],
        'bar-drift': ['shoulders', 'lats', 'core'],
        'knee-position': ['knees', 'quads', 'glutes'],
      }
    };
    
    const exerciseRegions = regionMap[exercise];
    return exerciseRegions?.[mistake.mistake] || ['general'];
  };

  /**
   * Generate step-by-step correction instructions
   */
  const generateCorrectionSteps = (mistake, exercise) => {
    const correctionMap = {
      [EXERCISE_TYPES.SQUAT]: {
        'knees-caving-in': [
          'Focus on pushing knees outward',
          'Engage glutes throughout movement',
          'Start with lighter weight',
          'Practice with resistance band around knees',
        ],
        'forward-lean': [
          'Keep chest up and proud',
          'Engage core muscles',
          'Focus on sitting back into squat',
          'Work on ankle mobility',
        ],
      },
      [EXERCISE_TYPES.PUSH_UP]: {
        'sagging-hips': [
          'Engage core muscles',
          'Think plank position throughout',
          'Start with knee push-ups if needed',
          'Focus on straight line from head to heels',
        ],
        'partial-range': [
          'Lower chest to ground',
          'Pause at bottom position',
          'Push up explosively',
          'Focus on full muscle engagement',
        ],
      }
    };
    
    const exerciseCorrections = correctionMap[exercise];
    return exerciseCorrections?.[mistake.mistake] || [
      'Focus on proper form',
      'Start with easier variation',
      'Get feedback from trainer',
      'Practice slowly first',
    ];
  };

  /**
   * Generate prevention tips
   */
  const generatePreventionTips = (mistake, exercise) => {
    return [
      'Warm up properly before exercising',
      'Start with lighter weights or easier variations',
      'Focus on form over speed or weight',
      'Get feedback from experienced practitioners',
      'Record yourself to analyze form',
    ];
  };

  /**
   * Generate visual cues for form correction
   */
  const generateVisualCues = (mistake, exercise) => {
    const cueMap = {
      [EXERCISE_TYPES.SQUAT]: {
        'knees-caving-in': [
          'Imagine pushing the floor apart with your feet',
          'Keep knees in line with your toes',
          'Activate glutes like you\'re cracking a walnut',
        ],
        'forward-lean': [
          'Imagine a string pulling your chest up',
          'Keep your weight on your heels',
          'Pretend you\'re sitting back into a chair',
        ],
      },
      [EXERCISE_TYPES.PUSH_UP]: {
        'sagging-hips': [
          'Imagine a straight line from head to heels',
          'Squeeze glutes and engage abs',
          'Think of doing a moving plank',
        ],
      }
    };
    
    const exerciseCues = cueMap[exercise];
    return exerciseCues?.[mistake.mistake] || [
      'Focus on quality over quantity',
      'Move with control and intention',
      'Maintain awareness of your body position',
    ];
  };

  /**
   * Load recording best practices guidance
   */
  const loadRecordingGuidance = async () => {
    try {
      const recordingContent = await tutorialContentManager.getRecordingPracticesTutorial({
        deviceType: 'mobile',
        environment: 'indoor',
        exerciseTypes: [exerciseType],
      });
      
      return {
        tips: recordingContent.deviceTips || [],
        angles: recordingContent.cameraAngles || [],
        lighting: recordingContent.lightingGuide || {},
      };
    } catch (error) {
      console.warn('Failed to load recording guidance:', error);
      return { tips: [], angles: [], lighting: {} };
    }
  };

  /**
   * Handle view mode changes
   */
  const handleViewChange = (newView) => {
    Animated.timing(fadeAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentView(newView);
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  /**
   * Handle mistake selection and analysis
   */
  const handleMistakeSelection = async (mistake) => {
    try {
      setSelectedMistake(mistake);
      mistakeViewCount.current += 1;
      
      // Highlight animation
      Animated.sequence([
        Animated.timing(mistakeHighlightAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(mistakeHighlightAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Track mistake viewing
      await tutorialService.trackTutorialEvent('mistake_viewed', {
        exerciseType,
        mistake: mistake.mistake,
        severity: mistake.severity,
      });
      
      onMistakeIdentified?.(mistake, mistakeAnalysis[mistake.mistake]);
      
    } catch (error) {
      console.error('Error handling mistake selection:', error);
    }
  };

  /**
   * Handle progression step completion
   */
  const handleProgressionCompleted = async (progressionIndex) => {
    try {
      const updatedProgressions = [...progressions];
      updatedProgressions[progressionIndex].completed = true;
      setProgressions(updatedProgressions);
      progressionCompletions.current += 1;
      
      // Update progress animation
      const completedCount = updatedProgressions.filter(p => p.completed).length;
      const progressPercentage = completedCount / updatedProgressions.length;
      
      Animated.timing(progressAnimation, {
        toValue: progressPercentage,
        duration: 500,
        useNativeDriver: false,
      }).start();
      
      // Track progression completion
      await tutorialService.trackTutorialEvent('progression_completed', {
        exerciseType,
        progression: updatedProgressions[progressionIndex].name,
        skillLevel: currentSkillLevel,
      });
      
      onProgressionCompleted?.(updatedProgressions[progressionIndex], completedCount, updatedProgressions.length);
      
      // Check if all progressions are completed
      if (completedCount === updatedProgressions.length) {
        await handleAllProgressionsCompleted();
      }
      
    } catch (error) {
      console.error('Error handling progression completion:', error);
    }
  };

  /**
   * Handle completion of all progressions
   */
  const handleAllProgressionsCompleted = async () => {
    try {
      Alert.alert(
        'Congratulations!',
        `You've completed all ${exerciseType} progressions for ${currentSkillLevel} level. Ready to advance?`,
        [
          { text: 'Stay at current level', style: 'cancel' },
          { 
            text: 'Advance level', 
            onPress: () => advanceSkillLevel(),
            style: 'default'
          },
        ]
      );
    } catch (error) {
      console.error('Error handling all progressions completed:', error);
    }
  };

  /**
   * Advance to next skill level
   */
  const advanceSkillLevel = async () => {
    try {
      const levelProgression = {
        [SKILL_LEVELS.BEGINNER]: SKILL_LEVELS.INTERMEDIATE,
        [SKILL_LEVELS.INTERMEDIATE]: SKILL_LEVELS.ADVANCED,
      };
      
      const nextLevel = levelProgression[currentSkillLevel];
      if (nextLevel) {
        setCurrentSkillLevel(nextLevel);
        
        // Reload progressions for new level
        const newProgressions = await loadProgressiveDemonstrations();
        setProgressions(newProgressions);
        setCurrentProgression(0);
        
        // Reset progress animation
        progressAnimation.setValue(0);
        
        Alert.alert(
          'Level Advanced!',
          `Welcome to ${nextLevel} level. New challenges await!`,
          [{ text: 'Let\'s go!' }]
        );
      }
    } catch (error) {
      console.error('Error advancing skill level:', error);
    }
  };

  /**
   * Render form analysis overlay
   */
  const renderFormAnalysisOverlay = () => {
    if (!enableFormAnalysis || !formAnalysisData) return null;
    
    return (
      <View style={styles.formAnalysisOverlay}>
        <View style={styles.formAnalysisPoints}>
          {formAnalysisData.keyPoints?.map((point, index) => (
            <View
              key={index}
              style={[
                styles.analysisPoint,
                {
                  left: point.x,
                  top: point.y,
                  backgroundColor: point.status === 'correct' 
                    ? colors.semantic.success.light.primary 
                    : colors.semantic.error.light.primary,
                }
              ]}
            >
              <Text style={styles.analysisPointNumber}>{index + 1}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  /**
   * Cleanup function
   */
  const cleanup = () => {
    // Cleanup animations, timers, etc.
  };

  // Render view selector
  const renderViewSelector = () => (
    <View style={styles.viewSelectorContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewSelector}>
        <TouchableOpacity
          style={[styles.viewTab, currentView === DEMO_MODES.CORRECT_FORM && styles.activeViewTab]}
          onPress={() => handleViewChange(DEMO_MODES.CORRECT_FORM)}
          accessibilityLabel="Correct form demonstration"
        >
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={currentView === DEMO_MODES.CORRECT_FORM ? '#FFFFFF' : (isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary)} 
          />
          <Text style={[styles.viewTabText, currentView === DEMO_MODES.CORRECT_FORM && styles.activeViewTabText]}>
            Correct Form
          </Text>
        </TouchableOpacity>
        
        {showCommonMistakes && (
          <TouchableOpacity
            style={[styles.viewTab, currentView === DEMO_MODES.COMMON_MISTAKES && styles.activeViewTab]}
            onPress={() => handleViewChange(DEMO_MODES.COMMON_MISTAKES)}
            accessibilityLabel="Common mistakes analysis"
          >
            <Ionicons 
              name="warning" 
              size={20} 
              color={currentView === DEMO_MODES.COMMON_MISTAKES ? '#FFFFFF' : (isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary)} 
            />
            <Text style={[styles.viewTabText, currentView === DEMO_MODES.COMMON_MISTAKES && styles.activeViewTabText]}>
              Mistakes
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.viewTab, currentView === DEMO_MODES.BEFORE_AFTER && styles.activeViewTab]}
          onPress={() => handleViewChange(DEMO_MODES.BEFORE_AFTER)}
          accessibilityLabel="Before and after comparison"
        >
          <Ionicons 
            name="git-compare" 
            size={20} 
            color={currentView === DEMO_MODES.BEFORE_AFTER ? '#FFFFFF' : (isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary)} 
          />
          <Text style={[styles.viewTabText, currentView === DEMO_MODES.BEFORE_AFTER && styles.activeViewTabText]}>
            Before/After
          </Text>
        </TouchableOpacity>
        
        {showProgressiveSteps && (
          <TouchableOpacity
            style={[styles.viewTab, currentView === DEMO_MODES.PROGRESSIVE && styles.activeViewTab]}
            onPress={() => handleViewChange(DEMO_MODES.PROGRESSIVE)}
            accessibilityLabel="Progressive training steps"
          >
            <Ionicons 
              name="trending-up" 
              size={20} 
              color={currentView === DEMO_MODES.PROGRESSIVE ? '#FFFFFF' : (isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary)} 
            />
            <Text style={[styles.viewTabText, currentView === DEMO_MODES.PROGRESSIVE && styles.activeViewTabText]}>
              Progressive
            </Text>
          </TouchableOpacity>
        )}
        
        {showRecordingTips && (
          <TouchableOpacity
            style={[styles.viewTab, currentView === DEMO_MODES.RECORDING_SETUP && styles.activeViewTab]}
            onPress={() => handleViewChange(DEMO_MODES.RECORDING_SETUP)}
            accessibilityLabel="Recording setup guidance"
          >
            <Ionicons 
              name="videocam" 
              size={20} 
              color={currentView === DEMO_MODES.RECORDING_SETUP ? '#FFFFFF' : (isDarkMode ? colors.dark.text.secondary : colors.light.text.secondary)} 
            />
            <Text style={[styles.viewTabText, currentView === DEMO_MODES.RECORDING_SETUP && styles.activeViewTabText]}>
              Recording
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  // Render correct form view
  const renderCorrectFormView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.demonstrationCard}>
        <Text style={styles.cardTitle}>Perfect {exerciseType} Form</Text>
        
        {demonstrationContent?.mediaUrls && (
          <TutorialVideo
            tutorialContent={demonstrationContent}
            contentId={`correct_${exerciseType}`}
            autoplay={false}
            style={styles.demonstrationVideo}
          />
        )}
        
        <View style={styles.keyPointsContainer}>
          <Text style={styles.keyPointsTitle}>Key Form Points</Text>
          {demonstrationContent?.structure?.find(s => s.section === 'tips')?.content?.map((point, index) => (
            <View key={index} style={styles.keyPointItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.semantic.success.light.primary} />
              <Text style={styles.keyPointText}>{point}</Text>
            </View>
          ))}
        </View>
        
        {enableFormAnalysis && renderFormAnalysisOverlay()}
      </GlassCard>
    </ScrollView>
  );

  // Render common mistakes view
  const renderCommonMistakesView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.demonstrationCard}>
        <Text style={styles.cardTitle}>Common {exerciseType} Mistakes</Text>
        <Text style={styles.cardSubtitle}>Learn to identify and correct these common errors</Text>
        
        {commonMistakes.map((mistake, index) => (
          <Animated.View
            key={mistake.mistake}
            style={[
              styles.mistakeCard,
              selectedMistake?.mistake === mistake.mistake && {
                transform: [{
                  scale: mistakeHighlightAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  }),
                }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleMistakeSelection(mistake)}
              style={styles.mistakeHeader}
              accessibilityLabel={`Learn about ${mistake.title}`}
            >
              <View style={styles.mistakeIconContainer}>
                <Ionicons 
                  name="warning" 
                  size={24} 
                  color={mistake.severity === 'high' 
                    ? colors.semantic.error.light.primary 
                    : colors.semantic.warning.light.primary
                  } 
                />
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: mistake.severity === 'high' 
                    ? colors.semantic.error.light.background 
                    : colors.semantic.warning.light.background
                  }
                ]}>
                  <Text style={[
                    styles.severityText,
                    { color: mistake.severity === 'high' 
                      ? colors.semantic.error.light.primary 
                      : colors.semantic.warning.light.primary
                    }
                  ]}>
                    {mistake.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.mistakeContent}>
                <Text style={styles.mistakeTitle}>{mistake.title}</Text>
                <Text style={styles.mistakeDescription}>{mistake.description}</Text>
              </View>
              
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary} 
              />
            </TouchableOpacity>
            
            {selectedMistake?.mistake === mistake.mistake && (
              <View style={styles.mistakeDetails}>
                <View style={styles.correctionSection}>
                  <Text style={styles.correctionTitle}>How to Correct:</Text>
                  <Text style={styles.correctionText}>{mistake.correction}</Text>
                </View>
                
                {mistakeAnalysis[mistake.mistake] && (
                  <>
                    <View style={styles.correctionSteps}>
                      <Text style={styles.correctionStepsTitle}>Step-by-step Correction:</Text>
                      {mistakeAnalysis[mistake.mistake].correctionSteps?.map((step, stepIndex) => (
                        <View key={stepIndex} style={styles.correctionStep}>
                          <Text style={styles.stepNumber}>{stepIndex + 1}</Text>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.visualCues}>
                      <Text style={styles.visualCuesTitle}>Mental Cues:</Text>
                      {mistakeAnalysis[mistake.mistake].visualCues?.map((cue, cueIndex) => (
                        <Text key={cueIndex} style={styles.visualCueText}>• {cue}</Text>
                      ))}
                    </View>
                  </>
                )}
                
                {mistake.videoUrl && (
                  <View style={styles.correctionVideo}>
                    <TutorialVideo
                      tutorialContent={{
                        videoUrl: mistake.correctVideoUrl || mistake.videoUrl,
                        title: `Correcting ${mistake.title}`,
                      }}
                      contentId={`correction_${mistake.mistake}`}
                      autoplay={false}
                      style={styles.correctionVideoPlayer}
                    />
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        ))}
      </GlassCard>
    </ScrollView>
  );

  // Render before/after comparison view
  const renderBeforeAfterView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.demonstrationCard}>
        <Text style={styles.cardTitle}>Before vs After Comparison</Text>
        <Text style={styles.cardSubtitle}>See the difference proper form makes</Text>
        
        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonSide}>
            <Text style={styles.comparisonLabel}>❌ Incorrect Form</Text>
            <View style={styles.comparisonVideoContainer}>
              <View style={styles.videoPlaceholder}>
                <Ionicons name="videocam-off" size={48} color={colors.semantic.error.light.primary} />
                <Text style={styles.placeholderText}>Incorrect Form Demo</Text>
              </View>
            </View>
            <View style={styles.issuesList}>
              <Text style={styles.issuesTitle}>Issues:</Text>
              {commonMistakes.slice(0, 3).map((mistake, index) => (
                <Text key={index} style={styles.issueText}>• {mistake.title}</Text>
              ))}
            </View>
          </View>
          
          <View style={styles.comparisonDivider}>
            <Ionicons name="arrow-forward" size={24} color={colors.primary.DEFAULT} />
          </View>
          
          <View style={styles.comparisonSide}>
            <Text style={styles.comparisonLabel}>✅ Correct Form</Text>
            <View style={styles.comparisonVideoContainer}>
              {demonstrationContent?.mediaUrls && (
                <TutorialVideo
                  tutorialContent={demonstrationContent}
                  contentId={`correct_comparison_${exerciseType}`}
                  autoplay={false}
                  style={styles.comparisonVideo}
                />
              )}
            </View>
            <View style={styles.benefitsList}>
              <Text style={styles.benefitsTitle}>Benefits:</Text>
              <Text style={styles.benefitText}>• Maximum muscle activation</Text>
              <Text style={styles.benefitText}>• Injury prevention</Text>
              <Text style={styles.benefitText}>• Better results</Text>
            </View>
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );

  // Render progressive training view
  const renderProgressiveView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.demonstrationCard}>
        <Text style={styles.cardTitle}>Progressive {exerciseType} Training</Text>
        <Text style={styles.cardSubtitle}>
          Level: {currentSkillLevel.charAt(0).toUpperCase() + currentSkillLevel.slice(1)}
        </Text>
        
        {progressions.length > 0 && (
          <>
            <View style={styles.progressContainer}>
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
                {progressions.filter(p => p.completed).length} of {progressions.length} completed
              </Text>
            </View>
            
            {progressions.map((progression, index) => (
              <View key={progression.id} style={styles.progressionCard}>
                <View style={styles.progressionHeader}>
                  <View style={styles.progressionIconContainer}>
                    <Ionicons
                      name={progression.completed ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={progression.completed 
                        ? colors.semantic.success.light.primary 
                        : (isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary)
                      }
                    />
                    <Text style={styles.progressionNumber}>{index + 1}</Text>
                  </View>
                  
                  <View style={styles.progressionContent}>
                    <Text style={styles.progressionTitle}>{progression.name}</Text>
                    <Text style={styles.progressionDifficulty}>
                      Difficulty: {progression.difficulty}
                    </Text>
                  </View>
                  
                  {!progression.completed && (
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => setCurrentProgression(index)}
                      accessibilityLabel={`Start ${progression.name}`}
                    >
                      <Ionicons name="play" size={16} color="#FFFFFF" />
                      <Text style={styles.startButtonText}>Start</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {currentProgression === index && (
                  <View style={styles.progressionDetails}>
                    <View style={styles.keyPointsList}>
                      <Text style={styles.keyPointsTitle}>Key Points:</Text>
                      {progression.keyPoints?.map((point, pointIndex) => (
                        <View key={pointIndex} style={styles.keyPointItem}>
                          <Ionicons name="checkmark" size={16} color={colors.primary.DEFAULT} />
                          <Text style={styles.keyPointText}>{point}</Text>
                        </View>
                      ))}
                    </View>
                    
                    {progression.videoUrl && (
                      <TutorialVideo
                        tutorialContent={{
                          videoUrl: progression.videoUrl,
                          title: progression.name,
                        }}
                        contentId={progression.id}
                        autoplay={false}
                        onComplete={() => handleProgressionCompleted(index)}
                        style={styles.progressionVideo}
                      />
                    )}
                    
                    <GlassButton
                      title={progression.completed ? "Completed" : "Mark as Complete"}
                      onPress={() => handleProgressionCompleted(index)}
                      disabled={progression.completed}
                      style={[
                        styles.completeButton,
                        progression.completed && styles.completedButton
                      ]}
                    />
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </GlassCard>
    </ScrollView>
  );

  // Render recording setup view
  const renderRecordingSetupView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.demonstrationCard}>
        <Text style={styles.cardTitle}>Recording Setup for {exerciseType}</Text>
        <Text style={styles.cardSubtitle}>Get the best angles and lighting for analysis</Text>
        
        <View style={styles.recordingSection}>
          <Text style={styles.sectionTitle}>📱 Camera Positioning</Text>
          <View style={styles.cameraAnglesList}>
            <View style={styles.cameraAngleItem}>
              <Ionicons name="videocam" size={24} color={colors.primary.DEFAULT} />
              <View style={styles.angleContent}>
                <Text style={styles.angleTitle}>Side View (Primary)</Text>
                <Text style={styles.angleDescription}>
                  Position camera 90° to your side, at hip height, 6-8 feet away
                </Text>
              </View>
            </View>
            
            <View style={styles.cameraAngleItem}>
              <Ionicons name="videocam" size={24} color={colors.primary.DEFAULT} />
              <View style={styles.angleContent}>
                <Text style={styles.angleTitle}>Front View (Secondary)</Text>
                <Text style={styles.angleDescription}>
                  Useful for checking knee tracking and upper body alignment
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.recordingSection}>
          <Text style={styles.sectionTitle}>💡 Lighting Setup</Text>
          <View style={styles.lightingTips}>
            <View style={styles.lightingTip}>
              <Ionicons name="sunny" size={20} color={colors.semantic.warning.light.primary} />
              <Text style={styles.lightingText}>Use natural light when possible</Text>
            </View>
            <View style={styles.lightingTip}>
              <Ionicons name="bulb" size={20} color={colors.semantic.warning.light.primary} />
              <Text style={styles.lightingText}>Avoid backlighting (windows behind you)</Text>
            </View>
            <View style={styles.lightingTip}>
              <Ionicons name="contrast" size={20} color={colors.semantic.warning.light.primary} />
              <Text style={styles.lightingText}>Ensure good contrast with background</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.recordingSection}>
          <Text style={styles.sectionTitle}>✅ Pre-Recording Checklist</Text>
          <View style={styles.checklistContainer}>
            {[
              'Camera is stable (use tripod if available)',
              'Full body is visible in frame',
              'Good lighting on subject',
              'Minimal background distractions',
              'Phone is in landscape mode',
              'Adequate space for full movement',
            ].map((item, index) => (
              <View key={index} style={styles.checklistItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.semantic.success.light.primary} />
                <Text style={styles.checklistText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.recordingSection}>
          <Text style={styles.sectionTitle}>🎯 Recording Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipText}>• Record multiple sets to capture form changes</Text>
            <Text style={styles.tipText}>• Include warm-up and working sets</Text>
            <Text style={styles.tipText}>• Use slow-motion for detailed analysis</Text>
            <Text style={styles.tipText}>• Keep videos under 2 minutes for easy review</Text>
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );

  // Loading state
  if (isLoading) {
    return (
      <GlassContainer style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading exercise demonstration...</Text>
        </View>
      </GlassContainer>
    );
  }

  // Render main content based on current view
  const renderContent = () => {
    switch (currentView) {
      case DEMO_MODES.CORRECT_FORM:
        return renderCorrectFormView();
      case DEMO_MODES.COMMON_MISTAKES:
        return renderCommonMistakesView();
      case DEMO_MODES.BEFORE_AFTER:
        return renderBeforeAfterView();
      case DEMO_MODES.PROGRESSIVE:
        return renderProgressiveView();
      case DEMO_MODES.RECORDING_SETUP:
        return renderRecordingSetupView();
      default:
        return renderCorrectFormView();
    }
  };

  return (
    <GlassContainer 
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel || `Exercise demonstration for ${exerciseType}`}
      testID={testID}
    >
      {renderViewSelector()}
      
      <Animated.View style={[styles.mainContent, { opacity: fadeAnimation }]}>
        {renderContent()}
      </Animated.View>
    </GlassContainer>
  );
});

/**
 * Component styles
 */
const styleSheet = (theme) => StyleSheet.create({
  container: {
    flex: 1,
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
  
  viewSelectorContainer: {
    marginBottom: spacing[4],
  },
  
  viewSelector: {
    paddingHorizontal: spacing[4],
  },
  
  viewTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginRight: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: theme.background.secondary,
    borderWidth: 1,
    borderColor: theme.border.light,
    gap: spacing[1],
  },
  
  activeViewTab: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  
  viewTabText: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  
  activeViewTabText: {
    color: '#FFFFFF',
  },
  
  mainContent: {
    flex: 1,
  },
  
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  
  demonstrationCard: {
    padding: spacing[5],
  },
  
  cardTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[2],
  },
  
  cardSubtitle: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.base,
    marginBottom: spacing[4],
  },
  
  demonstrationVideo: {
    marginBottom: spacing[4],
  },
  
  keyPointsContainer: {
    marginTop: spacing[4],
  },
  
  keyPointsTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[3],
  },
  
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  
  keyPointText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  
  mistakeCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: theme.border.light,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  
  mistakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  
  mistakeIconContainer: {
    alignItems: 'center',
    gap: spacing[1],
  },
  
  severityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.xs,
  },
  
  severityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  
  mistakeContent: {
    flex: 1,
  },
  
  mistakeTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  
  mistakeDescription: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  
  mistakeDetails: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.border.light,
    backgroundColor: theme.background.tertiary,
  },
  
  correctionSection: {
    marginBottom: spacing[4],
  },
  
  correctionTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[2],
  },
  
  correctionText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  
  correctionSteps: {
    marginBottom: spacing[4],
  },
  
  correctionStepsTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[2],
  },
  
  correctionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  
  stepNumber: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.full,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  stepText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  
  visualCues: {
    marginBottom: spacing[4],
  },
  
  visualCuesTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[2],
  },
  
  visualCueText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    marginBottom: spacing[1],
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  
  correctionVideo: {
    marginTop: spacing[4],
  },
  
  correctionVideoPlayer: {
    height: 200,
  },
  
  comparisonContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  
  comparisonSide: {
    flex: 1,
  },
  
  comparisonDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: colors.primary.light + '20',
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
  
  comparisonLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  
  comparisonVideoContainer: {
    marginBottom: spacing[3],
  },
  
  videoPlaceholder: {
    aspectRatio: 16 / 9,
    backgroundColor: theme.background.secondary,
    borderRadius: borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  
  placeholderText: {
    color: theme.text.tertiary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  
  comparisonVideo: {
    height: 150,
  },
  
  issuesList: {
    marginTop: spacing[2],
  },
  
  issuesTitle: {
    color: colors.semantic.error.light.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  
  issueText: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[0.5],
  },
  
  benefitsList: {
    marginTop: spacing[2],
  },
  
  benefitsTitle: {
    color: colors.semantic.success.light.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  
  benefitText: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[0.5],
  },
  
  progressContainer: {
    marginBottom: spacing[5],
  },
  
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.border.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing[2],
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
    fontWeight: typography.fontWeight.medium,
  },
  
  progressionCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: theme.border.light,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  
  progressionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  
  progressionIconContainer: {
    alignItems: 'center',
    gap: spacing[1],
  },
  
  progressionNumber: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  
  progressionContent: {
    flex: 1,
  },
  
  progressionTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  
  progressionDifficulty: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.base,
    gap: spacing[1],
  },
  
  startButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  
  progressionDetails: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: theme.border.light,
    backgroundColor: theme.background.tertiary,
  },
  
  keyPointsList: {
    marginBottom: spacing[4],
  },
  
  progressionVideo: {
    marginBottom: spacing[4],
  },
  
  completeButton: {
    alignSelf: 'center',
  },
  
  completedButton: {
    opacity: 0.6,
  },
  
  recordingSection: {
    marginBottom: spacing[5],
  },
  
  sectionTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[3],
  },
  
  cameraAnglesList: {
    gap: spacing[3],
  },
  
  cameraAngleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: theme.background.secondary,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  
  angleContent: {
    flex: 1,
  },
  
  angleTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  
  angleDescription: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  
  lightingTips: {
    gap: spacing[2],
  },
  
  lightingTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  
  lightingText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  
  checklistContainer: {
    gap: spacing[2],
  },
  
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  
  checklistText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  
  tipsList: {
    gap: spacing[2],
  },
  
  tipText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
  },
  
  formAnalysisOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  
  formAnalysisPoints: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  
  analysisPoint: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  
  analysisPointNumber: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});

ExerciseDemonstration.displayName = 'ExerciseDemonstration';

export default ExerciseDemonstration;