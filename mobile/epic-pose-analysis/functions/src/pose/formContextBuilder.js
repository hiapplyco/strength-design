/**
 * Form Context Builder for AI Coaching
 * Aggregates form analysis data and historical progress for intelligent AI coaching
 * Issue #16 - Stream A: Form Context Builder & Data Integration
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

// Collection names
const POSE_ANALYSIS_HISTORY = 'poseAnalysisHistory';
const USER_POSE_PROGRESS = 'userPoseProgress';
const POSE_SETTINGS = 'poseSettings';

// Context building constants
const CONTEXT_LIMITS = {
  MAX_RECENT_SESSIONS: 5,
  MAX_HISTORICAL_SESSIONS: 15,
  MAX_CONTEXT_TOKENS: 2000,
  MIN_CONFIDENCE_THRESHOLD: 0.6
};

/**
 * Build comprehensive form context for AI coaching
 * Combines current analysis with historical progress data
 */
export const buildFormContext = onCall(
  {
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 90,
  },
  async (request) => {
    try {
      const { 
        currentAnalysis, 
        exerciseType, 
        contextType = 'comprehensive',  // 'minimal', 'focused', 'comprehensive'
        includeHistory = true,
        targetTokens = CONTEXT_LIMITS.MAX_CONTEXT_TOKENS
      } = request.data;
      
      const userId = request.auth?.uid;

      if (!userId) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
      }

      if (!exerciseType) {
        throw new HttpsError("invalid-argument", "Exercise type is required");
      }

      logger.info("Building form context for AI coaching", {
        userId,
        exerciseType,
        contextType,
        includeHistory,
        hasCurrentAnalysis: !!currentAnalysis
      });

      // Build context components
      const contextBuilder = new FormContextBuilder(userId, exerciseType);
      
      // Get user progress and competency
      const [userProgress, competencyLevel, userSettings] = await Promise.all([
        includeHistory ? contextBuilder.getUserProgress() : null,
        includeHistory ? contextBuilder.getCompetencyLevel() : null,
        contextBuilder.getUserSettings()
      ]);

      // Build the context
      const context = await contextBuilder.buildContext({
        currentAnalysis,
        userProgress,
        competencyLevel,
        userSettings,
        contextType,
        targetTokens
      });

      const estimatedTokens = estimateTokenCount(JSON.stringify(context));

      logger.info("Form context built successfully", {
        userId,
        exerciseType,
        contextType,
        estimatedTokens,
        targetTokens,
        componentsIncluded: Object.keys(context)
      });

      return {
        success: true,
        context,
        metadata: {
          exerciseType,
          contextType,
          estimatedTokens,
          targetTokens,
          builtAt: new Date().toISOString(),
          userId: userId.substring(0, 8) + '...' // Partial ID for logging
        }
      };

    } catch (error) {
      logger.error("Form context building failed", {
        error: error.message,
        stack: error.stack,
        userId: request.auth?.uid
      });

      throw new HttpsError("internal", `Context building failed: ${error.message}`);
    }
  }
);

/**
 * Get historical form progress for context
 */
export const getHistoricalFormContext = onCall(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  async (request) => {
    try {
      const { 
        exerciseType, 
        timeRange = '30d',
        limit = CONTEXT_LIMITS.MAX_HISTORICAL_SESSIONS,
        includeDetails = false
      } = request.data;
      
      const userId = request.auth?.uid;

      if (!userId) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
      }

      if (!exerciseType) {
        throw new HttpsError("invalid-argument", "Exercise type is required");
      }

      logger.info("Getting historical form context", {
        userId,
        exerciseType,
        timeRange,
        limit
      });

      const contextBuilder = new FormContextBuilder(userId, exerciseType);
      const historicalContext = await contextBuilder.getHistoricalContext({
        timeRange,
        limit,
        includeDetails
      });

      return {
        success: true,
        historicalContext,
        metadata: {
          exerciseType,
          timeRange,
          limit,
          sessionsFound: historicalContext.sessions?.length || 0
        }
      };

    } catch (error) {
      logger.error("Historical form context retrieval failed", {
        error: error.message,
        stack: error.stack,
        userId: request.auth?.uid
      });

      throw new HttpsError("internal", `Historical context retrieval failed: ${error.message}`);
    }
  }
);

/**
 * Form Context Builder Class
 * Handles the complex logic of building AI coaching context
 */
class FormContextBuilder {
  constructor(userId, exerciseType) {
    this.userId = userId;
    this.exerciseType = exerciseType;
  }

  /**
   * Build comprehensive context for AI coaching
   */
  async buildContext({
    currentAnalysis,
    userProgress,
    competencyLevel,
    userSettings,
    contextType,
    targetTokens
  }) {
    const context = {
      // Core exercise information
      exerciseType: this.exerciseType,
      exerciseName: this.getExerciseName(this.exerciseType),
      
      // User competency and experience level
      userProfile: this.buildUserProfile(competencyLevel, userSettings),
      
      // Current analysis results
      currentSession: currentAnalysis ? this.buildCurrentSessionContext(currentAnalysis) : null,
      
      // Historical performance context
      progressContext: userProgress ? this.buildProgressContext(userProgress, contextType) : null,
      
      // AI coaching parameters
      coachingProfile: this.buildCoachingProfile(competencyLevel, userSettings),
      
      // Context metadata
      contextMetadata: {
        type: contextType,
        generatedAt: new Date().toISOString(),
        tokenBudget: targetTokens
      }
    };

    // Apply context optimization based on type and token budget
    return this.optimizeContext(context, contextType, targetTokens);
  }

  /**
   * Get user progress data from Firestore
   */
  async getUserProgress() {
    try {
      // Get recent sessions
      const recentQuery = db.collection(POSE_ANALYSIS_HISTORY)
        .where('userId', '==', this.userId)
        .where('exerciseType', '==', this.exerciseType)
        .orderBy('analyzedAt', 'desc')
        .limit(CONTEXT_LIMITS.MAX_RECENT_SESSIONS);

      const recentSnapshot = await recentQuery.get();
      const recentSessions = [];

      recentSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.confidence && data.confidence >= CONTEXT_LIMITS.MIN_CONFIDENCE_THRESHOLD) {
          recentSessions.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Get aggregate progress data
      const progressRef = db.collection(USER_POSE_PROGRESS).doc(`${this.userId}_${this.exerciseType}`);
      const progressDoc = await progressRef.get();
      const aggregateProgress = progressDoc.exists() ? progressDoc.data() : null;

      return {
        recentSessions,
        aggregateProgress,
        totalSessions: recentSessions.length
      };

    } catch (error) {
      logger.error("Error getting user progress", { error: error.message, userId: this.userId });
      return null;
    }
  }

  /**
   * Calculate user competency level
   */
  async getCompetencyLevel() {
    try {
      const userProgress = await this.getUserProgress();
      if (!userProgress || !userProgress.recentSessions.length) {
        return {
          level: 'beginner',
          score: 0,
          confidence: 0,
          sessionCount: 0
        };
      }

      const scores = userProgress.recentSessions.map(session => session.overallScore || 0);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      // Determine competency level
      let level = 'beginner';
      if (averageScore >= 85 && scores.length >= 8) {
        level = 'advanced';
      } else if (averageScore >= 70 && scores.length >= 4) {
        level = 'intermediate';
      }

      // Calculate consistency
      const mean = averageScore;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);
      const consistency = mean > 0 ? Math.max(0, 100 - (stdDev / mean) * 100) : 0;

      return {
        level,
        score: Math.round(averageScore),
        confidence: Math.round(consistency),
        sessionCount: scores.length,
        bestScore: Math.max(...scores),
        trend: this.calculateTrend(scores)
      };

    } catch (error) {
      logger.error("Error calculating competency level", { error: error.message, userId: this.userId });
      return {
        level: 'beginner',
        score: 0,
        confidence: 0,
        sessionCount: 0
      };
    }
  }

  /**
   * Get user settings and preferences
   */
  async getUserSettings() {
    try {
      const settingsRef = db.collection(POSE_SETTINGS).doc(this.userId);
      const settingsDoc = await settingsRef.get();
      
      const defaultSettings = {
        coachingStyle: 'supportive',
        feedbackDetail: 'balanced',
        focusAreas: [],
        preferredLanguage: 'english',
        experienceLevel: 'auto' // auto-detect, beginner, intermediate, advanced
      };

      return settingsDoc.exists() 
        ? { ...defaultSettings, ...settingsDoc.data() }
        : defaultSettings;

    } catch (error) {
      logger.error("Error getting user settings", { error: error.message, userId: this.userId });
      return {
        coachingStyle: 'supportive',
        feedbackDetail: 'balanced',
        focusAreas: [],
        preferredLanguage: 'english',
        experienceLevel: 'auto'
      };
    }
  }

  /**
   * Get historical context data
   */
  async getHistoricalContext({ timeRange, limit, includeDetails }) {
    try {
      const startDate = this.calculateStartDate(timeRange);
      
      let query = db.collection(POSE_ANALYSIS_HISTORY)
        .where('userId', '==', this.userId)
        .where('exerciseType', '==', this.exerciseType)
        .where('analyzedAt', '>=', startDate)
        .orderBy('analyzedAt', 'desc')
        .limit(limit);

      const snapshot = await query.get();
      const sessions = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.confidence && data.confidence >= CONTEXT_LIMITS.MIN_CONFIDENCE_THRESHOLD) {
          const session = {
            id: doc.id,
            analyzedAt: data.analyzedAt,
            overallScore: data.overallScore,
            formScores: data.formScores,
            confidence: data.confidence
          };

          if (includeDetails) {
            session.criticalErrors = data.criticalErrors;
            session.improvements = data.improvements;
            session.movementPhases = data.movementPhases;
          }

          sessions.push(session);
        }
      });

      // Calculate historical trends
      const scores = sessions.map(s => s.overallScore || 0);
      const trends = this.calculateHistoricalTrends(sessions);

      return {
        sessions,
        timeRange,
        trends,
        statistics: {
          totalSessions: sessions.length,
          averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
          bestScore: scores.length ? Math.max(...scores) : 0,
          mostRecentScore: scores.length ? scores[0] : 0
        }
      };

    } catch (error) {
      logger.error("Error getting historical context", { error: error.message, userId: this.userId });
      return {
        sessions: [],
        timeRange,
        trends: {},
        statistics: { totalSessions: 0, averageScore: 0, bestScore: 0, mostRecentScore: 0 }
      };
    }
  }

  /**
   * Context building helper methods
   */

  buildUserProfile(competencyLevel, userSettings) {
    return {
      experienceLevel: userSettings.experienceLevel !== 'auto' 
        ? userSettings.experienceLevel 
        : competencyLevel?.level || 'beginner',
      competencyScore: competencyLevel?.score || 0,
      sessionCount: competencyLevel?.sessionCount || 0,
      consistency: competencyLevel?.confidence || 0,
      preferredLanguage: userSettings.preferredLanguage || 'english',
      focusAreas: userSettings.focusAreas || []
    };
  }

  buildCurrentSessionContext(currentAnalysis) {
    if (!currentAnalysis) return null;

    return {
      overallScore: currentAnalysis.analysis?.overallScore || 0,
      formScores: this.extractFormScores(currentAnalysis.analysis),
      criticalErrors: (currentAnalysis.analysis?.criticalErrors || []).slice(0, 5).map(error => ({
        type: error.type,
        severity: error.severity,
        description: this.truncateText(error.description, 150),
        correction: this.truncateText(error.correction, 150)
      })),
      improvements: (currentAnalysis.analysis?.improvements || []).slice(0, 4).map(imp => ({
        category: imp.category,
        priority: imp.priority,
        suggestion: this.truncateText(imp.suggestion, 200)
      })),
      confidence: {
        analysis: Math.round((currentAnalysis.confidenceMetrics?.analysisReliability || 0) * 100),
        coverage: Math.round((currentAnalysis.confidenceMetrics?.framesCoverage || 0) * 100)
      },
      warnings: currentAnalysis.warnings || []
    };
  }

  buildProgressContext(userProgress, contextType) {
    if (!userProgress || !userProgress.recentSessions.length) {
      return {
        hasHistory: false,
        message: "No previous sessions found for this exercise."
      };
    }

    const recentScores = userProgress.recentSessions.map(s => s.overallScore || 0);
    const formScoresTrends = this.analyzeFormScoresTrends(userProgress.recentSessions);

    const context = {
      hasHistory: true,
      recentPerformance: {
        sessionsCount: userProgress.recentSessions.length,
        averageScore: Math.round(recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length),
        bestScore: Math.max(...recentScores),
        latestScore: recentScores[0] || 0,
        trend: this.calculateTrend(recentScores)
      },
      
      formProgress: formScoresTrends,
      
      commonIssues: this.identifyCommonIssues(userProgress.recentSessions),
      
      strengths: this.identifyStrengths(userProgress.recentSessions)
    };

    // Add detailed session data for comprehensive context
    if (contextType === 'comprehensive') {
      context.recentSessions = userProgress.recentSessions.slice(0, 3).map(session => ({
        analyzedAt: session.analyzedAt,
        overallScore: session.overallScore,
        formScores: session.formScores,
        topErrors: (session.criticalErrors || []).slice(0, 2).map(e => e.type),
        confidence: session.confidence
      }));
    }

    return context;
  }

  buildCoachingProfile(competencyLevel, userSettings) {
    const level = competencyLevel?.level || 'beginner';
    const coachingStyle = userSettings.coachingStyle || 'supportive';
    const feedbackDetail = userSettings.feedbackDetail || 'balanced';

    return {
      targetAudience: level,
      communicationStyle: coachingStyle,
      feedbackLevel: feedbackDetail,
      
      // Coaching guidelines based on user level
      guidelines: this.getCoachingGuidelines(level, coachingStyle),
      
      // Focus areas based on competency and settings
      focusAreas: this.determineFocusAreas(competencyLevel, userSettings),
      
      // Tone and approach
      tone: this.getCoachingTone(level, coachingStyle)
    };
  }

  /**
   * Context optimization methods
   */

  optimizeContext(context, contextType, targetTokens) {
    let optimized = { ...context };
    const currentTokens = estimateTokenCount(JSON.stringify(optimized));

    if (currentTokens <= targetTokens) {
      return optimized;
    }

    logger.info("Optimizing context for token limit", {
      currentTokens,
      targetTokens,
      contextType
    });

    // Apply optimization strategies based on context type
    switch (contextType) {
      case 'minimal':
        optimized = this.createMinimalContext(optimized);
        break;
      case 'focused':
        optimized = this.createFocusedContext(optimized);
        break;
      default:
        optimized = this.compressContext(optimized, targetTokens);
    }

    return optimized;
  }

  createMinimalContext(context) {
    return {
      exerciseType: context.exerciseType,
      exerciseName: context.exerciseName,
      userProfile: {
        experienceLevel: context.userProfile.experienceLevel,
        competencyScore: context.userProfile.competencyScore
      },
      currentSession: context.currentSession ? {
        overallScore: context.currentSession.overallScore,
        criticalErrors: context.currentSession.criticalErrors.slice(0, 2),
        improvements: context.currentSession.improvements.slice(0, 2)
      } : null,
      coachingProfile: {
        targetAudience: context.coachingProfile.targetAudience,
        communicationStyle: context.coachingProfile.communicationStyle,
        tone: context.coachingProfile.tone
      }
    };
  }

  createFocusedContext(context) {
    const focused = this.createMinimalContext(context);
    
    // Add focused progress information
    if (context.progressContext?.hasHistory) {
      focused.progressContext = {
        hasHistory: true,
        recentPerformance: context.progressContext.recentPerformance,
        commonIssues: context.progressContext.commonIssues.slice(0, 2),
        strengths: context.progressContext.strengths.slice(0, 2)
      };
    }

    return focused;
  }

  compressContext(context, targetTokens) {
    const compressed = { ...context };

    // Compress current session
    if (compressed.currentSession) {
      compressed.currentSession.criticalErrors = compressed.currentSession.criticalErrors.slice(0, 3);
      compressed.currentSession.improvements = compressed.currentSession.improvements.slice(0, 3);
      compressed.currentSession.warnings = compressed.currentSession.warnings.slice(0, 2);
    }

    // Compress progress context
    if (compressed.progressContext?.hasHistory) {
      compressed.progressContext.commonIssues = compressed.progressContext.commonIssues.slice(0, 3);
      compressed.progressContext.strengths = compressed.progressContext.strengths.slice(0, 3);
      
      if (compressed.progressContext.recentSessions) {
        compressed.progressContext.recentSessions = compressed.progressContext.recentSessions.slice(0, 2);
      }
    }

    return compressed;
  }

  /**
   * Analysis helper methods
   */

  extractFormScores(analysis) {
    if (!analysis) return {};
    
    const scores = {};
    
    // Extract exercise-specific scores
    if (analysis.depth?.depthScore !== undefined) scores.depth = analysis.depth.depthScore;
    if (analysis.kneeAlignment?.kneeTrackingScore !== undefined) scores.kneeAlignment = analysis.kneeAlignment.kneeTrackingScore;
    if (analysis.spinalAlignment?.alignmentScore !== undefined) scores.spinalAlignment = analysis.spinalAlignment.alignmentScore;
    if (analysis.balanceAnalysis?.stabilityScore !== undefined) scores.balance = analysis.balanceAnalysis.stabilityScore;
    if (analysis.timing?.tempoScore !== undefined) scores.timing = analysis.timing.tempoScore;
    
    // Add any other form scores
    if (analysis.formScores) {
      Object.assign(scores, analysis.formScores);
    }
    
    return scores;
  }

  analyzeFormScoresTrends(sessions) {
    const formAreas = {};
    
    sessions.forEach(session => {
      if (session.formScores) {
        Object.entries(session.formScores).forEach(([area, score]) => {
          if (area !== 'overall' && typeof score === 'number') {
            if (!formAreas[area]) formAreas[area] = [];
            formAreas[area].push(score);
          }
        });
      }
    });

    const trends = {};
    Object.entries(formAreas).forEach(([area, scores]) => {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const trend = this.calculateTrend(scores);
      
      trends[area] = {
        average: Math.round(average),
        trend,
        sessionsCount: scores.length
      };
    });

    return trends;
  }

  identifyCommonIssues(sessions) {
    const errorCounts = {};
    
    sessions.forEach(session => {
      (session.criticalErrors || []).forEach(error => {
        errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
      });
    });

    return Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({
        type,
        frequency: count,
        percentage: Math.round((count / sessions.length) * 100)
      }));
  }

  identifyStrengths(sessions) {
    const areaScores = {};
    
    sessions.forEach(session => {
      if (session.formScores) {
        Object.entries(session.formScores).forEach(([area, score]) => {
          if (area !== 'overall' && typeof score === 'number') {
            if (!areaScores[area]) areaScores[area] = [];
            areaScores[area].push(score);
          }
        });
      }
    });

    return Object.entries(areaScores)
      .map(([area, scores]) => ({
        area,
        averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
        consistency: this.calculateConsistency(scores)
      }))
      .filter(area => area.averageScore >= 80)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3);
  }

  calculateTrend(scores) {
    if (scores.length < 2) return 'stable';
    
    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.floor(scores.length / 2));
    
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  calculateConsistency(scores) {
    if (scores.length < 2) return 100;
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    return mean > 0 ? Math.max(0, Math.round(100 - (stdDev / mean) * 100)) : 0;
  }

  calculateHistoricalTrends(sessions) {
    if (!sessions.length) return {};

    const scores = sessions.map(s => s.overallScore || 0).reverse(); // Chronological order
    const formScores = {};

    // Analyze form score trends
    sessions.forEach(session => {
      if (session.formScores) {
        Object.entries(session.formScores).forEach(([area, score]) => {
          if (area !== 'overall' && typeof score === 'number') {
            if (!formScores[area]) formScores[area] = [];
            formScores[area].push(score);
          }
        });
      }
    });

    const trends = {
      overall: this.calculateTrend(scores),
      formAreas: {}
    };

    Object.entries(formScores).forEach(([area, areaScores]) => {
      trends.formAreas[area] = this.calculateTrend(areaScores.reverse());
    });

    return trends;
  }

  /**
   * Coaching profile methods
   */

  getCoachingGuidelines(level, style) {
    const guidelines = {
      beginner: {
        supportive: "Use encouraging language, focus on basic fundamentals, celebrate small wins",
        direct: "Give clear, simple instructions, focus on one correction at a time",
        technical: "Explain the 'why' behind movements, use anatomical references appropriately"
      },
      intermediate: {
        supportive: "Balance encouragement with challenge, acknowledge progress made",
        direct: "Provide specific, actionable feedback, address multiple areas simultaneously",
        technical: "Use technical terminology, reference biomechanics and performance theory"
      },
      advanced: {
        supportive: "Focus on refinement and optimization, acknowledge expertise level",
        direct: "Give precise corrections, discuss advanced techniques and variations",
        technical: "Use professional terminology, discuss complex movement patterns and efficiency"
      }
    };

    return guidelines[level]?.[style] || guidelines.beginner.supportive;
  }

  determineFocusAreas(competencyLevel, userSettings) {
    const areas = [];

    // User-specified focus areas
    if (userSettings.focusAreas && userSettings.focusAreas.length > 0) {
      areas.push(...userSettings.focusAreas);
    }

    // Auto-determined based on competency
    if (competencyLevel && competencyLevel.level) {
      switch (competencyLevel.level) {
        case 'beginner':
          areas.push('form_fundamentals', 'safety', 'movement_basics');
          break;
        case 'intermediate':
          areas.push('technique_refinement', 'consistency', 'progression');
          break;
        case 'advanced':
          areas.push('optimization', 'efficiency', 'advanced_techniques');
          break;
      }
    }

    return [...new Set(areas)]; // Remove duplicates
  }

  getCoachingTone(level, style) {
    const tones = {
      beginner: {
        supportive: "encouraging and patient",
        direct: "clear and instructional",
        technical: "educational and informative"
      },
      intermediate: {
        supportive: "motivational and goal-oriented",
        direct: "specific and performance-focused",
        technical: "analytical and detail-oriented"
      },
      advanced: {
        supportive: "collaborative and achievement-focused",
        direct: "precise and optimization-focused",
        technical: "expert-level and research-based"
      }
    };

    return tones[level]?.[style] || tones.beginner.supportive;
  }

  /**
   * Utility methods
   */

  getExerciseName(exerciseType) {
    const exerciseNames = {
      'squat': 'Squat',
      'deadlift': 'Deadlift',
      'push_up': 'Push-up',
      'bench_press': 'Bench Press',
      'overhead_press': 'Overhead Press',
      'baseball_pitch': 'Baseball Pitch',
      'tennis_serve': 'Tennis Serve',
      'golf_swing': 'Golf Swing',
      'basketball_shot': 'Basketball Shot'
    };
    return exerciseNames[exerciseType] || exerciseType;
  }

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

  truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

/**
 * Rough token estimation (4 characters ≈ 1 token for English)
 */
function estimateTokenCount(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}