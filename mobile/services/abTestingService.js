/**
 * A/B Testing Service for Premium Feature Optimization
 * 
 * Provides comprehensive A/B testing framework for optimizing premium feature conversion rates.
 * Tracks user interactions, manages test variants, and provides analytics for optimization.
 * 
 * Features:
 * - Dynamic test configuration
 * - User cohort management
 * - Conversion tracking
 * - Statistical analysis
 * - Real-time optimization
 * - Performance monitoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Cache keys
const AB_TEST_CACHE = '@ab_test_cache';
const USER_COHORT_CACHE = '@user_cohort_cache';
const CONVERSION_EVENTS_CACHE = '@conversion_events_cache';

// Collection names
const AB_TESTS_COLLECTION = 'abTests';
const USER_COHORTS_COLLECTION = 'userCohorts';
const CONVERSION_EVENTS_COLLECTION = 'conversionEvents';
const AB_TEST_RESULTS_COLLECTION = 'abTestResults';

/**
 * A/B Test Configurations for Premium Features
 */
export const AB_TEST_CONFIGS = {
  // Premium Gate Variants
  PREMIUM_GATE_MESSAGING: {
    id: 'premium_gate_messaging_v1',
    name: 'Premium Gate Messaging Test',
    status: 'active',
    startDate: new Date('2025-08-27'),
    endDate: new Date('2025-09-27'),
    trafficAllocation: 1.0, // 100% of users
    variants: {
      control: {
        weight: 0.5,
        name: 'Standard Messaging',
        config: {
          messageStyle: 'standard',
          emphasis: 'features',
          urgency: 'low',
          visualStyle: 'clean'
        }
      },
      variant_a: {
        weight: 0.5,
        name: 'Benefit-Focused',
        config: {
          messageStyle: 'benefit_focused',
          emphasis: 'outcomes',
          urgency: 'medium',
          visualStyle: 'engaging'
        }
      }
    },
    metrics: ['view_rate', 'click_rate', 'conversion_rate', 'time_to_convert'],
    segments: ['free_users', 'quota_approaching', 'consistent_users']
  },

  // Upgrade Prompt Variants
  UPGRADE_PROMPT_DESIGN: {
    id: 'upgrade_prompt_design_v1',
    name: 'Upgrade Prompt Design Test',
    status: 'active',
    startDate: new Date('2025-08-27'),
    endDate: new Date('2025-09-27'),
    trafficAllocation: 1.0,
    variants: {
      control: {
        weight: 0.33,
        name: 'Modal Style',
        config: {
          displayType: 'modal',
          animation: 'fade',
          dismissible: true,
          showProgress: false
        }
      },
      variant_a: {
        weight: 0.33,
        name: 'Banner Style',
        config: {
          displayType: 'banner',
          animation: 'slide',
          dismissible: true,
          showProgress: true
        }
      },
      variant_b: {
        weight: 0.34,
        name: 'Fullscreen Style',
        config: {
          displayType: 'fullscreen',
          animation: 'slide',
          dismissible: false,
          showProgress: true
        }
      }
    },
    metrics: ['impression_rate', 'engagement_rate', 'conversion_rate', 'bounce_rate'],
    segments: ['quota_exceeded', 'feature_blocked', 'progress_motivated']
  },

  // Feature Comparison Variants
  FEATURE_COMPARISON_LAYOUT: {
    id: 'feature_comparison_layout_v1',
    name: 'Feature Comparison Layout Test',
    status: 'active',
    startDate: new Date('2025-08-27'),
    endDate: new Date('2025-09-27'),
    trafficAllocation: 0.8, // 80% of users
    variants: {
      control: {
        weight: 0.5,
        name: 'Table Layout',
        config: {
          layout: 'table',
          highlighting: 'minimal',
          pricing: 'prominent',
          recommendations: true
        }
      },
      variant_a: {
        weight: 0.5,
        name: 'Card Layout',
        config: {
          layout: 'cards',
          highlighting: 'aggressive',
          pricing: 'subtle',
          recommendations: true
        }
      }
    },
    metrics: ['view_time', 'interaction_rate', 'conversion_rate', 'plan_selection_rate'],
    segments: ['comparison_viewers', 'price_sensitive', 'feature_focused']
  },

  // Pricing Display Variants
  PRICING_PSYCHOLOGY: {
    id: 'pricing_psychology_v1',
    name: 'Pricing Psychology Test',
    status: 'active',
    startDate: new Date('2025-08-27'),
    endDate: new Date('2025-09-27'),
    trafficAllocation: 1.0,
    variants: {
      control: {
        weight: 0.25,
        name: 'Standard Pricing',
        config: {
          priceFormat: '$9.99/month',
          annualDiscount: false,
          freeTrialOffer: false,
          valueEmphasis: 'features'
        }
      },
      variant_a: {
        weight: 0.25,
        name: 'Annual Discount',
        config: {
          priceFormat: '$9.99/month',
          annualDiscount: true,
          freeTrialOffer: false,
          valueEmphasis: 'savings'
        }
      },
      variant_b: {
        weight: 0.25,
        name: 'Free Trial',
        config: {
          priceFormat: 'Free for 7 days',
          annualDiscount: false,
          freeTrialOffer: true,
          valueEmphasis: 'trial'
        }
      },
      variant_c: {
        weight: 0.25,
        name: 'Value Pricing',
        config: {
          priceFormat: 'Less than $0.33/day',
          annualDiscount: true,
          freeTrialOffer: true,
          valueEmphasis: 'value'
        }
      }
    },
    metrics: ['conversion_rate', 'time_to_convert', 'plan_completion_rate'],
    segments: ['price_conscious', 'trial_seekers', 'value_buyers']
  }
};

/**
 * A/B Testing Service Class
 */
class ABTestingService {
  constructor() {
    this.isInitialized = false;
    this.userCohorts = new Map();
    this.activeTests = new Map();
    this.conversionEvents = [];
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    this.lastCacheUpdate = null;

    console.log('🧪 ABTestingService: Initialized');
  }

  /**
   * Initialize the A/B testing service
   */
  async initialize() {
    try {
      console.log('🧪 Initializing A/B Testing Service...');
      
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Load cached data
      await this.loadFromCache();
      
      // Load active tests
      await this.loadActiveTests();
      
      // Assign user to cohorts
      await this.assignUserCohorts();
      
      this.isInitialized = true;
      console.log('✅ A/B Testing Service initialized');
      
      return {
        success: true,
        message: 'A/B testing service initialized successfully'
      };
    } catch (error) {
      console.error('❌ Error initializing A/B testing service:', error);
      return {
        success: false,
        message: `Initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Get variant for a specific test
   */
  async getVariant(testId, context = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if test exists and is active
      const testConfig = AB_TEST_CONFIGS[testId];
      if (!testConfig || testConfig.status !== 'active') {
        console.warn(`🧪 Test ${testId} not found or inactive, using control`);
        return {
          testId,
          variant: 'control',
          config: {},
          isControl: true
        };
      }

      // Check date range
      const now = new Date();
      if (now < testConfig.startDate || now > testConfig.endDate) {
        console.warn(`🧪 Test ${testId} outside date range, using control`);
        return {
          testId,
          variant: 'control',
          config: testConfig.variants.control?.config || {},
          isControl: true
        };
      }

      // Check traffic allocation
      const userHash = this.getUserHash(user.uid, testId);
      if (userHash > testConfig.trafficAllocation) {
        console.log(`🧪 User ${user.uid} not in test ${testId} traffic allocation`);
        return {
          testId,
          variant: 'control',
          config: testConfig.variants.control?.config || {},
          isControl: true
        };
      }

      // Check user segment eligibility
      if (testConfig.segments && testConfig.segments.length > 0) {
        const userSegment = await this.getUserSegment(context);
        if (!testConfig.segments.includes(userSegment)) {
          console.log(`🧪 User not in eligible segment for test ${testId}`);
          return {
            testId,
            variant: 'control',
            config: testConfig.variants.control?.config || {},
            isControl: true
          };
        }
      }

      // Get or assign variant
      let assignedVariant = this.userCohorts.get(`${testId}_${user.uid}`);
      
      if (!assignedVariant) {
        assignedVariant = this.assignVariant(testConfig, userHash);
        this.userCohorts.set(`${testId}_${user.uid}`, assignedVariant);
        
        // Store assignment in Firestore
        await this.storeUserCohort(testId, assignedVariant, context);
      }

      const variantConfig = testConfig.variants[assignedVariant]?.config || {};

      // Track exposure
      await this.trackEvent('test_exposure', {
        testId,
        variant: assignedVariant,
        context,
        userId: user.uid,
        timestamp: new Date()
      });

      console.log(`🧪 User assigned to test ${testId}, variant: ${assignedVariant}`);

      return {
        testId,
        variant: assignedVariant,
        config: variantConfig,
        isControl: assignedVariant === 'control',
        testConfig
      };

    } catch (error) {
      console.error('🧪 Error getting A/B test variant:', error);
      return {
        testId,
        variant: 'control',
        config: {},
        isControl: true,
        error: error.message
      };
    }
  }

  /**
   * Track conversion event
   */
  async trackConversion(testId, variant, conversionType, metadata = {}) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const conversionEvent = {
        testId,
        variant,
        conversionType,
        userId: user.uid,
        metadata,
        timestamp: serverTimestamp(),
        sessionId: this.getSessionId(),
        createdAt: serverTimestamp()
      };

      // Add to local cache
      this.conversionEvents.push(conversionEvent);

      // Store in Firestore
      await addDoc(collection(db, CONVERSION_EVENTS_COLLECTION), conversionEvent);

      console.log('🧪 Conversion tracked:', { testId, variant, conversionType });

      return conversionEvent;
    } catch (error) {
      console.error('🧪 Error tracking conversion:', error);
      throw error;
    }
  }

  /**
   * Track general event for A/B testing
   */
  async trackEvent(eventType, data = {}) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const event = {
        eventType,
        userId: user.uid,
        sessionId: this.getSessionId(),
        data,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      // Store in Firestore
      await addDoc(collection(db, CONVERSION_EVENTS_COLLECTION), event);

      console.log('🧪 Event tracked:', eventType, data);

    } catch (error) {
      console.error('🧪 Error tracking event:', error);
    }
  }

  /**
   * Get test results and analytics
   */
  async getTestResults(testId) {
    try {
      const testConfig = AB_TEST_CONFIGS[testId];
      if (!testConfig) {
        throw new Error(`Test ${testId} not found`);
      }

      // Query conversion events for this test
      const eventsQuery = query(
        collection(db, CONVERSION_EVENTS_COLLECTION),
        where('testId', '==', testId),
        orderBy('timestamp', 'desc'),
        limit(10000)
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      const events = [];
      eventsSnapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
      });

      // Calculate metrics by variant
      const results = {
        testId,
        testName: testConfig.name,
        status: testConfig.status,
        totalEvents: events.length,
        variants: {},
        summary: {
          totalExposures: 0,
          totalConversions: 0,
          overallConversionRate: 0,
          statisticalSignificance: false
        }
      };

      // Group events by variant
      const eventsByVariant = {};
      events.forEach(event => {
        const variant = event.variant || 'unknown';
        if (!eventsByVariant[variant]) {
          eventsByVariant[variant] = {
            exposures: 0,
            conversions: 0,
            events: []
          };
        }
        eventsByVariant[variant].events.push(event);
        
        if (event.eventType === 'test_exposure') {
          eventsByVariant[variant].exposures++;
        } else if (event.eventType === 'conversion' || event.conversionType) {
          eventsByVariant[variant].conversions++;
        }
      });

      // Calculate metrics for each variant
      Object.keys(eventsByVariant).forEach(variant => {
        const variantData = eventsByVariant[variant];
        const conversionRate = variantData.exposures > 0 ? 
          (variantData.conversions / variantData.exposures) : 0;

        results.variants[variant] = {
          name: testConfig.variants[variant]?.name || variant,
          exposures: variantData.exposures,
          conversions: variantData.conversions,
          conversionRate: conversionRate,
          conversionRatePercent: (conversionRate * 100).toFixed(2),
          events: variantData.events.length
        };

        results.summary.totalExposures += variantData.exposures;
        results.summary.totalConversions += variantData.conversions;
      });

      // Calculate overall conversion rate
      results.summary.overallConversionRate = results.summary.totalExposures > 0 ?
        (results.summary.totalConversions / results.summary.totalExposures) : 0;

      // Basic statistical significance test (simplified)
      const variants = Object.keys(results.variants);
      if (variants.length >= 2) {
        const controlVariant = results.variants.control || results.variants[variants[0]];
        const testVariant = results.variants[variants.find(v => v !== 'control')] || results.variants[variants[1]];
        
        results.summary.statisticalSignificance = 
          this.calculateStatisticalSignificance(controlVariant, testVariant);
      }

      console.log('🧪 Test results calculated:', testId);
      return results;

    } catch (error) {
      console.error('🧪 Error getting test results:', error);
      return {
        testId,
        error: error.message,
        variants: {},
        summary: { totalExposures: 0, totalConversions: 0, overallConversionRate: 0 }
      };
    }
  }

  /**
   * Private helper methods
   */

  /**
   * Generate consistent hash for user assignment
   */
  getUserHash(userId, testId) {
    const str = `${userId}_${testId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / Math.pow(2, 31); // Normalize to 0-1
  }

  /**
   * Assign variant based on weights and hash
   */
  assignVariant(testConfig, userHash) {
    const variants = Object.keys(testConfig.variants);
    let cumulativeWeight = 0;
    
    for (const variant of variants) {
      cumulativeWeight += testConfig.variants[variant].weight;
      if (userHash <= cumulativeWeight) {
        return variant;
      }
    }
    
    return variants[0] || 'control'; // Fallback
  }

  /**
   * Determine user segment for targeting
   */
  async getUserSegment(context) {
    try {
      // Analyze context to determine segment
      if (context.quotaUsagePercentage >= 100) return 'quota_exceeded';
      if (context.quotaUsagePercentage >= 80) return 'quota_approaching';
      if (context.analysisCount >= 10) return 'consistent_users';
      if (context.hasBlockedFeature) return 'feature_blocked';
      if (context.improvementDetected) return 'progress_motivated';
      if (context.viewingComparison) return 'comparison_viewers';
      if (context.pricePointFocus) return 'price_sensitive';
      
      return 'free_users'; // Default segment
    } catch (error) {
      console.warn('🧪 Error determining user segment:', error);
      return 'free_users';
    }
  }

  /**
   * Load active tests from configuration
   */
  async loadActiveTests() {
    Object.keys(AB_TEST_CONFIGS).forEach(testId => {
      const config = AB_TEST_CONFIGS[testId];
      if (config.status === 'active') {
        this.activeTests.set(testId, config);
      }
    });

    console.log(`🧪 Loaded ${this.activeTests.size} active tests`);
  }

  /**
   * Assign user to cohorts for all active tests
   */
  async assignUserCohorts() {
    const user = auth.currentUser;
    if (!user) return;

    // Load existing cohorts from Firestore
    try {
      const cohortsQuery = query(
        collection(db, USER_COHORTS_COLLECTION),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(cohortsQuery);
      snapshot.forEach(doc => {
        const data = doc.data();
        this.userCohorts.set(`${data.testId}_${data.userId}`, data.variant);
      });

      console.log(`🧪 Loaded ${this.userCohorts.size} user cohort assignments`);
    } catch (error) {
      console.warn('🧪 Error loading user cohorts:', error);
    }
  }

  /**
   * Store user cohort assignment
   */
  async storeUserCohort(testId, variant, context) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const cohortData = {
        testId,
        userId: user.uid,
        variant,
        context,
        assignedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, USER_COHORTS_COLLECTION), cohortData);
      
    } catch (error) {
      console.error('🧪 Error storing user cohort:', error);
    }
  }

  /**
   * Simple statistical significance calculation
   */
  calculateStatisticalSignificance(controlVariant, testVariant) {
    // Simplified chi-square test
    const controlRate = controlVariant.conversionRate;
    const testRate = testVariant.conversionRate;
    const controlSample = controlVariant.exposures;
    const testSample = testVariant.exposures;

    if (controlSample < 30 || testSample < 30) {
      return false; // Not enough data
    }

    const pooledRate = (controlVariant.conversions + testVariant.conversions) / 
                     (controlSample + testSample);
    
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlSample + 1/testSample));
    const zScore = Math.abs(controlRate - testRate) / standardError;
    
    return zScore > 1.96; // 95% confidence level
  }

  /**
   * Get session ID for tracking
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Cache management
   */
  async loadFromCache() {
    try {
      const [testCache, cohortCache, eventsCache] = await Promise.all([
        AsyncStorage.getItem(AB_TEST_CACHE),
        AsyncStorage.getItem(USER_COHORT_CACHE),
        AsyncStorage.getItem(CONVERSION_EVENTS_CACHE)
      ]);

      if (cohortCache) {
        const cohortData = JSON.parse(cohortCache);
        cohortData.forEach(item => {
          this.userCohorts.set(`${item.testId}_${item.userId}`, item.variant);
        });
      }

      if (eventsCache) {
        this.conversionEvents = JSON.parse(eventsCache);
      }

      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.warn('🧪 Error loading A/B test cache:', error);
    }
  }

  async saveToCache() {
    try {
      const cohortData = Array.from(this.userCohorts.entries()).map(([key, variant]) => {
        const [testId, userId] = key.split('_');
        return { testId, userId, variant };
      });

      await Promise.all([
        AsyncStorage.setItem(USER_COHORT_CACHE, JSON.stringify(cohortData)),
        AsyncStorage.setItem(CONVERSION_EVENTS_CACHE, JSON.stringify(this.conversionEvents.slice(-100))) // Keep only recent events
      ]);

      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.warn('🧪 Error saving A/B test cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        AB_TEST_CACHE,
        USER_COHORT_CACHE,
        CONVERSION_EVENTS_CACHE
      ]);
      
      this.userCohorts.clear();
      this.conversionEvents = [];
      this.lastCacheUpdate = null;
      
      console.log('🗑️ A/B test cache cleared');
    } catch (error) {
      console.error('❌ Error clearing A/B test cache:', error);
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.userCohorts.clear();
    this.activeTests.clear();
    this.conversionEvents = [];
    this.isInitialized = false;
    console.log('🧪 A/B Testing Service destroyed');
  }
}

// Create and export singleton instance
const abTestingService = new ABTestingService();
export default abTestingService;

// Export class for custom instances
export { ABTestingService };