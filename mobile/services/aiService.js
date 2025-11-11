/**
 * AI Service - Form-Aware AI Coaching Integration
 * Issue #16 - Stream C: UI Integration & Seamless Experience
 * 
 * Provides comprehensive AI coaching services with form analysis integration
 * Connects form context from Stream A with enhanced AI functions from Stream B
 */

import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import contextAggregator from './contextAggregator';
import formContextService from './formContextService';

// Storage keys for AI coaching cache
const AI_COACHING_CACHE_KEY = '@ai_coaching_cache';
const COACHING_SESSION_KEY = '@coaching_session_state';
const AI_PREFERENCES_KEY = '@ai_preferences';

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
  COACHING_RESPONSE: 10 * 60 * 1000,    // 10 minutes
  FORM_CONTEXT: 5 * 60 * 1000,          // 5 minutes
  COACHING_SESSION: 60 * 60 * 1000,     // 1 hour
};

/**
 * AI Service Class - Form-Aware AI Coaching
 * Integrates form analysis context with AI coaching responses
 */
class AIService {
  constructor() {
    this.isInitialized = false;
    this.coachingCache = new Map();
    this.sessionState = {
      isFormContextActive: false,
      currentExercise: null,
      formAnalysisData: null,
      coachingStyle: 'supportive',
      lastFormAnalysis: null,
      sessionId: null,
    };
    
    // Initialize Firebase Functions
    this.enhancedChat = httpsCallable(functions, 'enhancedChat');
    this.generateFormAwareWorkout = httpsCallable(functions, 'generateFormAwareWorkout');
    this.getPersonalizedCoachingCues = httpsCallable(functions, 'getPersonalizedCoachingCues');
    this.adaptCoachingStyle = httpsCallable(functions, 'adaptCoachingStyle');
    
    // Legacy function for backward compatibility
    this.chatWithGemini = httpsCallable(functions, 'chatWithGemini');

    // Default AI preferences
    this.defaultPreferences = {
      formContextEnabled: true,
      autoDetectFormIssues: true,
      prioritizeFormFeedback: true,
      coachingPersonality: 'supportive', // 'supportive', 'direct', 'technical'
      formFeedbackLevel: 'balanced',     // 'minimal', 'balanced', 'detailed'
      showFormMetrics: true,
      showProgressIntegration: true,
      enableFormAwareness: true,
    };

    this.preferences = { ...this.defaultPreferences };
  }

  /**
   * Initialize the AI service with form context integration
   */
  async initialize() {
    try {
      console.log('🤖 Initializing AI Service with form-aware coaching...');

      // Load AI preferences
      await this.loadAIPreferences();

      // Load session state
      await this.loadSessionState();

      // Initialize form context service if enabled
      if (this.preferences.formContextEnabled) {
        await formContextService.initialize();
      }

      // Load cached data
      await this.loadFromCache();

      this.isInitialized = true;
      console.log('✅ AI Service initialized with form-aware coaching');

      return {
        success: true,
        message: 'AI service initialized successfully',
        formContextEnabled: this.preferences.formContextEnabled,
      };
    } catch (error) {
      console.error('❌ Error initializing AI service:', error);
      return {
        success: false,
        message: `AI service initialization failed: ${error.message}`,
      };
    }
  }

  /**
   * Enhanced chat with form context integration
   * This is the main method that integrates form analysis with AI responses
   */
  async chatWithFormContext(message, history = [], options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        includeFormContext = this.preferences.formContextEnabled,
        coachingStyle = this.sessionState.coachingStyle,
        exerciseType = this.sessionState.currentExercise,
        formAnalysisData = this.sessionState.formAnalysisData,
        contextType = 'focused',
      } = options;

      console.log('💬 Processing chat with form context...', {
        includeFormContext,
        coachingStyle,
        exerciseType,
        hasFormData: !!formAnalysisData,
      });

      // Check cache for similar requests
      const cacheKey = this.generateCacheKey(message, {
        includeFormContext,
        coachingStyle,
        exerciseType,
      });
      
      const cached = this.coachingCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL.COACHING_RESPONSE) {
        console.log('📋 Using cached form-aware coaching response');
        return this.enhanceResponseWithFormContext(cached.data, formAnalysisData);
      }

      // Prepare enhanced message with form context
      let enhancedMessage = message;
      let formContext = null;
      let coachingPreferences = null;

      if (includeFormContext && exerciseType && formAnalysisData) {
        try {
          // Build form context using Stream A services
          formContext = await formContextService.buildAICoachingContext(
            formAnalysisData,
            exerciseType,
            { contextType, includeHistory: true }
          );

          // Get coaching preferences
          coachingPreferences = {
            style: coachingStyle,
            formFeedbackLevel: this.preferences.formFeedbackLevel,
            prioritizeFormFeedback: this.preferences.prioritizeFormFeedback,
            autoDetectFormIssues: this.preferences.autoDetectFormIssues,
          };

          console.log('🎯 Form context integrated for AI coaching', {
            exerciseType,
            contextType,
            competencyLevel: formContext.userProfile?.experienceLevel,
            formScore: formContext.currentSession?.overallScore,
          });

        } catch (contextError) {
          console.warn('⚠️ Could not build form context:', contextError);
        }
      }

      // Get user context from existing aggregator
      const userContext = await contextAggregator.getContext();

      // Call enhanced chat function from Stream B
      const response = await this.enhancedChat({
        message: enhancedMessage,
        history,
        userProfile: userContext.user,
        contextData: userContext,
        // NEW: Form context integration from Stream B
        formContext,
        exerciseType,
        coachingPreferences,
      });

      const responseData = response.data;

      // Cache the response
      this.coachingCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
      });

      // Save to persistent cache
      await this.saveToCache();

      // Enhance response with form-specific information
      const enhancedResponse = this.enhanceResponseWithFormContext(
        responseData,
        formAnalysisData
      );

      // Track coaching interaction for adaptation
      if (formContext && coachingPreferences) {
        this.trackCoachingInteraction(message, enhancedResponse, {
          formContext,
          coachingPreferences,
          exerciseType,
        });
      }

      return enhancedResponse;

    } catch (error) {
      console.error('❌ Error in form-aware chat:', error);
      
      // Fallback to regular chat without form context
      try {
        console.log('🔄 Falling back to regular chat...');
        const fallbackResponse = await this.chatWithGemini({
          message,
          history,
          context: await contextAggregator.getContext(),
        });

        return {
          response: fallbackResponse.data?.response || fallbackResponse.data || '',
          formContextUsed: false,
          fallback: true,
          error: error.message,
        };
      } catch (fallbackError) {
        console.error('❌ Fallback chat also failed:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * Generate form-aware workout using enhanced AI functions
   */
  async generateFormAwareWorkout(options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        formAnalysisHistory = null,
        currentCompetency = null,
        targetMuscleGroups = [],
        workoutPreferences = {},
        includeFormContext = true,
      } = options;

      console.log('🏋️ Generating form-aware workout...', {
        includeFormContext,
        hasFormHistory: !!formAnalysisHistory,
        targetMuscleGroups,
      });

      // Get form analysis history if not provided
      let formHistory = formAnalysisHistory;
      if (!formHistory && includeFormContext) {
        // Get recent form analysis data from pose progress service
        try {
          const { default: poseProgressService } = await import('./poseProgressService');
          formHistory = await poseProgressService.getFormAnalysisHistory({
            limit: 10,
            timeRange: '30d',
          });
        } catch (error) {
          console.warn('⚠️ Could not get form analysis history:', error);
        }
      }

      // Calculate current competencies if not provided
      let competencies = currentCompetency;
      if (!competencies && includeFormContext && formHistory) {
        try {
          const exerciseTypes = [...new Set(formHistory.map(h => h.exerciseType))];
          competencies = {};
          
          for (const exerciseType of exerciseTypes) {
            competencies[exerciseType] = await formContextService.getFormCompetency(
              exerciseType,
              formHistory.filter(h => h.exerciseType === exerciseType)
            );
          }
        } catch (error) {
          console.warn('⚠️ Could not calculate competencies:', error);
        }
      }

      // Call Firebase Function from Stream B
      const result = await this.generateFormAwareWorkout({
        formAnalysisHistory: formHistory,
        currentCompetency: competencies,
        workoutPreferences: {
          ...workoutPreferences,
          coachingStyle: this.sessionState.coachingStyle,
        },
        targetMuscleGroups,
        userProfile: await contextAggregator.getContext(),
      });

      const workoutData = result.data;

      console.log('✅ Form-aware workout generated', {
        exerciseCount: workoutData.workout?.exercises?.length || 0,
        formAdjustments: workoutData.formAdjustments?.length || 0,
        safetyConsiderations: workoutData.safetyConsiderations?.length || 0,
      });

      return workoutData;

    } catch (error) {
      console.error('❌ Error generating form-aware workout:', error);
      throw error;
    }
  }

  /**
   * Get personalized coaching cues based on form analysis
   */
  async getPersonalizedCoachingCues(exerciseType, formAnalysisData, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        coachingStyle = this.sessionState.coachingStyle,
        focusAreas = [],
        includeHistory = true,
      } = options;

      console.log('🎯 Getting personalized coaching cues...', {
        exerciseType,
        coachingStyle,
        focusAreas,
        includeHistory,
      });

      // Get form history if requested
      let formHistory = null;
      if (includeHistory) {
        try {
          const { default: poseProgressService } = await import('./poseProgressService');
          formHistory = await poseProgressService.getExerciseProgress(exerciseType, {
            limit: 15,
            timeRange: '60d',
          });
        } catch (error) {
          console.warn('⚠️ Could not get form history for coaching cues:', error);
        }
      }

      // Call Firebase Function from Stream B
      const result = await this.getPersonalizedCoachingCues({
        exerciseType,
        currentFormAnalysis: formAnalysisData,
        formHistory,
        coachingStyle,
        focusAreas,
      });

      const coachingCues = result.data;

      console.log('✅ Personalized coaching cues generated', {
        cueCount: coachingCues.cues?.length || 0,
        priority: coachingCues.priority,
        coachingStyle,
      });

      return coachingCues;

    } catch (error) {
      console.error('❌ Error getting personalized coaching cues:', error);
      throw error;
    }
  }

  /**
   * Update session state with form analysis data
   */
  updateFormAnalysisContext(exerciseType, formAnalysisData) {
    try {
      this.sessionState = {
        ...this.sessionState,
        isFormContextActive: true,
        currentExercise: exerciseType,
        formAnalysisData,
        lastFormAnalysis: new Date().toISOString(),
        sessionId: this.sessionState.sessionId || `session_${Date.now()}`,
      };

      // Save session state
      this.saveSessionState();

      console.log('🎯 Form analysis context updated', {
        exerciseType,
        hasFormData: !!formAnalysisData,
        sessionId: this.sessionState.sessionId,
      });

      return this.sessionState;
    } catch (error) {
      console.error('❌ Error updating form analysis context:', error);
    }
  }

  /**
   * Clear form context (when user finishes exercise analysis)
   */
  clearFormAnalysisContext() {
    try {
      this.sessionState = {
        ...this.sessionState,
        isFormContextActive: false,
        currentExercise: null,
        formAnalysisData: null,
        lastFormAnalysis: null,
      };

      // Save session state
      this.saveSessionState();

      console.log('🗑️ Form analysis context cleared');

      return this.sessionState;
    } catch (error) {
      console.error('❌ Error clearing form analysis context:', error);
    }
  }

  /**
   * Update AI preferences
   */
  async updateAIPreferences(preferences) {
    try {
      const updatedPreferences = {
        ...this.preferences,
        ...preferences,
        updatedAt: new Date().toISOString(),
      };

      this.preferences = updatedPreferences;

      // Save to persistent storage
      await AsyncStorage.setItem(
        AI_PREFERENCES_KEY,
        JSON.stringify(updatedPreferences)
      );

      // Clear cache since preferences changed
      this.coachingCache.clear();

      console.log('✅ AI preferences updated:', Object.keys(preferences));

      return updatedPreferences;
    } catch (error) {
      console.error('❌ Error updating AI preferences:', error);
      throw error;
    }
  }

  /**
   * Get current AI preferences
   */
  getAIPreferences() {
    return { ...this.preferences };
  }

  /**
   * Get current session state
   */
  getSessionState() {
    return { ...this.sessionState };
  }

  /**
   * Check if form context is currently active
   */
  isFormContextActive() {
    return this.sessionState.isFormContextActive && !!this.sessionState.currentExercise;
  }

  /**
   * Get form context status for UI indicators
   */
  getFormContextStatus() {
    return {
      isActive: this.sessionState.isFormContextActive,
      currentExercise: this.sessionState.currentExercise,
      hasFormData: !!this.sessionState.formAnalysisData,
      lastAnalysis: this.sessionState.lastFormAnalysis,
      coachingStyle: this.sessionState.coachingStyle,
      formContextEnabled: this.preferences.formContextEnabled,
    };
  }

  /**
   * Private helper methods
   */

  enhanceResponseWithFormContext(responseData, formAnalysisData) {
    if (!formAnalysisData || !responseData) {
      return {
        response: responseData?.response || responseData || '',
        formContextUsed: false,
      };
    }

    // Add form-specific metadata to response
    return {
      response: responseData.response || responseData,
      formContextUsed: true,
      formMetrics: this.extractFormMetrics(formAnalysisData),
      coachingInsights: responseData.coachingInsights || null,
      formAdjustments: responseData.formAdjustments || null,
      safetyConsiderations: responseData.safetyConsiderations || null,
      progressIndicators: responseData.progressIndicators || null,
    };
  }

  extractFormMetrics(formAnalysisData) {
    if (!formAnalysisData) return null;

    return {
      overallScore: formAnalysisData.overallScore || formAnalysisData.score || 0,
      keyErrors: formAnalysisData.criticalErrors || formAnalysisData.errors || [],
      improvements: formAnalysisData.improvements || [],
      riskLevel: formAnalysisData.injuryRisk || 'low',
      timestamp: formAnalysisData.timestamp || new Date().toISOString(),
    };
  }

  generateCacheKey(message, options) {
    const keyComponents = [
      message.toLowerCase().slice(0, 50),
      options.exerciseType || 'none',
      options.coachingStyle || 'supportive',
      options.includeFormContext ? 'form' : 'noform',
    ];

    return keyComponents.join('_');
  }

  async trackCoachingInteraction(message, response, context) {
    try {
      // Track coaching interaction for adaptation (using Stream B function)
      await this.adaptCoachingStyle({
        userMessage: message,
        aiResponse: response.response,
        formContext: context.formContext,
        coachingPreferences: context.coachingPreferences,
        exerciseType: context.exerciseType,
        interactionTimestamp: new Date().toISOString(),
      });

      console.log('📊 Coaching interaction tracked for adaptation');
    } catch (error) {
      console.warn('⚠️ Could not track coaching interaction:', error);
    }
  }

  /**
   * Cache management methods
   */

  async loadFromCache() {
    try {
      const cached = await AsyncStorage.getItem(AI_COACHING_CACHE_KEY);
      if (cached) {
        const cacheData = JSON.parse(cached);
        
        if (cacheData.coaching) {
          cacheData.coaching.forEach(([key, value]) => {
            this.coachingCache.set(key, value);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading AI cache:', error);
    }
  }

  async saveToCache() {
    try {
      const cacheData = {
        coaching: Array.from(this.coachingCache.entries()),
        savedAt: Date.now(),
      };

      await AsyncStorage.setItem(AI_COACHING_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error saving AI cache:', error);
    }
  }

  async loadAIPreferences() {
    try {
      const stored = await AsyncStorage.getItem(AI_PREFERENCES_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        this.preferences = { ...this.defaultPreferences, ...preferences };
      }
    } catch (error) {
      console.error('❌ Error loading AI preferences:', error);
    }
  }

  async loadSessionState() {
    try {
      const stored = await AsyncStorage.getItem(COACHING_SESSION_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        
        // Check if session is still valid (within 1 hour)
        if (state.lastFormAnalysis) {
          const lastAnalysis = new Date(state.lastFormAnalysis);
          const now = new Date();
          const timeDiff = now - lastAnalysis;
          
          if (timeDiff < CACHE_TTL.COACHING_SESSION) {
            this.sessionState = { ...this.sessionState, ...state };
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading session state:', error);
    }
  }

  async saveSessionState() {
    try {
      await AsyncStorage.setItem(
        COACHING_SESSION_KEY,
        JSON.stringify(this.sessionState)
      );
    } catch (error) {
      console.error('❌ Error saving session state:', error);
    }
  }

  /**
   * Cleanup methods
   */

  clearCache() {
    this.coachingCache.clear();
    console.log('🗑️ AI coaching cache cleared');
  }

  async clearPersistentCache() {
    try {
      await AsyncStorage.multiRemove([
        AI_COACHING_CACHE_KEY,
        COACHING_SESSION_KEY,
      ]);
      this.clearCache();
      console.log('🗑️ Persistent AI cache cleared');
    } catch (error) {
      console.error('❌ Error clearing persistent AI cache:', error);
    }
  }

  /**
   * Service status and diagnostics
   */

  getServiceStatus() {
    return {
      initialized: this.isInitialized,
      preferences: this.preferences,
      sessionState: this.sessionState,
      cacheSize: this.coachingCache.size,
      formContextService: formContextService.getServiceStatus(),
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.clearCache();
    this.sessionState = {
      isFormContextActive: false,
      currentExercise: null,
      formAnalysisData: null,
      coachingStyle: 'supportive',
      lastFormAnalysis: null,
      sessionId: null,
    };
    this.isInitialized = false;
    console.log('🔄 AI Service destroyed');
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;