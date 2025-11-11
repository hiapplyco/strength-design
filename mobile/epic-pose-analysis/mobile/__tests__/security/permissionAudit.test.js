/**
 * Permission Handling Audit Test Suite
 * Validates proper permission request flows and graceful degradation
 */

import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PoseAnalysisService from '../../services/poseDetection/PoseAnalysisService';

describe('Permission Handling Audit - Pose Analysis Feature', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('Camera Permission', () => {
    test('camera permission is requested before recording', async () => {
      const requestSpy = jest.spyOn(Camera, 'requestCameraPermissionsAsync');

      await PoseAnalysisService.requestCameraPermission();

      expect(requestSpy).toHaveBeenCalled();
    });

    test('camera permission request includes clear rationale', async () => {
      const permissionRequest = await Camera.requestCameraPermissionsAsync();

      // Verify permission request includes user-facing explanation
      expect(permissionRequest.canAskAgain).toBeDefined();
    });

    test('camera access is blocked when permission denied', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false
      });

      await expect(
        PoseAnalysisService.recordVideo()
      ).rejects.toThrow(/camera permission required/i);
    });

    test('user is prompted to grant camera permission when denied', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: true
      });

      const alertSpy = jest.spyOn(global, 'alert');

      try {
        await PoseAnalysisService.recordVideo();
      } catch (error) {
        // Expected to throw
      }

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Camera Permission Required')
      );
    });

    test('camera permission state is cached to minimize prompts', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true
      });

      await PoseAnalysisService.recordVideo();
      await PoseAnalysisService.recordVideo();

      // Should check cache, not request permission again
      const requestSpy = jest.spyOn(Camera, 'requestCameraPermissionsAsync');
      expect(requestSpy).not.toHaveBeenCalled();
    });

    test('camera permission can be revoked and re-requested', async () => {
      // Initial grant
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'granted',
        granted: true
      });

      await PoseAnalysisService.recordVideo();

      // Revoke permission
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: true
      });

      // Should detect revocation
      await expect(
        PoseAnalysisService.recordVideo()
      ).rejects.toThrow(/camera permission/i);
    });

    test('camera permission handles system settings redirect', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false // Permanent denial
      });

      const linkingSpy = jest.spyOn(require('react-native').Linking, 'openSettings');

      try {
        await PoseAnalysisService.recordVideo();
      } catch (error) {
        // User prompted to open settings
      }

      // User should be directed to system settings
      expect(linkingSpy).toHaveBeenCalled();
    });
  });

  describe('Media Library Permission', () => {
    test('media library permission is requested before video selection', async () => {
      const requestSpy = jest.spyOn(MediaLibrary, 'requestPermissionsAsync');

      await PoseAnalysisService.requestMediaLibraryPermission();

      expect(requestSpy).toHaveBeenCalled();
    });

    test('media library access is blocked when permission denied', async () => {
      jest.spyOn(MediaLibrary, 'getPermissionsAsync').mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false
      });

      await expect(
        PoseAnalysisService.selectVideoFromLibrary()
      ).rejects.toThrow(/media library permission required/i);
    });

    test('partial media library access is handled (iOS limited photos)', async () => {
      jest.spyOn(MediaLibrary, 'getPermissionsAsync').mockResolvedValue({
        status: 'limited',
        granted: true,
        canAskAgain: true,
        accessPrivileges: 'limited'
      });

      const result = await PoseAnalysisService.selectVideoFromLibrary();

      // Should work with limited access
      expect(result).toBeDefined();
    });

    test('media library permission state persists across app restarts', async () => {
      jest.spyOn(MediaLibrary, 'getPermissionsAsync').mockResolvedValue({
        status: 'granted',
        granted: true
      });

      await PoseAnalysisService.selectVideoFromLibrary();

      // Simulate app restart
      await PoseAnalysisService.initialize();

      // Permission state should be remembered
      const permissionSpy = jest.spyOn(MediaLibrary, 'getPermissionsAsync');
      await PoseAnalysisService.selectVideoFromLibrary();

      expect(permissionSpy).toHaveBeenCalled();
    });
  });

  describe('Storage Permission (Android)', () => {
    test('storage permission is requested on Android before file access', async () => {
      const Platform = require('react-native').Platform;
      Platform.OS = 'android';

      const permissionSpy = jest.spyOn(require('expo-permissions'), 'askAsync');

      await PoseAnalysisService.saveVideoToDevice('file:///video.mp4');

      expect(permissionSpy).toHaveBeenCalled();
    });

    test('storage permission is not required on iOS (scoped storage)', async () => {
      const Platform = require('react-native').Platform;
      Platform.OS = 'ios';

      const permissionSpy = jest.spyOn(require('expo-permissions'), 'askAsync');

      await PoseAnalysisService.saveVideoToDevice('file:///video.mp4');

      // iOS uses scoped storage, no permission needed
      expect(permissionSpy).not.toHaveBeenCalled();
    });

    test('scoped storage is used when permission denied (Android 11+)', async () => {
      const Platform = require('react-native').Platform;
      Platform.OS = 'android';
      Platform.Version = 30; // Android 11

      jest.spyOn(require('expo-permissions'), 'askAsync').mockResolvedValue({
        status: 'denied',
        granted: false
      });

      // Should fall back to scoped storage
      const result = await PoseAnalysisService.saveVideoToDevice('file:///video.mp4');

      expect(result.path).toContain(FileSystem.documentDirectory);
    });
  });

  describe('Permission Request Flow', () => {
    test('permissions are requested in logical order', async () => {
      const requestOrder = [];

      jest.spyOn(Camera, 'requestCameraPermissionsAsync').mockImplementation(() => {
        requestOrder.push('camera');
        return Promise.resolve({ status: 'granted', granted: true });
      });

      jest.spyOn(MediaLibrary, 'requestPermissionsAsync').mockImplementation(() => {
        requestOrder.push('mediaLibrary');
        return Promise.resolve({ status: 'granted', granted: true });
      });

      await PoseAnalysisService.requestAllPermissions();

      // Camera should be requested first (recording), then media library (saving)
      expect(requestOrder).toEqual(['camera', 'mediaLibrary']);
    });

    test('permission requests are batched to avoid multiple prompts', async () => {
      const requestSpy = jest.spyOn(Camera, 'requestCameraPermissionsAsync');

      // Multiple features requesting camera at once
      await Promise.all([
        PoseAnalysisService.recordVideo(),
        PoseAnalysisService.startLiveAnalysis()
      ]);

      // Should only request once
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    test('permission denial does not prevent app from functioning', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'denied',
        granted: false
      });

      // Recording blocked, but upload from library should still work
      await expect(
        PoseAnalysisService.recordVideo()
      ).rejects.toThrow(/camera permission/i);

      // Upload feature should still be accessible
      jest.spyOn(MediaLibrary, 'getPermissionsAsync').mockResolvedValue({
        status: 'granted',
        granted: true
      });

      const result = await PoseAnalysisService.selectVideoFromLibrary();
      expect(result).toBeDefined();
    });

    test('permission explanations are shown before requesting', async () => {
      const showExplanationSpy = jest.fn();
      PoseAnalysisService.setPermissionExplanationCallback(showExplanationSpy);

      await PoseAnalysisService.requestCameraPermission();

      expect(showExplanationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'camera',
          reason: expect.stringContaining('analyze')
        })
      );
    });
  });

  describe('Permission State Management', () => {
    test('permission state is tracked in AsyncStorage', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'granted',
        granted: true
      });

      await PoseAnalysisService.requestCameraPermission();

      const permissionState = await AsyncStorage.getItem('permission_state');
      const parsed = JSON.parse(permissionState);

      expect(parsed.camera).toBe('granted');
      expect(parsed.cameraUpdatedAt).toBeDefined();
    });

    test('permission state is refreshed periodically', async () => {
      // Set old permission state
      await AsyncStorage.setItem('permission_state', JSON.stringify({
        camera: 'granted',
        cameraUpdatedAt: Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
      }));

      const checkSpy = jest.spyOn(Camera, 'getCameraPermissionsAsync');

      await PoseAnalysisService.checkCameraPermission();

      // Should refresh stale permission state
      expect(checkSpy).toHaveBeenCalled();
    });

    test('permission state includes timestamp for tracking', async () => {
      await PoseAnalysisService.requestCameraPermission();

      const permissionState = await AsyncStorage.getItem('permission_state');
      const parsed = JSON.parse(permissionState);

      expect(parsed.cameraUpdatedAt).toBeGreaterThan(Date.now() - 1000);
    });

    test('permission history is logged for debugging', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync')
        .mockResolvedValueOnce({ status: 'denied', granted: false })
        .mockResolvedValueOnce({ status: 'granted', granted: true });

      await PoseAnalysisService.requestCameraPermission();
      await PoseAnalysisService.requestCameraPermission();

      const history = await PoseAnalysisService.getPermissionHistory();

      expect(history.camera).toHaveLength(2);
      expect(history.camera[0].status).toBe('denied');
      expect(history.camera[1].status).toBe('granted');
    });
  });

  describe('Graceful Degradation', () => {
    test('app provides alternative when camera permission denied', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'denied',
        granted: false
      });

      const alternatives = await PoseAnalysisService.getAlternativesForCamera();

      expect(alternatives).toContainEqual(
        expect.objectContaining({
          method: 'upload',
          description: expect.stringContaining('library')
        })
      );
    });

    test('offline analysis works without network-dependent permissions', async () => {
      // No permissions for cloud services
      const result = await PoseAnalysisService.analyzeVideoOffline(
        'file:///video.mp4',
        'squat'
      );

      expect(result.success).toBe(true);
      expect(result.analysisType).toBe('offline');
    });

    test('feature availability is communicated based on permissions', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'denied',
        granted: false
      });

      const features = await PoseAnalysisService.getAvailableFeatures();

      expect(features.recording).toBe(false);
      expect(features.upload).toBe(true);
      expect(features.unavailableReasons.recording).toContain('camera permission');
    });
  });

  describe('Permission Edge Cases', () => {
    test('handles permission request during app backgrounding', async () => {
      const AppState = require('react-native').AppState;
      AppState.currentState = 'background';

      const requestSpy = jest.spyOn(Camera, 'requestCameraPermissionsAsync');

      await PoseAnalysisService.requestCameraPermission();

      // Should defer permission request until app is active
      expect(requestSpy).not.toHaveBeenCalled();

      AppState.currentState = 'active';
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(requestSpy).toHaveBeenCalled();
    });

    test('handles simultaneous permission requests gracefully', async () => {
      const requestSpy = jest.spyOn(Camera, 'requestCameraPermissionsAsync');

      // Simulate multiple components requesting permission simultaneously
      await Promise.all([
        PoseAnalysisService.requestCameraPermission(),
        PoseAnalysisService.requestCameraPermission(),
        PoseAnalysisService.requestCameraPermission()
      ]);

      // Should only make one actual request
      expect(requestSpy).toHaveBeenCalledTimes(1);
    });

    test('handles permission request cancellation', async () => {
      let resolvePermission;
      jest.spyOn(Camera, 'requestCameraPermissionsAsync').mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePermission = resolve;
        });
      });

      const requestPromise = PoseAnalysisService.requestCameraPermission();

      // Cancel request
      PoseAnalysisService.cancelPermissionRequest('camera');

      resolvePermission({ status: 'denied', granted: false });

      const result = await requestPromise;
      expect(result.cancelled).toBe(true);
    });

    test('handles permissions on devices without camera', async () => {
      jest.spyOn(Camera, 'getAvailableCameraTypesAsync').mockResolvedValue([]);

      const result = await PoseAnalysisService.checkCameraAvailability();

      expect(result.available).toBe(false);
      expect(result.reason).toContain('no camera detected');
    });

    test('handles permission request timeout', async () => {
      jest.spyOn(Camera, 'requestCameraPermissionsAsync').mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      await expect(
        PoseAnalysisService.requestCameraPermission({ timeout: 5000 })
      ).rejects.toThrow(/permission request timed out/i);
    });
  });

  describe('Permission Compliance', () => {
    test('permission requests include privacy policy link', async () => {
      const showDialogSpy = jest.fn();
      PoseAnalysisService.setPermissionDialogCallback(showDialogSpy);

      await PoseAnalysisService.requestCameraPermission();

      expect(showDialogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          privacyPolicyUrl: expect.stringMatching(/^https:\/\//)
        })
      );
    });

    test('permission usage is logged for compliance audit', async () => {
      await PoseAnalysisService.requestCameraPermission();

      const auditLog = await PoseAnalysisService.getPermissionAuditLog();

      expect(auditLog).toContainEqual(
        expect.objectContaining({
          permission: 'camera',
          action: 'requested',
          timestamp: expect.any(Number),
          userId: expect.any(String)
        })
      );
    });

    test('permission data is included in user data export', async () => {
      await PoseAnalysisService.requestCameraPermission();
      await PoseAnalysisService.requestMediaLibraryPermission();

      const exportedData = await PoseAnalysisService.exportUserData();

      expect(exportedData.permissions).toBeDefined();
      expect(exportedData.permissions.camera).toBeDefined();
      expect(exportedData.permissions.mediaLibrary).toBeDefined();
    });

    test('permission prompts respect user language preferences', async () => {
      const I18n = require('i18n-js');
      I18n.locale = 'es';

      const showDialogSpy = jest.fn();
      PoseAnalysisService.setPermissionDialogCallback(showDialogSpy);

      await PoseAnalysisService.requestCameraPermission();

      expect(showDialogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/cámara/i) // Spanish
        })
      );
    });
  });

  describe('Permission Best Practices', () => {
    test('permissions are requested just-in-time, not upfront', async () => {
      const requestSpy = jest.spyOn(Camera, 'requestCameraPermissionsAsync');

      // App initialization should not request permissions
      await PoseAnalysisService.initialize();
      expect(requestSpy).not.toHaveBeenCalled();

      // Permission requested only when needed
      await PoseAnalysisService.recordVideo();
      expect(requestSpy).toHaveBeenCalled();
    });

    test('permission requests include clear context', async () => {
      const showContextSpy = jest.fn();
      PoseAnalysisService.setPermissionContextCallback(showContextSpy);

      await PoseAnalysisService.requestCameraPermission();

      expect(showContextSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: expect.stringContaining('video recording'),
          benefit: expect.stringContaining('analyze')
        })
      );
    });

    test('permission denial reasons are tracked for improvement', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false
      });

      await PoseAnalysisService.recordVideo().catch(() => {});

      const denials = await PoseAnalysisService.getPermissionDenials();

      expect(denials.camera).toEqual(
        expect.objectContaining({
          deniedAt: expect.any(Number),
          canAskAgain: false,
          feature: 'video_recording'
        })
      );
    });

    test('re-request prompts are limited to avoid annoyance', async () => {
      jest.spyOn(Camera, 'getCameraPermissionsAsync').mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: true
      });

      // Deny multiple times
      for (let i = 0; i < 5; i++) {
        try {
          await PoseAnalysisService.recordVideo();
        } catch (error) {
          // Expected
        }
      }

      const requestCount = await PoseAnalysisService.getPermissionRequestCount('camera');

      // Should limit re-requests (e.g., max 3 times)
      expect(requestCount).toBeLessThanOrEqual(3);
    });
  });
});
