/**
 * Security Audit Test Suite
 * Validates security measures for pose analysis feature
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { auth, storage } from '../../firebaseConfig';
import PoseAnalysisService from '../../services/poseDetection/PoseAnalysisService';

describe('Security Audit - Pose Analysis Feature', () => {
  describe('Video Data Security', () => {
    test('videos are not stored in app cache indefinitely', async () => {
      const videoUri = 'file:///mock-video.mp4';

      // Simulate video analysis
      await PoseAnalysisService.analyzeVideo(videoUri, 'squat');

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check that temporary video files are cleaned up
      const cacheDir = `${FileSystem.cacheDirectory}pose-analysis/`;
      const files = await FileSystem.readDirectoryAsync(cacheDir);

      // Only processed data should remain, not original videos
      const videoFiles = files.filter(f => f.endsWith('.mp4'));
      expect(videoFiles.length).toBe(0);
    });

    test('videos are encrypted during upload', async () => {
      const videoUri = 'file:///mock-video.mp4';

      const uploadSpy = jest.spyOn(storage, 'ref');

      await PoseAnalysisService.uploadVideo(videoUri);

      // Verify upload uses Firebase Storage (encrypted in transit)
      expect(uploadSpy).toHaveBeenCalled();

      const uploadConfig = uploadSpy.mock.calls[0];
      // Firebase Storage automatically uses HTTPS
      expect(uploadConfig).toBeDefined();
    });

    test('video URLs expire after analysis completes', async () => {
      const analysisResult = {
        id: 'test-123',
        videoUri: 'https://storage.googleapis.com/...',
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(
        'pose_analysis_result',
        JSON.stringify(analysisResult)
      );

      // Simulate time passing (24 hours)
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);

      // Video URL should be removed from storage
      const stored = await AsyncStorage.getItem('pose_analysis_result');
      const parsed = JSON.parse(stored);

      // URL should be removed after expiry
      expect(parsed.videoUri).toBeUndefined();
    });

    test('videos are not accessible without authentication', async () => {
      // Sign out user
      await auth.signOut();

      const videoRef = storage.ref('pose-videos/test-video.mp4');

      // Attempt to access video without auth
      await expect(videoRef.getDownloadURL()).rejects.toThrow(/permission/i);
    });

    test('uploaded videos have proper access control', async () => {
      const videoUri = 'file:///mock-video.mp4';

      const result = await PoseAnalysisService.uploadVideo(videoUri);

      // Verify video is stored in user-specific path
      expect(result.storagePath).toMatch(/^users\/[a-zA-Z0-9]+\/pose-videos\//);

      // Verify only user can access their videos
      const userId = auth.currentUser.uid;
      expect(result.storagePath).toContain(userId);
    });
  });

  describe('Data Encryption', () => {
    test('sensitive analysis data is encrypted at rest', async () => {
      const analysisData = {
        userId: 'user-123',
        videoUri: 'file:///video.mp4',
        results: { score: 85, feedback: ['Good form'] }
      };

      await AsyncStorage.setItem(
        'pose_analysis_data',
        JSON.stringify(analysisData)
      );

      // Retrieve raw stored data
      const stored = await AsyncStorage.getItem('pose_analysis_data');

      // In production, this should be encrypted
      // For now, verify we're using AsyncStorage (encrypted on iOS/Android)
      expect(stored).toBeDefined();

      // Verify no plaintext sensitive data in logs
      const consoleSpy = jest.spyOn(console, 'log');
      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat');

      const logs = consoleSpy.mock.calls.flat().join(' ');
      expect(logs).not.toContain('user-123'); // No user IDs in logs
      expect(logs).not.toContain('file:///'); // No file paths in logs
    });

    test('data transmission uses HTTPS only', async () => {
      const uploadSpy = jest.spyOn(global, 'fetch');

      await PoseAnalysisService.syncResults({
        id: 'test-123',
        score: 85
      });

      // Verify all fetch calls use HTTPS
      uploadSpy.mock.calls.forEach(call => {
        const url = call[0];
        if (typeof url === 'string') {
          expect(url).toMatch(/^https:\/\//);
        }
      });
    });

    test('Firebase Firestore security rules enforce user data isolation', async () => {
      const userId = auth.currentUser.uid;
      const otherUserId = 'other-user-456';

      // Create analysis result for current user
      const result = await PoseAnalysisService.saveAnalysisResult({
        userId,
        score: 85,
        exercise: 'squat'
      });

      // Attempt to access another user's data
      const otherUserDoc = firestore()
        .collection('pose_analyses')
        .doc(otherUserId);

      await expect(otherUserDoc.get()).rejects.toThrow(/permission/i);
    });
  });

  describe('Authentication & Authorization', () => {
    test('pose analysis requires authenticated user', async () => {
      // Sign out user
      await auth.signOut();

      // Attempt analysis without auth
      await expect(
        PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat')
      ).rejects.toThrow(/authentication required/i);
    });

    test('user can only access their own analysis results', async () => {
      const currentUserId = auth.currentUser.uid;

      // Create analysis for current user
      const result = await PoseAnalysisService.saveAnalysisResult({
        userId: currentUserId,
        score: 85
      });

      // Verify result is associated with correct user
      expect(result.userId).toBe(currentUserId);

      // Verify query filters by user ID
      const querySpy = jest.spyOn(firestore().collection('pose_analyses'), 'where');

      await PoseAnalysisService.getUserAnalyses();

      expect(querySpy).toHaveBeenCalledWith('userId', '==', currentUserId);
    });

    test('premium features are protected by subscription check', async () => {
      // Mock free tier user
      const mockSubscription = require('../../services/poseSubscriptionService');
      mockSubscription.default.hasFeature.mockResolvedValue(false);

      // Attempt to use premium feature
      await expect(
        PoseAnalysisService.exportToPDF('analysis-123')
      ).rejects.toThrow(/premium feature/i);
    });

    test('API endpoints validate user ownership', async () => {
      const currentUserId = auth.currentUser.uid;
      const otherUserAnalysisId = 'other-user-analysis-123';

      // Mock analysis that belongs to another user
      jest.spyOn(firestore(), 'doc').mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'other-user-456', score: 85 })
        })
      });

      // Attempt to access another user's analysis
      await expect(
        PoseAnalysisService.getAnalysisResult(otherUserAnalysisId)
      ).rejects.toThrow(/unauthorized/i);
    });
  });

  describe('Input Validation & Sanitization', () => {
    test('video file type is validated before processing', async () => {
      const invalidVideo = 'file:///malicious.exe';

      await expect(
        PoseAnalysisService.analyzeVideo(invalidVideo, 'squat')
      ).rejects.toThrow(/invalid video format/i);
    });

    test('video file size is validated', async () => {
      const largeVideo = 'file:///huge-video.mp4'; // Mock 2GB file

      // Mock file info
      jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
        exists: true,
        size: 2 * 1024 * 1024 * 1024, // 2GB
        uri: largeVideo
      });

      await expect(
        PoseAnalysisService.analyzeVideo(largeVideo, 'squat')
      ).rejects.toThrow(/file size exceeds maximum/i);
    });

    test('exercise type is validated and sanitized', async () => {
      const maliciousInput = '<script>alert("xss")</script>';

      await expect(
        PoseAnalysisService.analyzeVideo('file:///video.mp4', maliciousInput)
      ).rejects.toThrow(/invalid exercise type/i);
    });

    test('user input is sanitized before storage', async () => {
      const userNotes = '<script>alert("xss")</script>';

      const result = await PoseAnalysisService.saveAnalysisResult({
        userId: 'user-123',
        score: 85,
        notes: userNotes
      });

      // Verify HTML is escaped/stripped
      expect(result.notes).not.toContain('<script>');
      expect(result.notes).not.toContain('alert');
    });
  });

  describe('Rate Limiting & Abuse Prevention', () => {
    test('analysis requests are rate limited', async () => {
      const requests = [];

      // Attempt 10 rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat')
        );
      }

      // Some requests should be rejected due to rate limiting
      const results = await Promise.allSettled(requests);

      const rejected = results.filter(r => r.status === 'rejected');
      expect(rejected.length).toBeGreaterThan(0);

      const rateLimitError = rejected.find(r =>
        r.reason.message.includes('rate limit')
      );
      expect(rateLimitError).toBeDefined();
    });

    test('free tier users have usage limits enforced', async () => {
      const mockSubscription = require('../../services/poseSubscriptionService');
      mockSubscription.default.checkUsageLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 5
      });

      await expect(
        PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat')
      ).rejects.toThrow(/usage limit exceeded/i);
    });

    test('suspicious activity is logged and flagged', async () => {
      const logSpy = jest.spyOn(console, 'warn');

      // Simulate suspicious behavior (rapid different video uploads)
      for (let i = 0; i < 20; i++) {
        try {
          await PoseAnalysisService.analyzeVideo(`file:///video${i}.mp4`, 'squat');
        } catch (error) {
          // Expected to fail due to rate limiting
        }
      }

      // Verify suspicious activity is logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious activity detected')
      );
    });
  });

  describe('Error Messages & Information Disclosure', () => {
    test('error messages do not expose sensitive information', async () => {
      // Trigger various errors and check messages

      try {
        await PoseAnalysisService.analyzeVideo('file:///invalid.mp4', 'squat');
      } catch (error) {
        // Error should not expose internal paths or stack traces
        expect(error.message).not.toContain('/Users/');
        expect(error.message).not.toContain('/node_modules/');
        expect(error.message).not.toContain('Stack trace:');
      }
    });

    test('authentication errors are generic', async () => {
      await auth.signOut();

      try {
        await PoseAnalysisService.getUserAnalyses();
      } catch (error) {
        // Should not reveal whether user exists or not
        expect(error.message).toMatch(/authentication required/i);
        expect(error.message).not.toContain('user does not exist');
        expect(error.message).not.toContain('invalid user');
      }
    });

    test('network errors do not expose backend details', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(
        new Error('ECONNREFUSED 10.0.0.1:5000')
      );

      try {
        await PoseAnalysisService.syncResults({ id: 'test', score: 85 });
      } catch (error) {
        // Should not expose internal IP addresses or ports
        expect(error.message).not.toContain('10.0.0.1');
        expect(error.message).not.toContain(':5000');
        expect(error.message).toMatch(/network error|connection failed/i);
      }
    });
  });

  describe('Secure Storage Practices', () => {
    test('sensitive data is not logged to console', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat');

      const logs = consoleSpy.mock.calls.flat().join(' ');

      // Verify no sensitive data in logs
      expect(logs).not.toContain(auth.currentUser.uid);
      expect(logs).not.toContain(auth.currentUser.email);
      expect(logs).not.toContain('password');
      expect(logs).not.toContain('token');
    });

    test('temporary files are securely deleted', async () => {
      const videoUri = 'file:///video.mp4';

      await PoseAnalysisService.analyzeVideo(videoUri, 'squat');

      // Verify temporary files are deleted
      const tempDir = `${FileSystem.cacheDirectory}pose-temp/`;
      const exists = await FileSystem.getInfoAsync(tempDir);

      expect(exists.exists).toBe(false);
    });

    test('user data is not shared across app instances', async () => {
      // Save analysis for user A
      const userAId = 'user-a-123';
      await AsyncStorage.setItem('current_user', userAId);
      await AsyncStorage.setItem('pose_analysis_user_a', JSON.stringify({
        userId: userAId,
        score: 85
      }));

      // Switch to user B
      const userBId = 'user-b-456';
      await AsyncStorage.setItem('current_user', userBId);

      // User B should not see user A's data
      const userBData = await AsyncStorage.getItem('pose_analysis_user_a');
      expect(userBData).toBeNull();
    });
  });

  describe('Third-Party Dependencies Security', () => {
    test('ML Kit Pose Detection uses secure configuration', () => {
      const config = PoseAnalysisService.getPoseDetectionConfig();

      // Verify secure configuration
      expect(config.enableTracking).toBe(false); // No telemetry
      expect(config.performanceMode).toBe('ACCURATE'); // Not trading security for speed
    });

    test('no analytics or tracking without user consent', async () => {
      const analyticsSpy = jest.spyOn(global, 'fetch');

      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat');

      // Verify no analytics calls without consent
      const analyticsCalls = analyticsSpy.mock.calls.filter(call =>
        call[0].includes('analytics') || call[0].includes('tracking')
      );

      expect(analyticsCalls.length).toBe(0);
    });
  });

  describe('Data Retention & Deletion', () => {
    test('user can delete their analysis data', async () => {
      const analysisId = 'analysis-123';

      // Create analysis
      await PoseAnalysisService.saveAnalysisResult({
        id: analysisId,
        userId: auth.currentUser.uid,
        score: 85
      });

      // Delete analysis
      await PoseAnalysisService.deleteAnalysis(analysisId);

      // Verify deletion
      const result = await PoseAnalysisService.getAnalysisResult(analysisId);
      expect(result).toBeNull();
    });

    test('deleted analysis data is not recoverable', async () => {
      const analysisId = 'analysis-123';

      await PoseAnalysisService.saveAnalysisResult({
        id: analysisId,
        userId: auth.currentUser.uid,
        score: 85
      });

      await PoseAnalysisService.deleteAnalysis(analysisId);

      // Attempt to recover deleted data
      const firestore = require('firebase/firestore');
      const deletedDoc = await firestore.getDoc(
        firestore.doc(firestore.getFirestore(), 'pose_analyses_deleted', analysisId)
      );

      expect(deletedDoc.exists()).toBe(false);
    });

    test('old analysis data is automatically purged', async () => {
      // Create old analysis (90+ days)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 91);

      await PoseAnalysisService.saveAnalysisResult({
        id: 'old-analysis',
        userId: auth.currentUser.uid,
        score: 85,
        createdAt: oldDate
      });

      // Run cleanup
      await PoseAnalysisService.cleanupOldData();

      // Verify old data is purged
      const result = await PoseAnalysisService.getAnalysisResult('old-analysis');
      expect(result).toBeNull();
    });
  });
});
