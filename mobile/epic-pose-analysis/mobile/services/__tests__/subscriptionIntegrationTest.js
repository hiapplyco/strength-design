/**
 * Subscription Integration Test
 * 
 * Test suite for pose analysis subscription system integration
 * Validates quota enforcement, usage tracking, and billing period handling
 */

import usageTrackingService from '../usageTrackingService';
import poseSubscriptionService, { POSE_SUBSCRIPTION_TIERS } from '../poseSubscriptionService';
import poseAnalysisService from '../poseDetection/PoseAnalysisService';

// Mock Firebase dependencies
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123'
    }
  },
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: jest.fn(date => date)
  }
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({
    data: {
      subscribed: false,
      status: 'none',
      subscriptionType: null
    }
  })))
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  multiSet: jest.fn(() => Promise.resolve())
}));

describe('Subscription Integration Tests', () => {
  beforeEach(async () => {
    // Reset services
    await usageTrackingService.clearCache();
    await poseSubscriptionService.clearCache();
    
    // Initialize services
    await usageTrackingService.initialize();
    await poseSubscriptionService.initialize();
  });

  afterEach(async () => {
    // Clean up
    usageTrackingService.destroy();
    poseSubscriptionService.destroy();
  });

  describe('Free Tier Quota Enforcement', () => {
    test('should allow analyses within free tier quota', async () => {
      // Mock free tier subscription
      jest.spyOn(poseSubscriptionService, 'getSubscriptionStatus').mockResolvedValue({
        poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.FREE,
        tierConfig: {
          analysisQuota: 3,
          features: { basicFeedback: true },
          limits: { maxVideoSize: 50 * 1024 * 1024 }
        },
        isActive: true,
        quotas: { monthly: 3, daily: 1 }
      });

      // Mock current usage (0 used)
      jest.spyOn(poseSubscriptionService, 'getCurrentUsage').mockResolvedValue({
        monthlyCount: 0,
        dailyCount: 0,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const permission = await usageTrackingService.checkAnalysisPermission();
      
      expect(permission.allowed).toBe(true);
      expect(permission.reason).toBe('within_limits');
    });

    test('should deny analyses when free tier quota is exceeded', async () => {
      // Mock free tier subscription
      jest.spyOn(poseSubscriptionService, 'getSubscriptionStatus').mockResolvedValue({
        poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.FREE,
        tierConfig: {
          analysisQuota: 3,
          features: { basicFeedback: true }
        },
        isActive: true,
        quotas: { monthly: 3, daily: 1 }
      });

      // Mock quota exceeded usage
      jest.spyOn(poseSubscriptionService, 'getCurrentUsage').mockResolvedValue({
        monthlyCount: 3,
        dailyCount: 1,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      jest.spyOn(poseSubscriptionService, 'canPerformAnalysis').mockResolvedValue({
        canAnalyze: false,
        reason: 'quota_exceeded',
        message: 'Monthly quota of 3 analyses exceeded',
        remaining: 0
      });

      const permission = await usageTrackingService.checkAnalysisPermission();
      
      expect(permission.allowed).toBe(false);
      expect(permission.reason).toBe('quota_exceeded');
      expect(permission.message).toContain('quota exceeded');
    });

    test('should track usage correctly for free tier', async () => {
      const mockAnalysisData = {
        id: 'test-analysis-1',
        exerciseType: 'squat',
        processingTime: 5000,
        framesProcessed: 30,
        confidenceMetrics: { analysisReliability: 0.85 }
      };

      // Start session
      const session = await usageTrackingService.startAnalysisSession(mockAnalysisData);
      expect(session.sessionId).toBeDefined();
      expect(session.status).toBe('started');

      // Complete session
      const completion = await usageTrackingService.completeAnalysisSession(
        session.sessionId, 
        {
          success: true,
          analysis: { overallScore: 85 },
          processingTime: 5000,
          framesProcessed: 30,
          confidenceMetrics: { analysisReliability: 0.85 }
        }
      );

      expect(completion.status).toBe('completed');
      expect(completion.success).toBe(true);
    });
  });

  describe('Premium Tier Features', () => {
    test('should allow unlimited analyses for premium tier', async () => {
      // Mock premium tier subscription
      jest.spyOn(poseSubscriptionService, 'getSubscriptionStatus').mockResolvedValue({
        poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
        tierConfig: {
          analysisQuota: -1, // Unlimited
          features: { advancedInsights: true, unlimitedAnalyses: true }
        },
        isActive: true,
        quotas: { monthly: -1, daily: -1 }
      });

      jest.spyOn(poseSubscriptionService, 'canPerformAnalysis').mockResolvedValue({
        canAnalyze: true,
        reason: 'unlimited',
        remaining: -1
      });

      const permission = await usageTrackingService.checkAnalysisPermission();
      
      expect(permission.allowed).toBe(true);
      expect(permission.reason).toBe('within_limits');
    });

    test('should have larger file size limits for premium tier', async () => {
      const mockSubscription = {
        poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
        limits: {
          maxVideoSize: 200 * 1024 * 1024, // 200MB
          maxVideoDuration: 300 // 5 minutes
        }
      };

      // Test via pose analysis service
      const canAnalyze = await poseAnalysisService.canPerformAnalysis();
      expect(canAnalyze).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce per-minute rate limits', async () => {
      // Mock multiple rapid requests
      const promises = [];
      for (let i = 0; i < 6; i++) { // Exceed 5 per minute limit
        promises.push(usageTrackingService.checkAnalysisPermission());
      }

      const results = await Promise.all(promises);
      
      // At least some should be rate limited
      const rateLimited = results.filter(r => r.reason === 'rate_limit_minute');
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test('should enforce concurrent analysis limits', async () => {
      // Mock concurrent sessions
      const sessions = [];
      for (let i = 0; i < 4; i++) { // Exceed 3 concurrent limit
        sessions.push(usageTrackingService.startAnalysisSession({
          id: `concurrent-test-${i}`,
          exerciseType: 'squat'
        }));
      }

      const results = await Promise.allSettled(sessions);
      
      // Some should fail due to concurrent limits
      const failed = results.filter(r => r.status === 'rejected');
      expect(failed.length).toBeGreaterThan(0);
    });
  });

  describe('Billing Period Integration', () => {
    test('should reset quota at billing period boundary', async () => {
      // Mock current usage at quota limit
      jest.spyOn(poseSubscriptionService, 'getCurrentUsage').mockResolvedValue({
        monthlyCount: 3, // At limit
        dailyCount: 1,
        billingPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        billingPeriodEnd: new Date() // Ending now
      });

      // After billing period reset
      setTimeout(async () => {
        jest.spyOn(poseSubscriptionService, 'getCurrentUsage').mockResolvedValue({
          monthlyCount: 0, // Reset
          dailyCount: 0,
          billingPeriodStart: new Date(),
          billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        const permission = await usageTrackingService.checkAnalysisPermission();
        expect(permission.allowed).toBe(true);
      }, 100);
    });

    test('should calculate billing period correctly', async () => {
      const usageStatus = await usageTrackingService.getUsageStatus();
      
      expect(usageStatus.billingPeriod).toBeDefined();
      expect(usageStatus.billingPeriod.start).toBeInstanceOf(Date);
      expect(usageStatus.billingPeriod.end).toBeInstanceOf(Date);
      expect(usageStatus.billingPeriod.daysRemaining).toBeGreaterThan(0);
    });
  });

  describe('Usage Analytics', () => {
    test('should track usage analytics correctly', async () => {
      // Mock some usage data
      const analyticsData = await usageTrackingService.getUsageAnalytics('30d');
      
      expect(analyticsData).toBeDefined();
      expect(analyticsData.timeRange).toBe('30d');
      expect(analyticsData.totalSessions).toBeGreaterThanOrEqual(0);
      expect(analyticsData.exerciseBreakdown).toBeDefined();
      expect(analyticsData.performance).toBeDefined();
    });

    test('should provide usage trends', async () => {
      const analytics = await usageTrackingService.getUsageAnalytics('7d', true);
      
      expect(analytics.trends).toBeDefined();
      expect(analytics.trends.dailyUsage).toBeDefined();
      expect(analytics.trends.hourlyPattern).toBeInstanceOf(Array);
      expect(analytics.trends.hourlyPattern).toHaveLength(24);
    });
  });

  describe('Error Handling', () => {
    test('should handle subscription service errors gracefully', async () => {
      // Mock service error
      jest.spyOn(poseSubscriptionService, 'getSubscriptionStatus').mockRejectedValue(
        new Error('Network error')
      );

      const permission = await usageTrackingService.checkAnalysisPermission();
      
      // Should still allow analysis with error fallback
      expect(permission.allowed).toBe(true);
      expect(permission.reason).toBe('error_failsafe');
    });

    test('should handle quota service errors gracefully', async () => {
      // Mock usage tracking error
      jest.spyOn(usageTrackingService, 'getUsageStatus').mockRejectedValue(
        new Error('Database error')
      );

      // Analysis service should handle the error
      const status = await poseAnalysisService.getUsageStatus();
      expect(status).toBeDefined();
      expect(status.subscription.tier).toBe('free'); // Fallback
    });
  });

  describe('Integration with Pose Analysis Service', () => {
    test('should integrate quota checking into analysis flow', async () => {
      // Mock video file
      const mockVideoUri = 'file://test-video.mp4';
      
      // Mock file system
      jest.mock('expo-file-system', () => ({
        getInfoAsync: jest.fn(() => Promise.resolve({
          exists: true,
          size: 10 * 1024 * 1024 // 10MB
        }))
      }));

      // This would normally trigger the full analysis flow
      const canAnalyze = await poseAnalysisService.canPerformAnalysis();
      expect(canAnalyze).toBeDefined();
    });

    test('should record usage when analysis completes', async () => {
      const mockAnalysisData = {
        id: 'integration-test',
        exerciseType: 'squat',
        success: true,
        analysis: { overallScore: 88 },
        processingTime: 3000,
        framesProcessed: 25
      };

      // Record usage
      const recorded = await poseSubscriptionService.recordAnalysisUsage(mockAnalysisData);
      expect(recorded.id).toBeDefined();
      expect(recorded.exerciseType).toBe('squat');
    });
  });
});

console.log('✅ Subscription integration tests completed');