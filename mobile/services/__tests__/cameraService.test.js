/**
 * CameraService Tests
 * Comprehensive tests for pose analysis camera service
 */

import cameraService, { CAMERA_CONSTANTS, CameraUtils } from '../cameraService';
import { Platform } from 'react-native';

// Mock expo modules
jest.mock('expo-camera', () => ({
  Camera: {
    getCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getMicrophonePermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    requestMicrophonePermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Constants: {
      VideoQuality: {
        '480p': '480p',
        '720p': '720p', 
        '1080p': '1080p'
      }
    }
  },
  CameraType: {
    back: 'back',
    front: 'front'
  }
}));

jest.mock('expo-media-library', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  createAssetAsync: jest.fn(() => Promise.resolve({ id: 'test-asset-id' })),
  getAlbumAsync: jest.fn(() => Promise.resolve({ id: 'test-album-id' })),
  addAssetsToAlbumAsync: jest.fn(() => Promise.resolve())
}));

jest.mock('expo-image-picker', () => ({
  getMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Videos: 'Videos'
  },
  VideoExportPreset: {
    HighestQuality: 'HighestQuality'
  }
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1024 * 1024 })),
  getFreeDiskStorageAsync: jest.fn(() => Promise.resolve(5 * 1024 * 1024 * 1024)),
  getTotalDiskCapacityAsync: jest.fn(() => Promise.resolve(64 * 1024 * 1024 * 1024))
}));

jest.mock('expo-device', () => ({
  deviceType: 1,
  deviceName: 'Test Device',
  osVersion: '14.0'
}));

describe('CameraService', () => {
  beforeEach(() => {
    cameraService.reset();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize successfully with permissions', async () => {
      const result = await cameraService.initialize();
      
      expect(result.success).toBe(true);
      expect(result.capabilities).toBeDefined();
      expect(cameraService.isInitialized).toBe(true);
    });

    test('should detect device capabilities', async () => {
      await cameraService.initialize();
      
      const capabilities = await cameraService.getDetailedCameraCapabilities();
      
      expect(capabilities.platform).toBe(Platform.OS);
      expect(capabilities.availableVideoQualities).toContain('pose_analysis');
      expect(capabilities.recommendedConfiguration).toBeDefined();
    });
  });

  describe('Permission Management', () => {
    test('should check all required permissions', async () => {
      const permissions = await cameraService.checkAllPermissions();
      
      expect(permissions.camera).toBeDefined();
      expect(permissions.microphone).toBeDefined();
      expect(permissions.mediaLibrary).toBeDefined();
      expect(permissions.gallery).toBeDefined();
    });

    test('should request all permissions', async () => {
      const result = await cameraService.requestAllPermissions();
      
      expect(result.success).toBe(true);
      expect(result.canProceed).toBe(true);
    });

    test('should validate required permissions', async () => {
      await cameraService.initialize();
      expect(cameraService.hasRequiredPermissions()).toBe(true);
    });
  });

  describe('Video Configuration', () => {
    beforeEach(async () => {
      await cameraService.initialize();
    });

    test('should get optimal config for squat exercise', () => {
      const config = cameraService.getOptimalVideoConfig('squat');
      
      expect(config.exerciseSettings.minDuration).toBe(10);
      expect(config.exerciseSettings.recommendedAngle).toBe('side');
      expect(config.exerciseSettings.requiredFraming).toBe('full_body');
      expect(config.recordingOptions.quality).toBeDefined();
    });

    test('should get optimal config for deadlift exercise', () => {
      const config = cameraService.getOptimalVideoConfig('deadlift');
      
      expect(config.exerciseSettings.minDuration).toBe(8);
      expect(config.exerciseSettings.recommendedAngle).toBe('side');
      expect(config.exerciseSettings.optimalDistance).toBe('6-8 feet');
    });

    test('should return default config for unknown exercise', () => {
      const config = cameraService.getOptimalVideoConfig('unknown_exercise');
      
      expect(config.exerciseSettings).toEqual(
        CAMERA_CONSTANTS.EXERCISE_REQUIREMENTS.default
      );
    });

    test('should apply user preferences to config', () => {
      const config = cameraService.getOptimalVideoConfig('squat', {
        quality: 'high_quality',
        maxDuration: 60
      });
      
      expect(config.recordingOptions.maxDuration).toBe(60);
      expect(config.qualityInfo.name).toBe('high_quality');
    });
  });

  describe('File Validation', () => {
    beforeEach(async () => {
      await cameraService.initialize();
    });

    test('should validate valid video file', async () => {
      const videoUri = 'file://test.mp4';
      const metadata = {
        duration: 15,
        exercise: 'squat',
        fileSize: 10 * 1024 * 1024 // 10MB
      };

      const validation = await cameraService.validateVideoFile(videoUri, metadata);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject oversized video file', async () => {
      const FileSystem = require('expo-file-system');
      FileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        size: 3 * 1024 * 1024 * 1024 // 3GB
      });

      const videoUri = 'file://large.mp4';
      const validation = await cameraService.validateVideoFile(videoUri);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        expect.stringContaining('exceeds maximum allowed')
      );
    });

    test('should reject unsupported format', async () => {
      const videoUri = 'file://test.avi';
      const validation = await cameraService.validateVideoFile(videoUri);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        expect.stringContaining('format (avi) not supported')
      );
    });

    test('should warn about short duration', async () => {
      const videoUri = 'file://short.mp4';
      const metadata = {
        duration: 2,
        exercise: 'squat'
      };

      const validation = await cameraService.validateVideoFile(videoUri, metadata);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        expect.stringContaining('duration (2s) is too short')
      );
    });
  });

  describe('Gallery Upload', () => {
    beforeEach(async () => {
      await cameraService.initialize();
    });

    test('should upload video from gallery successfully', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{
          uri: 'file://gallery.mp4',
          duration: 15000, // 15 seconds in milliseconds
          fileSize: 25 * 1024 * 1024, // 25MB
          width: 1280,
          height: 720
        }]
      });

      const result = await cameraService.uploadFromGallery({
        exerciseType: 'squat',
        maxDuration: 30
      });
      
      expect(result.success).toBe(true);
      expect(result.asset.exercise).toBe('squat');
      expect(result.asset.source).toBe('gallery');
      expect(result.validation).toBeDefined();
    });

    test('should handle gallery upload cancellation', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: true
      });

      const result = await cameraService.uploadFromGallery();
      
      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
    });
  });

  describe('Recording Sessions', () => {
    beforeEach(async () => {
      await cameraService.initialize();
    });

    test('should start and complete recording session', () => {
      const sessionId = 'test-session-123';
      const exerciseType = 'squat';
      const config = { quality: 'pose_analysis' };

      // Start session
      const session = cameraService.startRecordingSession(sessionId, exerciseType, config);
      
      expect(session.id).toBe(sessionId);
      expect(session.exerciseType).toBe(exerciseType);
      expect(session.status).toBe('recording');
      
      // Complete session
      const result = { fileSize: 10 * 1024 * 1024, duration: 15 };
      const completedSession = cameraService.completeRecordingSession(sessionId, result);
      
      expect(completedSession.status).toBe('completed');
      expect(completedSession.result).toEqual(result);
      
      // Check analytics
      const analytics = cameraService.getAnalytics();
      expect(analytics.recordingsStarted).toBe(1);
      expect(analytics.recordingsCompleted).toBe(1);
    });

    test('should handle recording session failure', () => {
      const sessionId = 'test-session-456';
      const error = new Error('Recording failed');

      cameraService.startRecordingSession(sessionId, 'deadlift', {});
      const failedSession = cameraService.failRecordingSession(sessionId, error);
      
      expect(failedSession.status).toBe('failed');
      expect(failedSession.error).toBe(error);
      
      const analytics = cameraService.getAnalytics();
      expect(analytics.recordingsFailed).toBe(1);
    });
  });

  describe('Utility Functions', () => {
    test('should format file size correctly', () => {
      expect(CameraUtils.formatFileSize(1024)).toBe('1 KB');
      expect(CameraUtils.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(CameraUtils.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(CameraUtils.formatFileSize(0)).toBe('0 B');
    });

    test('should format duration correctly', () => {
      expect(CameraUtils.formatDuration(30)).toBe('0:30');
      expect(CameraUtils.formatDuration(65)).toBe('1:05');
      expect(CameraUtils.formatDuration(125)).toBe('2:05');
      expect(CameraUtils.formatDuration(0)).toBe('0:00');
    });

    test('should check file size acceptability', () => {
      expect(CameraUtils.isFileSizeAcceptable(100 * 1024 * 1024)).toBe(true); // 100MB
      expect(CameraUtils.isFileSizeAcceptable(3 * 1024 * 1024 * 1024)).toBe(false); // 3GB
    });

    test('should get exercise requirements', () => {
      const squatReqs = CameraUtils.getExerciseRequirements('squat');
      expect(squatReqs.minDuration).toBe(10);
      expect(squatReqs.recommendedAngle).toBe('side');
      
      const defaultReqs = CameraUtils.getExerciseRequirements('unknown');
      expect(defaultReqs).toEqual(CAMERA_CONSTANTS.EXERCISE_REQUIREMENTS.default);
    });

    test('should generate unique session IDs', () => {
      const id1 = CameraUtils.generateSessionId();
      const id2 = CameraUtils.generateSessionId();
      
      expect(id1).toMatch(/^camera_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^camera_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    test('should get quality options for UI', () => {
      const options = CameraUtils.getQualityOptions();
      
      expect(options).toHaveLength(5);
      expect(options[0]).toHaveProperty('value');
      expect(options[0]).toHaveProperty('label');
      expect(options[0]).toHaveProperty('fileSize');
      expect(options[0]).toHaveProperty('useCase');
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async () => {
      const Camera = require('expo-camera').Camera;
      Camera.getCameraPermissionsAsync.mockRejectedValueOnce(new Error('Permission error'));

      await expect(cameraService.initialize()).rejects.toThrow('Camera service initialization failed');
    });

    test('should provide fallback configuration on error', () => {
      // Simulate error by calling before initialization
      const config = cameraService.getOptimalVideoConfig('squat');
      
      expect(config.recordingOptions).toBeDefined();
      expect(config.exerciseSettings).toBeDefined();
      expect(config.qualityInfo).toBeDefined();
    });
  });

  describe('Analytics', () => {
    test('should track analytics correctly', () => {
      cameraService.startRecordingSession('session1', 'squat', {});
      cameraService.startRecordingSession('session2', 'deadlift', {});
      
      cameraService.completeRecordingSession('session1', { fileSize: 1000000, duration: 15 });
      cameraService.failRecordingSession('session2', new Error('Failed'));
      
      const analytics = cameraService.getAnalytics();
      
      expect(analytics.recordingsStarted).toBe(2);
      expect(analytics.recordingsCompleted).toBe(1);
      expect(analytics.recordingsFailed).toBe(1);
      expect(analytics.successRate).toBe(50);
      expect(analytics.totalRecordingTime).toBeGreaterThan(0);
    });
  });
});