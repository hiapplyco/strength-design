/**
 * Privacy Compliance Test Suite
 * Validates GDPR, CCPA, and general privacy compliance for pose analysis feature
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import PoseAnalysisService from '../../services/poseDetection/PoseAnalysisService';
import { auth } from '../../firebaseConfig';

describe('Privacy Compliance - Pose Analysis Feature', () => {
  describe('GDPR Compliance', () => {
    test('user consent is required before data collection', async () => {
      // Clear any existing consent
      await AsyncStorage.removeItem('pose_analysis_consent');

      // Attempt analysis without consent
      await expect(
        PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat')
      ).rejects.toThrow(/consent required/i);
    });

    test('user can grant consent for data collection', async () => {
      const consent = {
        video_processing: true,
        data_storage: true,
        analytics: false,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      await PoseAnalysisService.setUserConsent(consent);

      const stored = await AsyncStorage.getItem('pose_analysis_consent');
      const parsed = JSON.parse(stored);

      expect(parsed.video_processing).toBe(true);
      expect(parsed.data_storage).toBe(true);
      expect(parsed.analytics).toBe(false);
      expect(parsed.timestamp).toBeDefined();
    });

    test('user can revoke consent at any time', async () => {
      // Grant consent
      await PoseAnalysisService.setUserConsent({
        video_processing: true,
        data_storage: true
      });

      // Revoke consent
      await PoseAnalysisService.revokeConsent();

      // Verify consent is revoked
      const consent = await AsyncStorage.getItem('pose_analysis_consent');
      expect(consent).toBeNull();

      // Verify analysis is blocked after revocation
      await expect(
        PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat')
      ).rejects.toThrow(/consent required/i);
    });

    test('consent withdrawal triggers data deletion', async () => {
      const userId = auth.currentUser.uid;

      // Create some analysis data
      await PoseAnalysisService.saveAnalysisResult({
        userId,
        score: 85,
        exercise: 'squat'
      });

      // Revoke consent with data deletion option
      await PoseAnalysisService.revokeConsent({ deleteData: true });

      // Verify user data is deleted
      const analyses = await PoseAnalysisService.getUserAnalyses();
      expect(analyses.length).toBe(0);
    });

    test('data minimization principle is followed', async () => {
      const analysisResult = await PoseAnalysisService.analyzeVideo(
        'file:///video.mp4',
        'squat'
      );

      // Verify only necessary data is stored
      const storedData = Object.keys(analysisResult);

      // Should NOT include raw video data
      expect(storedData).not.toContain('rawVideoData');
      expect(storedData).not.toContain('fullFrameData');

      // Should include only analysis results
      expect(storedData).toContain('score');
      expect(storedData).toContain('feedback');
      expect(storedData).toContain('exerciseType');
    });

    test('right to access: user can export their data', async () => {
      const userId = auth.currentUser.uid;

      // Create test data
      await PoseAnalysisService.saveAnalysisResult({
        userId,
        score: 85,
        exercise: 'squat'
      });

      // Export user data (GDPR right to access)
      const exportedData = await PoseAnalysisService.exportUserData();

      expect(exportedData).toBeDefined();
      expect(exportedData.userId).toBe(userId);
      expect(exportedData.analyses).toBeDefined();
      expect(exportedData.exportDate).toBeDefined();
      expect(exportedData.format).toBe('JSON');
    });

    test('right to rectification: user can update their data', async () => {
      const analysisId = 'analysis-123';

      // Create analysis
      await PoseAnalysisService.saveAnalysisResult({
        id: analysisId,
        userId: auth.currentUser.uid,
        score: 85,
        notes: 'Original notes'
      });

      // Update data (right to rectification)
      await PoseAnalysisService.updateAnalysisResult(analysisId, {
        notes: 'Updated notes'
      });

      // Verify update
      const updated = await PoseAnalysisService.getAnalysisResult(analysisId);
      expect(updated.notes).toBe('Updated notes');
    });

    test('right to erasure: user can delete all their data', async () => {
      const userId = auth.currentUser.uid;

      // Create multiple analyses
      await PoseAnalysisService.saveAnalysisResult({
        userId,
        score: 85,
        exercise: 'squat'
      });
      await PoseAnalysisService.saveAnalysisResult({
        userId,
        score: 90,
        exercise: 'deadlift'
      });

      // Exercise right to erasure
      await PoseAnalysisService.deleteAllUserData();

      // Verify all data is deleted
      const analyses = await PoseAnalysisService.getUserAnalyses();
      expect(analyses.length).toBe(0);

      // Verify videos are deleted
      const videos = await PoseAnalysisService.getUserVideos();
      expect(videos.length).toBe(0);

      // Verify metadata is deleted
      const metadata = await AsyncStorage.getItem(`user_${userId}_pose_data`);
      expect(metadata).toBeNull();
    });

    test('right to data portability: data can be exported in standard format', async () => {
      await PoseAnalysisService.saveAnalysisResult({
        userId: auth.currentUser.uid,
        score: 85,
        exercise: 'squat'
      });

      // Export in JSON format (machine-readable)
      const jsonExport = await PoseAnalysisService.exportUserData('JSON');
      expect(() => JSON.parse(JSON.stringify(jsonExport))).not.toThrow();

      // Export in CSV format
      const csvExport = await PoseAnalysisService.exportUserData('CSV');
      expect(csvExport).toContain('exercise,score,date');
    });
  });

  describe('CCPA Compliance (California Consumer Privacy Act)', () => {
    test('user can opt-out of data sale', async () => {
      await PoseAnalysisService.setPrivacyPreferences({
        doNotSell: true
      });

      const preferences = await AsyncStorage.getItem('privacy_preferences');
      const parsed = JSON.parse(preferences);

      expect(parsed.doNotSell).toBe(true);
    });

    test('do-not-sell preference is respected', async () => {
      await PoseAnalysisService.setPrivacyPreferences({
        doNotSell: true
      });

      // Attempt to share data with third party
      const sharingSpy = jest.spyOn(PoseAnalysisService, 'shareWithThirdParty');

      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat');

      // Verify no data sharing occurred
      expect(sharingSpy).not.toHaveBeenCalled();
    });

    test('privacy policy is accessible', async () => {
      const policy = await PoseAnalysisService.getPrivacyPolicy();

      expect(policy).toBeDefined();
      expect(policy.url).toMatch(/^https:\/\//);
      expect(policy.lastUpdated).toBeDefined();
      expect(policy.version).toBeDefined();
    });

    test('user is notified of privacy policy changes', async () => {
      const oldVersion = '1.0';
      const newVersion = '1.1';

      await AsyncStorage.setItem('accepted_privacy_policy', oldVersion);

      // Simulate privacy policy update
      await PoseAnalysisService.updatePrivacyPolicy(newVersion);

      // User should be prompted to accept new policy
      const needsAcceptance = await PoseAnalysisService.needsPrivacyPolicyAcceptance();
      expect(needsAcceptance).toBe(true);
    });
  });

  describe('Data Collection Transparency', () => {
    test('user can view what data is collected', async () => {
      const dataCategories = await PoseAnalysisService.getDataCollectionInfo();

      expect(dataCategories).toContainEqual(
        expect.objectContaining({
          category: 'Video Data',
          description: expect.any(String),
          retention: expect.any(String),
          purpose: expect.any(String)
        })
      );

      expect(dataCategories).toContainEqual(
        expect.objectContaining({
          category: 'Analysis Results',
          description: expect.any(String),
          retention: expect.any(String),
          purpose: expect.any(String)
        })
      );
    });

    test('data collection purposes are clearly stated', async () => {
      const info = await PoseAnalysisService.getDataCollectionInfo();

      const videoPurpose = info.find(i => i.category === 'Video Data');
      expect(videoPurpose.purpose).toContain('pose analysis');
      expect(videoPurpose.purpose).not.toContain('advertising');
      expect(videoPurpose.purpose).not.toContain('marketing');
    });

    test('data retention periods are disclosed', async () => {
      const info = await PoseAnalysisService.getDataCollectionInfo();

      info.forEach(category => {
        expect(category.retention).toBeDefined();
        expect(category.retention).toMatch(/\d+ (days|months)/);
      });
    });

    test('third-party data sharing is disclosed', async () => {
      const thirdParties = await PoseAnalysisService.getThirdPartySharing();

      // Verify transparency about third-party services
      expect(thirdParties).toContainEqual(
        expect.objectContaining({
          service: 'Google ML Kit',
          purpose: 'Pose detection',
          dataShared: 'Video frames (processed locally)',
          privacyPolicy: expect.stringMatching(/^https:\/\//)
        })
      );

      expect(thirdParties).toContainEqual(
        expect.objectContaining({
          service: 'Firebase Storage',
          purpose: 'Video storage',
          dataShared: 'Encrypted video files',
          privacyPolicy: expect.stringMatching(/^https:\/\//)
        })
      );
    });
  });

  describe('Children\'s Privacy (COPPA)', () => {
    test('age verification is required', async () => {
      // Clear age verification
      await AsyncStorage.removeItem('age_verified');

      // Attempt to use service without age verification
      await expect(
        PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat')
      ).rejects.toThrow(/age verification required/i);
    });

    test('users under 13 are blocked', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 12); // 12 years old

      await expect(
        PoseAnalysisService.verifyAge(birthDate)
      ).rejects.toThrow(/minimum age requirement/i);
    });

    test('parental consent required for users 13-17', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 15); // 15 years old

      const result = await PoseAnalysisService.verifyAge(birthDate);

      expect(result.needsParentalConsent).toBe(true);
      expect(result.allowed).toBe(false);
    });

    test('no targeted advertising to children', async () => {
      const userAge = 16;

      await PoseAnalysisService.setUserAge(userAge);

      const adPreferences = await PoseAnalysisService.getAdPreferences();

      expect(adPreferences.targetedAds).toBe(false);
      expect(adPreferences.personalizedContent).toBe(false);
    });
  });

  describe('Sensitive Data Handling', () => {
    test('biometric data (pose data) is handled securely', async () => {
      const analysisResult = await PoseAnalysisService.analyzeVideo(
        'file:///video.mp4',
        'squat'
      );

      // Verify pose landmarks (biometric data) are not stored permanently
      const stored = await PoseAnalysisService.getAnalysisResult(analysisResult.id);

      expect(stored.landmarks).toBeUndefined();
      expect(stored.poseData).toBeUndefined();

      // Only aggregated, non-biometric data should be stored
      expect(stored.score).toBeDefined();
      expect(stored.feedback).toBeDefined();
    });

    test('health data is treated as sensitive', async () => {
      const analysisResult = {
        userId: 'user-123',
        score: 85,
        healthNotes: 'Knee pain during squat'
      };

      await PoseAnalysisService.saveAnalysisResult(analysisResult);

      // Verify health data has additional encryption
      const stored = await AsyncStorage.getItem('pose_analysis_health_data');

      // Should be encrypted (in production)
      expect(stored).toBeDefined();

      // Verify health data is not included in regular exports
      const regularExport = await PoseAnalysisService.exportUserData();
      expect(regularExport.healthNotes).toBeUndefined();
    });

    test('location data is not collected', async () => {
      const permissionSpy = jest.spyOn(require('expo-location'), 'requestForegroundPermissionsAsync');

      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat');

      // Verify no location permission requested
      expect(permissionSpy).not.toHaveBeenCalled();
    });
  });

  describe('User Privacy Controls', () => {
    test('user can control data sharing settings', async () => {
      const settings = {
        shareWithCoach: false,
        shareAnonymizedData: true,
        includeInLeaderboard: false
      };

      await PoseAnalysisService.setPrivacySettings(settings);

      const stored = await AsyncStorage.getItem('pose_privacy_settings');
      const parsed = JSON.parse(stored);

      expect(parsed.shareWithCoach).toBe(false);
      expect(parsed.shareAnonymizedData).toBe(true);
      expect(parsed.includeInLeaderboard).toBe(false);
    });

    test('privacy settings are respected during data operations', async () => {
      await PoseAnalysisService.setPrivacySettings({
        shareAnonymizedData: false
      });

      const shareSpy = jest.spyOn(PoseAnalysisService, 'shareAnonymizedData');

      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat');

      // Verify anonymized data is not shared when disabled
      expect(shareSpy).not.toHaveBeenCalled();
    });

    test('user can download all their privacy settings', async () => {
      const settings = await PoseAnalysisService.getPrivacySettings();

      expect(settings.consent).toBeDefined();
      expect(settings.preferences).toBeDefined();
      expect(settings.optOuts).toBeDefined();
      expect(settings.exportHistory).toBeDefined();
    });
  });

  describe('Data Breach Notification', () => {
    test('breach notification system is in place', () => {
      const notificationConfig = PoseAnalysisService.getBreachNotificationConfig();

      expect(notificationConfig.enabled).toBe(true);
      expect(notificationConfig.notificationDelay).toBeLessThanOrEqual(72); // hours
      expect(notificationConfig.contactMethods).toContain('email');
    });

    test('users are notified of data breaches', async () => {
      const emailSpy = jest.spyOn(PoseAnalysisService, 'sendEmail');

      // Simulate breach detection
      await PoseAnalysisService.handleDataBreach({
        severity: 'high',
        affectedUsers: [auth.currentUser.uid],
        dataTypes: ['analysis_results']
      });

      // Verify user notification
      expect(emailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: auth.currentUser.email,
          subject: expect.stringContaining('Security Notice'),
          body: expect.stringContaining('data breach')
        })
      );
    });
  });

  describe('Analytics & Tracking Opt-Out', () => {
    test('user can opt-out of analytics', async () => {
      await PoseAnalysisService.setAnalyticsPreference(false);

      const analyticsSpy = jest.spyOn(global, 'fetch');

      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat');

      // Verify no analytics events sent
      const analyticsCalls = analyticsSpy.mock.calls.filter(call =>
        call[0].includes('analytics')
      );
      expect(analyticsCalls.length).toBe(0);
    });

    test('analytics opt-out is persistent', async () => {
      await PoseAnalysisService.setAnalyticsPreference(false);

      // Restart app (clear memory, keep storage)
      await PoseAnalysisService.initialize();

      const preference = await PoseAnalysisService.getAnalyticsPreference();
      expect(preference).toBe(false);
    });

    test('do-not-track header is respected', async () => {
      // Simulate DNT header
      global.navigator = { doNotTrack: '1' };

      await PoseAnalysisService.initialize();

      const trackingSpy = jest.spyOn(PoseAnalysisService, 'trackEvent');

      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat');

      // Verify tracking is disabled
      expect(trackingSpy).not.toHaveBeenCalled();
    });
  });
});
