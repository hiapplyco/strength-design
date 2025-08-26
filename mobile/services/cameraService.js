/**
 * CameraService - Comprehensive Camera and Video Management Service
 * Production-ready service for pose analysis video capture and management
 * 
 * Features:
 * - Device capability detection and optimization
 * - Pose analysis specific camera configurations
 * - Video quality optimization for different use cases
 * - Cross-platform camera and media library integration
 * - Comprehensive error handling and logging
 * - Performance monitoring and analytics
 * 
 * Used by:
 * - VideoCaptureComponent (Stream A)
 * - VideoUploadComponent 
 * - PoseAnalysisScreen
 * - WorkoutVideoRecorder
 */

import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import { Platform, Alert, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Service configuration constants
export const CAMERA_CONSTANTS = {
  // Video quality presets optimized for pose analysis
  VIDEO_QUALITY: {
    POSE_ANALYSIS: 'pose_analysis',
    HIGH_QUALITY: 'high_quality', 
    BALANCED: 'balanced',
    BASIC: 'basic',
    STREAMING: 'streaming'
  },
  
  // Supported video formats for pose analysis
  SUPPORTED_FORMATS: ['mp4', 'mov', 'm4v'],
  
  // File size limits
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  RECOMMENDED_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  
  // Duration limits
  MAX_DURATION: 120, // 2 minutes
  RECOMMENDED_DURATION: 30, // 30 seconds
  MIN_DURATION: 3, // 3 seconds
  
  // Frame rate configurations
  FPS: {
    ANALYSIS: 30,
    HIGH_QUALITY: 60,
    STANDARD: 30,
    BASIC: 24
  },
  
  // Exercise-specific camera requirements
  EXERCISE_REQUIREMENTS: {
    squat: {
      minDuration: 10,
      recommendedAngle: 'side',
      requiredFraming: 'full_body',
      optimalDistance: '6-8 feet',
      quality: 'pose_analysis'
    },
    deadlift: {
      minDuration: 8,
      recommendedAngle: 'side', 
      requiredFraming: 'full_body',
      optimalDistance: '6-8 feet',
      quality: 'pose_analysis'
    },
    benchPress: {
      minDuration: 8,
      recommendedAngle: 'side',
      requiredFraming: 'upper_body',
      optimalDistance: '4-6 feet',
      quality: 'pose_analysis'
    },
    pullUp: {
      minDuration: 10,
      recommendedAngle: 'front_side',
      requiredFraming: 'full_body',
      optimalDistance: '8-10 feet',
      quality: 'pose_analysis'
    },
    default: {
      minDuration: 5,
      recommendedAngle: 'side',
      requiredFraming: 'full_body',
      optimalDistance: '6-8 feet',
      quality: 'balanced'
    }
  }
};

// Video quality configurations optimized for different use cases
const VIDEO_QUALITY_CONFIGS = {
  [CAMERA_CONSTANTS.VIDEO_QUALITY.POSE_ANALYSIS]: {
    quality: Camera.Constants.VideoQuality['720p'],
    fps: CAMERA_CONSTANTS.FPS.ANALYSIS,
    bitrate: 2000000, // 2 Mbps
    description: 'Optimized for pose analysis accuracy',
    fileSize: 'Medium (~20-40MB/min)',
    useCase: 'Best balance of quality and processing speed for AI analysis'
  },
  [CAMERA_CONSTANTS.VIDEO_QUALITY.HIGH_QUALITY]: {
    quality: Camera.Constants.VideoQuality['1080p'],
    fps: CAMERA_CONSTANTS.FPS.HIGH_QUALITY,
    bitrate: 8000000, // 8 Mbps
    description: 'High quality for detailed analysis',
    fileSize: 'Large (~60-100MB/min)',
    useCase: 'Maximum detail for complex movement analysis'
  },
  [CAMERA_CONSTANTS.VIDEO_QUALITY.BALANCED]: {
    quality: Camera.Constants.VideoQuality['720p'],
    fps: CAMERA_CONSTANTS.FPS.STANDARD,
    bitrate: 1500000, // 1.5 Mbps
    description: 'Balanced quality and file size',
    fileSize: 'Medium (~15-30MB/min)',
    useCase: 'Good for general exercise recording'
  },
  [CAMERA_CONSTANTS.VIDEO_QUALITY.BASIC]: {
    quality: Camera.Constants.VideoQuality['480p'],
    fps: CAMERA_CONSTANTS.FPS.BASIC,
    bitrate: 800000, // 800 Kbps
    description: 'Basic quality for smaller files',
    fileSize: 'Small (~8-15MB/min)',
    useCase: 'Quick recordings with limited storage'
  },
  [CAMERA_CONSTANTS.VIDEO_QUALITY.STREAMING]: {
    quality: Camera.Constants.VideoQuality['480p'],
    fps: CAMERA_CONSTANTS.FPS.STANDARD,
    bitrate: 1000000, // 1 Mbps
    description: 'Optimized for real-time streaming',
    fileSize: 'Small (~10-20MB/min)',
    useCase: 'Live analysis or network streaming'
  }
};

// Device capability cache
let deviceCapabilities = null;
let permissionStatus = null;

/**
 * CameraService - Main service class for camera operations
 */
class CameraService {
  constructor() {
    this.isInitialized = false;
    this.activeRecordings = new Map();
    this.analytics = {
      recordingsStarted: 0,
      recordingsCompleted: 0,
      recordingsFailed: 0,
      totalRecordingTime: 0,
      averageFileSize: 0
    };
  }

  /**
   * Initialize the camera service
   */
  async initialize() {
    try {
      console.log('CameraService: Initializing...');
      
      // Check device capabilities
      await this.detectDeviceCapabilities();
      
      // Check permissions
      await this.checkAllPermissions();
      
      this.isInitialized = true;
      console.log('CameraService: Initialized successfully', {
        capabilities: deviceCapabilities,
        permissions: permissionStatus
      });
      
      return { success: true, capabilities: deviceCapabilities };
    } catch (error) {
      console.error('CameraService: Initialization failed', error);
      throw new Error(`Camera service initialization failed: ${error.message}`);
    }
  }

  /**
   * Detect device camera capabilities
   */
  async detectDeviceCapabilities() {
    try {
      const capabilities = {
        // Device information
        deviceType: Device.deviceType,
        deviceName: Device.deviceName,
        osVersion: Device.osVersion,
        platform: Platform.OS,
        
        // Screen information
        screenWidth,
        screenHeight,
        screenRatio: screenWidth / screenHeight,
        
        // Camera capabilities (will be populated after permission)
        supportedQualities: [],
        supportedRatios: [],
        hasFlash: false,
        hasFrontCamera: true,
        hasBackCamera: true,
        
        // Performance indicators
        recommendedQuality: CAMERA_CONSTANTS.VIDEO_QUALITY.BALANCED,
        maxRecommendedDuration: CAMERA_CONSTANTS.RECOMMENDED_DURATION,
        
        // Storage information
        availableStorage: null,
        totalStorage: null
      };

      // Get storage information
      try {
        const storageInfo = await FileSystem.getFreeDiskStorageAsync();
        const totalStorage = await FileSystem.getTotalDiskCapacityAsync();
        capabilities.availableStorage = storageInfo;
        capabilities.totalStorage = totalStorage;
        
        // Adjust recommendations based on storage
        if (storageInfo < 1024 * 1024 * 1024) { // Less than 1GB
          capabilities.recommendedQuality = CAMERA_CONSTANTS.VIDEO_QUALITY.BASIC;
          capabilities.maxRecommendedDuration = 15;
        } else if (storageInfo < 5 * 1024 * 1024 * 1024) { // Less than 5GB
          capabilities.recommendedQuality = CAMERA_CONSTANTS.VIDEO_QUALITY.BALANCED;
        } else {
          capabilities.recommendedQuality = CAMERA_CONSTANTS.VIDEO_QUALITY.POSE_ANALYSIS;
        }
      } catch (storageError) {
        console.warn('CameraService: Could not get storage info', storageError);
      }

      // Device-specific optimizations
      if (Platform.OS === 'ios') {
        // iOS specific capabilities
        if (Device.deviceType === Device.DeviceType.PHONE) {
          capabilities.supportedQualities = ['480p', '720p', '1080p'];
        } else {
          capabilities.supportedQualities = ['480p', '720p', '1080p', '4k'];
        }
      } else {
        // Android specific capabilities
        capabilities.supportedQualities = ['480p', '720p', '1080p'];
        
        // Adjust for older Android devices
        if (Device.osVersion && parseInt(Device.osVersion) < 8) {
          capabilities.recommendedQuality = CAMERA_CONSTANTS.VIDEO_QUALITY.BASIC;
          capabilities.maxRecommendedDuration = 20;
        }
      }

      deviceCapabilities = capabilities;
      return capabilities;
    } catch (error) {
      console.error('CameraService: Device capability detection failed', error);
      // Set fallback capabilities
      deviceCapabilities = {
        platform: Platform.OS,
        recommendedQuality: CAMERA_CONSTANTS.VIDEO_QUALITY.BASIC,
        maxRecommendedDuration: 15,
        supportedQualities: ['480p', '720p']
      };
      return deviceCapabilities;
    }
  }

  /**
   * Check all required permissions
   */
  async checkAllPermissions() {
    try {
      const permissions = {};
      
      // Camera permission
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      permissions.camera = {
        granted: cameraStatus.status === 'granted',
        canAskAgain: cameraStatus.canAskAgain,
        status: cameraStatus.status
      };
      
      // Microphone permission
      const microphoneStatus = await Camera.getMicrophonePermissionsAsync();
      permissions.microphone = {
        granted: microphoneStatus.status === 'granted',
        canAskAgain: microphoneStatus.canAskAgain,
        status: microphoneStatus.status
      };
      
      // Media library permission
      const mediaStatus = await MediaLibrary.getPermissionsAsync();
      permissions.mediaLibrary = {
        granted: mediaStatus.status === 'granted',
        canAskAgain: mediaStatus.canAskAgain,
        status: mediaStatus.status
      };
      
      // Image picker permission
      const galleryStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
      permissions.gallery = {
        granted: galleryStatus.status === 'granted',
        canAskAgain: galleryStatus.canAskAgain,
        status: galleryStatus.status
      };
      
      permissionStatus = permissions;
      return permissions;
    } catch (error) {
      console.error('CameraService: Permission check failed', error);
      throw error;
    }
  }

  /**
   * Request all required permissions
   */
  async requestAllPermissions() {
    try {
      console.log('CameraService: Requesting permissions...');
      
      const results = {};
      
      // Request camera permission
      const cameraResult = await Camera.requestCameraPermissionsAsync();
      results.camera = cameraResult.status === 'granted';
      
      // Request microphone permission
      const microphoneResult = await Camera.requestMicrophonePermissionsAsync();
      results.microphone = microphoneResult.status === 'granted';
      
      // Request media library permission
      const mediaResult = await MediaLibrary.requestPermissionsAsync();
      results.mediaLibrary = mediaResult.status === 'granted';
      
      // Request gallery permission
      const galleryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      results.gallery = galleryResult.status === 'granted';
      
      // Update permission status
      await this.checkAllPermissions();
      
      const allGranted = results.camera && results.microphone && results.mediaLibrary;
      
      console.log('CameraService: Permission request completed', {
        results,
        allGranted
      });
      
      return {
        success: allGranted,
        granted: results,
        canProceed: allGranted
      };
    } catch (error) {
      console.error('CameraService: Permission request failed', error);
      throw new Error(`Permission request failed: ${error.message}`);
    }
  }

  /**
   * Check if service has all required permissions
   */
  hasRequiredPermissions() {
    if (!permissionStatus) return false;
    
    return (
      permissionStatus.camera.granted && 
      permissionStatus.microphone.granted && 
      permissionStatus.mediaLibrary.granted
    );
  }

  /**
   * Get optimal video configuration for exercise type
   */
  getOptimalVideoConfig(exerciseType, userPreferences = {}) {
    try {
      const exercise = exerciseType?.toLowerCase() || 'default';
      const requirements = CAMERA_CONSTANTS.EXERCISE_REQUIREMENTS[exercise] || 
                          CAMERA_CONSTANTS.EXERCISE_REQUIREMENTS.default;
      
      // Get base quality config
      const qualityKey = userPreferences.quality || requirements.quality;
      const baseConfig = VIDEO_QUALITY_CONFIGS[qualityKey] || 
                        VIDEO_QUALITY_CONFIGS[CAMERA_CONSTANTS.VIDEO_QUALITY.BALANCED];
      
      // Apply device-specific optimizations
      let optimizedConfig = { ...baseConfig };
      
      if (deviceCapabilities) {
        // Adjust for device performance
        if (deviceCapabilities.recommendedQuality === CAMERA_CONSTANTS.VIDEO_QUALITY.BASIC) {
          optimizedConfig = VIDEO_QUALITY_CONFIGS[CAMERA_CONSTANTS.VIDEO_QUALITY.BASIC];
        }
        
        // Adjust for storage constraints
        if (deviceCapabilities.availableStorage && 
            deviceCapabilities.availableStorage < 500 * 1024 * 1024) { // Less than 500MB
          optimizedConfig = VIDEO_QUALITY_CONFIGS[CAMERA_CONSTANTS.VIDEO_QUALITY.BASIC];
        }
      }
      
      return {
        // Recording configuration
        recordingOptions: {
          quality: optimizedConfig.quality,
          maxDuration: userPreferences.maxDuration || requirements.minDuration * 3,
          mute: false,
        },
        
        // Exercise-specific settings
        exerciseSettings: {
          minDuration: requirements.minDuration,
          recommendedAngle: requirements.recommendedAngle,
          requiredFraming: requirements.requiredFraming,
          optimalDistance: requirements.optimalDistance
        },
        
        // Quality information
        qualityInfo: {
          ...optimizedConfig,
          name: qualityKey,
          optimizedFor: exercise
        },
        
        // Performance settings
        performance: {
          fps: optimizedConfig.fps,
          bitrate: optimizedConfig.bitrate,
          estimatedFileSize: this.estimateFileSize(optimizedConfig, requirements.minDuration * 2)
        }
      };
    } catch (error) {
      console.error('CameraService: Failed to get optimal config', error);
      // Return safe fallback
      return {
        recordingOptions: {
          quality: Camera.Constants.VideoQuality['720p'],
          maxDuration: 30,
          mute: false
        },
        exerciseSettings: CAMERA_CONSTANTS.EXERCISE_REQUIREMENTS.default,
        qualityInfo: VIDEO_QUALITY_CONFIGS[CAMERA_CONSTANTS.VIDEO_QUALITY.BALANCED],
        performance: {
          fps: 30,
          bitrate: 1500000,
          estimatedFileSize: 25 * 1024 * 1024 // 25MB estimate
        }
      };
    }
  }

  /**
   * Estimate file size for recording configuration
   */
  estimateFileSize(qualityConfig, durationSeconds) {
    try {
      // Base calculation: bitrate * duration
      const baseSizeBytes = (qualityConfig.bitrate * durationSeconds) / 8;
      
      // Add overhead for container format (approximately 10%)
      const withOverhead = baseSizeBytes * 1.1;
      
      // Add audio overhead (approximately 64kbps for audio)
      const audioSize = (64000 * durationSeconds) / 8;
      
      return Math.round(withOverhead + audioSize);
    } catch (error) {
      console.error('CameraService: File size estimation failed', error);
      return 20 * 1024 * 1024; // 20MB fallback
    }
  }

  /**
   * Validate video file for pose analysis
   */
  async validateVideoFile(videoUri, metadata = {}) {
    try {
      console.log('CameraService: Validating video file', { videoUri, metadata });
      
      const validation = {
        isValid: false,
        errors: [],
        warnings: [],
        recommendations: [],
        fileInfo: null
      };
      
      // Check if file exists and get info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        validation.errors.push('Video file does not exist');
        return validation;
      }
      
      validation.fileInfo = fileInfo;
      
      // Validate file size
      if (fileInfo.size > CAMERA_CONSTANTS.MAX_FILE_SIZE) {
        validation.errors.push(`File size (${Math.round(fileInfo.size / 1024 / 1024)}MB) exceeds maximum allowed (2GB)`);
      } else if (fileInfo.size > CAMERA_CONSTANTS.RECOMMENDED_FILE_SIZE) {
        validation.warnings.push(`File size (${Math.round(fileInfo.size / 1024 / 1024)}MB) is large, consider using lower quality for faster processing`);
      }
      
      // Validate file format
      const fileExtension = videoUri.split('.').pop()?.toLowerCase();
      if (!CAMERA_CONSTANTS.SUPPORTED_FORMATS.includes(fileExtension)) {
        validation.errors.push(`File format (${fileExtension}) not supported. Use MP4, MOV, or M4V`);
      }
      
      // Validate duration if available
      if (metadata.duration) {
        if (metadata.duration < CAMERA_CONSTANTS.MIN_DURATION) {
          validation.errors.push(`Video duration (${metadata.duration}s) is too short. Minimum ${CAMERA_CONSTANTS.MIN_DURATION}s required`);
        } else if (metadata.duration > CAMERA_CONSTANTS.MAX_DURATION) {
          validation.errors.push(`Video duration (${metadata.duration}s) is too long. Maximum ${CAMERA_CONSTANTS.MAX_DURATION}s allowed`);
        }
      }
      
      // Provide recommendations for optimal pose analysis
      if (metadata.exercise) {
        const requirements = CAMERA_CONSTANTS.EXERCISE_REQUIREMENTS[metadata.exercise.toLowerCase()] || 
                            CAMERA_CONSTANTS.EXERCISE_REQUIREMENTS.default;
        
        if (metadata.duration && metadata.duration < requirements.minDuration) {
          validation.warnings.push(`Video is shorter than recommended ${requirements.minDuration}s for ${metadata.exercise} analysis`);
        }
        
        validation.recommendations.push(`For best ${metadata.exercise} analysis: ${requirements.recommendedAngle} angle, ${requirements.optimalDistance} distance`);
      }
      
      validation.isValid = validation.errors.length === 0;
      
      console.log('CameraService: Video validation completed', validation);
      return validation;
      
    } catch (error) {
      console.error('CameraService: Video validation failed', error);
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        recommendations: [],
        fileInfo: null
      };
    }
  }

  /**
   * Upload video from device gallery with validation
   */
  async uploadFromGallery(options = {}) {
    try {
      console.log('CameraService: Starting gallery upload', options);
      
      const {
        exerciseType = null,
        maxDuration = CAMERA_CONSTANTS.RECOMMENDED_DURATION,
        allowEditing = true,
        quality = 1
      } = options;
      
      // Check permissions
      if (!permissionStatus?.gallery?.granted) {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== 'granted') {
          throw new Error('Gallery access permission required');
        }
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing,
        quality,
        duration: maxDuration * 1000, // Convert to milliseconds
        videoExportPreset: ImagePicker.VideoExportPreset.HighestQuality
      });
      
      if (result.canceled || !result.assets[0]) {
        return { success: false, cancelled: true };
      }
      
      const asset = result.assets[0];
      
      // Create metadata
      const metadata = {
        uri: asset.uri,
        duration: asset.duration ? Math.round(asset.duration / 1000) : null, // Convert to seconds
        fileSize: asset.fileSize || 0,
        width: asset.width,
        height: asset.height,
        exercise: exerciseType,
        source: 'gallery',
        timestamp: new Date().toISOString(),
        platform: Platform.OS
      };
      
      // Validate the uploaded video
      const validation = await this.validateVideoFile(asset.uri, metadata);
      
      console.log('CameraService: Gallery upload completed', {
        asset: metadata,
        validation: {
          isValid: validation.isValid,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length
        }
      });
      
      return {
        success: true,
        asset: metadata,
        validation,
        uri: asset.uri
      };
      
    } catch (error) {
      console.error('CameraService: Gallery upload failed', error);
      throw new Error(`Gallery upload failed: ${error.message}`);
    }
  }

  /**
   * Save video to media library
   */
  async saveVideoToLibrary(videoUri, albumName = 'Strength Design') {
    try {
      console.log('CameraService: Saving video to library', { videoUri, albumName });
      
      // Check permissions
      if (!permissionStatus?.mediaLibrary?.granted) {
        const permissionResult = await MediaLibrary.requestPermissionsAsync();
        if (permissionResult.status !== 'granted') {
          throw new Error('Media library access permission required');
        }
      }
      
      // Create asset
      const asset = await MediaLibrary.createAssetAsync(videoUri);
      
      // Try to create/get album
      try {
        const album = await MediaLibrary.getAlbumAsync(albumName);
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        }
      } catch (albumError) {
        console.warn('CameraService: Album creation failed, asset saved to main library', albumError);
      }
      
      console.log('CameraService: Video saved successfully', { assetId: asset.id });
      return { success: true, asset };
      
    } catch (error) {
      console.error('CameraService: Save to library failed', error);
      throw new Error(`Save to library failed: ${error.message}`);
    }
  }

  /**
   * Get device camera capabilities after permissions are granted
   */
  async getDetailedCameraCapabilities() {
    try {
      if (!this.hasRequiredPermissions()) {
        throw new Error('Camera permissions not granted');
      }
      
      // This would require camera instance access
      // For now, return based on device capabilities
      return {
        ...deviceCapabilities,
        availableVideoQualities: Object.keys(VIDEO_QUALITY_CONFIGS),
        recommendedConfiguration: this.getOptimalVideoConfig('default'),
        supportedFeatures: {
          flash: true,
          focusMode: true,
          whiteBalance: true,
          zoom: Platform.OS === 'ios', // iOS generally has better zoom support
          stabilization: true
        }
      };
    } catch (error) {
      console.error('CameraService: Failed to get detailed capabilities', error);
      throw error;
    }
  }

  /**
   * Start recording session tracking
   */
  startRecordingSession(sessionId, exerciseType, config) {
    const session = {
      id: sessionId,
      exerciseType,
      config,
      startTime: new Date(),
      status: 'recording'
    };
    
    this.activeRecordings.set(sessionId, session);
    this.analytics.recordingsStarted++;
    
    console.log('CameraService: Recording session started', session);
    return session;
  }

  /**
   * Complete recording session
   */
  completeRecordingSession(sessionId, result) {
    const session = this.activeRecordings.get(sessionId);
    if (session) {
      session.endTime = new Date();
      session.duration = (session.endTime - session.startTime) / 1000;
      session.result = result;
      session.status = 'completed';
      
      // Update analytics
      this.analytics.recordingsCompleted++;
      this.analytics.totalRecordingTime += session.duration;
      if (result.fileSize) {
        this.analytics.averageFileSize = (this.analytics.averageFileSize + result.fileSize) / this.analytics.recordingsCompleted;
      }
      
      console.log('CameraService: Recording session completed', session);
      this.activeRecordings.delete(sessionId);
      return session;
    }
    return null;
  }

  /**
   * Fail recording session
   */
  failRecordingSession(sessionId, error) {
    const session = this.activeRecordings.get(sessionId);
    if (session) {
      session.endTime = new Date();
      session.error = error;
      session.status = 'failed';
      
      this.analytics.recordingsFailed++;
      
      console.error('CameraService: Recording session failed', session);
      this.activeRecordings.delete(sessionId);
      return session;
    }
    return null;
  }

  /**
   * Get service analytics
   */
  getAnalytics() {
    return {
      ...this.analytics,
      activeRecordings: this.activeRecordings.size,
      successRate: this.analytics.recordingsStarted > 0 ? 
        (this.analytics.recordingsCompleted / this.analytics.recordingsStarted) * 100 : 0
    };
  }

  /**
   * Clear cached data and reset service
   */
  reset() {
    this.activeRecordings.clear();
    this.analytics = {
      recordingsStarted: 0,
      recordingsCompleted: 0,
      recordingsFailed: 0,
      totalRecordingTime: 0,
      averageFileSize: 0
    };
    this.isInitialized = false;
    deviceCapabilities = null;
    permissionStatus = null;
    
    console.log('CameraService: Service reset');
  }
}

// Create singleton instance
const cameraService = new CameraService();

// Utility functions for external use
export const CameraUtils = {
  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Format duration for display
   */
  formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Check if file size is acceptable
   */
  isFileSizeAcceptable(bytes) {
    return bytes <= CAMERA_CONSTANTS.MAX_FILE_SIZE;
  },

  /**
   * Get exercise requirements
   */
  getExerciseRequirements(exerciseType) {
    const key = exerciseType?.toLowerCase() || 'default';
    return CAMERA_CONSTANTS.EXERCISE_REQUIREMENTS[key] || 
           CAMERA_CONSTANTS.EXERCISE_REQUIREMENTS.default;
  },

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `camera_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get quality options for UI
   */
  getQualityOptions() {
    return Object.entries(VIDEO_QUALITY_CONFIGS).map(([key, config]) => ({
      value: key,
      label: config.description,
      fileSize: config.fileSize,
      useCase: config.useCase
    }));
  }
};

// Export service instance and constants
export default cameraService;
export { VIDEO_QUALITY_CONFIGS };