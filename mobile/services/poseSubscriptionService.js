/**
 * Pose Analysis Subscription Service
 * 
 * Manages subscription tiers, quota limits, and billing integration for pose analysis features.
 * Extends existing subscription system with pose-specific plans and usage tracking.
 * 
 * Subscription Tiers:
 * - Free: 3 analyses/month, basic feedback, 30 days history
 * - Premium ($9.99): Unlimited analyses, advanced insights, full history  
 * - Coaching ($19.99): All Premium + priority processing, PDF reports, trainer sharing
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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

// Cache keys
const POSE_SUBSCRIPTION_CACHE = '@pose_subscription_cache';
const POSE_QUOTA_CACHE = '@pose_quota_cache';
const POSE_BILLING_CACHE = '@pose_billing_cache';

// Collection names
const USER_SUBSCRIPTIONS = 'userSubscriptions';
const POSE_USAGE_HISTORY = 'poseUsageHistory';
const POSE_SUBSCRIPTION_CONFIG = 'poseSubscriptionConfig';

/**
 * Pose Analysis Subscription Tiers
 */
export const POSE_SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium', 
  COACHING: 'coaching'
};

/**
 * Subscription tier configurations
 */
export const POSE_TIER_CONFIG = {
  [POSE_SUBSCRIPTION_TIERS.FREE]: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    analysisQuota: 3,
    features: {
      basicFeedback: true,
      advancedInsights: false,
      unlimitedAnalyses: false,
      historyDays: 30,
      pdfReports: false,
      priorityProcessing: false,
      trainerSharing: false,
      videoStorage: false,
      formComparison: false,
      progressTracking: 'basic'
    },
    limits: {
      maxVideoSize: 50 * 1024 * 1024, // 50MB
      maxVideoDuration: 60, // seconds
      concurrentAnalyses: 1,
      storageQuota: 100 * 1024 * 1024 // 100MB
    }
  },
  [POSE_SUBSCRIPTION_TIERS.PREMIUM]: {
    name: 'Premium',
    price: 9.99,
    currency: 'USD', 
    interval: 'month',
    analysisQuota: -1, // Unlimited
    features: {
      basicFeedback: true,
      advancedInsights: true,
      unlimitedAnalyses: true,
      historyDays: -1, // Unlimited
      pdfReports: false,
      priorityProcessing: false,
      trainerSharing: false,
      videoStorage: true,
      formComparison: true,
      progressTracking: 'advanced'
    },
    limits: {
      maxVideoSize: 200 * 1024 * 1024, // 200MB
      maxVideoDuration: 300, // 5 minutes
      concurrentAnalyses: 3,
      storageQuota: 1024 * 1024 * 1024 // 1GB
    }
  },
  [POSE_SUBSCRIPTION_TIERS.COACHING]: {
    name: 'Coaching',
    price: 19.99,
    currency: 'USD',
    interval: 'month', 
    analysisQuota: -1, // Unlimited
    features: {
      basicFeedback: true,
      advancedInsights: true,
      unlimitedAnalyses: true,
      historyDays: -1, // Unlimited
      pdfReports: true,
      priorityProcessing: true,
      trainerSharing: true,
      videoStorage: true,
      formComparison: true,
      progressTracking: 'professional'
    },
    limits: {
      maxVideoSize: 500 * 1024 * 1024, // 500MB
      maxVideoDuration: 600, // 10 minutes
      concurrentAnalyses: 5,
      storageQuota: 5 * 1024 * 1024 * 1024 // 5GB
    }
  }
};

/**
 * Pose Subscription Service Class
 */
class PoseSubscriptionService {
  constructor() {
    this.isInitialized = false;
    this.subscriptionCache = null;
    this.quotaCache = null;
    this.billingCache = null;
    this.lastCacheUpdate = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Firebase functions
    this.checkSubscriptionFunction = httpsCallable(functions, 'checkSubscription');
    
    console.log('🔐 PoseSubscriptionService: Initialized');
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      console.log('🔐 Initializing Pose Subscription Service...');
      
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Load cached data
      await this.loadFromCache();
      
      // Fetch current subscription status
      await this.refreshSubscriptionStatus();
      
      this.isInitialized = true;
      console.log('✅ Pose Subscription Service initialized');
      
      return {
        success: true,
        message: 'Pose subscription service initialized successfully'
      };
    } catch (error) {
      console.error('❌ Error initializing pose subscription service:', error);
      return {
        success: false,
        message: `Initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Get current user's pose subscription status
   */
  async getSubscriptionStatus(forceRefresh = false) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh && this.subscriptionCache && this.isCacheValid()) {
        return this.subscriptionCache;
      }

      console.log('🔐 Fetching subscription status from server...');

      // Get subscription from Firebase Function (existing checkSubscription)
      const result = await this.checkSubscriptionFunction();
      const subscriptionData = result.data;

      // Determine pose analysis tier
      const poseAnalysisTier = this.determinePoseAnalysisTier(subscriptionData);
      
      // Get pose-specific subscription details
      const poseSubscription = {
        ...subscriptionData,
        poseAnalysisTier,
        tierConfig: POSE_TIER_CONFIG[poseAnalysisTier],
        isActive: subscriptionData.subscribed || poseAnalysisTier === POSE_SUBSCRIPTION_TIERS.FREE,
        features: POSE_TIER_CONFIG[poseAnalysisTier].features,
        limits: POSE_TIER_CONFIG[poseAnalysisTier].limits,
        quotas: {
          monthly: POSE_TIER_CONFIG[poseAnalysisTier].analysisQuota,
          daily: this.calculateDailyQuota(POSE_TIER_CONFIG[poseAnalysisTier].analysisQuota)
        }
      };

      // Update cache
      this.subscriptionCache = poseSubscription;
      this.lastCacheUpdate = Date.now();
      await this.saveToCache();

      console.log('✅ Subscription status updated:', poseAnalysisTier);
      return poseSubscription;
    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      
      // Return default free tier on error
      const defaultSubscription = {
        subscribed: false,
        status: 'none',
        subscriptionType: null,
        poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.FREE,
        tierConfig: POSE_TIER_CONFIG[POSE_SUBSCRIPTION_TIERS.FREE],
        isActive: true,
        features: POSE_TIER_CONFIG[POSE_SUBSCRIPTION_TIERS.FREE].features,
        limits: POSE_TIER_CONFIG[POSE_SUBSCRIPTION_TIERS.FREE].limits,
        quotas: {
          monthly: POSE_TIER_CONFIG[POSE_SUBSCRIPTION_TIERS.FREE].analysisQuota,
          daily: this.calculateDailyQuota(POSE_TIER_CONFIG[POSE_SUBSCRIPTION_TIERS.FREE].analysisQuota)
        }
      };

      this.subscriptionCache = defaultSubscription;
      return defaultSubscription;
    }
  }

  /**
   * Check if user can perform pose analysis (quota check)
   */
  async canPerformAnalysis() {
    try {
      const subscription = await this.getSubscriptionStatus();
      
      if (!subscription.isActive) {
        return {
          canAnalyze: false,
          reason: 'subscription_inactive',
          message: 'Subscription is not active'
        };
      }

      // Unlimited tier check
      if (subscription.quotas.monthly === -1) {
        return {
          canAnalyze: true,
          reason: 'unlimited',
          remaining: -1
        };
      }

      // Get current usage for billing period
      const usage = await this.getCurrentUsage();
      const remaining = subscription.quotas.monthly - usage.monthlyCount;

      if (remaining <= 0) {
        return {
          canAnalyze: false,
          reason: 'quota_exceeded',
          message: `Monthly quota of ${subscription.quotas.monthly} analyses exceeded`,
          usage,
          resetDate: usage.billingPeriodEnd
        };
      }

      return {
        canAnalyze: true,
        reason: 'within_quota',
        remaining,
        usage,
        resetDate: usage.billingPeriodEnd
      };
    } catch (error) {
      console.error('❌ Error checking analysis permission:', error);
      return {
        canAnalyze: false,
        reason: 'error',
        message: error.message
      };
    }
  }

  /**
   * Get current billing period usage
   */
  async getCurrentUsage() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Check cache first
      if (this.quotaCache && this.isCacheValid()) {
        return this.quotaCache;
      }

      const billingPeriod = this.getCurrentBillingPeriod();
      
      // Query usage history for current billing period
      const usageQuery = query(
        collection(db, POSE_USAGE_HISTORY),
        where('userId', '==', user.uid),
        where('billingPeriodStart', '==', Timestamp.fromDate(billingPeriod.start)),
        orderBy('createdAt', 'desc'),
        limit(500)
      );

      const snapshot = await getDocs(usageQuery);
      const usageRecords = [];
      
      snapshot.forEach(doc => {
        usageRecords.push({ id: doc.id, ...doc.data() });
      });

      const usage = {
        billingPeriodStart: billingPeriod.start,
        billingPeriodEnd: billingPeriod.end,
        monthlyCount: usageRecords.length,
        dailyCount: this.calculateDailyUsage(usageRecords),
        records: usageRecords.slice(0, 10), // Recent 10 analyses
        lastAnalysis: usageRecords[0]?.createdAt?.toDate() || null,
        updatedAt: new Date()
      };

      // Update cache
      this.quotaCache = usage;
      this.lastCacheUpdate = Date.now();
      await this.saveToCache();

      return usage;
    } catch (error) {
      console.error('❌ Error getting current usage:', error);
      return {
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(),
        monthlyCount: 0,
        dailyCount: 0,
        records: [],
        lastAnalysis: null,
        updatedAt: new Date()
      };
    }
  }

  /**
   * Record pose analysis usage
   */
  async recordAnalysisUsage(analysisData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const subscription = await this.getSubscriptionStatus();
      const billingPeriod = this.getCurrentBillingPeriod();

      const usageRecord = {
        userId: user.uid,
        analysisId: analysisData.id || `analysis_${Date.now()}`,
        exerciseType: analysisData.exerciseType,
        
        // Subscription info
        subscriptionTier: subscription.poseAnalysisTier,
        subscriptionStatus: subscription.status,
        
        // Billing period
        billingPeriodStart: Timestamp.fromDate(billingPeriod.start),
        billingPeriodEnd: Timestamp.fromDate(billingPeriod.end),
        
        // Analysis metadata
        processingTime: analysisData.processingTime || 0,
        framesProcessed: analysisData.framesProcessed || 0,
        videoSize: analysisData.videoSize || 0,
        videoDuration: analysisData.videoDuration || 0,
        confidence: analysisData.confidenceMetrics?.analysisReliability || 0,
        
        // Timestamps
        analyzedAt: analysisData.analyzedAt || new Date(),
        createdAt: serverTimestamp()
      };

      // Save to Firestore
      const docRef = doc(collection(db, POSE_USAGE_HISTORY));
      await setDoc(docRef, usageRecord);
      
      usageRecord.id = docRef.id;

      // Update cache
      if (this.quotaCache) {
        this.quotaCache.monthlyCount += 1;
        this.quotaCache.dailyCount = this.calculateDailyUsage([usageRecord, ...this.quotaCache.records]);
        this.quotaCache.records.unshift(usageRecord);
        this.quotaCache.lastAnalysis = usageRecord.analyzedAt;
        this.quotaCache.updatedAt = new Date();
        
        // Keep only recent records in cache
        if (this.quotaCache.records.length > 10) {
          this.quotaCache.records = this.quotaCache.records.slice(0, 10);
        }
        
        await this.saveToCache();
      }

      console.log('✅ Analysis usage recorded:', docRef.id);
      return usageRecord;
    } catch (error) {
      console.error('❌ Error recording analysis usage:', error);
      throw error;
    }
  }

  /**
   * Get subscription tier features
   */
  getFeatures(tier) {
    return POSE_TIER_CONFIG[tier]?.features || POSE_TIER_CONFIG[POSE_SUBSCRIPTION_TIERS.FREE].features;
  }

  /**
   * Get subscription tier limits
   */
  getLimits(tier) {
    return POSE_TIER_CONFIG[tier]?.limits || POSE_TIER_CONFIG[POSE_SUBSCRIPTION_TIERS.FREE].limits;
  }

  /**
   * Check if feature is available for current subscription
   */
  async hasFeature(featureName) {
    try {
      const subscription = await this.getSubscriptionStatus();
      return subscription.features[featureName] === true;
    } catch (error) {
      console.error('❌ Error checking feature availability:', error);
      return false;
    }
  }

  /**
   * Get upgrade options for current user
   */
  async getUpgradeOptions() {
    try {
      const subscription = await this.getSubscriptionStatus();
      const currentTier = subscription.poseAnalysisTier;
      const availableUpgrades = [];

      // Define upgrade paths
      const upgradePaths = {
        [POSE_SUBSCRIPTION_TIERS.FREE]: [POSE_SUBSCRIPTION_TIERS.PREMIUM, POSE_SUBSCRIPTION_TIERS.COACHING],
        [POSE_SUBSCRIPTION_TIERS.PREMIUM]: [POSE_SUBSCRIPTION_TIERS.COACHING]
      };

      const availableTiers = upgradePaths[currentTier] || [];
      
      for (const tier of availableTiers) {
        const config = POSE_TIER_CONFIG[tier];
        availableUpgrades.push({
          tier,
          name: config.name,
          price: config.price,
          currency: config.currency,
          interval: config.interval,
          features: config.features,
          limits: config.limits,
          benefits: this.getUpgradeBenefits(currentTier, tier)
        });
      }

      return {
        currentTier,
        currentTierName: POSE_TIER_CONFIG[currentTier].name,
        availableUpgrades
      };
    } catch (error) {
      console.error('❌ Error getting upgrade options:', error);
      return {
        currentTier: POSE_SUBSCRIPTION_TIERS.FREE,
        currentTierName: 'Free',
        availableUpgrades: []
      };
    }
  }

  /**
   * Get usage analytics for current user
   */
  async getUsageAnalytics(timeRange = '30d') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const startDate = this.calculateStartDate(timeRange);
      
      const usageQuery = query(
        collection(db, POSE_USAGE_HISTORY),
        where('userId', '==', user.uid),
        where('analyzedAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('analyzedAt', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(usageQuery);
      const records = [];
      
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });

      return this.processUsageAnalytics(records, timeRange);
    } catch (error) {
      console.error('❌ Error getting usage analytics:', error);
      return {
        totalUsage: 0,
        dailyAverage: 0,
        exerciseBreakdown: {},
        timeRange,
        period: { start: new Date(), end: new Date() }
      };
    }
  }

  /**
   * Private helper methods
   */

  /**
   * Determine pose analysis tier from subscription data
   */
  determinePoseAnalysisTier(subscriptionData) {
    if (!subscriptionData.subscribed || subscriptionData.status !== 'active') {
      return POSE_SUBSCRIPTION_TIERS.FREE;
    }

    // Map subscription types to pose analysis tiers
    const tierMapping = {
      'premium': POSE_SUBSCRIPTION_TIERS.PREMIUM,
      'coaching': POSE_SUBSCRIPTION_TIERS.COACHING,
      'pro': POSE_SUBSCRIPTION_TIERS.PREMIUM, // Legacy mapping
      'enterprise': POSE_SUBSCRIPTION_TIERS.COACHING
    };

    return tierMapping[subscriptionData.subscriptionType] || POSE_SUBSCRIPTION_TIERS.FREE;
  }

  /**
   * Calculate daily quota from monthly quota
   */
  calculateDailyQuota(monthlyQuota) {
    if (monthlyQuota === -1) return -1; // Unlimited
    return Math.ceil(monthlyQuota / 30); // Rough daily estimate
  }

  /**
   * Get current billing period
   */
  getCurrentBillingPeriod() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    
    return { start, end };
  }

  /**
   * Calculate daily usage from records
   */
  calculateDailyUsage(records) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return records.filter(record => {
      const recordDate = record.analyzedAt?.toDate ? record.analyzedAt.toDate() : record.analyzedAt;
      if (!recordDate) return false;
      
      const recordDateOnly = new Date(recordDate);
      recordDateOnly.setHours(0, 0, 0, 0);
      
      return recordDateOnly.getTime() === today.getTime();
    }).length;
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
   * Process usage analytics from records
   */
  processUsageAnalytics(records, timeRange) {
    const analytics = {
      totalUsage: records.length,
      dailyAverage: 0,
      exerciseBreakdown: {},
      tierBreakdown: {},
      timeRange,
      period: {
        start: records[records.length - 1]?.analyzedAt?.toDate() || new Date(),
        end: records[0]?.analyzedAt?.toDate() || new Date()
      }
    };

    if (records.length === 0) return analytics;

    // Exercise breakdown
    records.forEach(record => {
      const exercise = record.exerciseType || 'unknown';
      analytics.exerciseBreakdown[exercise] = (analytics.exerciseBreakdown[exercise] || 0) + 1;
      
      const tier = record.subscriptionTier || 'free';
      analytics.tierBreakdown[tier] = (analytics.tierBreakdown[tier] || 0) + 1;
    });

    // Calculate daily average
    const daysDiff = Math.max(1, Math.ceil((analytics.period.end - analytics.period.start) / (1000 * 60 * 60 * 24)));
    analytics.dailyAverage = Math.round((analytics.totalUsage / daysDiff) * 10) / 10;

    return analytics;
  }

  /**
   * Get upgrade benefits comparison
   */
  getUpgradeBenefits(fromTier, toTier) {
    const fromFeatures = POSE_TIER_CONFIG[fromTier].features;
    const toFeatures = POSE_TIER_CONFIG[toTier].features;
    const fromLimits = POSE_TIER_CONFIG[fromTier].limits;
    const toLimits = POSE_TIER_CONFIG[toTier].limits;

    const benefits = [];

    // Feature comparisons
    Object.keys(toFeatures).forEach(feature => {
      if (toFeatures[feature] && !fromFeatures[feature]) {
        benefits.push({
          type: 'feature',
          name: feature,
          description: this.getFeatureDescription(feature)
        });
      }
    });

    // Limit improvements
    Object.keys(toLimits).forEach(limit => {
      if (toLimits[limit] > fromLimits[limit]) {
        benefits.push({
          type: 'limit',
          name: limit,
          from: fromLimits[limit],
          to: toLimits[limit],
          improvement: toLimits[limit] / fromLimits[limit]
        });
      }
    });

    return benefits;
  }

  /**
   * Get human-readable feature descriptions
   */
  getFeatureDescription(featureName) {
    const descriptions = {
      'basicFeedback': 'Basic form feedback and scoring',
      'advancedInsights': 'Detailed biomechanical analysis and insights',
      'unlimitedAnalyses': 'Unlimited pose analyses per month',
      'pdfReports': 'Downloadable PDF analysis reports',
      'priorityProcessing': 'Faster analysis processing',
      'trainerSharing': 'Share analyses with trainers and coaches',
      'videoStorage': 'Cloud video storage for your analyses',
      'formComparison': 'Compare form across multiple sessions',
      'progressTracking': 'Advanced progress tracking and trends'
    };
    
    return descriptions[featureName] || featureName;
  }

  /**
   * Cache management
   */
  isCacheValid() {
    return this.lastCacheUpdate && (Date.now() - this.lastCacheUpdate) < this.cacheTimeout;
  }

  async loadFromCache() {
    try {
      const subscriptionCache = await AsyncStorage.getItem(POSE_SUBSCRIPTION_CACHE);
      const quotaCache = await AsyncStorage.getItem(POSE_QUOTA_CACHE);
      const billingCache = await AsyncStorage.getItem(POSE_BILLING_CACHE);
      
      if (subscriptionCache) {
        const data = JSON.parse(subscriptionCache);
        this.subscriptionCache = data.subscription;
        this.lastCacheUpdate = data.timestamp;
      }
      
      if (quotaCache) {
        this.quotaCache = JSON.parse(quotaCache);
      }
      
      if (billingCache) {
        this.billingCache = JSON.parse(billingCache);
      }
    } catch (error) {
      console.error('❌ Error loading subscription cache:', error);
    }
  }

  async saveToCache() {
    try {
      if (this.subscriptionCache) {
        await AsyncStorage.setItem(POSE_SUBSCRIPTION_CACHE, JSON.stringify({
          subscription: this.subscriptionCache,
          timestamp: this.lastCacheUpdate
        }));
      }
      
      if (this.quotaCache) {
        await AsyncStorage.setItem(POSE_QUOTA_CACHE, JSON.stringify(this.quotaCache));
      }
      
      if (this.billingCache) {
        await AsyncStorage.setItem(POSE_BILLING_CACHE, JSON.stringify(this.billingCache));
      }
    } catch (error) {
      console.error('❌ Error saving subscription cache:', error);
    }
  }

  /**
   * Refresh subscription status from server
   */
  async refreshSubscriptionStatus() {
    this.subscriptionCache = null;
    this.quotaCache = null;
    this.lastCacheUpdate = null;
    return await this.getSubscriptionStatus(true);
  }

  /**
   * Clear all cache
   */
  async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        POSE_SUBSCRIPTION_CACHE,
        POSE_QUOTA_CACHE,
        POSE_BILLING_CACHE
      ]);
      
      this.subscriptionCache = null;
      this.quotaCache = null;
      this.billingCache = null;
      this.lastCacheUpdate = null;
      
      console.log('🗑️ Pose subscription cache cleared');
    } catch (error) {
      console.error('❌ Error clearing subscription cache:', error);
    }
  }

  /**
   * Create Stripe checkout session for pose analysis subscription
   */
  async createCheckoutSession({ 
    tier, 
    source = 'pose_upgrade_screen', 
    context = 'upgrade',
    feature = null,
    abTestVariant = null,
    userId = null
  }) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('💳 Creating checkout session for pose analysis...', {
        tier,
        source,
        context
      });

      // Get price ID based on tier
      const priceConfig = this.getTierPriceConfig(tier);
      if (!priceConfig.priceId) {
        throw new Error(`No price configuration for tier: ${tier}`);
      }

      // Create checkout session via Firebase Function
      const createCheckoutFunction = httpsCallable(functions, 'createCheckout');
      const result = await createCheckoutFunction({
        priceId: priceConfig.priceId,
        tier,
        source,
        context,
        feature,
        abTestVariant,
        userId: user.uid,
        metadata: {
          poseAnalysisTier: tier,
          upgradeSource: source,
          upgradeContext: context,
          abTestVariant: abTestVariant || 'none',
          timestamp: new Date().toISOString()
        }
      });

      if (!result.data || !result.data.sessionId) {
        throw new Error(result.data?.error || 'Failed to create checkout session');
      }

      console.log('✅ Checkout session created:', result.data.sessionId);

      return {
        success: true,
        sessionId: result.data.sessionId,
        checkoutUrl: result.data.checkoutUrl,
        tier,
        priceId: priceConfig.priceId,
        amount: priceConfig.amount,
        currency: priceConfig.currency
      };

    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code || 'checkout_creation_failed'
      };
    }
  }

  /**
   * Get price configuration for subscription tier
   */
  getTierPriceConfig(tier) {
    const priceConfigs = {
      [POSE_SUBSCRIPTION_TIERS.PREMIUM]: {
        priceId: 'price_pose_premium_monthly', // To be configured in Stripe
        amount: 999, // $9.99 in cents
        currency: 'usd',
        interval: 'month'
      },
      [POSE_SUBSCRIPTION_TIERS.COACHING]: {
        priceId: 'price_pose_coaching_monthly', // To be configured in Stripe
        amount: 1999, // $19.99 in cents  
        currency: 'usd',
        interval: 'month'
      }
    };

    return priceConfigs[tier] || {};
  }

  /**
   * Handle successful subscription upgrade
   */
  async handleUpgradeSuccess(subscriptionData) {
    try {
      console.log('🎉 Subscription upgrade successful:', subscriptionData);

      // Clear cache to force refresh
      await this.clearCache();

      // Refresh subscription status
      const updatedSubscription = await this.getSubscriptionStatus(true);

      // Track successful upgrade
      const analytics = {
        event: 'pose_subscription_upgraded',
        tier: subscriptionData.tier,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency,
        source: subscriptionData.source,
        timestamp: new Date().toISOString()
      };

      console.log('📊 Upgrade analytics:', analytics);

      return {
        success: true,
        subscription: updatedSubscription,
        analytics
      };

    } catch (error) {
      console.error('❌ Error handling upgrade success:', error);
      
      return {
        success: false,
        error: error.message,
        subscription: null
      };
    }
  }

  /**
   * Get upgrade options based on current tier
   */
  getUpgradeOptions(currentTier = POSE_SUBSCRIPTION_TIERS.FREE) {
    const allTiers = [
      POSE_SUBSCRIPTION_TIERS.FREE,
      POSE_SUBSCRIPTION_TIERS.PREMIUM,
      POSE_SUBSCRIPTION_TIERS.COACHING
    ];

    const currentIndex = allTiers.indexOf(currentTier);
    const availableUpgrades = allTiers.slice(currentIndex + 1);

    return availableUpgrades.map(tier => ({
      tier,
      config: POSE_TIER_CONFIG[tier],
      priceConfig: this.getTierPriceConfig(tier),
      benefits: this.getTierBenefits(currentTier, tier),
      savings: this.calculateSavings(currentTier, tier)
    }));
  }

  /**
   * Get benefits gained by upgrading from current tier to target tier
   */
  getTierBenefits(fromTier, toTier) {
    const fromFeatures = POSE_TIER_CONFIG[fromTier]?.features || [];
    const toFeatures = POSE_TIER_CONFIG[toTier]?.features || [];
    
    const newFeatures = toFeatures.filter(feature => !fromFeatures.includes(feature));
    
    return {
      newFeatures,
      quotaIncrease: this.getQuotaIncrease(fromTier, toTier),
      premiumFeatures: newFeatures.length,
      description: this.getUpgradeDescription(fromTier, toTier)
    };
  }

  /**
   * Calculate quota increase from tier upgrade
   */
  getQuotaIncrease(fromTier, toTier) {
    const fromQuota = POSE_TIER_CONFIG[fromTier]?.analysisQuota || 0;
    const toQuota = POSE_TIER_CONFIG[toTier]?.analysisQuota || 0;
    
    if (toQuota === -1) {
      return 'unlimited';
    }
    
    return Math.max(0, toQuota - fromQuota);
  }

  /**
   * Get upgrade description
   */
  getUpgradeDescription(fromTier, toTier) {
    const descriptions = {
      [`${POSE_SUBSCRIPTION_TIERS.FREE}_${POSE_SUBSCRIPTION_TIERS.PREMIUM}`]: 
        'Unlock unlimited analyses with advanced AI insights and progress tracking',
      [`${POSE_SUBSCRIPTION_TIERS.FREE}_${POSE_SUBSCRIPTION_TIERS.COACHING}`]:
        'Get everything in Premium plus professional reports and trainer collaboration',
      [`${POSE_SUBSCRIPTION_TIERS.PREMIUM}_${POSE_SUBSCRIPTION_TIERS.COACHING}`]:
        'Upgrade to professional features with PDF reports and trainer sharing'
    };

    return descriptions[`${fromTier}_${toTier}`] || 'Upgrade to access more features';
  }

  /**
   * Calculate savings for tier upgrade
   */
  calculateSavings(fromTier, toTier) {
    const fromPrice = this.getTierPriceConfig(fromTier).amount || 0;
    const toPrice = this.getTierPriceConfig(toTier).amount || 0;
    
    // This could be expanded to include promotional pricing logic
    return {
      monthlySavings: 0, // No current discount structure
      annualSavings: 0,
      promoAvailable: false
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.subscriptionCache = null;
    this.quotaCache = null;
    this.billingCache = null;
    this.lastCacheUpdate = null;
    this.isInitialized = false;
    console.log('🔐 Pose Subscription Service destroyed');
  }
}

// Create and export singleton instance
const poseSubscriptionService = new PoseSubscriptionService();
export default poseSubscriptionService;

// Export class for custom instances
export { PoseSubscriptionService };