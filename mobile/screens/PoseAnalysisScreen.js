/**
 * PoseAnalysisScreen - Main AI Form Coaching Interface
 * Production-ready screen integrating video capture, upload, and pose analysis components
 * 
 * Features:
 * - Exercise-specific video recording with real-time guidance
 * - Gallery video upload with format validation
 * - AI-powered form analysis with detailed feedback
 * - Beautiful glassmorphism design following existing patterns
 * - Cross-platform compatibility with error boundaries
 * - Premium feature integration with subscription prompts
 * - Accessibility compliant with screen reader support
 * 
 * Integration Components:
 * - VideoCaptureComponent: Stream A implementation (production-ready)
 * - VideoUploadComponent: Stream B implementation (production-ready) 
 * - CameraService: Stream D implementation (production-ready)
 * - PoseAnalysisService: Existing pose detection service
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

// Internal components
import { GlassContainer, GlassCard, GlassButton, BlurWrapper } from '../components/GlassmorphismComponents';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import VideoCaptureComponent from '../components/pose/VideoCaptureComponent';
import VideoUploadComponent from '../components/pose/VideoUploadComponent';
import { useTheme } from '../contexts/ThemeContext';

// Services
import cameraService, { CameraUtils } from '../services/cameraService';
import { PoseAnalysisService } from '../services/poseDetection/PoseAnalysisService';
import { ExerciseType } from '../services/poseDetection/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Available exercises for pose analysis
const AVAILABLE_EXERCISES = [
  {
    id: 'squat',
    type: ExerciseType.SQUAT,
    name: 'Squat',
    icon: 'fitness-outline',
    description: 'Analyze your squat form and depth',
    difficulty: 'Beginner',
    duration: '10-15 seconds',
    premium: false
  },
  {
    id: 'deadlift', 
    type: ExerciseType.DEADLIFT,
    name: 'Deadlift',
    icon: 'barbell-outline',
    description: 'Perfect your deadlift technique',
    difficulty: 'Intermediate',
    duration: '8-12 seconds',
    premium: true
  },
  {
    id: 'pushup',
    type: ExerciseType.PUSH_UP,
    name: 'Push-Up',
    icon: 'trending-up-outline',
    description: 'Improve your push-up form',
    difficulty: 'Beginner',
    duration: '10-20 seconds',
    premium: false
  }
];

export default function PoseAnalysisScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // State management
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [captureVisible, setCaptureVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);

  // Initialize camera service
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const result = await cameraService.initialize();
        if (result.success) {
          setCameraInitialized(true);
        } else {
          setError('Camera initialization failed');
        }
      } catch (err) {
        console.error('Camera initialization error:', err);
        setError('Failed to initialize camera service');
      }
    };

    initializeCamera();
  }, []);

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Exercise selection handler
  const handleExerciseSelect = useCallback((exercise) => {
    if (exercise.premium && !route.params?.isPremium) {
      Alert.alert(
        'Premium Feature',
        `${exercise.name} analysis requires a premium subscription. Upgrade to access advanced form coaching.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Premium') }
        ]
      );
      return;
    }

    setSelectedExercise(exercise);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [route.params?.isPremium, navigation]);

  // Video recording handler
  const handleVideoRecorded = useCallback(async (videoUri, metadata) => {
    try {
      setCaptureVisible(false);
      setAnalyzing(true);

      // Analyze video using pose detection service
      const analysisResult = await PoseAnalysisService.analyzeVideo(
        videoUri,
        selectedExercise.type,
        {
          exerciseName: selectedExercise.name,
          duration: metadata.duration,
          ...metadata
        }
      );

      setAnalysisResults(analysisResult);
      
      // Navigate to results screen
      navigation.navigate('PoseAnalysisResults', {
        exercise: selectedExercise,
        results: analysisResult,
        videoUri,
        metadata
      });

    } catch (err) {
      console.error('Video analysis failed:', err);
      setError('Analysis failed. Please try again.');
      Alert.alert('Analysis Error', 'Failed to analyze your video. Please try recording again.');
    } finally {
      setAnalyzing(false);
    }
  }, [selectedExercise, navigation]);

  // Video upload handler
  const handleVideoUploaded = useCallback(async (videoUri, metadata) => {
    try {
      setUploadVisible(false);
      setAnalyzing(true);

      // Analyze uploaded video
      const analysisResult = await PoseAnalysisService.analyzeVideo(
        videoUri,
        selectedExercise.type,
        {
          exerciseName: selectedExercise.name,
          source: 'gallery',
          ...metadata
        }
      );

      setAnalysisResults(analysisResult);
      
      // Navigate to results screen
      navigation.navigate('PoseAnalysisResults', {
        exercise: selectedExercise,
        results: analysisResult,
        videoUri,
        metadata
      });

    } catch (err) {
      console.error('Video analysis failed:', err);
      setError('Analysis failed. Please try again.');
      Alert.alert('Analysis Error', 'Failed to analyze your video. Please try uploading again.');
    } finally {
      setAnalyzing(false);
    }
  }, [selectedExercise, navigation]);

  // Error handler
  const handleError = useCallback((err) => {
    console.error('Pose analysis error:', err);
    setError(err.message || 'An error occurred');
    
    // Provide user-friendly error messages
    if (err.message?.includes('permission')) {
      Alert.alert(
        'Camera Access Required',
        'Please enable camera access to record videos for pose analysis.',
        [{ text: 'OK' }]
      );
    } else if (err.message?.includes('storage')) {
      Alert.alert(
        'Storage Full',
        'Please free up storage space to continue.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Error',
        'An error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Action buttons for selected exercise
  const renderActionButtons = () => {
    if (!selectedExercise || !cameraInitialized) return null;

    return (
      <View style={styles.actionContainer}>
        <GlassButton
          title="Record Video"
          onPress={() => setCaptureVisible(true)}
          style={[styles.actionButton, styles.recordButton]}
          textStyle={styles.actionButtonText}
          icon="videocam"
        />
        
        <GlassButton
          title="Upload Video"
          onPress={() => setUploadVisible(true)}
          style={[styles.actionButton, styles.uploadButton]}
          textStyle={styles.actionButtonText}
          icon="cloud-upload"
          variant="outline"
        />
      </View>
    );
  };

  // Exercise cards
  const renderExerciseCard = (exercise) => (
    <TouchableOpacity
      key={exercise.id}
      onPress={() => handleExerciseSelect(exercise)}
      activeOpacity={0.8}
    >
      <GlassCard
        style={[
          styles.exerciseCard,
          selectedExercise?.id === exercise.id && styles.selectedCard
        ]}
      >
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseIcon}>
            <Ionicons
              name={exercise.icon}
              size={24}
              color={selectedExercise?.id === exercise.id ? theme.primary : theme.text}
            />
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={[
              styles.exerciseName,
              { color: selectedExercise?.id === exercise.id ? theme.primary : theme.text }
            ]}>
              {exercise.name}
              {exercise.premium && (
                <Text style={styles.premiumBadge}> PRO</Text>
              )}
            </Text>
            <Text style={[styles.exerciseDifficulty, { color: theme.textSecondary }]}>
              {exercise.difficulty} • {exercise.duration}
            </Text>
          </View>
        </View>
        <Text style={[styles.exerciseDescription, { color: theme.textSecondary }]}>
          {exercise.description}
        </Text>
      </GlassCard>
    </TouchableOpacity>
  );

  // Loading state
  if (analyzing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeLinearGradient style={styles.gradientBackground} />
        
        <View style={styles.loadingContainer}>
          <BlurWrapper intensity={80} style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Analyzing your form...
            </Text>
            <Text style={[styles.loadingSubtext, { color: theme.textSecondary }]}>
              Using AI to provide personalized feedback
            </Text>
          </BlurWrapper>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeLinearGradient style={styles.gradientBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.text }]}>
          AI Form Coach
        </Text>
        
        <TouchableOpacity
          onPress={() => navigation.navigate('PoseAnalysisGuide')}
          style={styles.helpButton}
          accessibilityRole="button"
          accessibilityLabel="Help and tips"
        >
          <Ionicons name="help-circle-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        transform={[{ translateY: slideAnim }]}
        opacity={fadeAnim}
      >
        {/* Error Message */}
        {error && (
          <GlassCard style={styles.errorCard}>
            <View style={styles.errorContent}>
              <Ionicons name="warning" size={20} color="#FF6B6B" />
              <Text style={[styles.errorText, { color: theme.text }]}>
                {error}
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Feature Introduction */}
        <GlassContainer style={styles.introSection}>
          <Text style={[styles.introTitle, { color: theme.text }]}>
            Get AI-Powered Form Feedback
          </Text>
          <Text style={[styles.introText, { color: theme.textSecondary }]}>
            Record or upload a video of your exercise, and our AI will analyze your form 
            and provide personalized coaching tips.
          </Text>
        </GlassContainer>

        {/* Exercise Selection */}
        <GlassContainer style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Select Exercise
          </Text>
          <View style={styles.exerciseGrid}>
            {AVAILABLE_EXERCISES.map(renderExerciseCard)}
          </View>
        </GlassContainer>

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Camera Status */}
        {!cameraInitialized && (
          <GlassCard style={styles.statusCard}>
            <View style={styles.statusContent}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                Initializing camera...
              </Text>
            </View>
          </GlassCard>
        )}
      </Animated.ScrollView>

      {/* Video Capture Modal */}
      <VideoCaptureComponent
        visible={captureVisible}
        selectedExercise={selectedExercise}
        onVideoRecorded={handleVideoRecorded}
        onError={handleError}
        onClose={() => setCaptureVisible(false)}
        maxDuration={30}
      />

      {/* Video Upload Modal */}
      <VideoUploadComponent
        visible={uploadVisible}
        selectedExercise={selectedExercise}
        onVideoSelected={handleVideoUploaded}
        onError={handleError}
        onClose={() => setUploadVisible(false)}
        maxDuration={30}
        maxFileSize={2 * 1024 * 1024 * 1024} // 2GB
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  helpButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderWidth: 1,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  introSection: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  exerciseGrid: {
    gap: 12,
  },
  exerciseCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: 'rgba(255, 107, 0, 0.5)',
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  premiumBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B00',
  },
  exerciseDifficulty: {
    fontSize: 12,
  },
  exerciseDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
  },
  recordButton: {
    backgroundColor: 'rgba(255, 107, 0, 0.9)',
  },
  uploadButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 107, 0, 0.5)',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 20,
    minWidth: 200,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});