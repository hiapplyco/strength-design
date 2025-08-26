import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import healthService from './healthService';
import storageService from './storageService';

/**
 * ContextAggregator Service
 * Aggregates user context from multiple sources for AI-powered workout generation
 * Implements caching strategies to optimize performance and reduce API calls
 */
class ContextAggregator {
  constructor() {
    this.cache = {
      userProfile: null,
      workoutHistory: null,
      nutritionLogs: null,
      healthMetrics: null,
      exercisePreferences: null,
      performanceMetrics: null,
      contextHash: null,
      lastUpdated: null
    };
    
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.db = getFirestore();
    this.auth = getAuth();
  }

  /**
   * Get complete user context for workout generation
   * Uses intelligent caching to minimize data fetching
   */
  async getContext(forceRefresh = false) {
    try {
      console.log('[ContextAggregator] Getting user context, forceRefresh:', forceRefresh);
      
      // Validate authentication
      const user = this.auth.currentUser;
      if (!user) {
        console.warn('[ContextAggregator] No authenticated user found');
        return this.getMinimalContext();
      }
      
      // Check cache validity
      if (!forceRefresh && this.isCacheValid()) {
        console.log('[ContextAggregator] Returning cached context');
        return this.buildContext();
      }
      
      // Set timeout for context loading
      const contextPromise = Promise.all([
        this.getUserProfile().catch(error => {
          console.warn('[ContextAggregator] Failed to get user profile:', error.message);
          return null;
        }),
        this.getWorkoutHistory().catch(error => {
          console.warn('[ContextAggregator] Failed to get workout history:', error.message);
          return { workouts: [], stats: {}, totalCount: 0 };
        }),
        this.getNutritionLogs().catch(error => {
          console.warn('[ContextAggregator] Failed to get nutrition logs:', error.message);
          return { logs: [], dailyAverages: {}, totalDays: 0, compliance: 0 };
        }),
        this.getHealthMetrics().catch(error => {
          console.warn('[ContextAggregator] Failed to get health metrics:', error.message);
          return { today: {}, weekly: {}, isConnected: false };
        }),
        this.getExercisePreferences().catch(error => {
          console.warn('[ContextAggregator] Failed to get exercise preferences:', error.message);
          return { favorites: [], searchHistory: [], mostUsed: [] };
        }),
        this.getPerformanceMetrics().catch(error => {
          console.warn('[ContextAggregator] Failed to get performance metrics:', error.message);
          return this.getDefaultPerformanceMetrics();
        })
      ]);
      
      // Add timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Context loading timeout')), 15000)
      );
      
      const [
        userProfile,
        workoutHistory,
        nutritionLogs,
        healthMetrics,
        exercisePreferences,
        performanceMetrics
      ] = await Promise.race([contextPromise, timeoutPromise]);
      
      // Validate essential data
      const validatedData = {
        userProfile: userProfile || { uid: user.uid, experienceLevel: 'beginner' },
        workoutHistory: workoutHistory || { workouts: [], stats: {}, totalCount: 0 },
        nutritionLogs: nutritionLogs || { logs: [], dailyAverages: {}, totalDays: 0, compliance: 0 },
        healthMetrics: healthMetrics || { today: {}, weekly: {}, isConnected: false },
        exercisePreferences: exercisePreferences || { favorites: [], searchHistory: [], mostUsed: [] },
        performanceMetrics: performanceMetrics || this.getDefaultPerformanceMetrics()
      };
      
      // Update cache
      this.cache = {
        ...validatedData,
        contextHash: this.generateContextHash(),
        lastUpdated: Date.now()
      };
      
      // Persist cache to storage (don't await to avoid blocking)
      this.persistCache().catch(error => 
        console.warn('[ContextAggregator] Failed to persist cache:', error.message)
      );
      
      return this.buildContext();
    } catch (error) {
      console.error('[ContextAggregator] Error getting context:', error);
      
      // Try to load from cache as fallback
      if (this.cache.lastUpdated) {
        console.log('[ContextAggregator] Using stale cache as fallback');
        return this.buildContext();
      }
      
      // Return minimal context as last resort
      return this.getMinimalContext();
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile() {
    try {
      const user = this.auth.currentUser;
      if (!user) return null;
      
      const userDoc = await getDoc(doc(this.db, 'users', user.uid));
      if (!userDoc.exists()) return null;
      
      const userData = userDoc.data();
      
      // Get settings from AsyncStorage
      const settings = await AsyncStorage.getItem('userSettings');
      const parsedSettings = settings ? JSON.parse(settings) : {};
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || user.displayName,
        ...userData,
        settings: parsedSettings,
        memberSince: userData.createdAt || user.metadata.creationTime,
        lastActive: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ContextAggregator] Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Get workout history (last 30 days)
   */
  async getWorkoutHistory() {
    try {
      const user = this.auth.currentUser;
      if (!user) return [];
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get completed workouts
      const workoutsQuery = query(
        collection(this.db, 'workoutSessions'),
        where('userId', '==', user.uid),
        where('completedAt', '>=', thirtyDaysAgo.toISOString()),
        orderBy('completedAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(workoutsQuery);
      const workouts = [];
      
      snapshot.forEach(doc => {
        workouts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Calculate statistics
      const stats = this.calculateWorkoutStats(workouts);
      
      return {
        workouts,
        stats,
        totalCount: workouts.length,
        dateRange: {
          from: thirtyDaysAgo.toISOString(),
          to: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[ContextAggregator] Error getting workout history:', error);
      return { workouts: [], stats: {}, totalCount: 0 };
    }
  }

  /**
   * Get nutrition logs (last 7 days)
   */
  async getNutritionLogs() {
    try {
      const user = this.auth.currentUser;
      if (!user) return [];
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const nutritionQuery = query(
        collection(this.db, 'nutritionLogs'),
        where('userId', '==', user.uid),
        where('date', '>=', sevenDaysAgo.toISOString()),
        orderBy('date', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(nutritionQuery);
      const logs = [];
      
      snapshot.forEach(doc => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Calculate daily averages
      const dailyAverages = this.calculateNutritionAverages(logs);
      
      return {
        logs,
        dailyAverages,
        totalDays: this.getUniqueDays(logs),
        compliance: this.calculateNutritionCompliance(logs)
      };
    } catch (error) {
      console.error('[ContextAggregator] Error getting nutrition logs:', error);
      return { logs: [], dailyAverages: {}, totalDays: 0, compliance: 0 };
    }
  }

  /**
   * Get comprehensive health metrics from health service
   */
  async getHealthMetrics() {
    try {
      console.log('[ContextAggregator] Getting health metrics...');
      
      // Get today's summary
      const todaySummary = await healthService.getTodaysSummary();
      
      // Get weekly metrics
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      const weeklyMetrics = await healthService.getWeeklyAverages();
      
      // Get weight history
      const weightHistory = await healthService.getRecentWeight(30);
      
      // Process and enrich health data
      const processedMetrics = {
        today: {
          ...todaySummary,
          activityLevel: this._assessActivityLevel(todaySummary),
          caloriesBurnedLevel: this._assessCalorieLevel(todaySummary.calories),
          stepGoalProgress: this._calculateStepProgress(todaySummary.steps)
        },
        weekly: {
          ...weeklyMetrics,
          consistencyScore: this._calculateHealthConsistency(weeklyMetrics),
          improvementTrend: this._analyzeHealthTrend(weeklyMetrics)
        },
        weight: {
          current: weightHistory[0] || null,
          history: weightHistory,
          trend: this._analyzeWeightTrend(weightHistory)
        },
        isConnected: healthService.isInitialized && healthService.isSyncEnabled,
        lastSync: healthService.lastSyncTime,
        dataQuality: todaySummary.dataQuality || 'unknown',
        healthScore: this._calculateOverallHealthScore(todaySummary, weeklyMetrics)
      };
      
      console.log('[ContextAggregator] Health metrics processed:', {
        isConnected: processedMetrics.isConnected,
        todaySteps: processedMetrics.today.steps,
        todayCalories: processedMetrics.today.calories,
        healthScore: processedMetrics.healthScore
      });
      
      return processedMetrics;
    } catch (error) {
      console.error('[ContextAggregator] Error getting health metrics:', error);
      return { 
        today: {}, 
        weekly: {}, 
        weight: { current: null, history: [], trend: 'stable' },
        isConnected: false,
        lastSync: null,
        healthScore: 0,
        error: error.message
      };
    }
  }

  /**
   * Get exercise preferences from storage and history
   */
  async getExercisePreferences() {
    try {
      const user = this.auth.currentUser;
      if (!user) return {};
      
      // Get favorite exercises
      const favoritesQuery = query(
        collection(this.db, 'favoriteExercises'),
        where('userId', '==', user.uid),
        limit(50)
      );
      
      const snapshot = await getDocs(favoritesQuery);
      const favorites = [];
      
      snapshot.forEach(doc => {
        favorites.push(doc.data().exerciseId);
      });
      
      // Get search history from storage service
      const searchHistory = await storageService.getSearchHistory();
      
      // Get most used exercises from workout history
      const mostUsed = await this.getMostUsedExercises();
      
      return {
        favorites,
        searchHistory: searchHistory.slice(0, 10),
        mostUsed,
        equipment: await this.getAvailableEquipment(),
        avoidedMuscles: await this.getAvoidedMuscles()
      };
    } catch (error) {
      console.error('[ContextAggregator] Error getting exercise preferences:', error);
      return { favorites: [], searchHistory: [], mostUsed: [] };
    }
  }

  /**
   * Calculate performance metrics from workout history
   */
  async getPerformanceMetrics() {
    try {
      const { workouts } = this.cache.workoutHistory || await this.getWorkoutHistory();
      
      if (!workouts || workouts.length === 0) {
        return this.getDefaultPerformanceMetrics();
      }
      
      // Calculate various performance indicators
      const metrics = {
        consistency: this.calculateConsistency(workouts),
        volumeProgression: this.calculateVolumeProgression(workouts),
        intensityTrend: this.calculateIntensityTrend(workouts),
        recoveryScore: this.calculateRecoveryScore(workouts),
        personalRecords: await this.getPersonalRecords(),
        strengthLevel: this.estimateStrengthLevel(workouts),
        enduranceLevel: this.estimateEnduranceLevel(workouts),
        overallProgress: this.calculateOverallProgress(workouts)
      };
      
      return metrics;
    } catch (error) {
      console.error('[ContextAggregator] Error calculating performance metrics:', error);
      return this.getDefaultPerformanceMetrics();
    }
  }

  /**
   * Add program to selected programs context (supports multiple programs)
   */
  async addProgramContext(program) {
    try {
      console.log('[ContextAggregator] Adding program to context:', program.name);
      
      const programContext = {
        name: program.name,
        creator: program.creator,
        methodology: program.methodology,
        structure: program.structure,
        goals: program.goals,
        experienceLevel: program.experienceLevel,
        duration: program.duration,
        credibilityScore: program.credibilityScore,
        source: program.source || 'Perplexity Search',
        selectedAt: new Date().toISOString(),
        exercises: program.exercises || [],
        principles: program.principles || [],
        equipment: program.equipment || [],
        id: `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Get existing programs
      const existingPrograms = await this.getStoredProgramsContext() || [];
      
      // Check if program already exists (by name and creator)
      const existingIndex = existingPrograms.findIndex(p => 
        p.name === programContext.name && p.creator === programContext.creator
      );
      
      if (existingIndex !== -1) {
        // Update existing program
        existingPrograms[existingIndex] = programContext;
        console.log('[ContextAggregator] Updated existing program in context');
      } else {
        // Add new program
        existingPrograms.push(programContext);
        console.log('[ContextAggregator] Added new program to context');
      }
      
      // Store in AsyncStorage for persistence
      await AsyncStorage.setItem('selectedProgramsContext', JSON.stringify(existingPrograms));
      
      // Also store in cache for immediate use
      this.cache.programsContext = existingPrograms;
      
      console.log('[ContextAggregator] Programs context updated successfully. Total programs:', existingPrograms.length);
      return existingPrograms;
    } catch (error) {
      console.error('[ContextAggregator] Failed to add program context:', error);
      throw error;
    }
  }

  /**
   * Store selected program context for future use (legacy single program method)
   */
  async storeProgramContext(program) {
    try {
      console.log('[ContextAggregator] Storing single program context (legacy):', program.name);
      
      const programContext = {
        name: program.name,
        creator: program.creator,
        methodology: program.methodology,
        structure: program.structure,
        goals: program.goals,
        experienceLevel: program.experienceLevel,
        duration: program.duration,
        credibilityScore: program.credibilityScore,
        source: program.source || 'Perplexity Search',
        selectedAt: new Date().toISOString(),
        exercises: program.exercises || [],
        principles: program.principles || [],
        equipment: program.equipment || []
      };
      
      // Store in AsyncStorage for persistence
      await AsyncStorage.setItem('selectedProgramContext', JSON.stringify(programContext));
      
      // Also store in cache for immediate use
      this.cache.programContext = programContext;
      
      console.log('[ContextAggregator] Program context stored successfully');
      return programContext;
    } catch (error) {
      console.error('[ContextAggregator] Failed to store program context:', error);
      throw error;
    }
  }
  
  /**
   * Get stored programs context (multiple programs)
   */
  async getStoredProgramsContext() {
    try {
      // Check cache first
      if (this.cache.programsContext) {
        return this.cache.programsContext;
      }
      
      // Load from AsyncStorage
      const storedContext = await AsyncStorage.getItem('selectedProgramsContext');
      if (storedContext) {
        const programsContext = JSON.parse(storedContext);
        this.cache.programsContext = programsContext;
        return programsContext;
      }
      
      return [];
    } catch (error) {
      console.error('[ContextAggregator] Failed to get stored programs context:', error);
      return [];
    }
  }

  /**
   * Remove a program from context by ID
   */
  async removeProgramContext(programId) {
    try {
      console.log('[ContextAggregator] Removing program from context:', programId);
      
      const existingPrograms = await this.getStoredProgramsContext() || [];
      const filteredPrograms = existingPrograms.filter(p => p.id !== programId);
      
      // Store updated list
      await AsyncStorage.setItem('selectedProgramsContext', JSON.stringify(filteredPrograms));
      this.cache.programsContext = filteredPrograms;
      
      console.log('[ContextAggregator] Program removed successfully. Remaining programs:', filteredPrograms.length);
      return filteredPrograms;
    } catch (error) {
      console.error('[ContextAggregator] Failed to remove program context:', error);
      throw error;
    }
  }

  /**
   * Clear all programs context
   */
  async clearProgramsContext() {
    try {
      await AsyncStorage.removeItem('selectedProgramsContext');
      this.cache.programsContext = [];
      console.log('[ContextAggregator] All programs context cleared');
      return [];
    } catch (error) {
      console.error('[ContextAggregator] Failed to clear programs context:', error);
      throw error;
    }
  }

  /**
   * Get stored program context (legacy single program)
   */
  async getStoredProgramContext() {
    try {
      // Check cache first
      if (this.cache.programContext) {
        return this.cache.programContext;
      }
      
      // Load from AsyncStorage
      const storedContext = await AsyncStorage.getItem('selectedProgramContext');
      if (storedContext) {
        const programContext = JSON.parse(storedContext);
        this.cache.programContext = programContext;
        return programContext;
      }
      
      return null;
    } catch (error) {
      console.error('[ContextAggregator] Failed to get stored program context:', error);
      return null;
    }
  }
  
  /**
   * Clear stored program context
   */
  async clearProgramContext() {
    try {
      await AsyncStorage.removeItem('selectedProgramContext');
      this.cache.programContext = null;
      console.log('[ContextAggregator] Program context cleared');
    } catch (error) {
      console.error('[ContextAggregator] Failed to clear program context:', error);
    }
  }
  
  /**
   * Store selected exercises context for workout generation
   */
  async storeExerciseContext(exercises, foods = [], additionalContext = {}) {
    try {
      console.log('[ContextAggregator] Storing exercise context:', exercises.length, 'exercises');
      
      const exerciseContext = {
        exercises: exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          category: ex.category,
          primaryMuscles: ex.primaryMuscles,
          secondaryMuscles: ex.secondaryMuscles,
          equipment: ex.equipment,
          difficulty: ex.difficulty,
          instructions: ex.instructions
        })),
        foods: foods,
        ...additionalContext,
        selectedAt: new Date().toISOString()
      };
      
      // Store in AsyncStorage for persistence
      await AsyncStorage.setItem('selectedExerciseContext', JSON.stringify(exerciseContext));
      
      // Also store in cache for immediate use
      this.cache.exerciseContext = exerciseContext;
      
      console.log('[ContextAggregator] Exercise context stored successfully');
      return exerciseContext;
    } catch (error) {
      console.error('[ContextAggregator] Failed to store exercise context:', error);
      throw error;
    }
  }
  
  /**
   * Get stored exercise context
   */
  async getStoredExerciseContext() {
    try {
      // Check cache first
      if (this.cache.exerciseContext) {
        return this.cache.exerciseContext;
      }
      
      // Load from AsyncStorage
      const storedContext = await AsyncStorage.getItem('selectedExerciseContext');
      if (storedContext) {
        const exerciseContext = JSON.parse(storedContext);
        this.cache.exerciseContext = exerciseContext;
        return exerciseContext;
      }
      
      return null;
    } catch (error) {
      console.error('[ContextAggregator] Failed to get stored exercise context:', error);
      return null;
    }
  }

  /**
   * Build the final context object for AI with enhanced health integration
   */
  buildContext(programContext = null) {
    const context = {
      user: this.cache.userProfile,
      workoutHistory: this.cache.workoutHistory,
      nutrition: this.cache.nutritionLogs,
      health: this.cache.healthMetrics,
      preferences: this.cache.exercisePreferences,
      performance: this.cache.performanceMetrics,
      // Enhanced biometric integration
      biometrics: this._buildComprehensiveBiometrics(),
      // Health-based recommendations
      healthInsights: this._generateHealthInsights(),
      metadata: {
        contextVersion: '2.2',
        generatedAt: new Date().toISOString(),
        cacheAge: Date.now() - this.cache.lastUpdated,
        hash: this.cache.contextHash,
        hasHealthData: Boolean(this.cache.healthMetrics?.isConnected),
        hasBiometrics: Boolean(this.cache.userProfile?.age && this.cache.userProfile?.weight)
      }
    };
    
    // Add multiple programs context from cache
    const storedPrograms = this.cache.programsContext || [];
    if (storedPrograms.length > 0) {
      context.selectedPrograms = storedPrograms.map(program => ({
        name: program.name,
        creator: program.creator,
        methodology: program.methodology,
        structure: program.structure,
        goals: program.goals,
        experienceLevel: program.experienceLevel,
        duration: program.duration,
        credibilityScore: program.credibilityScore,
        source: program.source || 'Perplexity Search',
        selectedAt: program.selectedAt,
        exercises: program.exercises || [],
        principles: program.principles || [],
        equipment: program.equipment || [],
        id: program.id
      }));
      
      // Add program-specific insights for all programs
      context.programsInsights = storedPrograms.map(program => 
        this.generateProgramInsights(context, program)
      );
      
      context.metadata.selectedProgramsCount = storedPrograms.length;
    }
    
    // Add single program context if provided (legacy support or direct selection)
    if (programContext) {
      context.selectedProgram = {
        name: programContext.name,
        creator: programContext.creator,
        methodology: programContext.methodology,
        structure: programContext.structure,
        goals: programContext.goals,
        experienceLevel: programContext.experienceLevel,
        duration: programContext.duration,
        credibilityScore: programContext.credibilityScore,
        source: 'Perplexity Search',
        selectedAt: new Date().toISOString()
      };
      
      // Add program-specific insights
      context.programInsights = this.generateProgramInsights(context, programContext);
    }
    
    // Add derived insights
    context.insights = this.generateInsights(context);
    
    // Add recommendations (considering both single and multiple programs)
    context.recommendations = this.generateRecommendations(context, programContext, storedPrograms);
    
    return context;
  }

  /**
   * Generate insights specific to the selected program
   */
  generateProgramInsights(context, programContext) {
    const insights = {
      compatibility: 'unknown',
      adjustments: [],
      expectations: [],
      progressionPlan: []
    };

    // Check program compatibility with user's level
    const userLevel = context.performance?.strengthLevel || 'beginner';
    const programLevel = programContext.experienceLevel?.toLowerCase() || 'beginner';
    
    if (userLevel === programLevel) {
      insights.compatibility = 'excellent';
      insights.expectations.push(`Perfect match for your ${userLevel} level`);
    } else if (
      (userLevel === 'beginner' && programLevel.includes('intermediate')) ||
      (userLevel === 'intermediate' && programLevel.includes('advanced'))
    ) {
      insights.compatibility = 'challenging';
      insights.adjustments.push('Consider starting with lighter weights or fewer sets');
      insights.expectations.push('This program will challenge you to grow');
    } else if (
      (userLevel === 'advanced' && programLevel.includes('beginner')) ||
      (userLevel === 'intermediate' && programLevel.includes('beginner'))
    ) {
      insights.compatibility = 'easy';
      insights.adjustments.push('Consider increasing intensity or adding volume');
      insights.expectations.push('Good for active recovery or building consistency');
    }

    // Program-specific adjustments based on user context
    if (context.user?.injuries) {
      insights.adjustments.push(`Modify exercises to accommodate ${context.user.injuries}`);
    }

    if (context.preferences?.equipment?.length > 0) {
      insights.adjustments.push('Adapt exercises to available equipment');
    }

    // Progression planning
    if (programContext.duration) {
      insights.progressionPlan.push(`Follow ${programContext.duration} timeline`);
    }
    
    if (programContext.methodology?.includes('progressive')) {
      insights.progressionPlan.push('Focus on gradual weight increases');
    }

    return insights;
  }

  /**
   * Generate comprehensive insights from aggregated data including health metrics
   */
  generateInsights(context) {
    const insights = {
      trainingStatus: 'active', // active, recovering, overtraining, detraining
      currentPhase: 'building', // building, maintaining, cutting
      strengths: [],
      weaknesses: [],
      trends: [],
      risks: [],
      healthStatus: 'good', // excellent, good, fair, poor
      recommendations: []
    };
    
    // Analyze training status
    if (context.performance?.consistency > 0.8) {
      insights.trainingStatus = 'active';
    } else if (context.performance?.consistency < 0.4) {
      insights.trainingStatus = 'detraining';
    }
    
    // Analyze recovery with health data
    if (context.performance?.recoveryScore < 50) {
      insights.risks.push('Poor recovery - consider rest days');
    }
    
    // Health-based insights
    if (context.health?.isConnected) {
      const healthData = context.health;
      
      // Activity level analysis
      if (healthData.today?.steps > 10000) {
        insights.strengths.push('Excellent daily activity level');
      } else if (healthData.today?.steps < 5000) {
        insights.weaknesses.push('Low daily activity - increase NEAT');
        insights.recommendations.push('Try to walk more throughout the day');
      }
      
      // Sleep analysis
      if (healthData.today?.sleep) {
        if (healthData.today.sleep >= 7) {
          insights.strengths.push('Good sleep duration');
        } else {
          insights.risks.push('Insufficient sleep affecting recovery');
          insights.recommendations.push('Prioritize 7-9 hours of sleep');
        }
      }
      
      // Heart rate analysis
      if (healthData.today?.heartRate?.resting) {
        const rhr = healthData.today.heartRate.resting;
        if (rhr < 60) {
          insights.strengths.push('Excellent cardiovascular fitness');
        } else if (rhr > 80) {
          insights.recommendations.push('Focus on cardiovascular conditioning');
        }
      }
      
      // Overall health score
      if (healthData.healthScore > 80) {
        insights.healthStatus = 'excellent';
      } else if (healthData.healthScore > 60) {
        insights.healthStatus = 'good';
      } else if (healthData.healthScore > 40) {
        insights.healthStatus = 'fair';
      } else {
        insights.healthStatus = 'poor';
        insights.risks.push('Health metrics suggest need for lifestyle changes');
      }
    }
    
    // Biometric insights
    if (context.biometrics?.bmi) {
      const bmi = context.biometrics.bmi;
      const category = context.biometrics.bmiCategory;
      
      if (category === 'normal') {
        insights.strengths.push('Healthy BMI range');
      } else if (category === 'overweight') {
        insights.recommendations.push('Consider incorporating more cardio and calorie management');
      } else if (category === 'underweight') {
        insights.recommendations.push('Focus on muscle building and adequate nutrition');
      }
    }
    
    // Nutrition analysis
    if (context.nutrition?.compliance > 0.8) {
      insights.strengths.push('Excellent nutrition compliance');
    } else if (context.nutrition?.compliance < 0.5) {
      insights.weaknesses.push('Nutrition needs improvement');
      insights.recommendations.push('Focus on consistent meal planning and tracking');
    }
    
    // Volume progression with health context
    if (context.performance?.volumeProgression > 1.1) {
      insights.trends.push('Volume increasing - good progression');
      if (context.health?.today?.sleep < 7) {
        insights.risks.push('Increasing volume with poor sleep - monitor recovery');
      }
    } else if (context.performance?.volumeProgression < 0.9) {
      insights.trends.push('Volume decreasing - check recovery');
    }
    
    return insights;
  }

  /**
   * Generate recommendations based on context
   */
  generateRecommendations(context, programContext = null, multiplePrograms = []) {
    const recommendations = {
      workoutFocus: [],
      nutritionFocus: [],
      recoveryFocus: [],
      equipmentSuggestions: [],
      programAdjustments: []
    };
    
    // Workout recommendations
    if (context.performance?.consistency < 0.6) {
      recommendations.workoutFocus.push('Focus on building consistency with 3-day program');
    }
    
    if (context.user?.injuries) {
      recommendations.workoutFocus.push(`Avoid exercises that stress: ${context.user.injuries}`);
    }
    
    // Nutrition recommendations
    if (context.nutrition?.dailyAverages?.protein < context.user?.weight * 1.6) {
      recommendations.nutritionFocus.push('Increase protein intake for muscle growth');
    }
    
    // Recovery recommendations
    if (context.health?.today?.sleep < 7) {
      recommendations.recoveryFocus.push('Prioritize 7-9 hours of sleep');
    }
    
    // Equipment suggestions
    if (context.preferences?.equipment?.length < 3) {
      recommendations.equipmentSuggestions.push('Consider adding resistance bands for variety');
    }
    
    // Multiple programs recommendations
    if (multiplePrograms && multiplePrograms.length > 0) {
      const allGoals = multiplePrograms.flatMap(p => p.goals || []);
      const uniqueGoals = [...new Set(allGoals)];
      
      recommendations.multiProgramSpecific = {
        combinedFocus: `Blend elements from ${multiplePrograms.length} programs: ${multiplePrograms.map(p => p.name).join(', ')}`,
        diverseGoals: `Address multiple goals: ${uniqueGoals.join(', ').toLowerCase()}`,
        programCount: `${multiplePrograms.length} programs selected for comprehensive approach`,
        averageCredibility: `Average program quality: ${Math.round(multiplePrograms.reduce((sum, p) => sum + (p.credibilityScore || 7), 0) / multiplePrograms.length)}/10`
      };
      
      // Add multi-program specific workout focus
      const strengthPrograms = multiplePrograms.filter(p => p.goals?.some(g => g.toLowerCase().includes('strength')));
      const hypertrophyPrograms = multiplePrograms.filter(p => p.goals?.some(g => g.toLowerCase().includes('muscle')));
      const endurancePrograms = multiplePrograms.filter(p => p.goals?.some(g => g.toLowerCase().includes('endurance')));
      
      if (strengthPrograms.length > 0) {
        recommendations.workoutFocus.push(`Incorporate strength principles from ${strengthPrograms.length} program(s)`);
      }
      if (hypertrophyPrograms.length > 0) {
        recommendations.workoutFocus.push(`Blend hypertrophy methods from ${hypertrophyPrograms.length} program(s)`);
      }
      if (endurancePrograms.length > 0) {
        recommendations.workoutFocus.push(`Add endurance elements from ${endurancePrograms.length} program(s)`);
      }
      
      if (multiplePrograms.length > 2) {
        recommendations.programAdjustments.push('Consider focusing on 2-3 key programs to avoid complexity');
      }
    }
    
    // Single program-specific recommendations (legacy support)
    if (programContext) {
      recommendations.programSpecific = {
        focus: `Emphasize ${programContext.goals?.toLowerCase() || 'general fitness'}`,
        schedule: `Follow ${programContext.methodology || 'progressive training'} approach`,
        expectations: `Expected duration: ${programContext.duration || 'Variable'}`,
        credibility: `High-quality program (${programContext.credibilityScore || 7}/10)`
      };
      
      // Add program-specific workout focus
      if (programContext.goals?.toLowerCase().includes('strength')) {
        recommendations.workoutFocus.push('Focus on compound movements and progressive overload');
      } else if (programContext.goals?.toLowerCase().includes('muscle')) {
        recommendations.workoutFocus.push('Emphasize hypertrophy rep ranges (8-12 reps)');
      } else if (programContext.goals?.toLowerCase().includes('endurance')) {
        recommendations.workoutFocus.push('Include cardio and higher rep training');
      }
    }
    
    return recommendations;
  }

  /**
   * Calculate workout statistics
   */
  calculateWorkoutStats(workouts) {
    if (!workouts || workouts.length === 0) return {};
    
    const stats = {
      totalWorkouts: workouts.length,
      averageDuration: 0,
      totalVolume: 0,
      favoriteDay: '',
      favoriteTime: '',
      averageIntensity: 0,
      completionRate: 0
    };
    
    // Calculate averages
    let totalDuration = 0;
    let totalVolume = 0;
    const dayCount = {};
    const timeCount = {};
    
    workouts.forEach(workout => {
      totalDuration += workout.duration || 0;
      totalVolume += workout.totalVolume || 0;
      
      // Track workout days
      const day = new Date(workout.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
      
      // Track workout times
      const hour = new Date(workout.completedAt).getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      timeCount[timeSlot] = (timeCount[timeSlot] || 0) + 1;
    });
    
    stats.averageDuration = totalDuration / workouts.length;
    stats.totalVolume = totalVolume;
    stats.favoriteDay = Object.keys(dayCount).reduce((a, b) => dayCount[a] > dayCount[b] ? a : b, '');
    stats.favoriteTime = Object.keys(timeCount).reduce((a, b) => timeCount[a] > timeCount[b] ? a : b, '');
    
    return stats;
  }

  /**
   * Calculate nutrition averages
   */
  calculateNutritionAverages(logs) {
    if (!logs || logs.length === 0) return {};
    
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      water: 0
    };
    
    logs.forEach(log => {
      totals.calories += log.calories || 0;
      totals.protein += log.protein || 0;
      totals.carbs += log.carbs || 0;
      totals.fat += log.fat || 0;
      totals.fiber += log.fiber || 0;
      totals.water += log.water || 0;
    });
    
    const days = this.getUniqueDays(logs);
    
    return {
      calories: totals.calories / days,
      protein: totals.protein / days,
      carbs: totals.carbs / days,
      fat: totals.fat / days,
      fiber: totals.fiber / days,
      water: totals.water / days
    };
  }

  /**
   * Calculate consistency score (0-1)
   */
  calculateConsistency(workouts) {
    if (!workouts || workouts.length === 0) return 0;
    
    // Get dates of workouts
    const dates = workouts.map(w => new Date(w.completedAt).toDateString());
    const uniqueDates = [...new Set(dates)];
    
    // Calculate expected workouts (3 per week average)
    const dayRange = 30;
    const expectedWorkouts = (dayRange / 7) * 3;
    
    return Math.min(uniqueDates.length / expectedWorkouts, 1);
  }

  /**
   * Calculate volume progression (ratio)
   */
  calculateVolumeProgression(workouts) {
    if (!workouts || workouts.length < 2) return 1;
    
    // Compare last week to previous week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const lastWeek = workouts.filter(w => 
      new Date(w.completedAt) >= oneWeekAgo
    );
    const previousWeek = workouts.filter(w => 
      new Date(w.completedAt) >= twoWeeksAgo && 
      new Date(w.completedAt) < oneWeekAgo
    );
    
    if (previousWeek.length === 0) return 1;
    
    const lastWeekVolume = lastWeek.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    const previousWeekVolume = previousWeek.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    
    if (previousWeekVolume === 0) return 1;
    
    return lastWeekVolume / previousWeekVolume;
  }

  /**
   * Calculate intensity trend
   */
  calculateIntensityTrend(workouts) {
    if (!workouts || workouts.length < 2) return 'stable';
    
    // Compare average RPE/intensity over time
    const recent = workouts.slice(0, 5);
    const older = workouts.slice(5, 10);
    
    const recentIntensity = recent.reduce((sum, w) => sum + (w.averageRPE || 5), 0) / recent.length;
    const olderIntensity = older.reduce((sum, w) => sum + (w.averageRPE || 5), 0) / (older.length || 1);
    
    if (recentIntensity > olderIntensity * 1.1) return 'increasing';
    if (recentIntensity < olderIntensity * 0.9) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate recovery score (0-100)
   */
  calculateRecoveryScore(workouts) {
    // Simple recovery score based on rest days and sleep
    const lastWorkout = workouts[0];
    if (!lastWorkout) return 100;
    
    const daysSinceLastWorkout = Math.floor(
      (Date.now() - new Date(lastWorkout.completedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Optimal rest is 1-2 days
    let score = 100;
    if (daysSinceLastWorkout === 0) score = 60;
    else if (daysSinceLastWorkout === 1) score = 100;
    else if (daysSinceLastWorkout === 2) score = 90;
    else if (daysSinceLastWorkout > 3) score = 70;
    
    return score;
  }

  /**
   * Get most used exercises
   */
  async getMostUsedExercises() {
    try {
      const user = this.auth.currentUser;
      if (!user) return [];
      
      // This would analyze workout history for most frequently used exercises
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('[ContextAggregator] Error getting most used exercises:', error);
      return [];
    }
  }

  /**
   * Get available equipment from user preferences
   */
  async getAvailableEquipment() {
    try {
      const preferences = await AsyncStorage.getItem('equipmentPreferences');
      return preferences ? JSON.parse(preferences) : ['bodyweight', 'dumbbells'];
    } catch (error) {
      return ['bodyweight', 'dumbbells'];
    }
  }

  /**
   * Get avoided muscle groups (from injuries)
   */
  async getAvoidedMuscles() {
    try {
      const injuries = this.cache.userProfile?.injuries || '';
      const avoidedMuscles = [];
      
      // Parse injuries for muscle groups to avoid
      if (injuries.toLowerCase().includes('knee')) avoidedMuscles.push('quadriceps', 'hamstrings');
      if (injuries.toLowerCase().includes('shoulder')) avoidedMuscles.push('shoulders', 'chest');
      if (injuries.toLowerCase().includes('back')) avoidedMuscles.push('lower back', 'lats');
      
      return avoidedMuscles;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get personal records
   */
  async getPersonalRecords() {
    try {
      const user = this.auth.currentUser;
      if (!user) return {};
      
      const prDoc = await getDoc(doc(this.db, 'personalRecords', user.uid));
      return prDoc.exists() ? prDoc.data() : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Estimate strength level
   */
  estimateStrengthLevel(workouts) {
    // Simple estimation based on workout frequency and volume
    if (workouts.length > 20) return 'advanced';
    if (workouts.length > 10) return 'intermediate';
    return 'beginner';
  }

  /**
   * Estimate endurance level
   */
  estimateEnduranceLevel(workouts) {
    // Based on average workout duration
    const avgDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / (workouts.length || 1);
    
    if (avgDuration > 60) return 'high';
    if (avgDuration > 40) return 'moderate';
    return 'low';
  }

  /**
   * Calculate overall progress score
   */
  calculateOverallProgress(workouts) {
    // Combine various metrics for overall progress
    const consistency = this.calculateConsistency(workouts);
    const volumeProgression = this.calculateVolumeProgression(workouts);
    const recovery = this.calculateRecoveryScore(workouts) / 100;
    
    return (consistency * 0.4 + Math.min(volumeProgression, 1.5) * 0.4 + recovery * 0.2) * 100;
  }

  /**
   * Calculate nutrition compliance
   */
  calculateNutritionCompliance(logs) {
    if (!logs || logs.length === 0) return 0;
    
    // Check how many days have complete logs
    const days = this.getUniqueDays(logs);
    const expectedDays = 7;
    
    return Math.min(days / expectedDays, 1);
  }

  /**
   * Get unique days from logs
   */
  getUniqueDays(logs) {
    const dates = logs.map(log => new Date(log.date || log.timestamp).toDateString());
    return [...new Set(dates)].length;
  }

  /**
   * Get default performance metrics
   */
  getDefaultPerformanceMetrics() {
    return {
      consistency: 0,
      volumeProgression: 1,
      intensityTrend: 'stable',
      recoveryScore: 100,
      personalRecords: {},
      strengthLevel: 'beginner',
      enduranceLevel: 'low',
      overallProgress: 0
    };
  }

  /**
   * Get minimal context when data is unavailable
   */
  getMinimalContext() {
    return {
      user: {
        experienceLevel: 'beginner',
        preferredWorkoutDays: 3
      },
      workoutHistory: { workouts: [], stats: {} },
      nutrition: { logs: [], dailyAverages: {} },
      health: { today: {}, weekly: {} },
      preferences: { favorites: [], equipment: ['bodyweight'] },
      performance: this.getDefaultPerformanceMetrics(),
      metadata: {
        contextVersion: '2.0',
        generatedAt: new Date().toISOString(),
        minimal: true
      }
    };
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    if (!this.cache.lastUpdated) return false;
    
    const cacheAge = Date.now() - this.cache.lastUpdated;
    return cacheAge < this.cacheTimeout;
  }

  /**
   * Generate a hash of the current context for comparison
   */
  generateContextHash() {
    const data = JSON.stringify({
      userId: this.auth.currentUser?.uid,
      timestamp: Date.now()
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return hash.toString(36);
  }

  /**
   * Persist cache to AsyncStorage
   */
  async persistCache() {
    try {
      await AsyncStorage.setItem('contextCache', JSON.stringify(this.cache));
    } catch (error) {
      console.error('[ContextAggregator] Error persisting cache:', error);
    }
  }

  /**
   * Load cache from AsyncStorage
   */
  async loadCache() {
    try {
      const cached = await AsyncStorage.getItem('contextCache');
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.error('[ContextAggregator] Error loading cache:', error);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {
      userProfile: null,
      workoutHistory: null,
      nutritionLogs: null,
      healthMetrics: null,
      exercisePreferences: null,
      performanceMetrics: null,
      contextHash: null,
      lastUpdated: null
    };
    
    AsyncStorage.removeItem('contextCache').catch(console.error);
  }
  
  /**
   * Build comprehensive biometrics data combining user profile and health data
   */
  _buildComprehensiveBiometrics() {
    const profile = this.cache.userProfile || {};
    const health = this.cache.healthMetrics || {};
    
    const biometrics = {
      // Basic profile data
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      experienceLevel: profile.experienceLevel,
      
      // Health data integration
      currentWeight: health.weight?.current?.value,
      weightTrend: health.weight?.trend,
      restingHeartRate: health.today?.heartRate?.resting,
      averageHeartRate: health.today?.heartRate?.average,
      
      // Activity metrics
      dailySteps: health.today?.steps,
      dailyCalories: health.today?.calories,
      activeMinutes: health.today?.activeMinutes,
      sleepHours: health.today?.sleep,
      
      // Calculated metrics
      bmi: this._calculateBMI(profile.height, profile.weight),
      activityLevel: health.today?.activityLevel,
      healthScore: health.healthScore,
      
      // Data quality indicators
      hasHealthData: health.isConnected,
      lastHealthSync: health.lastSync,
      dataQuality: health.dataQuality
    };
    
    // Remove undefined values
    return Object.fromEntries(
      Object.entries(biometrics).filter(([_, value]) => value !== undefined && value !== null)
    );
  }
  
  /**
   * Generate health-based insights for AI context
   */
  _generateHealthInsights() {
    const health = this.cache.healthMetrics || {};
    const insights = [];
    
    if (!health.isConnected) {
      insights.push('Health data not connected - recommendations based on profile only');
      return insights;
    }
    
    // Activity insights
    if (health.today?.steps > 10000) {
      insights.push('High daily activity - excellent cardiovascular base');
    } else if (health.today?.steps < 5000) {
      insights.push('Low daily activity - focus on increasing NEAT and cardio');
    }
    
    // Sleep insights
    if (health.today?.sleep < 6) {
      insights.push('Poor sleep quality - may affect recovery and performance');
    } else if (health.today?.sleep > 8) {
      insights.push('Good sleep habits - optimal for recovery');
    }
    
    // Heart rate insights
    if (health.today?.heartRate?.resting < 60) {
      insights.push('Low resting heart rate indicates good cardiovascular fitness');
    } else if (health.today?.heartRate?.resting > 80) {
      insights.push('Elevated resting heart rate - may benefit from cardio focus');
    }
    
    // Weekly trends
    if (health.weekly?.consistency > 0.8) {
      insights.push('Consistent health metrics - good lifestyle habits');
    } else if (health.weekly?.consistency < 0.5) {
      insights.push('Inconsistent health patterns - focus on routine building');
    }
    
    // Weight trends
    if (health.weight?.trend === 'increasing' && health.weekly?.averageCalories > 300) {
      insights.push('Weight increasing with high calorie burn - likely muscle gain');
    } else if (health.weight?.trend === 'decreasing' && health.weekly?.averageCalories < 200) {
      insights.push('Weight decreasing with low activity - may need nutrition review');
    }
    
    return insights;
  }
  
  /**
   * Calculate BMI from height and weight
   */
  _calculateBMI(height, weight) {
    if (!height || !weight) return null;
    
    const heightM = parseFloat(height) / 100; // Assume cm, convert to meters
    const weightKg = parseFloat(weight); // Assume kg
    
    if (heightM > 0 && weightKg > 0) {
      return Number((weightKg / (heightM * heightM)).toFixed(1));
    }
    
    return null;
  }
  
  /**
   * Assess activity level from step count
   */
  _assessActivityLevel(todayData) {
    if (!todayData?.steps) return 'unknown';
    
    const steps = todayData.steps;
    if (steps > 12000) return 'very_high';
    if (steps > 8000) return 'high';
    if (steps > 5000) return 'moderate';
    if (steps > 2000) return 'low';
    return 'very_low';
  }
  
  /**
   * Assess calorie burn level
   */
  _assessCalorieLevel(calories) {
    if (!calories) return 'unknown';
    
    if (calories > 500) return 'high';
    if (calories > 300) return 'moderate';
    if (calories > 150) return 'low';
    return 'very_low';
  }
  
  /**
   * Calculate step goal progress
   */
  _calculateStepProgress(steps) {
    if (!steps) return 0;
    
    const goal = 10000; // Standard step goal
    return Math.min((steps / goal) * 100, 100);
  }
  
  /**
   * Calculate health consistency score
   */
  _calculateHealthConsistency(weeklyData) {
    if (!weeklyData) return 0;
    
    // Simple consistency based on available metrics
    return weeklyData.consistency || 0.7; // Default to moderate consistency
  }
  
  /**
   * Analyze health trend
   */
  _analyzeHealthTrend(weeklyData) {
    if (!weeklyData) return 'stable';
    
    return weeklyData.trendDirection || 'stable';
  }
  
  /**
   * Analyze weight trend
   */
  _analyzeWeightTrend(weightHistory) {
    if (!weightHistory || weightHistory.length < 2) return 'stable';
    
    const recent = weightHistory.slice(0, 3);
    const older = weightHistory.slice(3, 6);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, w) => sum + w.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, w) => sum + w.value, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    
    if (change > 1) return 'increasing';
    if (change < -1) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Calculate overall health score
   */
  _calculateOverallHealthScore(todayData, weeklyData) {
    if (!todayData) return 0;
    
    let score = 0;
    let maxScore = 0;
    
    // Steps (25 points)
    maxScore += 25;
    if (todayData.steps) {
      score += Math.min((todayData.steps / 10000) * 25, 25);
    }
    
    // Sleep (25 points)
    maxScore += 25;
    if (todayData.sleep) {
      const sleepScore = todayData.sleep >= 7 ? 25 : (todayData.sleep / 7) * 25;
      score += sleepScore;
    }
    
    // Heart rate (20 points)
    maxScore += 20;
    if (todayData.heartRate?.resting) {
      const rhr = todayData.heartRate.resting;
      if (rhr < 60) score += 20;
      else if (rhr < 70) score += 15;
      else if (rhr < 80) score += 10;
      else score += 5;
    }
    
    // Activity calories (15 points)
    maxScore += 15;
    if (todayData.calories) {
      score += Math.min((todayData.calories / 400) * 15, 15);
    }
    
    // Consistency (15 points)
    maxScore += 15;
    if (weeklyData?.consistency) {
      score += weeklyData.consistency * 15;
    }
    
    return Math.round((score / maxScore) * 100);
  }
}

// Export singleton instance
export default new ContextAggregator();