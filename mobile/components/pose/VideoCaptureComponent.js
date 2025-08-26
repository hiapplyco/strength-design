/**
 * VideoCaptureComponent - AI Pose Analysis Video Recording Interface
 * Production-ready video recording component with exercise-specific guidance
 * 
 * Features:
 * - Exercise-specific framing guidelines and real-time overlays
 * - Support for video recording with optimal settings for pose analysis
 * - Video upload from device gallery with format validation
 * - Cross-platform camera integration with graceful permission handling
 * - Real-time feedback for proper camera positioning and lighting
 * - Production-ready error handling and loading states
 * 
 * Component Interface (for other streams):
 * - onVideoRecorded: (videoUri: string, metadata: object) => void
 * - onVideoUploaded: (videoUri: string, metadata: object) => void
 * - onError: (error: Error) => void
 * - selectedExercise: object - Exercise details for framing guidance
 * - maxDuration: number - Maximum recording duration (default: 30s)
 * - visible: boolean - Controls component visibility
 * - onClose: () => void - Close handler
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

import { GlassContainer, GlassButton, BlurWrapper } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Exercise-specific framing configurations
const EXERCISE_FRAMING_CONFIGS = {
  squat: {
    guidanceText: 'Position camera to show full body from side angle',
    framingGuides: [
      { type: 'horizontal', position: 0.2, label: 'Head level' },
      { type: 'horizontal', position: 0.8, label: 'Foot level' },
      { type: 'vertical', position: 0.5, label: 'Center body' }
    ],
    optimalDistance: '6-8 feet away',
    cameraAngle: 'side view',
    lightingTips: 'Face the light source, avoid backlighting'
  },
  deadlift: {
    guidanceText: 'Side angle showing full body and bar path',
    framingGuides: [
      { type: 'horizontal', position: 0.15, label: 'Head level' },
      { type: 'horizontal', position: 0.85, label: 'Floor level' },
      { type: 'vertical', position: 0.4, label: 'Bar position' }
    ],
    optimalDistance: '6-8 feet away',
    cameraAngle: 'side view',
    lightingTips: 'Ensure bar and body are well lit'
  },
  benchPress: {
    guidanceText: 'Side view capturing full range of motion',
    framingGuides: [
      { type: 'horizontal', position: 0.3, label: 'Bar level (up)' },
      { type: 'horizontal', position: 0.6, label: 'Chest level' },
      { type: 'vertical', position: 0.5, label: 'Body center' }
    ],
    optimalDistance: '4-6 feet away',
    cameraAngle: 'side view',
    lightingTips: 'Light from front to avoid shadows'
  },
  pullUp: {
    guidanceText: 'Front or side view showing full body extension',
    framingGuides: [
      { type: 'horizontal', position: 0.1, label: 'Bar level' },
      { type: 'horizontal', position: 0.9, label: 'Foot level' },
      { type: 'vertical', position: 0.5, label: 'Body center' }
    ],
    optimalDistance: '8-10 feet away',
    cameraAngle: 'front or side view',
    lightingTips: 'Even lighting to capture movement'
  },
  default: {
    guidanceText: 'Position camera to capture full exercise movement',
    framingGuides: [
      { type: 'horizontal', position: 0.2, label: 'Top of movement' },
      { type: 'horizontal', position: 0.8, label: 'Bottom of movement' },
      { type: 'vertical', position: 0.5, label: 'Center frame' }
    ],
    optimalDistance: '6-8 feet away',
    cameraAngle: 'side view preferred',
    lightingTips: 'Ensure good lighting on exercise area'
  }
};

// Video quality configurations optimized for pose analysis
const VIDEO_QUALITY_CONFIGS = {
  analysis: {
    quality: Camera.Constants.VideoQuality['720p'],
    fps: 30,
    description: 'Optimized for pose analysis',
    fileSize: 'Medium (~20-40MB/min)'
  },
  high: {
    quality: Camera.Constants.VideoQuality['1080p'],
    fps: 60,
    description: 'High quality recording',
    fileSize: 'Large (~50-80MB/min)'
  },
  basic: {
    quality: Camera.Constants.VideoQuality['480p'],
    fps: 30,
    description: 'Basic quality, smaller files',
    fileSize: 'Small (~10-20MB/min)'
  }
};

const SUPPORTED_VIDEO_FORMATS = ['mp4', 'mov', 'm4v'];
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const DEFAULT_MAX_DURATION = 30; // 30 seconds

export default function VideoCaptureComponent({
  visible = false,
  selectedExercise = null,
  maxDuration = DEFAULT_MAX_DURATION,
  onVideoRecorded,
  onVideoUploaded,
  onError,
  onClose,
  videoQuality = 'analysis',
  showFramingGuides = true,
  enableHaptics = true,
}) {
  const { theme, isDarkMode } = useTheme();
  
  // Permission states
  const [hasPermission, setHasPermission] = useState(null);
  const [permissionDetails, setPermissionDetails] = useState({});
  
  // Camera states
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState(null);
  
  // UI states
  const [showOverlay, setShowOverlay] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState('camera'); // 'camera', 'preview', 'upload'
  
  // Refs
  const cameraRef = useRef(null);
  const recordingTimer = useRef(null);
  const countdownTimer = useRef(null);
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0.8)).current;

  // Get exercise-specific configuration
  const exerciseConfig = useMemo(() => {
    if (!selectedExercise) return EXERCISE_FRAMING_CONFIGS.default;
    const exerciseKey = selectedExercise.name?.toLowerCase() || 'default';
    return EXERCISE_FRAMING_CONFIGS[exerciseKey] || EXERCISE_FRAMING_CONFIGS.default;
  }, [selectedExercise]);

  // Get video quality configuration
  const qualityConfig = useMemo(() => {
    return VIDEO_QUALITY_CONFIGS[videoQuality] || VIDEO_QUALITY_CONFIGS.analysis;
  }, [videoQuality]);

  // Request permissions on mount
  useEffect(() => {
    if (visible) {
      requestPermissions();
    }
    return cleanupTimers;
  }, [visible]);

  // Start pulse animation
  useEffect(() => {
    if (visible && !isRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [visible, isRecording]);

  // Cleanup function
  const cleanupTimers = useCallback(() => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    if (countdownTimer.current) {
      clearTimeout(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  // Request camera and media permissions
  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      const permissions = {
        camera: cameraStatus === 'granted',
        audio: audioStatus === 'granted',
        media: mediaStatus === 'granted',
        gallery: galleryStatus === 'granted',
      };
      
      setPermissionDetails(permissions);
      setHasPermission(
        permissions.camera && 
        permissions.audio && 
        permissions.media
      );
    } catch (error) {
      console.error('Permission request error:', error);
      handleError(new Error('Failed to request permissions'));
    }
  };

  // Error handler with production logging
  const handleError = useCallback((error, context = '') => {
    console.error('VideoCaptureComponent Error:', {
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
      exercise: selectedExercise?.name,
      mode,
    });
    
    onError?.(error);
    
    // User-friendly error messages
    const friendlyMessage = getFriendlyErrorMessage(error);
    Alert.alert('Recording Error', friendlyMessage);
  }, [selectedExercise, mode, onError]);

  // Get user-friendly error messages
  const getFriendlyErrorMessage = (error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('permission')) {
      return 'Camera and microphone access is required to record videos.';
    }
    if (message.includes('storage')) {
      return 'Not enough storage space to record video.';
    }
    if (message.includes('duration')) {
      return `Recording is limited to ${maxDuration} seconds.`;
    }
    if (message.includes('format')) {
      return 'Video format not supported. Please try a different file.';
    }
    if (message.includes('size')) {
      return 'Video file is too large. Maximum size is 2GB.';
    }
    
    return 'An error occurred while recording. Please try again.';
  };

  // Start countdown before recording
  const startCountdown = useCallback(async () => {
    if (!selectedExercise) {
      Alert.alert('Select Exercise', 'Please select an exercise before recording.');
      return;
    }

    try {
      let count = 3;
      setCountdown(count);
      
      countdownTimer.current = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
          // Haptic feedback
          if (enableHaptics && Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          setCountdown(null);
          clearInterval(countdownTimer.current);
          countdownTimer.current = null;
          startRecording();
        }
      }, 1000);
    } catch (error) {
      handleError(error, 'countdown');
    }
  }, [selectedExercise, enableHaptics, handleError]);

  // Start video recording
  const startRecording = useCallback(async () => {
    if (!cameraRef.current) {
      handleError(new Error('Camera not available'));
      return;
    }

    try {
      // Haptic feedback for start
      if (enableHaptics && Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      setIsRecording(true);
      setRecordingTime(0);
      setShowOverlay(false);
      
      // Start recording timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at max duration
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
      
      // Configure recording options
      const recordingOptions = {
        maxDuration: maxDuration,
        quality: qualityConfig.quality,
        mute: false,
      };
      
      const video = await cameraRef.current.recordAsync(recordingOptions);
      
      // Get video metadata
      const fileInfo = await FileSystem.getInfoAsync(video.uri);
      const metadata = {
        duration: recordingTime,
        fileSize: fileInfo.size,
        exercise: selectedExercise?.name,
        timestamp: new Date().toISOString(),
        quality: videoQuality,
        cameraType: cameraType === CameraType.back ? 'back' : 'front',
      };
      
      setVideoUri(video.uri);
      setVideoMetadata(metadata);
      setMode('preview');
      
    } catch (error) {
      setIsRecording(false);
      cleanupTimers();
      handleError(error, 'recording');
    }
  }, [
    selectedExercise,
    maxDuration,
    enableHaptics,
    qualityConfig,
    videoQuality,
    cameraType,
    recordingTime,
    handleError,
    cleanupTimers
  ]);

  // Stop video recording
  const stopRecording = useCallback(async () => {
    if (cameraRef.current && isRecording) {
      try {
        // Haptic feedback for stop
        if (enableHaptics && Platform.OS !== 'web') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        
        setIsRecording(false);
        cleanupTimers();
        
        cameraRef.current.stopRecording();
      } catch (error) {
        handleError(error, 'stop_recording');
      }
    }
  }, [isRecording, enableHaptics, handleError, cleanupTimers]);

  // Upload video from gallery
  const uploadFromGallery = useCallback(async () => {
    try {
      setIsUploading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        duration: maxDuration * 1000, // Convert to milliseconds
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate file format
        const fileExtension = asset.uri.split('.').pop()?.toLowerCase();
        if (!SUPPORTED_VIDEO_FORMATS.includes(fileExtension)) {
          throw new Error('Unsupported video format. Please use MP4, MOV, or M4V.');
        }
        
        // Check file size
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          throw new Error('Video file is too large. Maximum size is 2GB.');
        }
        
        // Create metadata
        const metadata = {
          duration: asset.duration || 0,
          fileSize: asset.fileSize || 0,
          exercise: selectedExercise?.name,
          timestamp: new Date().toISOString(),
          source: 'gallery',
          width: asset.width,
          height: asset.height,
        };
        
        setVideoUri(asset.uri);
        setVideoMetadata(metadata);
        setMode('preview');
        
        onVideoUploaded?.(asset.uri, metadata);
      }
    } catch (error) {
      handleError(error, 'gallery_upload');
    } finally {
      setIsUploading(false);
    }
  }, [selectedExercise, maxDuration, handleError, onVideoUploaded]);

  // Confirm and submit recorded video
  const confirmVideo = useCallback(async () => {
    if (!videoUri || !videoMetadata) return;
    
    try {
      // Save to media library if needed
      if (videoMetadata.source !== 'gallery') {
        await MediaLibrary.createAssetAsync(videoUri);
      }
      
      onVideoRecorded?.(videoUri, videoMetadata);
      
      // Haptic feedback
      if (enableHaptics && Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
    } catch (error) {
      handleError(error, 'confirm_video');
    }
  }, [videoUri, videoMetadata, onVideoRecorded, enableHaptics, handleError]);

  // Retake video
  const retakeVideo = useCallback(() => {
    setVideoUri(null);
    setVideoMetadata(null);
    setMode('camera');
    setRecordingTime(0);
    setShowOverlay(true);
  }, []);

  // Format time display
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Render framing guides
  const renderFramingGuides = () => {
    if (!showFramingGuides || !showOverlay) return null;
    
    return (
      <View style={styles.framingGuides}>
        {exerciseConfig.framingGuides.map((guide, index) => (
          <View
            key={index}
            style={[
              styles.framingGuide,
              guide.type === 'horizontal'
                ? {
                    top: `${guide.position * 100}%`,
                    left: 20,
                    right: 20,
                    height: 1,
                  }
                : {
                    left: `${guide.position * 100}%`,
                    top: 20,
                    bottom: 20,
                    width: 1,
                  },
            ]}
          >
            <View style={styles.guideLabel}>
              <Text style={styles.guideLabelText}>{guide.label}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Render camera view
  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <Camera 
        style={styles.camera} 
        type={cameraType}
        ref={cameraRef}
      >
        {/* Framing guides overlay */}
        {renderFramingGuides()}

        {/* Exercise guidance overlay */}
        {showOverlay && selectedExercise && (
          <Animated.View style={[styles.guidanceOverlay, { opacity: overlayOpacity }]}>
            <BlurWrapper intensity="medium" style={styles.guidanceContainer}>
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, { color: theme.text }]}>
                  {selectedExercise.name}
                </Text>
                <Text style={[styles.guidanceText, { color: theme.textSecondary }]}>
                  {exerciseConfig.guidanceText}
                </Text>
                <View style={styles.guidanceDetails}>
                  <View style={styles.guidanceDetail}>
                    <Ionicons name="camera-outline" size={16} color={theme.primary} />
                    <Text style={[styles.guidanceDetailText, { color: theme.textSecondary }]}>
                      {exerciseConfig.cameraAngle}
                    </Text>
                  </View>
                  <View style={styles.guidanceDetail}>
                    <Ionicons name="resize-outline" size={16} color={theme.primary} />
                    <Text style={[styles.guidanceDetailText, { color: theme.textSecondary }]}>
                      {exerciseConfig.optimalDistance}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowOverlay(false)}
                style={styles.hideOverlayButton}
                accessibilityLabel="Hide guidance overlay"
              >
                <Ionicons name="eye-off" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </BlurWrapper>
          </Animated.View>
        )}

        {/* Countdown overlay */}
        {countdown && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
            <Text style={styles.maxDurationText}>/ {formatTime(maxDuration)}</Text>
          </View>
        )}

        {/* Camera controls */}
        {!isRecording && (
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                setCameraType(current => 
                  current === CameraType.back ? CameraType.front : CameraType.back
                );
              }}
              accessibilityLabel="Flip camera"
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowOverlay(!showOverlay)}
              accessibilityLabel="Toggle guidance overlay"
            >
              <Ionicons 
                name={showOverlay ? "eye" : "eye-off"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={uploadFromGallery}
              disabled={isUploading}
              accessibilityLabel="Upload from gallery"
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="folder-open" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Record button */}
        <View style={styles.recordButtonContainer}>
          {!isRecording ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startCountdown}
                disabled={!selectedExercise}
                accessibilityLabel="Start recording"
              >
                <View style={[
                  styles.recordButtonInner,
                  !selectedExercise && styles.recordButtonDisabled
                ]} />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
              accessibilityLabel="Stop recording"
            >
              <View style={styles.stopButtonInner} />
            </TouchableOpacity>
          )}
        </View>
      </Camera>
    </View>
  );

  // Render video preview
  const renderVideoPreview = () => (
    <View style={styles.previewContainer}>
      <Video
        source={{ uri: videoUri }}
        style={styles.video}
        useNativeControls
        resizeMode="contain"
        shouldPlay={false}
        isLooping
      />
      
      <View style={styles.previewInfo}>
        <GlassContainer variant="subtle" style={styles.metadataContainer}>
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={16} color={theme.primary} />
              <Text style={[styles.metadataText, { color: theme.text }]}>
                {formatTime(videoMetadata?.duration || 0)}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="download-outline" size={16} color={theme.primary} />
              <Text style={[styles.metadataText, { color: theme.text }]}>
                {Math.round((videoMetadata?.fileSize || 0) / (1024 * 1024))}MB
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="fitness-outline" size={16} color={theme.primary} />
              <Text style={[styles.metadataText, { color: theme.text }]}>
                {videoMetadata?.exercise || 'Exercise'}
              </Text>
            </View>
          </View>
        </GlassContainer>
        
        <View style={styles.previewActions}>
          <GlassButton
            title="Retake"
            onPress={retakeVideo}
            variant="subtle"
            size="md"
            style={styles.actionButton}
            accessibilityLabel="Retake video"
          />
          <GlassButton
            title="Use Video"
            onPress={confirmVideo}
            variant="medium"
            size="md"
            style={[styles.actionButton, styles.primaryActionButton]}
            accessibilityLabel="Confirm and use this video"
          />
        </View>
      </View>
    </View>
  );

  // Render permissions request screen
  const renderPermissionRequest = () => (
    <View style={styles.permissionContainer}>
      <View style={styles.permissionContent}>
        <Ionicons 
          name="camera-outline" 
          size={64} 
          color={theme.textTertiary} 
          style={styles.permissionIcon}
        />
        <Text style={[styles.permissionTitle, { color: theme.text }]}>
          Camera Access Required
        </Text>
        <Text style={[styles.permissionDescription, { color: theme.textSecondary }]}>
          To record videos for pose analysis, we need access to your camera and microphone.
        </Text>
        
        <View style={styles.permissionDetails}>
          {Object.entries(permissionDetails).map(([key, granted]) => (
            <View key={key} style={styles.permissionItem}>
              <Ionicons 
                name={granted ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={granted ? theme.success : theme.error} 
              />
              <Text style={[styles.permissionItemText, { color: theme.text }]}>
                {key.charAt(0).toUpperCase() + key.slice(1)} Access
              </Text>
            </View>
          ))}
        </View>
        
        <GlassButton
          title="Grant Permissions"
          onPress={requestPermissions}
          variant="medium"
          size="lg"
          style={styles.permissionButton}
          accessibilityLabel="Request camera permissions"
        />
      </View>
    </View>
  );

  // Render loading screen
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.text }]}>
        Initializing Camera...
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.headerButton}
            accessibilityLabel="Close video capture"
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {mode === 'preview' ? 'Video Preview' : 'Record Exercise'}
            </Text>
            {selectedExercise && (
              <Text style={styles.headerSubtitle}>
                {selectedExercise.name}
              </Text>
            )}
          </View>
          
          <View style={styles.headerRight}>
            {mode === 'camera' && (
              <View style={styles.qualityIndicator}>
                <Text style={styles.qualityText}>
                  {videoQuality.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {hasPermission === false ? (
            renderPermissionRequest()
          ) : hasPermission === null ? (
            renderLoading()
          ) : mode === 'preview' ? (
            renderVideoPreview()
          ) : (
            renderCamera()
          )}
        </View>

        {/* Footer tips */}
        {mode === 'camera' && !isRecording && selectedExercise && (
          <View style={styles.footer}>
            <BlurWrapper intensity="medium" style={styles.footerContainer}>
              <View style={styles.tipContainer}>
                <Ionicons name="bulb-outline" size={16} color={theme.warning} />
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  {exerciseConfig.lightingTips}
                </Text>
              </View>
            </BlurWrapper>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
  },
  qualityIndicator: {
    backgroundColor: 'rgba(255, 107, 53, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qualityText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  framingGuides: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  framingGuide: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 107, 53, 0.6)',
  },
  guideLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    top: -16,
  },
  guideLabelText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  guidanceOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  guidanceContainer: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  guidanceText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  guidanceDetails: {
    gap: 8,
  },
  guidanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guidanceDetailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  hideOverlayButton: {
    padding: 4,
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '700',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  recordingIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 40,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  maxDurationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  cameraControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -100 }],
    gap: 16,
    zIndex: 50,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 60,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B35',
  },
  recordButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  previewInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  metadataContainer: {
    marginBottom: 20,
    padding: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  primaryActionButton: {
    backgroundColor: '#FF6B35',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  permissionContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  permissionIcon: {
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionDescription: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionDetails: {
    width: '100%',
    marginBottom: 32,
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  permissionButton: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContainer: {
    padding: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
});