/**
 * VideoCaptureEnhanced - Enhanced version using CameraService
 * 
 * This is an example of how to integrate the existing VideoCaptureComponent
 * with the new CameraService for improved functionality and consistency.
 * 
 * Key Enhancements:
 * - Uses CameraService for optimal configuration
 * - Automatic device capability detection
 * - Exercise-specific video quality optimization
 * - Enhanced validation and error handling
 * - Recording session tracking and analytics
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
  StatusBar,
  Animated,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { GlassContainer, GlassButton, BlurWrapper } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';
import cameraService, { CameraUtils } from '../../services/cameraService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideoCaptureEnhanced({
  visible = false,
  selectedExercise = null,
  maxDuration = 30,
  onVideoRecorded,
  onVideoUploaded,
  onError,
  onClose,
  enableHaptics = true,
}) {
  const { theme, isDarkMode } = useTheme();
  
  // Service states
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState(null);
  const [optimalConfig, setOptimalConfig] = useState(null);
  
  // Camera states
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState(null);
  
  // UI states
  const [countdown, setCountdown] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mode, setMode] = useState('camera'); // 'camera', 'preview'
  const [sessionId, setSessionId] = useState(null);
  
  // Refs
  const cameraRef = useRef(null);
  const recordingTimer = useRef(null);
  const countdownTimer = useRef(null);

  // Initialize camera service when component becomes visible
  useEffect(() => {
    if (visible && !serviceInitialized) {
      initializeCameraService();
    }
  }, [visible]);

  // Update optimal configuration when exercise changes
  useEffect(() => {
    if (serviceInitialized && selectedExercise) {
      const config = cameraService.getOptimalVideoConfig(selectedExercise.name, {
        maxDuration,
        quality: 'pose_analysis'
      });
      setOptimalConfig(config);
    }
  }, [serviceInitialized, selectedExercise, maxDuration]);

  // Initialize camera service
  const initializeCameraService = useCallback(async () => {
    try {
      console.log('VideoCaptureEnhanced: Initializing camera service');
      
      const initResult = await cameraService.initialize();
      
      if (initResult.success) {
        setDeviceCapabilities(initResult.capabilities);
        setServiceInitialized(true);
        
        // Check permissions
        const hasPerms = cameraService.hasRequiredPermissions();
        setHasPermission(hasPerms);
        
        if (!hasPerms) {
          const permResult = await cameraService.requestAllPermissions();
          setHasPermission(permResult.success);
        }
        
        console.log('VideoCaptureEnhanced: Camera service initialized', {
          capabilities: initResult.capabilities,
          permissions: hasPerms
        });
      } else {
        throw new Error('Service initialization failed');
      }
    } catch (error) {
      console.error('VideoCaptureEnhanced: Service initialization failed', error);
      onError?.(error);
      Alert.alert('Camera Error', 'Failed to initialize camera service. Please try again.');
    }
  }, [onError]);

  // Start countdown before recording
  const startCountdown = useCallback(async () => {
    if (!selectedExercise) {
      Alert.alert('Select Exercise', 'Please select an exercise before recording.');
      return;
    }

    if (!optimalConfig) {
      Alert.alert('Configuration Error', 'Camera configuration not ready. Please try again.');
      return;
    }

    try {
      // Generate session ID and start tracking
      const newSessionId = CameraUtils.generateSessionId();
      setSessionId(newSessionId);
      
      cameraService.startRecordingSession(newSessionId, selectedExercise.name, optimalConfig);
      
      let count = 3;
      setCountdown(count);
      
      countdownTimer.current = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
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
      console.error('VideoCaptureEnhanced: Countdown failed', error);
      onError?.(error);
    }
  }, [selectedExercise, optimalConfig, enableHaptics, onError]);

  // Start video recording
  const startRecording = useCallback(async () => {
    if (!cameraRef.current || !optimalConfig) {
      const error = new Error('Camera or configuration not available');
      if (sessionId) {
        cameraService.failRecordingSession(sessionId, error);
      }
      onError?.(error);
      return;
    }

    try {
      if (enableHaptics && Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
      
      // Use optimal configuration from service
      const recordingOptions = optimalConfig.recordingOptions;
      const video = await cameraRef.current.recordAsync(recordingOptions);
      
      // Get file info for metadata
      const fileInfo = await require('expo-file-system').getInfoAsync(video.uri);
      
      const metadata = {
        uri: video.uri,
        duration: recordingTime,
        fileSize: fileInfo.size,
        exercise: selectedExercise.name,
        timestamp: new Date().toISOString(),
        quality: optimalConfig.qualityInfo.name,
        cameraType: cameraType === CameraType.back ? 'back' : 'front',
        deviceCapabilities: {
          platform: deviceCapabilities?.platform,
          recommendedQuality: deviceCapabilities?.recommendedQuality
        }
      };
      
      setVideoUri(video.uri);
      setVideoMetadata(metadata);
      setMode('preview');
      
      console.log('VideoCaptureEnhanced: Recording completed', {
        duration: recordingTime,
        fileSize: fileInfo.size,
        quality: optimalConfig.qualityInfo.name
      });
      
    } catch (error) {
      setIsRecording(false);
      cleanupTimers();
      
      if (sessionId) {
        cameraService.failRecordingSession(sessionId, error);
      }
      
      console.error('VideoCaptureEnhanced: Recording failed', error);
      onError?.(error);
      Alert.alert('Recording Failed', 'Unable to record video. Please try again.');
    }
  }, [
    selectedExercise,
    optimalConfig,
    maxDuration,
    enableHaptics,
    cameraType,
    deviceCapabilities,
    recordingTime,
    sessionId,
    onError
  ]);

  // Stop video recording
  const stopRecording = useCallback(async () => {
    if (cameraRef.current && isRecording) {
      try {
        if (enableHaptics && Platform.OS !== 'web') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        
        setIsRecording(false);
        cleanupTimers();
        
        cameraRef.current.stopRecording();
      } catch (error) {
        console.error('VideoCaptureEnhanced: Stop recording failed', error);
      }
    }
  }, [isRecording, enableHaptics]);

  // Upload video from gallery using camera service
  const uploadFromGallery = useCallback(async () => {
    if (!serviceInitialized) {
      Alert.alert('Service Error', 'Camera service not ready. Please try again.');
      return;
    }

    try {
      console.log('VideoCaptureEnhanced: Starting gallery upload');
      
      const result = await cameraService.uploadFromGallery({
        exerciseType: selectedExercise?.name,
        maxDuration: maxDuration,
        allowEditing: true
      });

      if (result.success) {
        if (!result.validation.isValid) {
          Alert.alert('Invalid Video', result.validation.errors.join('\n'));
          return;
        }

        // Show warnings if any
        if (result.validation.warnings.length > 0) {
          Alert.alert('Video Warnings', result.validation.warnings.join('\n'));
        }

        setVideoUri(result.uri);
        setVideoMetadata(result.asset);
        setMode('preview');
        
        console.log('VideoCaptureEnhanced: Gallery upload successful', {
          validation: result.validation.isValid,
          warnings: result.validation.warnings.length
        });
      } else if (!result.cancelled) {
        throw new Error('Gallery upload failed');
      }
    } catch (error) {
      console.error('VideoCaptureEnhanced: Gallery upload failed', error);
      onError?.(error);
      Alert.alert('Upload Failed', 'Unable to upload video from gallery.');
    }
  }, [serviceInitialized, selectedExercise, maxDuration, onError]);

  // Confirm and submit video
  const confirmVideo = useCallback(async () => {
    if (!videoUri || !videoMetadata) return;
    
    try {
      console.log('VideoCaptureEnhanced: Confirming video');
      
      // Validate video using camera service
      const validation = await cameraService.validateVideoFile(videoUri, videoMetadata);
      
      if (!validation.isValid) {
        Alert.alert('Video Validation Failed', validation.errors.join('\n'));
        return;
      }

      // Save to media library if it's a recorded video
      if (videoMetadata.source !== 'gallery') {
        await MediaLibrary.createAssetAsync(videoUri);
      }

      // Complete recording session if there was one
      if (sessionId) {
        cameraService.completeRecordingSession(sessionId, {
          ...videoMetadata,
          validation: validation.isValid
        });
      }

      // Notify parent component
      if (videoMetadata.source === 'gallery') {
        onVideoUploaded?.(videoUri, videoMetadata);
      } else {
        onVideoRecorded?.(videoUri, videoMetadata);
      }
      
      if (enableHaptics && Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      console.log('VideoCaptureEnhanced: Video confirmed successfully');
      
    } catch (error) {
      console.error('VideoCaptureEnhanced: Video confirmation failed', error);
      
      if (sessionId) {
        cameraService.failRecordingSession(sessionId, error);
      }
      
      onError?.(error);
      Alert.alert('Confirmation Failed', 'Unable to process video. Please try again.');
    }
  }, [videoUri, videoMetadata, sessionId, onVideoRecorded, onVideoUploaded, enableHaptics, onError]);

  // Cleanup timers
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

  // Retake video
  const retakeVideo = useCallback(() => {
    setVideoUri(null);
    setVideoMetadata(null);
    setMode('camera');
    setRecordingTime(0);
    setSessionId(null);
    console.log('VideoCaptureEnhanced: Video retake initiated');
  }, []);

  // Format time display
  const formatTime = useCallback((seconds) => CameraUtils.formatDuration(seconds), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
      if (sessionId && isRecording) {
        cameraService.failRecordingSession(sessionId, new Error('Component unmounted'));
      }
    };
  }, [sessionId, isRecording, cleanupTimers]);

  // Show service analytics in development
  useEffect(() => {
    if (__DEV__ && serviceInitialized) {
      const analytics = cameraService.getAnalytics();
      console.log('VideoCaptureEnhanced: Service Analytics', analytics);
    }
  }, [serviceInitialized, sessionId]);

  // Render loading screen
  if (!serviceInitialized || hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {!serviceInitialized ? 'Initializing Camera Service...' : 'Checking Permissions...'}
          </Text>
          {deviceCapabilities && (
            <Text style={[styles.loadingSubtext, { color: theme.textSecondary }]}>
              Device: {deviceCapabilities.platform} • Quality: {deviceCapabilities.recommendedQuality}
            </Text>
          )}
        </View>
      </Modal>
    );
  }

  // Render permission request
  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.permissionContainer}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.permissionContent}>
            <Ionicons name="camera-outline" size={64} color={theme.textTertiary} />
            <Text style={[styles.permissionTitle, { color: theme.text }]}>
              Camera Access Required
            </Text>
            <Text style={[styles.permissionDescription, { color: theme.textSecondary }]}>
              Enable camera and microphone access to record videos for pose analysis.
            </Text>
            <GlassButton
              title="Grant Permissions"
              onPress={async () => {
                const result = await cameraService.requestAllPermissions();
                setHasPermission(result.success);
              }}
              variant="medium"
              size="lg"
              style={styles.permissionButton}
            />
          </View>
        </View>
      </Modal>
    );
  }

  // Main render - simplified for space, would include full camera and preview UI
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header with enhanced info */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {mode === 'preview' ? 'Video Preview' : 'Record Exercise'}
            </Text>
            {selectedExercise && optimalConfig && (
              <Text style={styles.headerSubtitle}>
                {selectedExercise.name} • {optimalConfig.qualityInfo.description}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            {optimalConfig && (
              <View style={styles.qualityIndicator}>
                <Text style={styles.qualityText}>
                  {optimalConfig.qualityInfo.name.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Content would include camera view and controls */}
        <View style={styles.content}>
          <Text style={[styles.placeholder, { color: theme.text }]}>
            Enhanced Camera Interface Here
            {optimalConfig && (
              <>
                {'\n'}Quality: {optimalConfig.qualityInfo.description}
                {'\n'}Exercise: {selectedExercise?.name}
                {'\n'}Min Duration: {optimalConfig.exerciseSettings.minDuration}s
                {'\n'}Recommended: {optimalConfig.exerciseSettings.recommendedAngle}
                {'\n'}Distance: {optimalConfig.exerciseSettings.optimalDistance}
              </>
            )}
          </Text>
        </View>

        {/* Enhanced footer with service info */}
        {optimalConfig && mode === 'camera' && (
          <View style={styles.footer}>
            <BlurWrapper intensity="medium" style={styles.footerContainer}>
              <View style={styles.configInfo}>
                <Text style={[styles.configText, { color: theme.textSecondary }]}>
                  📱 {deviceCapabilities?.platform} • 
                  🎬 {optimalConfig.qualityInfo.fileSize} • 
                  ⏱️ Max {maxDuration}s
                </Text>
              </View>
            </BlurWrapper>
          </View>
        )}
      </View>
    </Modal>
  );
}

// Simplified styles - would include full styling
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  loadingSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  permissionContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
  closeButton: { position: 'absolute', top: 60, right: 20, zIndex: 10 },
  permissionContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  permissionTitle: { fontSize: 24, fontWeight: '700', marginTop: 20, textAlign: 'center' },
  permissionDescription: { fontSize: 16, marginTop: 12, marginBottom: 32, textAlign: 'center' },
  permissionButton: { width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerRight: { width: 44 },
  qualityIndicator: { backgroundColor: 'rgba(255,107,53,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  qualityText: { fontSize: 10, fontWeight: '700', color: 'white' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: 16, textAlign: 'center', padding: 20 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  footerContainer: { padding: 16 },
  configInfo: { alignItems: 'center' },
  configText: { fontSize: 12, textAlign: 'center' },
});