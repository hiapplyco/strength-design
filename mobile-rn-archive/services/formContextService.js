/**
 * Form Context Service - Mobile Integration
 * Provides mobile app integration with Firebase Functions for form context and AI coaching
 * Issue #16 - Stream A: Form Context Builder & Data Integration
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const FORM_CONTEXT_CACHE_KEY = '@form_context_cache';
const COMPETENCY_CACHE_KEY = '@competency_cache';
const COACHING_PREFERENCES_KEY = '@coaching_preferences';

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
  FORM_CONTEXT: 5 * 60 * 1000,      // 5 minutes
  COMPETENCY: 30 * 60 * 1000,       // 30 minutes  
  HISTORICAL_DATA: 60 * 60 * 1000   // 1 hour
};

/**
 * Form Context Service Class
 * Manages form analysis context for AI coaching integration
 */
class FormContextService {
  constructor() {
    this.isInitialized = false;
    this.contextCache = new Map();
    this.competencyCache = new Map();
    this.requestQueue = new Map(); // Prevent duplicate requests
    
    // Initialize Firebase Functions
    this.summarizeFormData = httpsCallable(functions, 'summarizeFormData');
    this.calculateFormCompetency = httpsCallable(functions, 'calculateFormCompetency');
    this.buildFormContext = httpsCallable(functions, 'buildFormContext');
    this.getHistoricalFormContext = httpsCallable(functions, 'getHistoricalFormContext');

    // Default coaching preferences
    this.defaultPreferences = {
      coachingStyle: 'supportive', // 'supportive', 'direct', 'technical'
      feedbackDetail: 'balanced',  // 'minimal', 'balanced', 'detailed'
      focusAreas: [],
      preferredLanguage: 'english',
      experienceLevel: 'auto',     // 'auto', 'beginner', 'intermediate', 'advanced'
      contextType: 'comprehensive' // 'minimal', 'focused', 'comprehensive'
    };

    this.preferences = { ...this.defaultPreferences };
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      console.log('🎯 Initializing Form Context Service...');
      
      // Load cached preferences
      await this.loadCoachingPreferences();
      
      // Load cached data
      await this.loadFromCache();
      
      this.isInitialized = true;
      console.log('✅ Form Context Service initialized');
      
      return {
        success: true,
        message: 'Form context service initialized successfully'
      };
    } catch (error) {
      console.error('❌ Error initializing form context service:', error);
      return {
        success: false,
        message: `Initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Summarize form analysis data for AI consumption
   */
  async summarizeAnalysisData(analysisData, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        compressionLevel = 'balanced',
        targetTokens = 1500,
        includeDetails = true
      } = options;

      console.log('📊 Summarizing form analysis data...', {
        exerciseType: analysisData.exerciseType,
        compressionLevel,
        targetTokens
      });

      // Check cache first
      const cacheKey = `summary_${analysisData.id || 'current'}_${compressionLevel}`;
      const cached = this.contextCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL.FORM_CONTEXT) {
        console.log('📋 Using cached form summary');
        return cached.data;
      }

      // Check if request is already in progress
      if (this.requestQueue.has(cacheKey)) {
        console.log('⏳ Waiting for existing summarization request...');
        return await this.requestQueue.get(cacheKey);
      }

      // Create the request promise
      const requestPromise = this.performSummarization(analysisData, {
        compressionLevel,
        targetTokens,
        includeDetails
      });

      this.requestQueue.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;
        
        // Cache the result
        this.contextCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        // Save to persistent cache
        await this.saveToCache();
        
        return result;
      } finally {
        this.requestQueue.delete(cacheKey);
      }

    } catch (error) {
      console.error('❌ Error summarizing analysis data:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive form context for AI coaching
   */
  async buildAICoachingContext(currentAnalysis, exerciseType, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        contextType = this.preferences.contextType,
        includeHistory = true,
        targetTokens = 2000
      } = options;

      console.log('🧠 Building AI coaching context...', {
        exerciseType,
        contextType,
        includeHistory,
        targetTokens
      });

      // Check cache first
      const cacheKey = `context_${exerciseType}_${contextType}_${includeHistory}`;
      const cached = this.contextCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL.FORM_CONTEXT) {
        console.log('📋 Using cached form context');
        return cached.data;
      }

      // Check if request is already in progress
      if (this.requestQueue.has(cacheKey)) {
        console.log('⏳ Waiting for existing context building request...');
        return await this.requestQueue.get(cacheKey);
      }

      // Create the request promise
      const requestPromise = this.performContextBuilding(
        currentAnalysis, 
        exerciseType, 
        contextType, 
        includeHistory, 
        targetTokens
      );

      this.requestQueue.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;
        
        // Cache the result
        this.contextCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        // Save to persistent cache
        await this.saveToCache();
        
        return result;
      } finally {
        this.requestQueue.delete(cacheKey);
      }

    } catch (error) {
      console.error('❌ Error building AI coaching context:', error);
      throw error;
    }
  }

  /**
   * Get user's form competency level for an exercise
   */
  async getFormCompetency(exerciseType, progressData = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📈 Getting form competency level...', { exerciseType });

      // Check cache first
      const cacheKey = `competency_${exerciseType}`;
      const cached = this.competencyCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL.COMPETENCY) {
        console.log('📋 Using cached competency data');
        return cached.data;
      }

      // If no progress data provided, we need to get it from progress service
      if (!progressData) {
        try {
          // Dynamic import to avoid circular dependencies
          const { default: poseProgressService } = await import('./poseProgressService');
          const progress = await poseProgressService.getExerciseProgress(exerciseType, {
            limit: 20,
            timeRange: '90d',
            includeDetails: false
          });
          progressData = progress;
        } catch (progressError) {
          console.warn('⚠️ Could not get progress data:', progressError);
          progressData = [];
        }
      }

      // Calculate competency
      const result = await this.calculateFormCompetency.call({
        progressData,
        exerciseType
      });

      if (result.data.success) {
        // Cache the result
        this.competencyCache.set(cacheKey, {
          data: result.data.competency,
          timestamp: Date.now()
        });
        
        return result.data.competency;
      } else {
        throw new Error('Competency calculation failed');
      }

    } catch (error) {
      console.error('❌ Error getting form competency:', error);
      
      // Return default competency on error
      return {
        level: 'beginner',
        score: 0,
        confidence: 0,
        sessionCount: 0,
        strengths: [],
        weaknesses: [],
        trend: 'stable'
      };
    }
  }

  /**
   * Get historical form context data
   */
  async getHistoricalContext(exerciseType, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        timeRange = '30d',
        limit = 15,
        includeDetails = false
      } = options;

      console.log('📚 Getting historical form context...', {
        exerciseType,
        timeRange,
        limit
      });

      // Check cache first
      const cacheKey = `historical_${exerciseType}_${timeRange}_${limit}`;
      const cached = this.contextCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL.HISTORICAL_DATA) {
        console.log('📋 Using cached historical context');
        return cached.data;
      }

      // Get historical data from Firebase Function
      const result = await this.getHistoricalFormContext.call({
        exerciseType,
        timeRange,
        limit,
        includeDetails
      });

      if (result.data.success) {
        // Cache the result
        this.contextCache.set(cacheKey, {
          data: result.data.historicalContext,
          timestamp: Date.now()
        });
        
        // Save to persistent cache
        await this.saveToCache();
        
        return result.data.historicalContext;
      } else {
        throw new Error('Historical context retrieval failed');
      }

    } catch (error) {
      console.error('❌ Error getting historical context:', error);
      
      // Return empty context on error
      return {
        sessions: [],
        timeRange,
        trends: {},
        statistics: {
          totalSessions: 0,
          averageScore: 0,
          bestScore: 0,
          mostRecentScore: 0
        }
      };
    }
  }

  /**
   * Update coaching preferences
   */
  async updateCoachingPreferences(preferences) {
    try {
      const updatedPreferences = {
        ...this.preferences,
        ...preferences,
        updatedAt: new Date().toISOString()
      };

      this.preferences = updatedPreferences;
      
      // Save to persistent storage
      await AsyncStorage.setItem(
        COACHING_PREFERENCES_KEY,
        JSON.stringify(updatedPreferences)
      );

      // Clear context cache since preferences changed
      this.contextCache.clear();

      console.log('✅ Coaching preferences updated:', preferences);
      
      return updatedPreferences;
    } catch (error) {
      console.error('❌ Error updating coaching preferences:', error);
      throw error;
    }
  }

  /**
   * Get current coaching preferences
   */
  getCoachingPreferences() {
    return { ...this.preferences };
  }

  /**
   * Generate AI coaching prompt with context
   */
  async generateCoachingPrompt(analysisData, exerciseType, options = {}) {
    try {
      const {
        includeHistory = true,
        customPrompt = null,
        contextType = this.preferences.contextType
      } = options;

      // Build comprehensive context
      const context = await this.buildAICoachingContext(
        analysisData,
        exerciseType,
        { contextType, includeHistory }
      );

      // Create coaching prompt structure
      const prompt = {
        system: this.generateSystemPrompt(context),
        context,
        analysisData,
        customInstructions: customPrompt,
        preferences: this.preferences,
        generatedAt: new Date().toISOString()
      };

      console.log('💬 Generated coaching prompt for AI', {
        exerciseType,
        contextType,
        includeHistory,
        estimatedTokens: this.estimateTokenCount(JSON.stringify(prompt))
      });

      return prompt;
    } catch (error) {
      console.error('❌ Error generating coaching prompt:', error);
      throw error;
    }
  }

  /**
   * Private implementation methods
   */

  async performSummarization(analysisData, options) {
    const result = await this.summarizeFormData.call({
      analysisData,
      options
    });

    if (result.data.success) {
      return result.data.summary;
    } else {
      throw new Error('Form data summarization failed');
    }
  }

  async performContextBuilding(currentAnalysis, exerciseType, contextType, includeHistory, targetTokens) {
    const result = await this.buildFormContext.call({
      currentAnalysis,
      exerciseType,
      contextType,
      includeHistory,
      targetTokens
    });

    if (result.data.success) {
      return result.data.context;
    } else {
      throw new Error('Form context building failed');
    }
  }

  generateSystemPrompt(context) {
    const { userProfile, coachingProfile } = context;
    
    const systemPrompt = `You are an expert fitness coach providing personalized form analysis and coaching for ${context.exerciseName}.

User Profile:
- Experience Level: ${userProfile.experienceLevel}
- Competency Score: ${userProfile.competencyScore}/100
- Session Count: ${userProfile.sessionCount}
- Consistency: ${userProfile.consistency}%

Coaching Guidelines:
- Communication Style: ${coachingProfile.communicationStyle}
- Target Audience: ${coachingProfile.targetAudience}
- Feedback Level: ${coachingProfile.feedbackLevel}
- Tone: ${coachingProfile.tone}
- Focus Areas: ${coachingProfile.focusAreas.join(', ') || 'general improvement'}

Instructions:
${coachingProfile.guidelines}

Provide specific, actionable feedback based on the form analysis results. Focus on the most impactful improvements while maintaining an ${coachingProfile.communicationStyle} approach suitable for a ${coachingProfile.targetAudience} level athlete.`;

    return systemPrompt;
  }

  /**
   * Cache management methods
   */

  async loadFromCache() {
    try {
      const cached = await AsyncStorage.getItem(FORM_CONTEXT_CACHE_KEY);
      if (cached) {
        const cacheData = JSON.parse(cached);
        
        // Restore context cache
        if (cacheData.contexts) {
          cacheData.contexts.forEach(([key, value]) => {
            this.contextCache.set(key, value);
          });
        }
        
        // Restore competency cache
        if (cacheData.competencies) {
          cacheData.competencies.forEach(([key, value]) => {
            this.competencyCache.set(key, value);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading from cache:', error);
    }
  }

  async saveToCache() {
    try {
      const cacheData = {
        contexts: Array.from(this.contextCache.entries()),
        competencies: Array.from(this.competencyCache.entries()),
        savedAt: Date.now()
      };

      await AsyncStorage.setItem(FORM_CONTEXT_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error saving to cache:', error);
    }
  }

  async loadCoachingPreferences() {
    try {
      const stored = await AsyncStorage.getItem(COACHING_PREFERENCES_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        this.preferences = { ...this.defaultPreferences, ...preferences };
      }
    } catch (error) {
      console.error('❌ Error loading coaching preferences:', error);
    }
  }

  /**
   * Cache cleanup methods
   */

  clearCache() {
    this.contextCache.clear();
    this.competencyCache.clear();
    console.log('🗑️ Form context cache cleared');
  }

  async clearPersistentCache() {
    try {
      await AsyncStorage.multiRemove([
        FORM_CONTEXT_CACHE_KEY,
        COMPETENCY_CACHE_KEY
      ]);
      this.clearCache();
      console.log('🗑️ Persistent form context cache cleared');
    } catch (error) {
      console.error('❌ Error clearing persistent cache:', error);
    }
  }

  /**
   * Utility methods
   */

  estimateTokenCount(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  getServiceStatus() {
    return {
      initialized: this.isInitialized,
      preferences: this.preferences,
      cacheSize: {
        context: this.contextCache.size,
        competency: this.competencyCache.size
      },
      requestQueue: this.requestQueue.size
    };
  }

  /**
   * Integration helper methods for AI coaching
   */

  /**
   * Prepare context for specific AI coaching scenarios
   */
  async prepareContextForScenario(analysisData, exerciseType, scenario) {
    const scenarios = {
      // Post-workout immediate feedback
      immediate: {
        contextType: 'focused',
        includeHistory: false,
        targetTokens: 1000
      },
      
      // Comprehensive analysis and coaching
      detailed: {
        contextType: 'comprehensive',
        includeHistory: true,
        targetTokens: 2000
      },
      
      // Quick form check during workout
      realtime: {
        contextType: 'minimal',
        includeHistory: false,
        targetTokens: 500
      },
      
      // Progress review and planning
      progress: {
        contextType: 'comprehensive',
        includeHistory: true,
        targetTokens: 2500
      }
    };

    const config = scenarios[scenario] || scenarios.detailed;
    
    return await this.buildAICoachingContext(analysisData, exerciseType, config);
  }

  /**
   * Get form context optimized for mobile display
   */
  async getMobileOptimizedContext(analysisData, exerciseType) {
    try {
      const context = await this.buildAICoachingContext(analysisData, exerciseType, {
        contextType: 'focused',
        includeHistory: true,
        targetTokens: 1500
      });

      // Extract key information for mobile UI
      return {
        currentScore: context.currentSession?.overallScore || 0,
        competencyLevel: context.userProfile.experienceLevel,
        topErrors: (context.currentSession?.criticalErrors || []).slice(0, 3),
        topImprovements: (context.currentSession?.improvements || []).slice(0, 3),
        progressTrend: context.progressContext?.recentPerformance?.trend || 'stable',
        strengths: context.progressContext?.strengths || [],
        commonIssues: context.progressContext?.commonIssues || [],
        coachingStyle: context.coachingProfile.communicationStyle,
        fullContext: context
      };
    } catch (error) {
      console.error('❌ Error getting mobile optimized context:', error);
      return {
        currentScore: 0,
        competencyLevel: 'beginner',
        topErrors: [],
        topImprovements: [],
        progressTrend: 'stable',
        strengths: [],
        commonIssues: [],
        coachingStyle: 'supportive',
        fullContext: null
      };
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.clearCache();
    this.requestQueue.clear();
    this.isInitialized = false;
    console.log('🔄 Form Context Service destroyed');
  }
}

// Create singleton instance
const formContextService = new FormContextService();

export default formContextService;