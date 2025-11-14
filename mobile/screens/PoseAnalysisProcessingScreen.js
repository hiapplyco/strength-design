/**
 * Pose Analysis Processing Screen - Beautiful Analysis Progress Display
 * Shows real-time analysis progress with engaging animations
 * 
 * Features:
 * - Real-time progress tracking
 * - Beautiful glass morphism animations
 * - Step-by-step analysis feedback
 * - Error handling with retry options
 * - Accessibility compliant progress indicators
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import { GlassContainer } from '../components/GlassmorphismComponents';
import { useTheme } from '../contexts/ThemeContext';
import poseAnalysisService from '../services/poseDetection/PoseAnalysisService';
import AnalysisProgressIndicator from '../components/PoseAnalysis/AnalysisProgressIndicator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Analysis steps for user feedback
const ANALYSIS_STEPS = [
  {
    id: 'initializing',
    title: 'Initializing Analysis',
    description: 'Preparing AI analysis engine',
    icon: 'settings-outline',
    estimatedTime: 2000
  },
  {
    id: 'extracting',
    title: 'Extracting Frames',
    description: 'Processing video frames for analysis',
    icon: 'film-outline',
    estimatedTime: 3000
  },
  {
    id: 'detecting',
    title: 'Detecting Poses',
    description: 'Identifying body landmarks and positions',
    icon: 'body-outline',
    estimatedTime: 5000
  },
  {
    id: 'analyzing',
    title: 'Analyzing Movement',
    description: 'Evaluating form and technique',
    icon: 'analytics-outline',
    estimatedTime: 4000
  },
  {
    id: 'generating',
    title: 'Generating Feedback',
    description: 'Creating personalized recommendations',
    icon: 'clipboard-outline',
    estimatedTime: 2000
  }
];

export default function PoseAnalysisProcessingScreen({ navigation, route }) {
  const themeContext = useTheme();
  const { colors: themeColors, isDarkMode } = themeContext;

  // Defensive: ensure colors are available
  const theme = themeColors || {
    primary: '#FF6B35',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#6E6E73',
    surface: '#1C1C1E',
    border: '#38383A',
    success: '#34C759',
    error: '#DC2626',
  };

  const { exerciseType, videoUri, exerciseName } = route.params;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Start analysis
    startAnalysis();

    // Continuous pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Continuous rotation for loading indicator
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const startAnalysis = async () => {
    try {
      console.log('Starting pose analysis...', { exerciseType, videoUri });
      
      // Initialize the service
      const initResult = await poseAnalysisService.initialize();
      if (!initResult.success) {
        throw new Error(initResult.message);
      }

      // Simulate step progression
      let currentStepIndex = 0;
      let totalProgress = 0;
      
      for (const step of ANALYSIS_STEPS) {
        setCurrentStep(currentStepIndex);
        
        // Update progress gradually for this step
        const stepProgress = 100 / ANALYSIS_STEPS.length;
        const stepStartProgress = totalProgress;
        const stepEndProgress = totalProgress + stepProgress;
        
        const progressInterval = setInterval(() => {
          totalProgress += 2;
          if (totalProgress >= stepEndProgress) {
            totalProgress = stepEndProgress;
            clearInterval(progressInterval);
          }
          setProgress(Math.min(totalProgress, 100));
        }, step.estimatedTime / 50);
        
        // Wait for step completion
        await new Promise(resolve => setTimeout(resolve, step.estimatedTime));
        clearInterval(progressInterval);
        
        totalProgress = stepEndProgress;
        setProgress(totalProgress);
        currentStepIndex++;
      }

      // Start actual analysis
      const result = await poseAnalysisService.analyzeVideoFile(
        videoUri,
        exerciseType,
        {
          saveToHistory: true,
          enableProgressTracking: true
        }
      );

      if (result.success) {
        setAnalysisResult(result);
        setProgress(100);
        setIsComplete(true);
        
        // Navigate to results after a brief delay
        setTimeout(() => {
          navigation.replace('PoseAnalysisResults', {
            analysisResult: result,
            exerciseType,
            exerciseName,
            videoUri
          });
        }, 1500);
      } else {
        throw new Error(result.errors?.[0]?.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error.message);
      setProgress(0);
    }
  };

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setCurrentStep(0);
    setIsComplete(false);
    startAnalysis();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Analysis',
      'Are you sure you want to cancel the analysis?',
      [
        { text: 'Continue', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const currentStepData = ANALYSIS_STEPS[currentStep] || ANALYSIS_STEPS[0];

  return (
    <SafeLinearGradient 
      type="background" 
      variant="oura" 
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          accessibilityLabel="Cancel analysis"
          accessibilityRole="button"
        >
          <BlurView intensity={20} style={styles.cancelButtonBlur}>
            <Ionicons 
              name="close" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#000000'} 
            />
          </BlurView>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Analyzing {exerciseName}
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim }
        ]}
      >
        {/* Main Analysis Display */}
        <GlassContainer 
          variant="medium" 
          style={styles.analysisContainer}
          accessibilityLabel="Analysis progress"
        >
          {/* Central Animation */}
          <Animated.View
            style={[
              styles.centerAnimation,
              { 
                transform: [
                  { scale: pulseAnim },
                  { rotate: spin }
                ] 
              }
            ]}
          >
            {isComplete ? (
              <View style={styles.successIcon}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={80} 
                  color={theme.primary} 
                />
              </View>
            ) : error ? (
              <View style={styles.errorIcon}>
                <Ionicons 
                  name="alert-circle" 
                  size={80} 
                  color="#FF6B6B" 
                />
              </View>
            ) : (
              <View style={styles.loadingIcon}>
                <BlurView intensity={40} style={styles.loadingIconBlur}>
                  <Ionicons 
                    name={currentStepData.icon} 
                    size={48} 
                    color={theme.primary} 
                  />
                </BlurView>
              </View>
            )}
          </Animated.View>

          {/* Progress Indicator */}
          <AnalysisProgressIndicator
            progress={progress}
            currentStep={currentStep}
            totalSteps={ANALYSIS_STEPS.length}
            isError={!!error}
            isComplete={isComplete}
          />

          {/* Status Text */}
          <View style={styles.statusContainer}>
            {isComplete ? (
              <>
                <Text style={[styles.statusTitle, { color: theme.text }]}>
                  Analysis Complete!
                </Text>
                <Text style={[styles.statusDescription, { color: theme.textSecondary }]}>
                  Preparing your personalized feedback...
                </Text>
              </>
            ) : error ? (
              <>
                <Text style={[styles.statusTitle, { color: '#FF6B6B' }]}>
                  Analysis Failed
                </Text>
                <Text style={[styles.statusDescription, { color: theme.textSecondary }]}>
                  {error}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.statusTitle, { color: theme.text }]}>
                  {currentStepData.title}
                </Text>
                <Text style={[styles.statusDescription, { color: theme.textSecondary }]}>
                  {currentStepData.description}
                </Text>
              </>
            )}
          </View>

          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            {ANALYSIS_STEPS.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.stepItem,
                  index <= currentStep && styles.stepItemActive,
                  index === currentStep && !error && !isComplete && styles.stepItemCurrent
                ]}
              >
                <View style={[
                  styles.stepIcon,
                  index <= currentStep && styles.stepIconActive,
                  index === currentStep && !error && !isComplete && styles.stepIconCurrent
                ]}>
                  {index < currentStep || isComplete ? (
                    <Ionicons 
                      name="checkmark" 
                      size={12} 
                      color={theme.background} 
                    />
                  ) : (
                    <View style={[
                      styles.stepDot,
                      { backgroundColor: index === currentStep && !error && !isComplete ? theme.primary : theme.textTertiary }
                    ]} />
                  )}
                </View>
                <Text style={[
                  styles.stepText,
                  {
                    color: index <= currentStep ? theme.text : theme.textTertiary
                  }
                ]}>
                  {step.title}
                </Text>
              </View>
            ))}
          </View>
        </GlassContainer>

        {/* Error Actions */}
        {error && (
          <Animated.View
            style={[
              styles.errorActions,
              { opacity: fadeAnim }
            ]}
          >
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              accessibilityLabel="Retry analysis"
              accessibilityRole="button"
            >
              <BlurView intensity={30} style={styles.retryButtonBlur}>
                <Ionicons name="refresh" size={20} color={theme.primary} />
                <Text style={[styles.retryButtonText, { color: theme.primary }]}>
                  Try Again
                </Text>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Analysis Info */}
        <GlassContainer variant="subtle" style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              Analysis Details
            </Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Exercise:</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{exerciseName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Status:</Text>
              <Text style={[
                styles.infoValue, 
                { 
                  color: error ? '#FF6B6B' : isComplete ? theme.primary : theme.text 
                }
              ]}>
                {error ? 'Failed' : isComplete ? 'Complete' : 'Processing'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Progress:</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {Math.round(progress)}%
              </Text>
            </View>
          </View>
        </GlassContainer>
      </Animated.View>
    </SafeLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cancelButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  analysisContainer: {
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
  },
  centerAnimation: {
    marginBottom: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  loadingIconBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepsContainer: {
    width: '100%',
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepItemCurrent: {
    opacity: 1,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepIconActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  stepIconCurrent: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorActions: {
    alignItems: 'center',
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryButtonBlur: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContent: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});