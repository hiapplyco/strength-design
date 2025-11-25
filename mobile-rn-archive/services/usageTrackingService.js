/**
 * Usage Tracking Service
 * 
 * Comprehensive usage tracking and quota enforcement for pose analysis features.
 * Integrates with billing periods, subscription tiers, and provides real-time usage monitoring.
 * 
 * Features:
 * - Real-time usage counting and quota enforcement
 * - Billing period integration with automatic rollover
 * - Usage analytics and reporting
 * - Rate limiting and abuse prevention
 * - Integration with subscription service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import poseSubscriptionService from './poseSubscriptionService';

// Cache keys
const USAGE_TRACKING_CACHE = '@usage_tracking_cache';
const USAGE_ANALYTICS_CACHE = '@usage_analytics_cache';
const RATE_LIMIT_CACHE = '@rate_limit_cache';

// Collection names
const POSE_USAGE_TRACKING = 'poseUsageTracking';
const POSE_USAGE_SESSIONS = 'poseUsageSessions';
const POSE_USAGE_ANALYTICS = 'poseUsageAnalytics';

/**
 * Usage event types
 */
export const USAGE_EVENT_TYPES = {
  ANALYSIS_START: 'analysis_start',
  ANALYSIS_COMPLETE: 'analysis_complete',
  ANALYSIS_FAILED: 'analysis_failed',
  QUOTA_CHECK: 'quota_check',
  QUOTA_EXCEEDED: 'quota_exceeded',
  BILLING_RESET: 'billing_reset'
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  ANALYSES_PER_MINUTE: 5,
  ANALYSES_PER_HOUR: 30,
  CONCURRENT_ANALYSES: 3,
  COOLDOWN_SECONDS: 10
};

/**
 * Usage Tracking Service Class
 */
class UsageTrackingService {
  constructor() {
    this.isInitialized = false;
    this.usageCache = new Map();
    this.analyticsCache = new Map();
    this.rateLimitCache = new Map();
    this.activeSessions = new Set();
    this.lastSyncTime = null;
    
    // Rate limiting state
    this.recentAnalyses = [];
    this.currentConcurrent = 0;
    
    console.log('📊 UsageTrackingService: Initialized');
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      console.log('📊 Initializing Usage Tracking Service...');
      
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Load cached data
      await this.loadFromCache();
      
      // Initialize rate limiting
      await this.initializeRateLimiting();
      
      // Sync with subscription service
      await this.syncWithSubscriptionService();
      
      // Schedule periodic cleanup
      this.scheduleCleanup();
      
      this.isInitialized = true;
      console.log('✅ Usage Tracking Service initialized');
      
      return {
        success: true,
        message: 'Usage tracking service initialized successfully'
      };
    } catch (error) {
      console.error('❌ Error initializing usage tracking service:', error);
      return {
        success: false,
        message: `Initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Check if analysis can be performed (comprehensive quota and rate limiting)
   */
  async checkAnalysisPermission(options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const user = auth.currentUser;
      if (!user) {
        return {
          allowed: false,
          reason: 'not_authenticated',
          message: 'User not authenticated'
        };
      }

      // 1. Check subscription quota
      const subscriptionCheck = await poseSubscriptionService.canPerformAnalysis();
      if (!subscriptionCheck.canAnalyze) {
        await this.recordUsageEvent(USAGE_EVENT_TYPES.QUOTA_EXCEEDED, {
          reason: subscriptionCheck.reason,
          remaining: subscriptionCheck.remaining
        });
        
        return {
          allowed: false,
          reason: subscriptionCheck.reason,
          message: subscriptionCheck.message,
          quotaInfo: subscriptionCheck,
          resetDate: subscriptionCheck.resetDate
        };
      }

      // 2. Check rate limits
      const rateLimitCheck = await this.checkRateLimits();
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck;
      }

      // 3. Check concurrent analysis limit
      const concurrentCheck = await this.checkConcurrentLimit();
      if (!concurrentCheck.allowed) {
        return concurrentCheck;
      }

      // 4. Check daily limits (additional safety)
      const dailyCheck = await this.checkDailyLimits();
      if (!dailyCheck.allowed) {
        return dailyCheck;
      }

      // Record quota check event
      await this.recordUsageEvent(USAGE_EVENT_TYPES.QUOTA_CHECK, {
        result: 'allowed',
        remaining: subscriptionCheck.remaining,
        rateLimits: rateLimitCheck.limits
      });

      return {
        allowed: true,
        reason: 'within_limits',
        quotaInfo: subscriptionCheck,
        rateLimits: rateLimitCheck.limits,
        message: 'Analysis permitted'
      };
    } catch (error) {
      console.error('❌ Error checking analysis permission:', error);
      
      // Fail-safe: allow if error (but log it)
      await this.recordUsageEvent('error', {
        error: error.message,
        context: 'checkAnalysisPermission'
      });
      
      return {
        allowed: true,
        reason: 'error_failsafe',
        message: 'Permission check failed, allowing analysis'
      };
    }
  }

  /**
   * Start tracking an analysis session
   */
  async startAnalysisSession(analysisData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const sessionId = analysisData.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check permission one more time
      const permission = await this.checkAnalysisPermission();
      if (!permission.allowed) {
        throw new Error(`Analysis not permitted: ${permission.message}`);
      }

      const session = {
        sessionId,
        userId: user.uid,
        status: 'started',
        
        // Analysis metadata
        exerciseType: analysisData.exerciseType,
        videoUri: analysisData.videoUri,
        videoSize: analysisData.videoSize || 0,
        videoDuration: analysisData.videoDuration || 0,
        
        // Timing
        startedAt: new Date(),
        expectedDuration: this.estimateProcessingTime(analysisData),
        
        // Subscription context
        subscriptionTier: permission.quotaInfo?.poseAnalysisTier,
        remainingQuota: permission.quotaInfo?.remaining,
        
        // Tracking
        createdAt: serverTimestamp()
      };

      // Save session to Firestore
      const sessionRef = doc(db, POSE_USAGE_SESSIONS, sessionId);
      await setDoc(sessionRef, session);

      // Update local tracking
      this.activeSessions.add(sessionId);
      this.currentConcurrent++;
      this.recentAnalyses.push({
        timestamp: Date.now(),
        sessionId,
        type: 'start'
      });

      // Record usage event
      await this.recordUsageEvent(USAGE_EVENT_TYPES.ANALYSIS_START, {
        sessionId,
        exerciseType: analysisData.exerciseType,
        subscriptionTier: session.subscriptionTier
      });

      // Update cache
      await this.updateUsageCache(sessionId, session);
      
      console.log('🟢 Analysis session started:', sessionId);
      return {
        sessionId,
        status: 'started',
        permission,
        estimatedDuration: session.expectedDuration
      };
    } catch (error) {
      console.error('❌ Error starting analysis session:', error);
      throw error;
    }
  }

  /**
   * Complete an analysis session
   */
  async completeAnalysisSession(sessionId, analysisResult) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const sessionRef = doc(db, POSE_USAGE_SESSIONS, sessionId);
      
      // Update session with completion data
      const completionData = {
        status: 'completed',
        completedAt: new Date(),
        
        // Result metadata
        success: analysisResult.success,
        overallScore: analysisResult.analysis?.overallScore || 0,
        processingTime: analysisResult.processingTime || 0,
        framesProcessed: analysisResult.framesProcessed || 0,
        confidence: analysisResult.confidenceMetrics?.analysisReliability || 0,
        
        // Error tracking
        errors: analysisResult.errors || [],
        warnings: analysisResult.warnings || [],
        
        updatedAt: serverTimestamp()
      };

      await updateDoc(sessionRef, completionData);

      // Record usage in subscription service (for quota tracking)
      await poseSubscriptionService.recordAnalysisUsage({
        id: sessionId,
        exerciseType: analysisResult.exerciseType || 'unknown',
        processingTime: completionData.processingTime,
        framesProcessed: completionData.framesProcessed,
        confidenceMetrics: analysisResult.confidenceMetrics,
        analyzedAt: new Date()
      });

      // Update local tracking
      this.activeSessions.delete(sessionId);
      this.currentConcurrent = Math.max(0, this.currentConcurrent - 1);
      
      // Record completion event
      await this.recordUsageEvent(USAGE_EVENT_TYPES.ANALYSIS_COMPLETE, {
        sessionId,
        success: analysisResult.success,
        processingTime: completionData.processingTime,
        overallScore: completionData.overallScore
      });

      // Update analytics
      await this.updateAnalytics(sessionId, completionData);
      
      console.log('✅ Analysis session completed:', sessionId);
      return completionData;
    } catch (error) {
      console.error('❌ Error completing analysis session:', error);
      
      // Still try to clean up local state
      this.activeSessions.delete(sessionId);
      this.currentConcurrent = Math.max(0, this.currentConcurrent - 1);
      
      throw error;
    }
  }

  /**
   * Handle analysis session failure
   */
  async failAnalysisSession(sessionId, errorInfo) {
    try {
      const sessionRef = doc(db, POSE_USAGE_SESSIONS, sessionId);
      
      const failureData = {
        status: 'failed',
        failedAt: new Date(),
        
        // Error details
        errorType: errorInfo.type || 'unknown',
        errorMessage: errorInfo.message || 'Unknown error',
        errorDetails: errorInfo.details || {},
        
        // Partial results (if any)
        processingTime: errorInfo.processingTime || 0,
        framesProcessed: errorInfo.framesProcessed || 0,
        
        updatedAt: serverTimestamp()
      };

      await updateDoc(sessionRef, failureData);

      // Update local tracking
      this.activeSessions.delete(sessionId);
      this.currentConcurrent = Math.max(0, this.currentConcurrent - 1);
      
      // Record failure event
      await this.recordUsageEvent(USAGE_EVENT_TYPES.ANALYSIS_FAILED, {
        sessionId,
        errorType: failureData.errorType,
        errorMessage: failureData.errorMessage,
        processingTime: failureData.processingTime
      });

      // Note: Don't record as completed usage for quota since it failed
      
      console.log('❌ Analysis session failed:', sessionId, failureData.errorMessage);
      return failureData;
    } catch (error) {
      console.error('❌ Error handling session failure:', error);
      
      // Still clean up local state
      this.activeSessions.delete(sessionId);
      this.currentConcurrent = Math.max(0, this.currentConcurrent - 1);
      
      throw error;
    }
  }

  /**
   * Get current usage status
   */
  async getUsageStatus() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Get subscription status
      const subscription = await poseSubscriptionService.getSubscriptionStatus();
      const currentUsage = await poseSubscriptionService.getCurrentUsage();
      
      // Get rate limit status
      const rateLimits = await this.getRateLimitStatus();
      
      // Calculate usage percentages
      const monthlyPercentage = subscription.quotas.monthly === -1 ? 0 : 
        (currentUsage.monthlyCount / subscription.quotas.monthly) * 100;

      return {
        subscription: {
          tier: subscription.poseAnalysisTier,
          tierName: subscription.tierConfig.name,
          isActive: subscription.isActive,
          features: subscription.features,
          limits: subscription.limits
        },
        
        quotas: {
          monthly: {
            limit: subscription.quotas.monthly,
            used: currentUsage.monthlyCount,
            remaining: subscription.quotas.monthly === -1 ? -1 : 
              subscription.quotas.monthly - currentUsage.monthlyCount,
            percentage: Math.min(100, monthlyPercentage)
          },
          daily: {
            limit: subscription.quotas.daily,
            used: currentUsage.dailyCount,
            remaining: subscription.quotas.daily === -1 ? -1 : 
              subscription.quotas.daily - currentUsage.dailyCount
          }
        },
        
        rateLimits: rateLimits,
        
        billingPeriod: {
          start: currentUsage.billingPeriodStart,
          end: currentUsage.billingPeriodEnd,
          daysRemaining: Math.ceil((currentUsage.billingPeriodEnd - new Date()) / (1000 * 60 * 60 * 24))
        },
        
        activity: {
          activeSessions: this.activeSessions.size,
          lastAnalysis: currentUsage.lastAnalysis,
          recentAnalyses: this.recentAnalyses.slice(-5)
        },
        
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error getting usage status:', error);
      return {
        subscription: { tier: 'free', isActive: false },
        quotas: { monthly: { limit: 0, used: 0, remaining: 0 } },
        rateLimits: { allowed: false },
        billingPeriod: { start: new Date(), end: new Date() },
        activity: { activeSessions: 0, lastAnalysis: null },
        updatedAt: new Date()
      };
    }
  }

  /**
   * Get usage analytics for time period
   */
  async getUsageAnalytics(timeRange = '30d', includeDetails = false) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Check cache first
      const cacheKey = `${user.uid}_${timeRange}_${includeDetails}`;
      if (this.analyticsCache.has(cacheKey)) {
        const cached = this.analyticsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes
          return cached.data;
        }
      }

      const startDate = this.calculateStartDate(timeRange);
      
      // Get usage sessions
      const sessionsQuery = query(
        collection(db, POSE_USAGE_SESSIONS),
        where('userId', '==', user.uid),
        where('startedAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('startedAt', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(sessionsQuery);
      const sessions = [];
      
      snapshot.forEach(doc => {
        sessions.push({ id: doc.id, ...doc.data() });
      });

      const analytics = this.processUsageAnalytics(sessions, timeRange, includeDetails);
      
      // Cache results
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      console.error('❌ Error getting usage analytics:', error);
      return this.getEmptyAnalytics(timeRange);
    }
  }

  /**
   * Record a usage event
   */
  async recordUsageEvent(eventType, eventData = {}) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const event = {
        userId: user.uid,
        eventType,
        eventData,
        timestamp: new Date(),
        createdAt: serverTimestamp()
      };

      // Save to Firestore (fire and forget for performance)
      const eventRef = doc(collection(db, POSE_USAGE_TRACKING));
      setDoc(eventRef, event).catch(error => {
        console.warn('⚠️ Failed to record usage event:', error);
      });

      // Update local cache for immediate access
      const cacheKey = `${user.uid}_events`;
      const cachedEvents = this.usageCache.get(cacheKey) || [];
      cachedEvents.unshift(event);
      
      // Keep only recent events in cache
      if (cachedEvents.length > 50) {
        cachedEvents.splice(50);
      }
      
      this.usageCache.set(cacheKey, cachedEvents);
      
    } catch (error) {
      console.warn('⚠️ Error recording usage event:', error);
      // Don't throw - this shouldn't break the main flow
    }
  }

  /**
   * Private helper methods
   */

  /**
   * Check rate limits
   */
  async checkRateLimits() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    
    // Clean old entries
    this.recentAnalyses = this.recentAnalyses.filter(analysis => 
      analysis.timestamp > oneHourAgo
    );
    
    // Count recent analyses
    const lastMinute = this.recentAnalyses.filter(analysis => 
      analysis.timestamp > oneMinuteAgo
    ).length;
    
    const lastHour = this.recentAnalyses.length;
    
    // Check limits
    if (lastMinute >= RATE_LIMITS.ANALYSES_PER_MINUTE) {
      return {
        allowed: false,
        reason: 'rate_limit_minute',
        message: `Rate limit exceeded: ${lastMinute}/${RATE_LIMITS.ANALYSES_PER_MINUTE} analyses in the last minute`,
        retryAfter: 60 // seconds
      };
    }
    
    if (lastHour >= RATE_LIMITS.ANALYSES_PER_HOUR) {
      return {
        allowed: false,
        reason: 'rate_limit_hour',
        message: `Rate limit exceeded: ${lastHour}/${RATE_LIMITS.ANALYSES_PER_HOUR} analyses in the last hour`,
        retryAfter: 3600 // seconds
      };
    }
    
    return {
      allowed: true,
      limits: {
        minute: { current: lastMinute, limit: RATE_LIMITS.ANALYSES_PER_MINUTE },
        hour: { current: lastHour, limit: RATE_LIMITS.ANALYSES_PER_HOUR }
      }
    };
  }

  /**
   * Check concurrent analysis limit
   */
  async checkConcurrentLimit() {
    if (this.currentConcurrent >= RATE_LIMITS.CONCURRENT_ANALYSES) {
      return {
        allowed: false,
        reason: 'concurrent_limit',
        message: `Concurrent limit exceeded: ${this.currentConcurrent}/${RATE_LIMITS.CONCURRENT_ANALYSES} active analyses`,
        current: this.currentConcurrent,
        limit: RATE_LIMITS.CONCURRENT_ANALYSES
      };
    }
    
    return {
      allowed: true,
      current: this.currentConcurrent,
      limit: RATE_LIMITS.CONCURRENT_ANALYSES
    };
  }

  /**
   * Check daily limits (safety measure)
   */
  async checkDailyLimits() {
    const usage = await poseSubscriptionService.getCurrentUsage();
    const subscription = await poseSubscriptionService.getSubscriptionStatus();
    
    if (subscription.quotas.daily !== -1 && usage.dailyCount >= subscription.quotas.daily) {
      return {
        allowed: false,
        reason: 'daily_limit',
        message: `Daily limit exceeded: ${usage.dailyCount}/${subscription.quotas.daily} analyses today`,
        used: usage.dailyCount,
        limit: subscription.quotas.daily
      };
    }
    
    return {
      allowed: true,
      used: usage.dailyCount,
      limit: subscription.quotas.daily
    };
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus() {
    const rateLimitCheck = await this.checkRateLimits();
    const concurrentCheck = await this.checkConcurrentLimit();
    const dailyCheck = await this.checkDailyLimits();
    
    return {
      allowed: rateLimitCheck.allowed && concurrentCheck.allowed && dailyCheck.allowed,
      minute: rateLimitCheck.limits?.minute,
      hour: rateLimitCheck.limits?.hour,
      concurrent: {
        current: concurrentCheck.current,
        limit: concurrentCheck.limit
      },
      daily: {
        current: dailyCheck.used,
        limit: dailyCheck.limit
      }
    };
  }

  /**
   * Initialize rate limiting
   */
  async initializeRateLimiting() {
    try {
      // Clean up any orphaned active sessions
      const user = auth.currentUser;
      if (!user) return;

      // Query for sessions that might have been left active
      const activeSessionsQuery = query(
        collection(db, POSE_USAGE_SESSIONS),
        where('userId', '==', user.uid),
        where('status', '==', 'started'),
        limit(10)
      );

      const snapshot = await getDocs(activeSessionsQuery);
      const cleanupPromises = [];
      
      snapshot.forEach(doc => {
        const session = doc.data();
        const startedAt = session.startedAt?.toDate();
        
        // If session started more than 10 minutes ago, consider it abandoned
        if (startedAt && Date.now() - startedAt.getTime() > 10 * 60 * 1000) {
          cleanupPromises.push(this.failAnalysisSession(doc.id, {
            type: 'abandoned',
            message: 'Session abandoned during initialization cleanup'
          }));
        } else {
          // Re-add to active sessions
          this.activeSessions.add(doc.id);
          this.currentConcurrent++;
        }
      });

      await Promise.all(cleanupPromises);
      
      console.log(`🧹 Cleaned up ${cleanupPromises.length} abandoned sessions, ${this.activeSessions.size} active`);
    } catch (error) {
      console.warn('⚠️ Error initializing rate limiting:', error);
    }
  }

  /**
   * Sync with subscription service
   */
  async syncWithSubscriptionService() {
    try {
      await poseSubscriptionService.getSubscriptionStatus(true); // Force refresh
      console.log('🔄 Synced with subscription service');
    } catch (error) {
      console.warn('⚠️ Error syncing with subscription service:', error);
    }
  }

  /**
   * Schedule periodic cleanup
   */
  scheduleCleanup() {
    // Clean up every 5 minutes
    setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Perform periodic cleanup
   */
  async performCleanup() {
    try {
      // Clean recent analyses array
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      this.recentAnalyses = this.recentAnalyses.filter(analysis => 
        analysis.timestamp > oneHourAgo
      );
      
      // Clean cache
      const now = Date.now();
      for (const [key, value] of this.analyticsCache.entries()) {
        if (now - value.timestamp > 15 * 60 * 1000) { // 15 minutes
          this.analyticsCache.delete(key);
        }
      }
      
      console.log('🧹 Usage tracking cleanup completed');
    } catch (error) {
      console.warn('⚠️ Error during cleanup:', error);
    }
  }

  /**
   * Process usage analytics
   */
  processUsageAnalytics(sessions, timeRange, includeDetails) {
    const analytics = {
      timeRange,
      totalSessions: sessions.length,
      completedSessions: 0,
      failedSessions: 0,
      
      exerciseBreakdown: {},
      statusBreakdown: {},
      subscriptionBreakdown: {},
      
      performance: {
        averageProcessingTime: 0,
        averageFrames: 0,
        averageScore: 0,
        averageConfidence: 0
      },
      
      trends: {
        dailyUsage: {},
        hourlyPattern: new Array(24).fill(0)
      }
    };

    if (sessions.length === 0) return analytics;

    let totalProcessingTime = 0;
    let totalFrames = 0;
    let totalScore = 0;
    let totalConfidence = 0;
    let performanceCount = 0;

    sessions.forEach(session => {
      // Status breakdown
      analytics.statusBreakdown[session.status] = 
        (analytics.statusBreakdown[session.status] || 0) + 1;
      
      if (session.status === 'completed') {
        analytics.completedSessions++;
        
        // Performance metrics
        if (session.processingTime) {
          totalProcessingTime += session.processingTime;
          performanceCount++;
        }
        if (session.framesProcessed) totalFrames += session.framesProcessed;
        if (session.overallScore) totalScore += session.overallScore;
        if (session.confidence) totalConfidence += session.confidence;
      } else if (session.status === 'failed') {
        analytics.failedSessions++;
      }
      
      // Exercise breakdown
      const exercise = session.exerciseType || 'unknown';
      analytics.exerciseBreakdown[exercise] = 
        (analytics.exerciseBreakdown[exercise] || 0) + 1;
      
      // Subscription breakdown
      const tier = session.subscriptionTier || 'unknown';
      analytics.subscriptionBreakdown[tier] = 
        (analytics.subscriptionBreakdown[tier] || 0) + 1;
      
      // Time patterns
      const startedAt = session.startedAt?.toDate ? session.startedAt.toDate() : session.startedAt;
      if (startedAt) {
        const dateKey = startedAt.toISOString().split('T')[0];
        analytics.trends.dailyUsage[dateKey] = 
          (analytics.trends.dailyUsage[dateKey] || 0) + 1;
        
        analytics.trends.hourlyPattern[startedAt.getHours()]++;
      }
    });

    // Calculate averages
    if (performanceCount > 0) {
      analytics.performance.averageProcessingTime = totalProcessingTime / performanceCount;
      analytics.performance.averageFrames = totalFrames / performanceCount;
      analytics.performance.averageScore = totalScore / performanceCount;
      analytics.performance.averageConfidence = totalConfidence / performanceCount;
    }

    // Add details if requested
    if (includeDetails) {
      analytics.sessions = sessions.slice(0, 20); // Recent 20 sessions
    }

    return analytics;
  }

  /**
   * Estimate processing time for analysis
   */
  estimateProcessingTime(analysisData) {
    // Base processing time in seconds
    let estimatedTime = 30;
    
    // Adjust based on video duration
    if (analysisData.videoDuration) {
      estimatedTime += Math.ceil(analysisData.videoDuration / 10); // 1 sec per 10 sec of video
    }
    
    // Adjust based on file size
    if (analysisData.videoSize) {
      const sizeMB = analysisData.videoSize / (1024 * 1024);
      estimatedTime += Math.ceil(sizeMB / 10); // 1 sec per 10MB
    }
    
    return Math.min(300, estimatedTime); // Cap at 5 minutes
  }

  /**
   * Calculate start date for time range
   */
  calculateStartDate(timeRange) {
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    if (days[timeRange]) {
      now.setDate(now.getDate() - days[timeRange]);
    }
    
    return now;
  }

  /**
   * Get empty analytics structure
   */
  getEmptyAnalytics(timeRange) {
    return {
      timeRange,
      totalSessions: 0,
      completedSessions: 0,
      failedSessions: 0,
      exerciseBreakdown: {},
      statusBreakdown: {},
      subscriptionBreakdown: {},
      performance: {
        averageProcessingTime: 0,
        averageFrames: 0,
        averageScore: 0,
        averageConfidence: 0
      },
      trends: {
        dailyUsage: {},
        hourlyPattern: new Array(24).fill(0)
      }
    };
  }

  /**
   * Update analytics cache
   */
  async updateAnalytics(sessionId, sessionData) {
    // Implementation for real-time analytics updates
    // This could trigger dashboard updates, etc.
  }

  /**
   * Update usage cache
   */
  async updateUsageCache(sessionId, sessionData) {
    const user = auth.currentUser;
    if (!user) return;

    const cacheKey = `${user.uid}_sessions`;
    const cachedSessions = this.usageCache.get(cacheKey) || [];
    
    // Update or add session
    const existingIndex = cachedSessions.findIndex(s => s.sessionId === sessionId);
    if (existingIndex >= 0) {
      cachedSessions[existingIndex] = { ...cachedSessions[existingIndex], ...sessionData };
    } else {
      cachedSessions.unshift(sessionData);
    }
    
    // Keep only recent sessions in cache
    if (cachedSessions.length > 20) {
      cachedSessions.splice(20);
    }
    
    this.usageCache.set(cacheKey, cachedSessions);
    await this.saveToCache();
  }

  /**
   * Cache management
   */
  async loadFromCache() {
    try {
      const usageCache = await AsyncStorage.getItem(USAGE_TRACKING_CACHE);
      const analyticsCache = await AsyncStorage.getItem(USAGE_ANALYTICS_CACHE);
      const rateLimitCache = await AsyncStorage.getItem(RATE_LIMIT_CACHE);
      
      if (usageCache) {
        const data = JSON.parse(usageCache);
        this.usageCache = new Map(data.usage || []);
        this.lastSyncTime = data.lastSyncTime;
      }
      
      if (analyticsCache) {
        const data = JSON.parse(analyticsCache);
        this.analyticsCache = new Map(data);
      }
      
      if (rateLimitCache) {
        const data = JSON.parse(rateLimitCache);
        this.recentAnalyses = data.recentAnalyses || [];
        this.currentConcurrent = data.currentConcurrent || 0;
      }
    } catch (error) {
      console.error('❌ Error loading usage tracking cache:', error);
    }
  }

  async saveToCache() {
    try {
      const usageData = {
        usage: Array.from(this.usageCache.entries()),
        lastSyncTime: Date.now()
      };
      
      const rateLimitData = {
        recentAnalyses: this.recentAnalyses.slice(-100), // Keep recent 100
        currentConcurrent: this.currentConcurrent
      };
      
      await AsyncStorage.multiSet([
        [USAGE_TRACKING_CACHE, JSON.stringify(usageData)],
        [USAGE_ANALYTICS_CACHE, JSON.stringify(Array.from(this.analyticsCache.entries()))],
        [RATE_LIMIT_CACHE, JSON.stringify(rateLimitData)]
      ]);
    } catch (error) {
      console.error('❌ Error saving usage tracking cache:', error);
    }
  }

  /**
   * Clear cache
   */
  async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        USAGE_TRACKING_CACHE,
        USAGE_ANALYTICS_CACHE,
        RATE_LIMIT_CACHE
      ]);
      
      this.usageCache.clear();
      this.analyticsCache.clear();
      this.rateLimitCache.clear();
      this.recentAnalyses = [];
      this.currentConcurrent = 0;
      
      console.log('🗑️ Usage tracking cache cleared');
    } catch (error) {
      console.error('❌ Error clearing usage tracking cache:', error);
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.usageCache.clear();
    this.analyticsCache.clear();
    this.rateLimitCache.clear();
    this.activeSessions.clear();
    this.recentAnalyses = [];
    this.currentConcurrent = 0;
    this.isInitialized = false;
    console.log('📊 Usage Tracking Service destroyed');
  }
}

// Create and export singleton instance
const usageTrackingService = new UsageTrackingService();
export default usageTrackingService;

// Export class for custom instances
export { UsageTrackingService };