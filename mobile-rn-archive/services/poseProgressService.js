/**
 * Pose Progress Service
 * Manages pose analysis progress tracking, form score history, and performance metrics
 * Integrates with existing Firebase infrastructure and PoseAnalysisService
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

// Storage keys
const POSE_PROGRESS_CACHE_KEY = '@pose_progress_cache';
const POSE_SETTINGS_KEY = '@pose_progress_settings';
const FORM_SCORES_CACHE_KEY = '@form_scores_cache';

// Collection names
const POSE_ANALYSIS_HISTORY = 'poseAnalysisHistory';
const USER_POSE_PROGRESS = 'userPoseProgress';
const POSE_SETTINGS = 'poseSettings';

/**
 * Pose Progress Service Class
 * Tracks form analysis results, historical data, and user progress over time
 */
class PoseProgressService {
  constructor() {
    this.progressCache = new Map(); // Exercise ID -> progress data
    this.formScoresCache = new Map(); // Exercise ID -> form scores array
    this.settingsCache = {};
    this.isInitialized = false;
    this.lastSyncTime = null;
    
    // Default settings
    this.defaultSettings = {
      dataRetentionDays: 365,
      trackingEnabled: true,
      syncFrequency: 'daily', // 'realtime', 'daily', 'weekly'
      includeVideoFiles: false, // Whether to keep video references
      exportFormat: 'json', // 'json', 'csv'
      privacyLevel: 'private' // 'private', 'anonymous'
    };
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      console.log('🏋️ Initializing Pose Progress Service...');
      
      // Load cached data
      await this.loadFromCache();
      
      // Load user settings
      await this.loadUserSettings();
      
      this.isInitialized = true;
      console.log('✅ Pose Progress Service initialized');
      
      // Background sync if needed
      this.scheduleBackgroundSync();
      
      return {
        success: true,
        message: 'Pose progress service initialized successfully'
      };
    } catch (error) {
      console.error('❌ Error initializing pose progress service:', error);
      return {
        success: false,
        message: `Initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Record a pose analysis session
   */
  async recordAnalysisSession(analysisData, videoMetadata = {}) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      if (!this.isInitialized) {
        await this.initialize();
      }

      const sessionData = {
        userId: user.uid,
        analysisId: analysisData.id || this.generateAnalysisId(),
        
        // Exercise information
        exerciseType: analysisData.exerciseType,
        exerciseName: this.getExerciseName(analysisData.exerciseType),
        
        // Form analysis results
        overallScore: analysisData.analysis?.overallScore || 0,
        formScores: this.extractFormScores(analysisData.analysis),
        
        // Performance metrics
        confidence: analysisData.confidenceMetrics?.analysisReliability || 0,
        framesCoverage: analysisData.confidenceMetrics?.framesCoverage || 0,
        processingTime: analysisData.processingTime || 0,
        framesProcessed: analysisData.framesProcessed || 0,
        
        // Movement analysis
        movementPhases: analysisData.analysis?.keyPhases || [],
        timing: analysisData.analysis?.timing || {},
        jointAngles: this.summarizeJointAngles(analysisData.analysis?.jointAngles || []),
        
        // Errors and improvements
        criticalErrors: analysisData.analysis?.criticalErrors || [],
        improvements: analysisData.analysis?.improvements || [],
        warnings: analysisData.warnings || [],
        
        // Video metadata (optional)
        videoUri: this.settingsCache.includeVideoFiles ? videoMetadata.uri : null,
        videoDuration: videoMetadata.duration || null,
        videoFileSize: videoMetadata.fileSize || null,
        
        // Progress tracking
        isPersonalBest: false, // Will be calculated
        improvementFromLast: 0, // Will be calculated
        consistencyScore: 0, // Will be calculated
        
        // Timestamps
        analyzedAt: new Date(),
        createdAt: serverTimestamp()
      };

      // Calculate progress metrics
      await this.calculateProgressMetrics(sessionData);
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, POSE_ANALYSIS_HISTORY), sessionData);
      sessionData.id = docRef.id;
      
      // Update local cache
      this.updateLocalCache(sessionData);
      
      // Update aggregate progress data
      await this.updateAggregateProgress(sessionData);
      
      // Check for achievements
      const achievements = await this.checkAchievements(sessionData);
      
      console.log('✅ Pose analysis session recorded:', docRef.id);
      
      return {
        id: docRef.id,
        ...sessionData,
        achievements
      };
    } catch (error) {
      console.error('❌ Error recording analysis session:', error);
      throw error;
    }
  }

  /**
   * Get progress history for an exercise
   */
  async getExerciseProgress(exerciseType, options = {}) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const {
        limit: limitCount = 50,
        timeRange = '30d', // '7d', '30d', '90d', '1y', 'all'
        includeDetails = true
      } = options;

      // Check cache first
      const cacheKey = `${user.uid}_${exerciseType}_${timeRange}`;
      if (this.progressCache.has(cacheKey)) {
        const cached = this.progressCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes
          return cached.data.slice(0, limitCount);
        }
      }

      // Build query
      let q = query(
        collection(db, POSE_ANALYSIS_HISTORY),
        where('userId', '==', user.uid),
        where('exerciseType', '==', exerciseType),
        orderBy('analyzedAt', 'desc')
      );

      // Add time range filter
      if (timeRange !== 'all') {
        const startDate = this.calculateStartDate(timeRange);
        q = query(q, where('analyzedAt', '>=', startDate));
      }

      // Add limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      const progress = [];
      
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        
        // Filter out detailed data if not needed
        if (!includeDetails) {
          delete data.jointAngles;
          delete data.movementPhases;
          delete data.criticalErrors;
          delete data.improvements;
        }
        
        progress.push(data);
      });

      // Update cache
      this.progressCache.set(cacheKey, {
        data: progress,
        timestamp: Date.now()
      });

      return progress;
    } catch (error) {
      console.error('❌ Error fetching exercise progress:', error);
      return [];
    }
  }

  /**
   * Get form score trends for visualization
   */
  async getFormScoreTrends(exerciseType, timeRange = '30d') {
    try {
      const progress = await this.getExerciseProgress(exerciseType, { 
        timeRange, 
        includeDetails: false 
      });

      return {
        exerciseType,
        timeRange,
        data: progress.map(session => ({
          date: session.analyzedAt,
          overallScore: session.overallScore,
          confidence: session.confidence,
          formScores: session.formScores
        })),
        summary: {
          totalSessions: progress.length,
          averageScore: this.calculateAverageScore(progress),
          bestScore: Math.max(...progress.map(p => p.overallScore || 0)),
          improvement: this.calculateImprovement(progress),
          lastAnalysis: progress[0]?.analyzedAt || null
        }
      };
    } catch (error) {
      console.error('❌ Error getting form score trends:', error);
      return {
        exerciseType,
        timeRange,
        data: [],
        summary: {
          totalSessions: 0,
          averageScore: 0,
          bestScore: 0,
          improvement: 0,
          lastAnalysis: null
        }
      };
    }
  }

  /**
   * Get detailed progress summary for an exercise
   */
  async getProgressSummary(exerciseType) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Get recent progress
      const recentProgress = await this.getExerciseProgress(exerciseType, { 
        limit: 10, 
        timeRange: '30d' 
      });

      // Get all-time progress for comparison
      const allTimeProgress = await this.getExerciseProgress(exerciseType, { 
        limit: 100, 
        timeRange: 'all', 
        includeDetails: false 
      });

      const summary = {
        exerciseType,
        exerciseName: this.getExerciseName(exerciseType),
        
        // Recent performance
        recentSessions: recentProgress.length,
        lastAnalysis: recentProgress[0]?.analyzedAt || null,
        currentScore: recentProgress[0]?.overallScore || 0,
        
        // Progress metrics
        averageScore: this.calculateAverageScore(recentProgress),
        bestScore: Math.max(...allTimeProgress.map(p => p.overallScore || 0)),
        improvement: this.calculateImprovement(allTimeProgress),
        consistency: this.calculateConsistency(recentProgress),
        
        // Form analysis
        commonErrors: this.analyzeCommonErrors(recentProgress),
        improvementAreas: this.identifyImprovementAreas(recentProgress),
        strengths: this.identifyStrengths(recentProgress),
        
        // Achievement tracking
        personalBests: allTimeProgress.filter(p => p.isPersonalBest),
        streaks: this.calculateStreaks(allTimeProgress),
        
        // Statistics
        totalSessions: allTimeProgress.length,
        totalAnalysisTime: allTimeProgress.reduce((sum, p) => sum + (p.processingTime || 0), 0),
        averageConfidence: this.calculateAverageConfidence(allTimeProgress)
      };

      return summary;
    } catch (error) {
      console.error('❌ Error getting progress summary:', error);
      throw error;
    }
  }

  /**
   * Update user progress settings
   */
  async updateProgressSettings(settings) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const updatedSettings = {
        ...this.defaultSettings,
        ...this.settingsCache,
        ...settings,
        userId: user.uid,
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      const settingsRef = doc(db, POSE_SETTINGS, user.uid);
      await updateDoc(settingsRef, updatedSettings);

      // Update cache
      this.settingsCache = updatedSettings;
      await this.saveSettingsCache();

      console.log('✅ Progress settings updated');
      return updatedSettings;
    } catch (error) {
      console.error('❌ Error updating progress settings:', error);
      throw error;
    }
  }

  /**
   * Export progress data
   */
  async exportProgressData(exerciseType = null, format = 'json') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      let data;
      
      if (exerciseType) {
        data = await this.getExerciseProgress(exerciseType, { 
          timeRange: 'all', 
          includeDetails: true 
        });
      } else {
        // Export all exercises
        data = await this.getAllUserProgress();
      }

      const exportData = {
        userId: user.uid,
        exportedAt: new Date().toISOString(),
        exerciseType,
        format,
        totalSessions: data.length,
        data: data.map(session => ({
          ...session,
          // Convert Firestore timestamps to ISO strings
          analyzedAt: session.analyzedAt?.toISOString?.() || session.analyzedAt,
          createdAt: session.createdAt?.toISOString?.() || session.createdAt
        }))
      };

      if (format === 'csv') {
        return this.convertToCSV(exportData.data);
      }

      return exportData;
    } catch (error) {
      console.error('❌ Error exporting progress data:', error);
      throw error;
    }
  }

  /**
   * Clean up old data based on retention policy
   */
  async cleanupOldData() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const retentionDays = this.settingsCache.dataRetentionDays || this.defaultSettings.dataRetentionDays;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      console.log(`🧹 Cleaning up pose analysis data older than ${retentionDays} days`);

      // Query old records
      const q = query(
        collection(db, POSE_ANALYSIS_HISTORY),
        where('userId', '==', user.uid),
        where('analyzedAt', '<', cutoffDate),
        limit(500) // Process in batches
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('✅ No old data to clean up');
        return 0;
      }

      // Batch delete
      const batch = writeBatch(db);
      let deleteCount = 0;

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
      });

      await batch.commit();
      
      // Clear relevant cache entries
      this.progressCache.clear();
      this.formScoresCache.clear();
      
      console.log(`✅ Cleaned up ${deleteCount} old analysis records`);
      return deleteCount;
    } catch (error) {
      console.error('❌ Error cleaning up old data:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  /**
   * Extract form scores from analysis results
   */
  extractFormScores(analysis) {
    if (!analysis) return {};

    const scores = {
      overall: analysis.overallScore || 0
    };

    // Exercise-specific scores
    switch (analysis.constructor.name) {
      case 'SquatAnalysis':
        scores.depth = analysis.depth?.depthScore || 0;
        scores.kneeAlignment = analysis.kneeAlignment?.kneeTrackingScore || 0;
        scores.spinalAlignment = analysis.spinalAlignment?.alignmentScore || 0;
        scores.balance = analysis.balanceAnalysis?.stabilityScore || 0;
        scores.timing = analysis.timing?.tempoScore || 0;
        break;
      // Add other exercise types as needed
      default:
        // Generic form scores
        if (analysis.formScores) {
          Object.assign(scores, analysis.formScores);
        }
    }

    return scores;
  }

  /**
   * Summarize joint angles data
   */
  summarizeJointAngles(jointAnglesSequence) {
    if (!Array.isArray(jointAnglesSequence) || jointAnglesSequence.length === 0) {
      return {};
    }

    const summary = {};
    const firstFrame = jointAnglesSequence[0];
    
    if (firstFrame) {
      Object.keys(firstFrame).forEach(joint => {
        const values = jointAnglesSequence
          .map(frame => frame[joint])
          .filter(val => typeof val === 'number' && !isNaN(val));
        
        if (values.length > 0) {
          summary[joint] = {
            min: Math.min(...values),
            max: Math.max(...values),
            average: values.reduce((sum, val) => sum + val, 0) / values.length,
            range: Math.max(...values) - Math.min(...values)
          };
        }
      });
    }

    return summary;
  }

  /**
   * Calculate progress metrics
   */
  async calculateProgressMetrics(sessionData) {
    try {
      // Get previous sessions for comparison
      const previousSessions = await this.getExerciseProgress(sessionData.exerciseType, {
        limit: 5,
        includeDetails: false
      });

      if (previousSessions.length > 0) {
        const lastSession = previousSessions[0];
        
        // Calculate improvement
        sessionData.improvementFromLast = sessionData.overallScore - (lastSession.overallScore || 0);
        
        // Check if personal best
        const bestScore = Math.max(...previousSessions.map(p => p.overallScore || 0));
        sessionData.isPersonalBest = sessionData.overallScore > bestScore;
        
        // Calculate consistency (how close to recent average)
        const recentScores = previousSessions.slice(0, 3).map(p => p.overallScore || 0);
        const recentAverage = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
        const deviation = Math.abs(sessionData.overallScore - recentAverage);
        sessionData.consistencyScore = Math.max(0, 100 - (deviation / recentAverage) * 100);
      } else {
        // First session
        sessionData.isPersonalBest = true;
        sessionData.improvementFromLast = 0;
        sessionData.consistencyScore = 100;
      }
    } catch (error) {
      console.error('❌ Error calculating progress metrics:', error);
      // Set default values on error
      sessionData.isPersonalBest = false;
      sessionData.improvementFromLast = 0;
      sessionData.consistencyScore = 0;
    }
  }

  /**
   * Update aggregate progress data
   */
  async updateAggregateProgress(sessionData) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const progressRef = doc(db, USER_POSE_PROGRESS, `${user.uid}_${sessionData.exerciseType}`);
      const existing = await getDoc(progressRef);

      let aggregateData;
      
      if (existing.exists()) {
        aggregateData = existing.data();
        aggregateData.totalSessions++;
        aggregateData.lastAnalysis = sessionData.analyzedAt;
        aggregateData.bestScore = Math.max(aggregateData.bestScore || 0, sessionData.overallScore);
        
        // Update running averages
        aggregateData.averageScore = (
          (aggregateData.averageScore * (aggregateData.totalSessions - 1)) + sessionData.overallScore
        ) / aggregateData.totalSessions;
        
      } else {
        aggregateData = {
          userId: user.uid,
          exerciseType: sessionData.exerciseType,
          exerciseName: sessionData.exerciseName,
          totalSessions: 1,
          bestScore: sessionData.overallScore,
          averageScore: sessionData.overallScore,
          firstAnalysis: sessionData.analyzedAt,
          lastAnalysis: sessionData.analyzedAt,
          createdAt: serverTimestamp()
        };
      }

      aggregateData.updatedAt = serverTimestamp();
      
      await updateDoc(progressRef, aggregateData);
    } catch (error) {
      console.error('❌ Error updating aggregate progress:', error);
    }
  }

  /**
   * Check for achievements
   */
  async checkAchievements(sessionData) {
    const achievements = [];

    try {
      // Personal best achievement
      if (sessionData.isPersonalBest) {
        achievements.push({
          type: 'personal_best',
          title: 'Personal Best!',
          description: `New high score of ${sessionData.overallScore} for ${sessionData.exerciseName}`,
          icon: '🏆',
          earnedAt: new Date()
        });
      }

      // Perfect form achievement
      if (sessionData.overallScore >= 95) {
        achievements.push({
          type: 'perfect_form',
          title: 'Perfect Form',
          description: 'Achieved excellent form with 95+ score',
          icon: '⭐',
          earnedAt: new Date()
        });
      }

      // Consistency achievement
      if (sessionData.consistencyScore >= 90) {
        achievements.push({
          type: 'consistency',
          title: 'Consistent Performer',
          description: 'Maintained consistent form quality',
          icon: '🎯',
          earnedAt: new Date()
        });
      }

      // Major improvement achievement
      if (sessionData.improvementFromLast >= 10) {
        achievements.push({
          type: 'major_improvement',
          title: 'Major Improvement',
          description: `Improved by ${sessionData.improvementFromLast} points`,
          icon: '📈',
          earnedAt: new Date()
        });
      }

      return achievements;
    } catch (error) {
      console.error('❌ Error checking achievements:', error);
      return achievements;
    }
  }

  /**
   * Helper calculation methods
   */
  
  calculateAverageScore(sessions) {
    if (!sessions.length) return 0;
    const total = sessions.reduce((sum, session) => sum + (session.overallScore || 0), 0);
    return Math.round(total / sessions.length);
  }

  calculateImprovement(sessions) {
    if (sessions.length < 2) return 0;
    const recent = sessions.slice(0, Math.min(5, sessions.length));
    const older = sessions.slice(-Math.min(5, sessions.length));
    
    const recentAvg = this.calculateAverageScore(recent);
    const olderAvg = this.calculateAverageScore(older);
    
    return recentAvg - olderAvg;
  }

  calculateConsistency(sessions) {
    if (sessions.length < 2) return 100;
    
    const scores = sessions.map(s => s.overallScore || 0);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency percentage (lower deviation = higher consistency)
    const consistencyScore = Math.max(0, 100 - (stdDev / mean) * 100);
    return Math.round(consistencyScore);
  }

  calculateAverageConfidence(sessions) {
    if (!sessions.length) return 0;
    const total = sessions.reduce((sum, session) => sum + (session.confidence || 0), 0);
    return Math.round((total / sessions.length) * 100) / 100;
  }

  calculateStreaks(sessions) {
    // Implement streak calculation logic
    return {
      current: 0,
      longest: 0,
      lastUpdated: new Date()
    };
  }

  analyzeCommonErrors(sessions) {
    const errorCounts = {};
    
    sessions.forEach(session => {
      session.criticalErrors?.forEach(error => {
        errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
      });
    });

    return Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count, percentage: (count / sessions.length) * 100 }));
  }

  identifyImprovementAreas(sessions) {
    // Analyze form scores to identify areas that need work
    const areaScores = {};
    
    sessions.forEach(session => {
      Object.entries(session.formScores || {}).forEach(([area, score]) => {
        if (area !== 'overall') {
          if (!areaScores[area]) areaScores[area] = [];
          areaScores[area].push(score);
        }
      });
    });

    return Object.entries(areaScores)
      .map(([area, scores]) => ({
        area,
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        trend: this.calculateTrend(scores)
      }))
      .filter(area => area.averageScore < 80) // Areas needing improvement
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 3);
  }

  identifyStrengths(sessions) {
    // Similar to improvement areas but for high-scoring areas
    const areaScores = {};
    
    sessions.forEach(session => {
      Object.entries(session.formScores || {}).forEach(([area, score]) => {
        if (area !== 'overall') {
          if (!areaScores[area]) areaScores[area] = [];
          areaScores[area].push(score);
        }
      });
    });

    return Object.entries(areaScores)
      .map(([area, scores]) => ({
        area,
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        consistency: this.calculateConsistency(scores.map(score => ({ overallScore: score })))
      }))
      .filter(area => area.averageScore >= 80) // Strong areas
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3);
  }

  calculateTrend(scores) {
    if (scores.length < 2) return 0;
    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.floor(scores.length / 2));
    
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
    
    return recentAvg - olderAvg;
  }

  /**
   * Utility methods
   */

  generateAnalysisId() {
    return `pose_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

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

  async getAllUserProgress() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, POSE_ANALYSIS_HISTORY),
      where('userId', '==', user.uid),
      orderBy('analyzedAt', 'desc'),
      limit(1000)
    );

    const snapshot = await getDocs(q);
    const progress = [];
    
    snapshot.forEach(doc => {
      progress.push({ id: doc.id, ...doc.data() });
    });

    return progress;
  }

  convertToCSV(data) {
    if (!data.length) return '';

    const headers = Object.keys(data[0]).filter(key => 
      typeof data[0][key] !== 'object' || data[0][key] === null
    );
    
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Cache management methods
   */

  updateLocalCache(sessionData) {
    // Update progress cache
    const exerciseKey = `${sessionData.userId}_${sessionData.exerciseType}`;
    const existing = this.progressCache.get(exerciseKey);
    
    if (existing) {
      existing.data.unshift(sessionData);
      existing.timestamp = Date.now();
    }

    // Update form scores cache
    const scoresKey = `${sessionData.userId}_${sessionData.exerciseType}_scores`;
    const existingScores = this.formScoresCache.get(scoresKey);
    
    const scoreEntry = {
      date: sessionData.analyzedAt,
      overallScore: sessionData.overallScore,
      formScores: sessionData.formScores
    };

    if (existingScores) {
      existingScores.data.unshift(scoreEntry);
      existingScores.timestamp = Date.now();
    } else {
      this.formScoresCache.set(scoresKey, {
        data: [scoreEntry],
        timestamp: Date.now()
      });
    }

    // Save to persistent cache
    this.saveToCache();
  }

  async loadFromCache() {
    try {
      const cached = await AsyncStorage.getItem(POSE_PROGRESS_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        this.progressCache = new Map(data.progress || []);
        this.formScoresCache = new Map(data.formScores || []);
        this.lastSyncTime = data.lastSyncTime;
      }

      const scoresCached = await AsyncStorage.getItem(FORM_SCORES_CACHE_KEY);
      if (scoresCached && !this.formScoresCache.size) {
        const scoresData = JSON.parse(scoresCached);
        this.formScoresCache = new Map(scoresData);
      }
    } catch (error) {
      console.error('❌ Error loading from cache:', error);
    }
  }

  async saveToCache() {
    try {
      const cacheData = {
        progress: Array.from(this.progressCache.entries()),
        formScores: Array.from(this.formScoresCache.entries()),
        lastSyncTime: Date.now()
      };

      await AsyncStorage.setItem(POSE_PROGRESS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error saving to cache:', error);
    }
  }

  async loadUserSettings() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Try to load from cache first
      const cached = await AsyncStorage.getItem(POSE_SETTINGS_KEY);
      if (cached) {
        this.settingsCache = JSON.parse(cached);
      }

      // Load from Firestore
      const settingsRef = doc(db, POSE_SETTINGS, user.uid);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        this.settingsCache = { ...this.defaultSettings, ...settingsDoc.data() };
        await this.saveSettingsCache();
      } else {
        // Create default settings
        this.settingsCache = { ...this.defaultSettings, userId: user.uid };
        await updateDoc(settingsRef, this.settingsCache);
      }
    } catch (error) {
      console.error('❌ Error loading user settings:', error);
      this.settingsCache = this.defaultSettings;
    }
  }

  async saveSettingsCache() {
    try {
      await AsyncStorage.setItem(POSE_SETTINGS_KEY, JSON.stringify(this.settingsCache));
    } catch (error) {
      console.error('❌ Error saving settings cache:', error);
    }
  }

  scheduleBackgroundSync() {
    // Schedule background sync based on user settings
    if (this.settingsCache.syncFrequency === 'realtime') {
      // Real-time sync is handled by Firestore listeners
      return;
    }

    const syncInterval = this.settingsCache.syncFrequency === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    
    setTimeout(() => {
      this.syncWithFirestore();
      this.scheduleBackgroundSync(); // Reschedule
    }, syncInterval);
  }

  async syncWithFirestore() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      console.log('🔄 Syncing pose progress with Firestore...');
      
      // Clear cache to force fresh data on next request
      this.progressCache.clear();
      this.formScoresCache.clear();
      
      this.lastSyncTime = Date.now();
      await this.saveToCache();
      
      console.log('✅ Pose progress sync complete');
    } catch (error) {
      console.error('❌ Error syncing with Firestore:', error);
    }
  }

  /**
   * Form Context Integration Methods
   * Support methods for AI coaching context generation
   */

  /**
   * Get form progress data optimized for AI context
   */
  async getFormContextData(exerciseType, options = {}) {
    try {
      const {
        timeRange = '30d',
        limit = 10,
        includeErrorPatterns = true,
        includeFormScores = true
      } = options;

      const progress = await this.getExerciseProgress(exerciseType, {
        timeRange,
        limit,
        includeDetails: includeErrorPatterns
      });

      // Process data for form context
      const formContextData = {
        exerciseType,
        sessions: progress.map(session => ({
          id: session.id,
          analyzedAt: session.analyzedAt,
          overallScore: session.overallScore,
          formScores: includeFormScores ? session.formScores : {},
          confidence: session.confidence,
          criticalErrors: includeErrorPatterns ? (session.criticalErrors || []).slice(0, 3) : [],
          improvements: includeErrorPatterns ? (session.improvements || []).slice(0, 2) : []
        })),
        
        // Summary statistics for AI context
        summary: await this.getProgressSummary(exerciseType)
      };

      return formContextData;
    } catch (error) {
      console.error('❌ Error getting form context data:', error);
      return {
        exerciseType,
        sessions: [],
        summary: null
      };
    }
  }

  /**
   * Get competency data for form context
   */
  async getCompetencyForContext(exerciseType) {
    try {
      const summary = await this.getProgressSummary(exerciseType);
      
      return {
        level: this.determineCompetencyLevel(summary),
        score: summary.averageScore || 0,
        sessionCount: summary.totalSessions || 0,
        consistency: summary.consistency || 0,
        trend: this.calculateProgressTrend(summary),
        strengths: summary.strengths || [],
        weaknesses: summary.improvementAreas || []
      };
    } catch (error) {
      console.error('❌ Error getting competency for context:', error);
      return {
        level: 'beginner',
        score: 0,
        sessionCount: 0,
        consistency: 0,
        trend: 'stable',
        strengths: [],
        weaknesses: []
      };
    }
  }

  /**
   * Update form context cache after new analysis
   */
  async updateFormContextCache(exerciseType, analysisData) {
    try {
      // Invalidate related cache entries
      const cacheKeys = Array.from(this.progressCache.keys())
        .filter(key => key.includes(exerciseType));
      
      cacheKeys.forEach(key => {
        this.progressCache.delete(key);
      });

      // Clear form scores cache for this exercise
      const formScoreKeys = Array.from(this.formScoresCache.keys())
        .filter(key => key.includes(exerciseType));
      
      formScoreKeys.forEach(key => {
        this.formScoresCache.delete(key);
      });

      console.log('✅ Form context cache updated for:', exerciseType);
    } catch (error) {
      console.error('❌ Error updating form context cache:', error);
    }
  }

  /**
   * Get form trend data for AI coaching
   */
  async getFormTrends(exerciseType, timeRange = '30d') {
    try {
      const progress = await this.getExerciseProgress(exerciseType, {
        timeRange,
        limit: 20,
        includeDetails: false
      });

      if (!progress.length) {
        return {
          hasData: false,
          message: 'No historical data available'
        };
      }

      // Analyze trends in different form aspects
      const formAreas = {};
      const scoreHistory = [];

      progress.forEach(session => {
        scoreHistory.push({
          date: session.analyzedAt,
          score: session.overallScore || 0
        });

        if (session.formScores) {
          Object.entries(session.formScores).forEach(([area, score]) => {
            if (area !== 'overall' && typeof score === 'number') {
              if (!formAreas[area]) formAreas[area] = [];
              formAreas[area].push({
                date: session.analyzedAt,
                score
              });
            }
          });
        }
      });

      return {
        hasData: true,
        overallTrend: this.calculateTrendDirection(scoreHistory),
        formAreaTrends: Object.entries(formAreas).reduce((trends, [area, scores]) => {
          trends[area] = {
            trend: this.calculateTrendDirection(scores),
            current: scores[0]?.score || 0,
            average: scores.reduce((sum, s) => sum + s.score, 0) / scores.length
          };
          return trends;
        }, {}),
        recentSessions: scoreHistory.slice(0, 5)
      };
    } catch (error) {
      console.error('❌ Error getting form trends:', error);
      return {
        hasData: false,
        error: error.message
      };
    }
  }

  /**
   * Private helper methods for form context
   */

  determineCompetencyLevel(summary) {
    if (!summary || summary.totalSessions === 0) return 'beginner';
    
    const { averageScore, totalSessions } = summary;
    
    if (averageScore >= 85 && totalSessions >= 10) return 'advanced';
    if (averageScore >= 70 && totalSessions >= 5) return 'intermediate';
    return 'beginner';
  }

  calculateProgressTrend(summary) {
    if (!summary || !summary.improvement) return 'stable';
    
    const improvement = summary.improvement;
    if (improvement > 5) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
  }

  calculateTrendDirection(dataPoints) {
    if (dataPoints.length < 3) return 'stable';
    
    const recent = dataPoints.slice(0, Math.ceil(dataPoints.length / 2));
    const older = dataPoints.slice(Math.floor(dataPoints.length / 2));
    
    const recentAvg = recent.reduce((sum, point) => sum + point.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, point) => sum + point.score, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 3) return 'improving';
    if (difference < -3) return 'declining';
    return 'stable';
  }

  /**
   * Cleanup and destroy
   */
  async clearAllData() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      console.log('🗑️ Clearing all pose progress data...');
      
      // Clear Firestore data
      const historyQuery = query(
        collection(db, POSE_ANALYSIS_HISTORY),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(historyQuery);
      const batch = writeBatch(db);
      
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Clear aggregate data
      const progressQuery = query(
        collection(db, USER_POSE_PROGRESS),
        where('userId', '==', user.uid)
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      const progressBatch = writeBatch(db);
      
      progressSnapshot.forEach(doc => {
        progressBatch.delete(doc.ref);
      });
      
      await progressBatch.commit();
      
      // Clear local cache
      await this.clearCache();
      
      // Clear form context service cache too
      try {
        const { default: formContextService } = await import('./formContextService');
        await formContextService.clearPersistentCache();
        console.log('✅ Form context cache cleared');
      } catch (contextError) {
        console.warn('⚠️ Failed to clear form context cache:', contextError);
      }
      
      console.log('✅ All pose progress data cleared');
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }

  async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        POSE_PROGRESS_CACHE_KEY,
        FORM_SCORES_CACHE_KEY
      ]);
      
      this.progressCache.clear();
      this.formScoresCache.clear();
      this.lastSyncTime = null;
      
      console.log('🗑️ Pose progress cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  destroy() {
    this.progressCache.clear();
    this.formScoresCache.clear();
    this.settingsCache = {};
    this.isInitialized = false;
    console.log('🔄 Pose Progress Service destroyed');
  }
}

// Create singleton instance
const poseProgressService = new PoseProgressService();

export default poseProgressService;