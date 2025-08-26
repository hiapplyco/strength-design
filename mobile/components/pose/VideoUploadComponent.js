/**
 * VideoUploadComponent - AI Pose Analysis Video Upload Interface
 * Production-ready video upload component for gallery selection with validation
 * 
 * Features:
 * - Gallery video selection with format validation (MP4, MOV, M4V)
 * - File size validation (up to 2GB)
 * - Intuitive upload flow with progress feedback
 * - Comprehensive error handling and user messaging
 * - Cross-platform compatibility (iOS/Android/Web)
 * - Production-ready error boundaries and loading states
 * - Glassmorphism design following existing patterns
 * 
 * Component Interface:
 * - onVideoSelected: (videoUri: string, metadata: object) => void
 * - onError: (error: Error) => void
 * - onClose: () => void
 * - visible: boolean - Controls component visibility
 * - maxFileSize: number - Maximum file size in bytes (default: 2GB)
 * - maxDuration: number - Maximum video duration in seconds (default: 30s)
 * - selectedExercise: object - Exercise context for metadata
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  PermissionsAndroid,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// Note: expo-document-picker is optional - if needed, install with: npx expo install expo-document-picker
// import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { GlassContainer, GlassButton, BlurWrapper } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Supported video formats for pose analysis
const SUPPORTED_VIDEO_FORMATS = ['mp4', 'mov', 'm4v'];
const SUPPORTED_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v'];

// File size limits
const DEFAULT_MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const DEFAULT_MAX_DURATION = 30; // 30 seconds

// Video quality recommendations
const VIDEO_QUALITY_RECOMMENDATIONS = {
  excellent: {
    minResolution: '1080p',
    minFps: 30,
    description: 'High quality video optimal for pose analysis',
    badge: 'Excellent',
    color: '#34C759',
  },
  good: {
    minResolution: '720p',
    minFps: 24,
    description: 'Good quality video suitable for analysis',
    badge: 'Good',
    color: '#FF9500',
  },
  acceptable: {
    minResolution: '480p',
    minFps: 15,
    description: 'Basic quality - analysis may be limited',
    badge: 'Basic',
    color: '#FF6B35',
  },
  poor: {
    description: 'Low quality - analysis not recommended',
    badge: 'Poor',
    color: '#FF3B30',
  },
};

export default function VideoUploadComponent({
  visible = false,
  selectedExercise = null,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  maxDuration = DEFAULT_MAX_DURATION,
  onVideoSelected,
  onError,
  onClose,
  enableHaptics = true,
  showQualityFeedback = true,
  autoPlayPreview = false,
}) {
  const { theme, isDarkMode } = useTheme();
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [videoQuality, setVideoQuality] = useState(null);
  
  // UI states
  const [mode, setMode] = useState('select'); // 'select', 'preview', 'processing'
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Request media library permissions
  const requestPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Media Library Permission',
            message: 'This app needs access to your media library to upload videos for pose analysis.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Media library permission denied');
        }
      } else {
        // iOS/Web
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Media library permission denied');
        }
      }
      
      setPermissionStatus('granted');
      return true;
    } catch (error) {
      setPermissionStatus('denied');
      handleError(error, 'permission_request');
      return false;
    }
  }, []);

  // Error handler with production logging
  const handleError = useCallback((error, context = '') => {
    console.error('VideoUploadComponent Error:', {
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
      exercise: selectedExercise?.name,
      mode,
    });
    
    onError?.(error);
    
    // User-friendly error messages
    const friendlyMessage = getFriendlyErrorMessage(error);
    Alert.alert('Upload Error', friendlyMessage);
  }, [selectedExercise, mode, onError]);

  // Get user-friendly error messages
  const getFriendlyErrorMessage = (error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('permission')) {
      return 'Media library access is required to select videos for analysis.';
    }
    if (message.includes('cancelled') || message.includes('canceled')) {
      return 'Video selection was cancelled.';
    }
    if (message.includes('format') || message.includes('type')) {
      return `Unsupported video format. Please use ${SUPPORTED_VIDEO_FORMATS.join(', ').toUpperCase()} files.`;
    }
    if (message.includes('size')) {
      return `Video file is too large. Maximum size is ${Math.round(maxFileSize / (1024 * 1024 * 1024))}GB.`;
    }
    if (message.includes('duration')) {
      return `Video is too long. Maximum duration is ${maxDuration} seconds.`;
    }
    if (message.includes('corrupt') || message.includes('invalid')) {
      return 'The selected video file appears to be corrupted or invalid.';
    }
    
    return 'An error occurred while selecting the video. Please try again.';
  };

  // Validate video file
  const validateVideoFile = useCallback(async (asset) => {
    const errors = [];
    
    // Check file extension
    const fileExtension = asset.uri.split('.').pop()?.toLowerCase();
    if (!fileExtension || !SUPPORTED_VIDEO_FORMATS.includes(fileExtension)) {
      errors.push(`Unsupported format: ${fileExtension?.toUpperCase() || 'unknown'}`);
    }
    
    // Check MIME type if available
    if (asset.mimeType && !SUPPORTED_MIME_TYPES.includes(asset.mimeType)) {
      errors.push(`Unsupported MIME type: ${asset.mimeType}`);
    }
    
    // Check file size
    if (asset.fileSize && asset.fileSize > maxFileSize) {
      errors.push(`File too large: ${Math.round(asset.fileSize / (1024 * 1024))}MB (max ${Math.round(maxFileSize / (1024 * 1024 * 1024))}GB)`);
    }
    
    // Check duration
    if (asset.duration && asset.duration > maxDuration * 1000) { // duration in ms
      errors.push(`Video too long: ${Math.round(asset.duration / 1000)}s (max ${maxDuration}s)`);
    }
    
    // Get additional file info if needed
    try {
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      if (!fileInfo.exists) {
        errors.push('Video file not found or inaccessible');
      }
      if (fileInfo.size && fileInfo.size > maxFileSize) {
        errors.push(`File too large: ${Math.round(fileInfo.size / (1024 * 1024))}MB`);
      }
    } catch (error) {
      console.warn('Could not get additional file info:', error);
    }
    
    return errors;
  }, [maxFileSize, maxDuration]);

  // Assess video quality for pose analysis
  const assessVideoQuality = useCallback((asset) => {
    if (!asset.width || !asset.height) {
      return VIDEO_QUALITY_RECOMMENDATIONS.poor;
    }
    
    const resolution = Math.max(asset.width, asset.height);
    const fps = asset.frameRate || 24; // Default assumption
    
    if (resolution >= 1080 && fps >= 30) {
      return VIDEO_QUALITY_RECOMMENDATIONS.excellent;
    } else if (resolution >= 720 && fps >= 24) {
      return VIDEO_QUALITY_RECOMMENDATIONS.good;
    } else if (resolution >= 480) {
      return VIDEO_QUALITY_RECOMMENDATIONS.acceptable;
    } else {
      return VIDEO_QUALITY_RECOMMENDATIONS.poor;
    }
  }, []);

  // Select video from gallery using ImagePicker
  const selectVideoFromGallery = useCallback(async () => {
    try {
      // Check permissions first
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;
      }
      
      setIsUploading(true);
      setUploadProgress(10);
      
      // Configure picker options
      const pickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false, // Keep original video for analysis
        quality: 1, // Highest quality
        videoMaxDuration: maxDuration,
        allowsMultipleSelection: false,
      };
      
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      setUploadProgress(40);
      
      if (result.canceled) {
        throw new Error('Video selection cancelled');
      }
      
      if (!result.assets || result.assets.length === 0) {
        throw new Error('No video selected');
      }
      
      const asset = result.assets[0];
      setUploadProgress(60);
      
      // Validate the selected video
      const validationErrors = await validateVideoFile(asset);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
      
      setUploadProgress(80);
      
      // Assess video quality
      const quality = assessVideoQuality(asset);
      setVideoQuality(quality);
      
      // Create metadata
      const metadata = {
        uri: asset.uri,
        fileSize: asset.fileSize || 0,
        duration: asset.duration ? Math.round(asset.duration / 1000) : 0,
        width: asset.width || 0,
        height: asset.height || 0,
        exercise: selectedExercise?.name,
        timestamp: new Date().toISOString(),
        source: 'gallery',
        format: asset.uri.split('.').pop()?.toLowerCase(),
        quality: quality.badge,
        qualityScore: quality === VIDEO_QUALITY_RECOMMENDATIONS.excellent ? 1 : 
                      quality === VIDEO_QUALITY_RECOMMENDATIONS.good ? 0.8 :
                      quality === VIDEO_QUALITY_RECOMMENDATIONS.acceptable ? 0.6 : 0.3,
      };
      
      setSelectedVideo(asset);
      setVideoMetadata(metadata);
      setUploadProgress(100);
      setMode('preview');
      
      // Haptic feedback on success
      if (enableHaptics && Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Animate progress completion
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
    } catch (error) {
      handleError(error, 'gallery_selection');
      resetUploadState();
    } finally {
      setTimeout(() => setIsUploading(false), 500); // Keep loading visible briefly
    }
  }, [
    permissionStatus,
    requestPermissions,
    maxDuration,
    validateVideoFile,
    assessVideoQuality,
    selectedExercise,
    enableHaptics,
    handleError
  ]);

  // Select video using DocumentPicker (alternative method - requires expo-document-picker)
  const selectVideoFromFiles = useCallback(async () => {
    try {
      // Check if DocumentPicker is available
      const DocumentPicker = require('expo-document-picker');
      if (!DocumentPicker) {
        throw new Error('Document picker not available. Please install expo-document-picker.');
      }

      setIsUploading(true);
      setUploadProgress(10);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: false,
        multiple: false,
      });
      
      setUploadProgress(40);
      
      if (result.type === 'cancel') {
        throw new Error('File selection cancelled');
      }
      
      if (!result.assets || result.assets.length === 0) {
        throw new Error('No file selected');
      }
      
      const asset = result.assets[0];
      setUploadProgress(60);
      
      // Create a compatible asset object
      const compatibleAsset = {
        uri: asset.uri,
        fileSize: asset.size,
        mimeType: asset.mimeType,
        duration: null, // Will be determined later if possible
        width: null,
        height: null,
      };
      
      // Validate the selected file
      const validationErrors = await validateVideoFile(compatibleAsset);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
      
      setUploadProgress(80);
      
      // Basic quality assessment (limited for file picker)
      const quality = VIDEO_QUALITY_RECOMMENDATIONS.acceptable; // Conservative estimate
      setVideoQuality(quality);
      
      // Create metadata
      const metadata = {
        uri: asset.uri,
        fileSize: asset.size || 0,
        duration: 0, // Unknown from file picker
        width: 0,
        height: 0,
        exercise: selectedExercise?.name,
        timestamp: new Date().toISOString(),
        source: 'files',
        format: asset.name?.split('.').pop()?.toLowerCase(),
        quality: quality.badge,
        qualityScore: 0.6, // Conservative estimate
        fileName: asset.name,
      };
      
      setSelectedVideo(compatibleAsset);
      setVideoMetadata(metadata);
      setUploadProgress(100);
      setMode('preview');
      
      // Haptic feedback on success
      if (enableHaptics && Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
    } catch (error) {
      if (error.message.includes('Document picker not available')) {
        // Fallback to ImagePicker for file selection
        Alert.alert(
          'Alternative Selection',
          'File browser not available. Using gallery instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Use Gallery', onPress: selectVideoFromGallery }
          ]
        );
      } else {
        handleError(error, 'file_selection');
      }
      resetUploadState();
    } finally {
      setTimeout(() => setIsUploading(false), 500);
    }
  }, [
    validateVideoFile,
    selectedExercise,
    enableHaptics,
    handleError,
    selectVideoFromGallery,
    resetUploadState
  ]);

  // Reset upload state
  const resetUploadState = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedVideo(null);
    setVideoMetadata(null);
    setVideoQuality(null);
    setMode('select');
    progressAnim.setValue(0);
  }, []);

  // Confirm video selection
  const confirmVideoSelection = useCallback(async () => {
    if (!selectedVideo || !videoMetadata) return;
    
    try {
      // Final validation before confirming
      const finalValidation = await validateVideoFile(selectedVideo);
      if (finalValidation.length > 0) {
        throw new Error(finalValidation.join(', '));
      }
      
      onVideoSelected?.(selectedVideo.uri, videoMetadata);
      
      // Haptic feedback
      if (enableHaptics && Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Close modal after confirmation
      setTimeout(() => {
        resetUploadState();
        onClose?.();
      }, 500);
      
    } catch (error) {
      handleError(error, 'video_confirmation');
    }
  }, [selectedVideo, videoMetadata, validateVideoFile, onVideoSelected, enableHaptics, handleError, onClose, resetUploadState]);

  // Format file size for display
  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return 'Unknown size';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }, []);

  // Format duration for display
  const formatDuration = useCallback((seconds) => {
    if (!seconds) return 'Unknown duration';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  }, []);

  // Render video selection screen
  const renderSelectionScreen = () => (
    <View style={styles.selectionContainer}>
      <View style={styles.selectionContent}>
        {/* Header */}
        <View style={styles.selectionHeader}>
          <Ionicons 
            name="cloud-upload-outline" 
            size={64} 
            color={theme.primary} 
            style={styles.uploadIcon}
          />
          <Text style={[styles.selectionTitle, { color: theme.text }]}>
            Upload Exercise Video
          </Text>
          <Text style={[styles.selectionSubtitle, { color: theme.textSecondary }]}>
            Select a video from your device for pose analysis
          </Text>
        </View>

        {/* Exercise info */}
        {selectedExercise && (
          <GlassContainer variant="subtle" style={styles.exerciseContainer}>
            <View style={styles.exerciseInfo}>
              <Ionicons name="fitness-outline" size={20} color={theme.primary} />
              <View style={styles.exerciseTextContainer}>
                <Text style={[styles.exerciseText, { color: theme.text }]}>
                  Exercise: {selectedExercise.name}
                </Text>
                <Text style={[styles.exerciseHint, { color: theme.textSecondary }]}>
                  Best results with side-angle video showing full movement
                </Text>
              </View>
            </View>
          </GlassContainer>
        )}

        {/* Upload options */}
        <View style={styles.uploadOptions}>
          <GlassButton
            title="Choose from Gallery"
            onPress={selectVideoFromGallery}
            variant="medium"
            size="lg"
            style={[styles.uploadButton, styles.primaryUploadButton]}
            disabled={isUploading}
            accessibilityLabel="Select video from photo gallery"
          >
            <View style={styles.buttonContent}>
              <Ionicons name="images-outline" size={24} color={theme.text} />
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.buttonTitle, { color: theme.text }]}>
                  Gallery
                </Text>
                <Text style={[styles.buttonSubtitle, { color: theme.textSecondary }]}>
                  MP4, MOV, M4V • Max {Math.round(maxFileSize / (1024 * 1024 * 1024))}GB
                </Text>
              </View>
            </View>
          </GlassButton>

          <GlassButton
            title="Browse Files"
            onPress={selectVideoFromFiles}
            variant="subtle"
            size="lg"
            style={styles.uploadButton}
            disabled={isUploading}
            accessibilityLabel="Browse and select video file"
          >
            <View style={styles.buttonContent}>
              <Ionicons name="folder-outline" size={24} color={theme.text} />
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.buttonTitle, { color: theme.text }]}>
                  Files
                </Text>
                <Text style={[styles.buttonSubtitle, { color: theme.textSecondary }]}>
                  Browse all video files on device
                </Text>
              </View>
            </View>
          </GlassButton>
        </View>

        {/* Upload requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={[styles.requirementsTitle, { color: theme.textSecondary }]}>
            Video Requirements:
          </Text>
          <View style={styles.requirements}>
            <View style={styles.requirement}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                Formats: MP4, MOV, M4V
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                Maximum size: {Math.round(maxFileSize / (1024 * 1024 * 1024))}GB
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                Duration: Up to {maxDuration} seconds
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                Recommended: 720p or higher
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Render upload progress screen
  const renderUploadProgress = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressContent}>
        <ActivityIndicator size="large" color={theme.primary} style={styles.progressSpinner} />
        <Text style={[styles.progressTitle, { color: theme.text }]}>
          Processing Video
        </Text>
        <Text style={[styles.progressSubtitle, { color: theme.textSecondary }]}>
          Validating format and analyzing quality...
        </Text>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarTrack, { backgroundColor: theme.borderLight }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.primary,
                  width: `${uploadProgress}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressPercentage, { color: theme.textSecondary }]}>
            {uploadProgress}%
          </Text>
        </View>
      </View>
    </View>
  );

  // Render video preview screen
  const renderVideoPreview = () => (
    <ScrollView style={styles.previewContainer} showsVerticalScrollIndicator={false}>
      {/* Video player */}
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: selectedVideo?.uri }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          shouldPlay={autoPlayPreview}
          isLooping
        />
      </View>

      {/* Video metadata */}
      <View style={styles.metadataSection}>
        <GlassContainer variant="subtle" style={styles.metadataContainer}>
          <View style={styles.metadataHeader}>
            <Text style={[styles.metadataTitle, { color: theme.text }]}>
              Video Information
            </Text>
            {showQualityFeedback && videoQuality && (
              <View style={[styles.qualityBadge, { backgroundColor: videoQuality.color + '20' }]}>
                <View style={[styles.qualityDot, { backgroundColor: videoQuality.color }]} />
                <Text style={[styles.qualityText, { color: videoQuality.color }]}>
                  {videoQuality.badge}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={18} color={theme.primary} />
              <View style={styles.metadataTextContainer}>
                <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>
                  Duration
                </Text>
                <Text style={[styles.metadataValue, { color: theme.text }]}>
                  {formatDuration(videoMetadata?.duration)}
                </Text>
              </View>
            </View>

            <View style={styles.metadataItem}>
              <Ionicons name="download-outline" size={18} color={theme.primary} />
              <View style={styles.metadataTextContainer}>
                <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>
                  File Size
                </Text>
                <Text style={[styles.metadataValue, { color: theme.text }]}>
                  {formatFileSize(videoMetadata?.fileSize)}
                </Text>
              </View>
            </View>

            {videoMetadata?.width && videoMetadata?.height && (
              <View style={styles.metadataItem}>
                <Ionicons name="resize-outline" size={18} color={theme.primary} />
                <View style={styles.metadataTextContainer}>
                  <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>
                    Resolution
                  </Text>
                  <Text style={[styles.metadataValue, { color: theme.text }]}>
                    {videoMetadata.width} × {videoMetadata.height}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.metadataItem}>
              <Ionicons name="document-outline" size={18} color={theme.primary} />
              <View style={styles.metadataTextContainer}>
                <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>
                  Format
                </Text>
                <Text style={[styles.metadataValue, { color: theme.text }]}>
                  {videoMetadata?.format?.toUpperCase() || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
        </GlassContainer>

        {/* Quality feedback */}
        {showQualityFeedback && videoQuality && (
          <GlassContainer 
            variant="subtle" 
            style={[
              styles.qualityContainer,
              { borderColor: videoQuality.color + '40', borderWidth: 1 }
            ]}
          >
            <View style={styles.qualityHeader}>
              <Ionicons 
                name={
                  videoQuality === VIDEO_QUALITY_RECOMMENDATIONS.excellent ? "checkmark-circle" :
                  videoQuality === VIDEO_QUALITY_RECOMMENDATIONS.good ? "checkmark-circle" :
                  videoQuality === VIDEO_QUALITY_RECOMMENDATIONS.acceptable ? "warning" : "close-circle"
                } 
                size={24} 
                color={videoQuality.color} 
              />
              <Text style={[styles.qualityTitle, { color: theme.text }]}>
                Analysis Quality: {videoQuality.badge}
              </Text>
            </View>
            <Text style={[styles.qualityDescription, { color: theme.textSecondary }]}>
              {videoQuality.description}
            </Text>
          </GlassContainer>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.previewActions}>
        <GlassButton
          title="Choose Different"
          onPress={resetUploadState}
          variant="subtle"
          size="lg"
          style={[styles.actionButton, styles.secondaryActionButton]}
          accessibilityLabel="Select a different video"
        />
        <GlassButton
          title="Use This Video"
          onPress={confirmVideoSelection}
          variant="medium"
          size="lg"
          style={[styles.actionButton, styles.primaryActionButton]}
          accessibilityLabel="Confirm and use selected video"
        />
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.backgroundElevated }]}>
          <TouchableOpacity 
            onPress={() => {
              resetUploadState();
              onClose?.();
            }}
            style={styles.headerButton}
            accessibilityLabel="Close video upload"
          >
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {mode === 'preview' ? 'Video Preview' : 'Upload Video'}
            </Text>
            {selectedExercise && (
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {selectedExercise.name}
              </Text>
            )}
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {isUploading ? (
            renderUploadProgress()
          ) : mode === 'preview' ? (
            renderVideoPreview()
          ) : (
            renderSelectionScreen()
          )}
        </View>
      </View>
    </Modal>
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
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  
  // Selection screen styles
  selectionContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  selectionContent: {
    alignItems: 'center',
  },
  selectionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  uploadIcon: {
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  exerciseContainer: {
    width: '100%',
    marginBottom: 32,
    padding: 16,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  exerciseTextContainer: {
    flex: 1,
  },
  exerciseText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseHint: {
    fontSize: 14,
    lineHeight: 18,
  },
  uploadOptions: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  uploadButton: {
    width: '100%',
  },
  primaryUploadButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  buttonTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 14,
  },
  requirementsContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirements: {
    gap: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
  },

  // Progress screen styles
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  progressContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  progressSpinner: {
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 8,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Preview screen styles
  previewContainer: {
    flex: 1,
  },
  videoContainer: {
    aspectRatio: 16/9,
    backgroundColor: '#000',
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    flex: 1,
  },
  metadataSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  metadataContainer: {
    padding: 20,
  },
  metadataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metadataTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metadataGrid: {
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metadataTextContainer: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  qualityContainer: {
    padding: 16,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  qualityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  qualityDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  previewActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  secondaryActionButton: {
    // Subtle variant styling applied via variant prop
  },
  primaryActionButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
});