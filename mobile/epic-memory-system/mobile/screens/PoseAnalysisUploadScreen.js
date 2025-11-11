/**
 * Pose Analysis Upload Screen - Video Upload and Exercise Selection
 * Beautiful glassmorphism design for uploading workout videos and selecting exercises
 * 
 * Features:
 * - Video upload with file validation
 * - Exercise selection with clear instructions
 * - Beautiful glass morphism design
 * - Progress tracking and error handling
 * - Accessibility compliant
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import { GlassContainer, GlassCard, GlassButton } from '../components/GlassmorphismComponents';
import { useTheme } from '../contexts/ThemeContext';
import { ExerciseType } from '../services/poseDetection/types';
import PoseUploadCard from '../components/PoseAnalysis/PoseUploadCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Available exercises for pose analysis
const AVAILABLE_EXERCISES = [
  {
    type: ExerciseType.SQUAT,
    name: 'Squat',
    icon: 'fitness-outline',
    description: 'Analyze your squat form and depth',
    difficulty: 'Beginner',
    duration: '5-15 seconds'
  },
  {
    type: ExerciseType.DEADLIFT,
    name: 'Deadlift',
    icon: 'barbell-outline',
    description: 'Perfect your deadlift technique',
    difficulty: 'Intermediate',
    duration: '3-10 seconds'
  },
  {
    type: ExerciseType.PUSH_UP,
    name: 'Push-up',
    icon: 'body-outline',
    description: 'Check your push-up alignment',
    difficulty: 'Beginner',
    duration: '5-20 seconds'
  },
  {
    type: ExerciseType.BENCH_PRESS,
    name: 'Bench Press',
    icon: 'fitness-outline',
    description: 'Analyze bench press form',
    difficulty: 'Intermediate',
    duration: '3-8 seconds'
  },
  {
    type: ExerciseType.OVERHEAD_PRESS,
    name: 'Overhead Press',
    icon: 'arrow-up-outline',
    description: 'Perfect shoulder alignment',
    difficulty: 'Intermediate',
    duration: '3-8 seconds'
  }
];

export default function PoseAnalysisUploadScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      })
    ]).start();

    // Pulse animation for upload button
    if (selectedExercise && videoUri) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [selectedExercise, videoUri]);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera roll access is needed to upload workout videos.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  const handleVideoUpload = async () => {
    try {
      setIsUploading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        duration: 30000, // 30 seconds max
      });

      if (!result.cancelled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        
        // Validate video file
        const fileInfo = await FileSystem.getInfoAsync(video.uri);
        const maxSize = 100 * 1024 * 1024; // 100MB max
        
        if (fileInfo.size > maxSize) {
          Alert.alert(
            'File Too Large',
            'Please select a video file smaller than 100MB.',
            [{ text: 'OK' }]
          );
          return;
        }

        if (video.duration > 30000) {
          Alert.alert(
            'Video Too Long',
            'Please select a video shorter than 30 seconds for best analysis results.',
            [{ text: 'OK' }]
          );
          return;
        }

        setVideoUri(video.uri);
        
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      console.error('Video upload failed:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to upload video. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedExercise || !videoUri) {
      Alert.alert(
        'Missing Information',
        'Please select an exercise and upload a video before starting analysis.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to processing screen
    navigation.navigate('PoseAnalysisProcessing', {
      exerciseType: selectedExercise.type,
      videoUri: videoUri,
      exerciseName: selectedExercise.name
    });
  };

  const handleRetakeVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        duration: 30000,
      });

      if (!result.cancelled && result.assets && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri);
        setUploadProgress(100);
      }
    } catch (error) {
      console.error('Video capture failed:', error);
      Alert.alert('Camera Error', 'Failed to capture video. Please try again.');
    }
  };

  return (
    <SafeLinearGradient 
      type="background" 
      variant="oura" 
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <BlurView intensity={20} style={styles.backButtonBlur}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#000000'} 
            />
          </BlurView>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Form Analysis
        </Text>
        
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => Alert.alert(
            'How It Works',
            'Select an exercise, upload a video of yourself performing it, and get instant AI-powered form feedback.'
          )}
          accessibilityLabel="Help"
          accessibilityRole="button"
        >
          <BlurView intensity={20} style={styles.helpButtonBlur}>
            <Ionicons 
              name="help-circle-outline" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#000000'} 
            />
          </BlurView>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise Selection Section */}
          <GlassContainer 
            variant="medium" 
            style={styles.sectionContainer}
            accessibilityLabel="Exercise selection"
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Select Exercise
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Choose the exercise you want to analyze
            </Text>
            
            <View style={styles.exerciseGrid}>
              {AVAILABLE_EXERCISES.map((exercise, index) => (
                <TouchableOpacity
                  key={exercise.type}
                  style={[
                    styles.exerciseCard,
                    selectedExercise?.type === exercise.type && styles.exerciseCardSelected
                  ]}
                  onPress={() => setSelectedExercise(exercise)}
                  accessibilityLabel={`Select ${exercise.name} exercise`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedExercise?.type === exercise.type }}
                >
                  <BlurView 
                    intensity={selectedExercise?.type === exercise.type ? 40 : 20} 
                    style={styles.exerciseCardBlur}
                  >
                    <Ionicons
                      name={exercise.icon}
                      size={32}
                      color={
                        selectedExercise?.type === exercise.type 
                          ? theme.primary 
                          : theme.textSecondary
                      }
                    />
                    <Text style={[
                      styles.exerciseName, 
                      { 
                        color: selectedExercise?.type === exercise.type 
                          ? theme.text 
                          : theme.textSecondary 
                      }
                    ]}>
                      {exercise.name}
                    </Text>
                    <Text style={[styles.exerciseDifficulty, { color: theme.textTertiary }]}>
                      {exercise.difficulty}
                    </Text>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </View>

            {selectedExercise && (
              <Animated.View
                style={[
                  styles.exerciseDetails,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <GlassContainer variant="subtle" style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseDescription, { color: theme.text }]}>
                    {selectedExercise.description}
                  </Text>
                  <View style={styles.exerciseMeta}>
                    <Text style={[styles.exerciseMetaText, { color: theme.textSecondary }]}>
                      Duration: {selectedExercise.duration}
                    </Text>
                  </View>
                </GlassContainer>
              </Animated.View>
            )}
          </GlassContainer>

          {/* Video Upload Section */}
          <GlassContainer 
            variant="medium" 
            style={styles.sectionContainer}
            accessibilityLabel="Video upload"
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Upload Video
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Record or select a video of your exercise
            </Text>
            
            <PoseUploadCard
              videoUri={videoUri}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onUploadPress={handleVideoUpload}
              onRetakePress={handleRetakeVideo}
              selectedExercise={selectedExercise}
            />
          </GlassContainer>

          {/* Analysis Tips */}
          <GlassContainer variant="subtle" style={styles.tipsContainer}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={20} color={theme.primary} />
              <Text style={[styles.tipsTitle, { color: theme.text }]}>
                Tips for Better Analysis
              </Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={[styles.tip, { color: theme.textSecondary }]}>
                • Record from the side for best angle view
              </Text>
              <Text style={[styles.tip, { color: theme.textSecondary }]}>
                • Ensure good lighting and clear visibility
              </Text>
              <Text style={[styles.tip, { color: theme.textSecondary }]}>
                • Keep the entire body in frame
              </Text>
              <Text style={[styles.tip, { color: theme.textSecondary }]}>
                • Perform 2-3 repetitions slowly
              </Text>
            </View>
          </GlassContainer>
        </ScrollView>

        {/* Start Analysis Button */}
        <Animated.View
          style={[
            styles.bottomSection,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <GlassButton
            title="Start Analysis"
            onPress={handleStartAnalysis}
            style={[
              styles.analyzeButton,
              (!selectedExercise || !videoUri) && styles.analyzeButtonDisabled
            ]}
            disabled={!selectedExercise || !videoUri}
            accessibilityLabel="Start pose analysis"
            accessibilityHint="Analyzes your uploaded video for form feedback"
          >
            <View style={styles.analyzeButtonContent}>
              <Ionicons
                name="analytics-outline"
                size={24}
                color={(!selectedExercise || !videoUri) ? theme.textTertiary : theme.text}
              />
              <Text style={[
                styles.analyzeButtonText,
                {
                  color: (!selectedExercise || !videoUri) ? theme.textTertiary : theme.text
                }
              ]}>
                Start Analysis
              </Text>
            </View>
          </GlassButton>
        </Animated.View>
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
  backButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  helpButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  helpButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 24,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exerciseCard: {
    width: (screenWidth - 84) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  exerciseCardSelected: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  exerciseCardBlur: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  exerciseDifficulty: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  exerciseDetails: {
    marginTop: 20,
  },
  exerciseInfo: {
    padding: 16,
  },
  exerciseDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseMetaText: {
    fontSize: 14,
  },
  tipsContainer: {
    padding: 20,
    marginBottom: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSection: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 20,
    right: 20,
  },
  analyzeButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 12,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});