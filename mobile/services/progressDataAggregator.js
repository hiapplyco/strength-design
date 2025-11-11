/**
 * Progress Data Aggregator Service
 * Handles complex data aggregation, analytics, and visualization preparation
 * for pose analysis progress tracking system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  aggregateQuery,
  sum,
  average,
  count
} from 'firebase/firestore';

// Cache keys
const AGGREGATED_DATA_CACHE_KEY = '@aggregated_pose_data_cache';
const ANALYTICS_CACHE_KEY = '@pose_analytics_cache';
const TRENDS_CACHE_KEY = '@pose_trends_cache';

// Time period constants
const TIME_PERIODS = {
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  QUARTER: 90 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
};

/**
 * Progress Data Aggregator Class
 * Provides advanced analytics, trend analysis, and data aggregation
 * for pose analysis progress visualization and insights
 */
class ProgressDataAggregator {
  constructor() {
    this.cache = new Map();
    this.analyticsCache = new Map();
    this.trendsCache = new Map();
    this.isInitialized = false;
    this.cacheTimeout = 300000; // 5 minutes default
    
    // Aggregation settings
    this.settings = {
      defaultTimeRange: 'month',
      maxDataPoints: 100,
      smoothingFactor: 0.3,
      outlierThreshold: 2.5,
      confidenceThreshold: 0.7
    };
  }

  /**
   * Initialize the aggregator service
   */
  async initialize() {
    try {
      console.log('📊 Initializing Progress Data Aggregator...');
      
      await this.loadCachedData();
      
      this.isInitialized = true;
      console.log('✅ Progress Data Aggregator initialized');
      
      return {
        success: true,
        message: 'Progress data aggregator initialized successfully'
      };
    } catch (error) {
      console.error('❌ Error initializing progress data aggregator:', error);
      return {
        success: false,
        message: `Initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Get comprehensive progress analytics for an exercise
   */
  async getExerciseAnalytics(exerciseType, options = {}) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const {
        timeRange = 'month',
        includeComparisons = true,
        includeProjections = true,
        granularity = 'daily'
      } = options;

      // Check cache first
      const cacheKey = `analytics_${user.uid}_${exerciseType}_${timeRange}_${granularity}`;
      if (this.analyticsCache.has(cacheKey)) {
        const cached = this.analyticsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      // Fetch raw data
      const rawData = await this.fetchProgressData(exerciseType, timeRange);
      
      if (!rawData.length) {
        return this.createEmptyAnalytics(exerciseType, timeRange);
      }

      // Process analytics
      const analytics = {
        exerciseType,
        timeRange,
        generatedAt: new Date(),
        
        // Basic metrics
        summary: await this.calculateSummaryMetrics(rawData),
        
        // Time series data
        timeSeries: await this.generateTimeSeries(rawData, granularity),
        
        // Trend analysis
        trends: await this.analyzeTrends(rawData),
        
        // Performance patterns
        patterns: await this.identifyPatterns(rawData),
        
        // Comparative analysis
        comparisons: includeComparisons ? await this.generateComparisons(rawData, exerciseType) : null,
        
        // Future projections
        projections: includeProjections ? await this.calculateProjections(rawData) : null,
        
        // Quality metrics
        quality: await this.assessDataQuality(rawData),
        
        // Insights and recommendations
        insights: await this.generateInsights(rawData),
      };

      // Cache results
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      console.error('❌ Error getting exercise analytics:', error);
      return this.createEmptyAnalytics(exerciseType, timeRange);
    }
  }

  /**
   * Get aggregated data for multiple exercises
   */
  async getMultiExerciseAnalytics(exerciseTypes, options = {}) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const {
        timeRange = 'month',
        includeCorrelations = true,
        normalizeScores = true
      } = options;

      const results = {};
      const allData = [];

      // Fetch data for all exercises
      for (const exerciseType of exerciseTypes) {
        const exerciseData = await this.fetchProgressData(exerciseType, timeRange);
        results[exerciseType] = exerciseData;
        allData.push(...exerciseData.map(d => ({ ...d, exerciseType })));
      }

      // Cross-exercise analysis
      const aggregated = {
        exerciseTypes,
        timeRange,
        generatedAt: new Date(),
        
        // Individual exercise summaries
        exercises: {},
        
        // Cross-exercise comparisons
        comparisons: {
          averageScores: {},
          improvementRates: {},
          consistency: {},
          sessionCounts: {}
        },
        
        // Correlations between exercises
        correlations: includeCorrelations ? await this.calculateCorrelations(results) : null,
        
        // Overall progress patterns
        overallTrends: await this.analyzeOverallTrends(allData),
        
        // Recommendations
        recommendations: await this.generateMultiExerciseRecommendations(results)
      };

      // Process individual exercises
      for (const [exerciseType, data] of Object.entries(results)) {
        if (data.length > 0) {
          aggregated.exercises[exerciseType] = {
            summary: await this.calculateSummaryMetrics(data),
            recentTrend: await this.calculateRecentTrend(data),
            normalizedScore: normalizeScores ? await this.normalizeScore(data, allData) : null
          };
          
          // Update comparisons
          aggregated.comparisons.averageScores[exerciseType] = 
            data.reduce((sum, d) => sum + (d.overallScore || 0), 0) / data.length;
          aggregated.comparisons.sessionCounts[exerciseType] = data.length;
          aggregated.comparisons.consistency[exerciseType] = this.calculateConsistency(data);
          aggregated.comparisons.improvementRates[exerciseType] = this.calculateImprovementRate(data);
        }
      }

      return aggregated;
    } catch (error) {
      console.error('❌ Error getting multi-exercise analytics:', error);
      throw error;
    }
  }

  /**
   * Generate time-based aggregated data for charts
   */
  async getTimeSeriesData(exerciseType, options = {}) {
    try {
      const {
        timeRange = 'month',
        granularity = 'daily',
        metrics = ['overallScore', 'confidence'],
        smoothing = true,
        fillGaps = true
      } = options;

      const cacheKey = `timeseries_${exerciseType}_${timeRange}_${granularity}_${metrics.join(',')}}`;
      if (this.trendsCache.has(cacheKey)) {
        const cached = this.trendsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const rawData = await this.fetchProgressData(exerciseType, timeRange);
      
      if (!rawData.length) {
        return this.createEmptyTimeSeries(exerciseType, timeRange, granularity, metrics);
      }

      // Group data by time periods
      const groupedData = await this.groupDataByPeriod(rawData, granularity);
      
      // Calculate metrics for each period
      const timeSeriesData = await this.calculatePeriodMetrics(groupedData, metrics);
      
      // Apply smoothing if requested
      const processedData = smoothing ? 
        await this.applySmoothing(timeSeriesData, metrics) : 
        timeSeriesData;
      
      // Fill gaps if requested
      const finalData = fillGaps ? 
        await this.fillDataGaps(processedData, granularity, metrics) : 
        processedData;

      const result = {
        exerciseType,
        timeRange,
        granularity,
        metrics,
        data: finalData,
        statistics: {
          totalDataPoints: rawData.length,
          timePoints: finalData.length,
          coverage: this.calculateCoverage(finalData, timeRange, granularity),
          gaps: this.identifyGaps(finalData)
        },
        generatedAt: new Date()
      };

      // Cache results
      this.trendsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('❌ Error generating time series data:', error);
      throw error;
    }
  }

  /**
   * Get comparative benchmarking data
   */
  async getBenchmarkData(exerciseType, userScore, options = {}) {
    try {
      const {
        includePercentile = true,
        includeGoals = true,
        compareToSelf = true
      } = options;

      // For privacy, we'll focus on self-comparison and general benchmarks
      // rather than comparing to other users
      
      const userHistory = await this.fetchProgressData(exerciseType, 'all');
      
      const benchmark = {
        exerciseType,
        currentScore: userScore,
        generatedAt: new Date(),
        
        // Self-comparison metrics
        selfComparison: compareToSelf ? {
          personalBest: Math.max(...userHistory.map(d => d.overallScore || 0)),
          personalAverage: userHistory.reduce((sum, d) => sum + (d.overallScore || 0), 0) / userHistory.length,
          recentAverage: this.calculateRecentAverage(userHistory, 5),
          percentileInOwnHistory: this.calculatePercentile(userHistory.map(d => d.overallScore), userScore)
        } : null,
        
        // Standard benchmarks (based on general fitness standards)
        standardBenchmarks: this.getStandardBenchmarks(exerciseType, userScore),
        
        // Goals and targets
        goals: includeGoals ? await this.getGoalMetrics(exerciseType, userScore, userHistory) : null,
        
        // Progress assessment
        assessment: this.assessProgress(userHistory, userScore)
      };

      return benchmark;
    } catch (error) {
      console.error('❌ Error generating benchmark data:', error);
      throw error;
    }
  }

  /**
   * Get streak and milestone data
   */
  async getAchievementData(exerciseTypes = null) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      let exercisesToAnalyze = exerciseTypes;
      if (!exercisesToAnalyze) {
        // Get all exercises user has done
        exercisesToAnalyze = await this.getUserExerciseTypes();
      }

      const achievements = {
        generatedAt: new Date(),
        exercises: {},
        overall: {
          totalSessions: 0,
          totalExercises: exercisesToAnalyze.length,
          longestStreak: 0,
          currentStreak: 0,
          milestones: []
        }
      };

      for (const exerciseType of exercisesToAnalyze) {
        const data = await this.fetchProgressData(exerciseType, 'all');
        
        const exerciseAchievements = {
          totalSessions: data.length,
          personalBests: data.filter(d => d.isPersonalBest).length,
          perfectScores: data.filter(d => (d.overallScore || 0) >= 95).length,
          streaks: this.calculateStreaks(data),
          milestones: this.identifyMilestones(data),
          averageScore: data.reduce((sum, d) => sum + (d.overallScore || 0), 0) / data.length,
          improvementRate: this.calculateImprovementRate(data)
        };

        achievements.exercises[exerciseType] = exerciseAchievements;
        achievements.overall.totalSessions += exerciseAchievements.totalSessions;
        
        if (exerciseAchievements.streaks.longest > achievements.overall.longestStreak) {
          achievements.overall.longestStreak = exerciseAchievements.streaks.longest;
        }
      }

      // Calculate overall current streak (across all exercises)
      achievements.overall.currentStreak = await this.calculateOverallCurrentStreak(exercisesToAnalyze);
      
      // Overall milestones
      achievements.overall.milestones = this.calculateOverallMilestones(achievements);

      return achievements;
    } catch (error) {
      console.error('❌ Error getting achievement data:', error);
      throw error;
    }
  }

  /**
   * Get prediction and forecasting data
   */
  async getPredictionData(exerciseType, options = {}) {
    try {
      const {
        forecastDays = 30,
        confidenceInterval = 0.95,
        includeGoalProjection = true
      } = options;

      const historicalData = await this.fetchProgressData(exerciseType, 'all');
      
      if (historicalData.length < 5) {
        return {
          exerciseType,
          error: 'Insufficient data for predictions (minimum 5 sessions required)',
          dataPoints: historicalData.length
        };
      }

      // Prepare data for forecasting
      const timeSeriesData = this.prepareTimeSeriesForForecasting(historicalData);
      
      // Generate predictions using multiple methods
      const predictions = {
        exerciseType,
        forecastDays,
        basedOnSessions: historicalData.length,
        generatedAt: new Date(),
        
        // Linear trend prediction
        linearTrend: this.calculateLinearTrendForecast(timeSeriesData, forecastDays),
        
        // Moving average prediction
        movingAverage: this.calculateMovingAverageForecast(timeSeriesData, forecastDays),
        
        // Exponential smoothing prediction
        exponentialSmoothing: this.calculateExponentialSmoothingForecast(timeSeriesData, forecastDays),
        
        // Ensemble prediction (combination of methods)
        ensemble: null, // Will be calculated after individual methods
        
        // Confidence intervals
        confidence: {
          level: confidenceInterval,
          intervals: []
        },
        
        // Goal projections
        goalProjections: includeGoalProjection ? 
          this.calculateGoalProjections(timeSeriesData, forecastDays) : null
      };

      // Calculate ensemble prediction
      predictions.ensemble = this.calculateEnsembleForecast([
        predictions.linearTrend,
        predictions.movingAverage,
        predictions.exponentialSmoothing
      ]);

      // Calculate confidence intervals
      predictions.confidence.intervals = this.calculateConfidenceIntervals(
        timeSeriesData,
        predictions.ensemble,
        confidenceInterval
      );

      return predictions;
    } catch (error) {
      console.error('❌ Error generating prediction data:', error);
      throw error;
    }
  }

  /**
   * Data fetching and processing methods
   */

  async fetchProgressData(exerciseType, timeRange) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      let q = query(
        collection(db, 'poseAnalysisHistory'),
        where('userId', '==', user.uid),
        where('exerciseType', '==', exerciseType),
        orderBy('analyzedAt', 'desc')
      );

      // Add time range filter
      if (timeRange !== 'all') {
        const startDate = this.getStartDateForRange(timeRange);
        q = query(q, where('analyzedAt', '>=', startDate));
      }

      // Add reasonable limit for performance
      q = query(q, limit(1000));

      const snapshot = await getDocs(q);
      const data = [];
      
      snapshot.forEach(doc => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          ...docData,
          analyzedAt: docData.analyzedAt?.toDate?.() || new Date(docData.analyzedAt)
        });
      });

      return data.sort((a, b) => new Date(a.analyzedAt) - new Date(b.analyzedAt));
    } catch (error) {
      console.error('❌ Error fetching progress data:', error);
      return [];
    }
  }

  async getUserExerciseTypes() {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      const q = query(
        collection(db, 'userPoseProgress'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const exerciseTypes = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.exerciseType && !exerciseTypes.includes(data.exerciseType)) {
          exerciseTypes.push(data.exerciseType);
        }
      });

      return exerciseTypes;
    } catch (error) {
      console.error('❌ Error getting user exercise types:', error);
      return [];
    }
  }

  /**
   * Analytics calculation methods
   */

  async calculateSummaryMetrics(data) {
    if (!data.length) return this.getEmptySummaryMetrics();

    const scores = data.map(d => d.overallScore || 0);
    const confidenceScores = data.map(d => d.confidence || 0);
    const recent = data.slice(-5); // Last 5 sessions

    return {
      totalSessions: data.length,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      recentAverageScore: recent.length ? 
        recent.reduce((sum, d) => sum + (d.overallScore || 0), 0) / recent.length : 0,
      averageConfidence: confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length,
      improvement: this.calculateImprovementRate(data),
      consistency: this.calculateConsistency(data),
      personalBests: data.filter(d => d.isPersonalBest).length,
      lastSession: data[data.length - 1]?.analyzedAt || null,
      firstSession: data[0]?.analyzedAt || null,
      timeSpan: data.length > 1 ? 
        new Date(data[data.length - 1].analyzedAt) - new Date(data[0].analyzedAt) : 0
    };
  }

  async generateTimeSeries(data, granularity) {
    const grouped = await this.groupDataByPeriod(data, granularity);
    const timeSeries = [];

    for (const [period, sessions] of Object.entries(grouped)) {
      if (sessions.length > 0) {
        timeSeries.push({
          period,
          date: new Date(period),
          sessionCount: sessions.length,
          averageScore: sessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / sessions.length,
          bestScore: Math.max(...sessions.map(s => s.overallScore || 0)),
          averageConfidence: sessions.reduce((sum, s) => sum + (s.confidence || 0), 0) / sessions.length,
          personalBests: sessions.filter(s => s.isPersonalBest).length,
          totalImprovements: sessions.filter(s => (s.improvementFromLast || 0) > 0).length
        });
      }
    }

    return timeSeries.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  async analyzeTrends(data) {
    if (data.length < 3) {
      return {
        overall: 'insufficient_data',
        score: 'stable',
        confidence: 'stable',
        frequency: 'stable'
      };
    }

    const recent = data.slice(-Math.min(10, data.length));
    const older = data.slice(0, Math.min(10, data.length));

    const recentAvgScore = recent.reduce((sum, d) => sum + (d.overallScore || 0), 0) / recent.length;
    const olderAvgScore = older.reduce((sum, d) => sum + (d.overallScore || 0), 0) / older.length;

    const recentAvgConfidence = recent.reduce((sum, d) => sum + (d.confidence || 0), 0) / recent.length;
    const olderAvgConfidence = older.reduce((sum, d) => sum + (d.confidence || 0), 0) / older.length;

    // Calculate trend directions
    const scoreTrend = this.determineTrendDirection(recentAvgScore, olderAvgScore, 2);
    const confidenceTrend = this.determineTrendDirection(recentAvgConfidence, olderAvgConfidence, 0.05);

    // Calculate frequency trend (sessions per time unit)
    const frequencyTrend = this.calculateFrequencyTrend(data);

    return {
      overall: this.determineOverallTrend(scoreTrend, confidenceTrend, frequencyTrend),
      score: scoreTrend,
      confidence: confidenceTrend,
      frequency: frequencyTrend,
      metrics: {
        scoreChange: recentAvgScore - olderAvgScore,
        confidenceChange: recentAvgConfidence - olderAvgConfidence,
        recentScore: recentAvgScore,
        recentConfidence: recentAvgConfidence
      }
    };
  }

  async identifyPatterns(data) {
    return {
      seasonality: this.detectSeasonality(data),
      weeklyPatterns: this.analyzeWeeklyPatterns(data),
      timeOfDayPatterns: this.analyzeTimeOfDayPatterns(data),
      improvementPatterns: this.analyzeImprovementPatterns(data),
      consistencyPatterns: this.analyzeConsistencyPatterns(data)
    };
  }

  async generateComparisons(data, exerciseType) {
    const summary = await this.calculateSummaryMetrics(data);
    
    // Compare to exercise-specific standards
    const standards = this.getExerciseStandards(exerciseType);
    
    return {
      toStandards: {
        beginner: this.compareToLevel(summary.averageScore, standards.beginner),
        intermediate: this.compareToLevel(summary.averageScore, standards.intermediate),
        advanced: this.compareToLevel(summary.averageScore, standards.advanced)
      },
      toPreviousPeriod: await this.compareToPreviousPeriod(data),
      consistency: {
        rating: this.rateConsistency(summary.consistency),
        comparison: 'Good consistency compared to typical users'
      }
    };
  }

  async calculateProjections(data) {
    if (data.length < 5) return null;

    const timeSeriesData = this.prepareTimeSeriesForForecasting(data);
    
    return {
      nextSession: this.predictNextSessionScore(timeSeriesData),
      oneWeek: this.predictScoreAtTime(timeSeriesData, 7),
      oneMonth: this.predictScoreAtTime(timeSeriesData, 30),
      goalTarget: this.predictTimeToReachGoal(timeSeriesData, 90), // 90% score goal
      confidence: this.calculateProjectionConfidence(timeSeriesData)
    };
  }

  async assessDataQuality(data) {
    const totalSessions = data.length;
    const highConfidenceSessions = data.filter(d => (d.confidence || 0) > this.settings.confidenceThreshold).length;
    const recentSessions = data.filter(d => 
      new Date() - new Date(d.analyzedAt) < TIME_PERIODS.MONTH
    ).length;

    return {
      overall: totalSessions >= 10 && highConfidenceSessions/totalSessions >= 0.7 ? 'good' : 'fair',
      totalSessions,
      highConfidenceSessions,
      confidenceRatio: highConfidenceSessions / totalSessions,
      recentActivity: recentSessions,
      dataSpan: totalSessions > 1 ? 
        new Date(data[data.length - 1].analyzedAt) - new Date(data[0].analyzedAt) : 0,
      consistency: this.calculateConsistency(data),
      outliers: this.detectOutliers(data).length
    };
  }

  async generateInsights(data) {
    const insights = [];

    // Performance insights
    const trend = await this.analyzeTrends(data);
    if (trend.score === 'improving') {
      insights.push({
        type: 'positive',
        category: 'performance',
        title: 'Improving Performance',
        description: `Your form scores are trending upward with an average improvement of ${trend.metrics.scoreChange.toFixed(1)} points`,
        priority: 'high',
        actionable: true
      });
    }

    // Consistency insights
    const consistency = this.calculateConsistency(data);
    if (consistency < 70) {
      insights.push({
        type: 'improvement',
        category: 'consistency',
        title: 'Variable Performance',
        description: 'Your scores vary significantly between sessions. Consider focusing on consistent technique',
        priority: 'medium',
        actionable: true,
        recommendation: 'Practice with lighter weights or slower tempo to improve consistency'
      });
    }

    // Frequency insights
    const recentSessions = data.filter(d => 
      new Date() - new Date(d.analyzedAt) < TIME_PERIODS.WEEK
    ).length;
    
    if (recentSessions === 0 && data.length > 0) {
      const daysSinceLastSession = Math.floor(
        (new Date() - new Date(data[data.length - 1].analyzedAt)) / (24 * 60 * 60 * 1000)
      );
      
      insights.push({
        type: 'reminder',
        category: 'frequency',
        title: 'Session Reminder',
        description: `It's been ${daysSinceLastSession} days since your last analysis session`,
        priority: 'low',
        actionable: true,
        recommendation: 'Regular practice helps maintain and improve form consistency'
      });
    }

    // Achievement insights
    const personalBests = data.filter(d => d.isPersonalBest).length;
    if (personalBests > 0) {
      insights.push({
        type: 'achievement',
        category: 'progress',
        title: 'Personal Bests',
        description: `You've achieved ${personalBests} personal best${personalBests > 1 ? 's' : ''} in this exercise`,
        priority: 'high',
        actionable: false
      });
    }

    return insights.slice(0, 5); // Return top 5 insights
  }

  /**
   * Helper calculation methods
   */

  calculateConsistency(data) {
    if (data.length < 2) return 100;
    
    const scores = data.map(d => d.overallScore || 0);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency percentage (lower deviation = higher consistency)
    const consistencyScore = Math.max(0, 100 - (stdDev / mean) * 100);
    return Math.round(consistencyScore);
  }

  calculateImprovementRate(data) {
    if (data.length < 2) return 0;
    
    const firstHalf = data.slice(0, Math.ceil(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + (d.overallScore || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + (d.overallScore || 0), 0) / secondHalf.length;
    
    return secondHalfAvg - firstHalfAvg;
  }

  calculateStreaks(data) {
    // Calculate consecutive sessions with improvement
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 1; i < data.length; i++) {
      if ((data[i].overallScore || 0) > (data[i-1].overallScore || 0)) {
        tempStreak++;
        if (i === data.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        if (i === data.length - 1) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return {
      current: currentStreak,
      longest: longestStreak
    };
  }

  identifyMilestones(data) {
    const milestones = [];
    const scores = data.map(d => d.overallScore || 0);
    
    // Score milestones
    const scoreMilestones = [60, 70, 80, 90, 95];
    scoreMilestones.forEach(milestone => {
      const firstAchieved = data.find(d => (d.overallScore || 0) >= milestone);
      if (firstAchieved) {
        milestones.push({
          type: 'score',
          value: milestone,
          achievedAt: firstAchieved.analyzedAt,
          description: `First time scoring ${milestone}+ points`
        });
      }
    });
    
    // Session count milestones
    const sessionMilestones = [5, 10, 25, 50, 100];
    sessionMilestones.forEach(milestone => {
      if (data.length >= milestone) {
        milestones.push({
          type: 'sessions',
          value: milestone,
          achievedAt: data[milestone - 1].analyzedAt,
          description: `Completed ${milestone} analysis sessions`
        });
      }
    });
    
    return milestones;
  }

  /**
   * Time series and forecasting methods
   */

  async groupDataByPeriod(data, granularity) {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item.analyzedAt);
      let key;
      
      switch (granularity) {
        case 'hourly':
          key = date.toISOString().substring(0, 13) + ':00:00.000Z';
          break;
        case 'daily':
          key = date.toISOString().substring(0, 10) + 'T00:00:00.000Z';
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().substring(0, 10) + 'T00:00:00.000Z';
          break;
        case 'monthly':
          key = date.toISOString().substring(0, 7) + '-01T00:00:00.000Z';
          break;
        default:
          key = date.toISOString().substring(0, 10) + 'T00:00:00.000Z';
      }
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    
    return grouped;
  }

  prepareTimeSeriesForForecasting(data) {
    return data.map((item, index) => ({
      x: index,
      y: item.overallScore || 0,
      date: new Date(item.analyzedAt),
      confidence: item.confidence || 0
    }));
  }

  calculateLinearTrendForecast(timeSeriesData, forecastPeriods) {
    if (timeSeriesData.length < 2) return [];
    
    // Simple linear regression
    const n = timeSeriesData.length;
    const sumX = timeSeriesData.reduce((sum, point) => sum + point.x, 0);
    const sumY = timeSeriesData.reduce((sum, point) => sum + point.y, 0);
    const sumXY = timeSeriesData.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = timeSeriesData.reduce((sum, point) => sum + point.x * point.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const forecast = [];
    const lastX = timeSeriesData[timeSeriesData.length - 1].x;
    
    for (let i = 1; i <= forecastPeriods; i++) {
      const x = lastX + i;
      const y = Math.max(0, Math.min(100, slope * x + intercept)); // Clamp between 0-100
      forecast.push({
        x,
        y,
        predicted: true,
        method: 'linear'
      });
    }
    
    return forecast;
  }

  calculateMovingAverageForecast(timeSeriesData, forecastPeriods) {
    if (timeSeriesData.length < 3) return [];
    
    const windowSize = Math.min(5, Math.floor(timeSeriesData.length / 2));
    const lastValues = timeSeriesData.slice(-windowSize);
    const average = lastValues.reduce((sum, point) => sum + point.y, 0) / lastValues.length;
    
    const forecast = [];
    const lastX = timeSeriesData[timeSeriesData.length - 1].x;
    
    for (let i = 1; i <= forecastPeriods; i++) {
      forecast.push({
        x: lastX + i,
        y: average,
        predicted: true,
        method: 'moving_average'
      });
    }
    
    return forecast;
  }

  calculateExponentialSmoothingForecast(timeSeriesData, forecastPeriods) {
    if (timeSeriesData.length < 2) return [];
    
    const alpha = this.settings.smoothingFactor;
    let smoothedValue = timeSeriesData[0].y;
    
    // Calculate smoothed values
    for (let i = 1; i < timeSeriesData.length; i++) {
      smoothedValue = alpha * timeSeriesData[i].y + (1 - alpha) * smoothedValue;
    }
    
    const forecast = [];
    const lastX = timeSeriesData[timeSeriesData.length - 1].x;
    
    for (let i = 1; i <= forecastPeriods; i++) {
      forecast.push({
        x: lastX + i,
        y: smoothedValue,
        predicted: true,
        method: 'exponential_smoothing'
      });
    }
    
    return forecast;
  }

  calculateEnsembleForecast(forecasts) {
    if (!forecasts.length) return [];
    
    const forecastLength = Math.min(...forecasts.map(f => f.length));
    const ensemble = [];
    
    for (let i = 0; i < forecastLength; i++) {
      const values = forecasts.map(f => f[i]?.y || 0);
      const averageY = values.reduce((sum, y) => sum + y, 0) / values.length;
      
      ensemble.push({
        x: forecasts[0][i].x,
        y: averageY,
        predicted: true,
        method: 'ensemble'
      });
    }
    
    return ensemble;
  }

  /**
   * Utility and helper methods
   */

  getStartDateForRange(timeRange) {
    const now = new Date();
    const ranges = {
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365
    };
    
    if (ranges[timeRange]) {
      now.setDate(now.getDate() - ranges[timeRange]);
    }
    
    return now;
  }

  determineTrendDirection(recent, older, threshold) {
    const diff = recent - older;
    if (Math.abs(diff) < threshold) return 'stable';
    return diff > 0 ? 'improving' : 'declining';
  }

  calculateFrequencyTrend(data) {
    if (data.length < 4) return 'stable';
    
    const halfPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, halfPoint);
    const secondHalf = data.slice(halfPoint);
    
    const firstHalfTimeSpan = new Date(firstHalf[firstHalf.length - 1].analyzedAt) - new Date(firstHalf[0].analyzedAt);
    const secondHalfTimeSpan = new Date(secondHalf[secondHalf.length - 1].analyzedAt) - new Date(secondHalf[0].analyzedAt);
    
    if (firstHalfTimeSpan === 0 || secondHalfTimeSpan === 0) return 'stable';
    
    const firstFreq = firstHalf.length / firstHalfTimeSpan;
    const secondFreq = secondHalf.length / secondHalfTimeSpan;
    
    const threshold = 0.1;
    if (Math.abs(secondFreq - firstFreq) < threshold) return 'stable';
    return secondFreq > firstFreq ? 'increasing' : 'decreasing';
  }

  determineOverallTrend(scoreTrend, confidenceTrend, frequencyTrend) {
    if (scoreTrend === 'improving' && confidenceTrend !== 'declining') return 'improving';
    if (scoreTrend === 'declining' && confidenceTrend === 'declining') return 'declining';
    if (frequencyTrend === 'decreasing' && scoreTrend !== 'improving') return 'declining';
    return 'stable';
  }

  detectOutliers(data) {
    const scores = data.map(d => d.overallScore || 0);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const stdDev = Math.sqrt(
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    );
    
    const threshold = this.settings.outlierThreshold;
    return data.filter(d => 
      Math.abs((d.overallScore || 0) - mean) > threshold * stdDev
    );
  }

  /**
   * Cache management
   */

  async loadCachedData() {
    try {
      const [aggregatedData, analyticsData, trendsData] = await Promise.all([
        AsyncStorage.getItem(AGGREGATED_DATA_CACHE_KEY),
        AsyncStorage.getItem(ANALYTICS_CACHE_KEY),
        AsyncStorage.getItem(TRENDS_CACHE_KEY)
      ]);

      if (aggregatedData) {
        const parsed = JSON.parse(aggregatedData);
        this.cache = new Map(parsed);
      }

      if (analyticsData) {
        const parsed = JSON.parse(analyticsData);
        this.analyticsCache = new Map(parsed);
      }

      if (trendsData) {
        const parsed = JSON.parse(trendsData);
        this.trendsCache = new Map(parsed);
      }
    } catch (error) {
      console.error('❌ Error loading cached data:', error);
    }
  }

  async saveCachedData() {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          AGGREGATED_DATA_CACHE_KEY, 
          JSON.stringify(Array.from(this.cache.entries()))
        ),
        AsyncStorage.setItem(
          ANALYTICS_CACHE_KEY,
          JSON.stringify(Array.from(this.analyticsCache.entries()))
        ),
        AsyncStorage.setItem(
          TRENDS_CACHE_KEY,
          JSON.stringify(Array.from(this.trendsCache.entries()))
        )
      ]);
    } catch (error) {
      console.error('❌ Error saving cached data:', error);
    }
  }

  async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        AGGREGATED_DATA_CACHE_KEY,
        ANALYTICS_CACHE_KEY,
        TRENDS_CACHE_KEY
      ]);
      
      this.cache.clear();
      this.analyticsCache.clear();
      this.trendsCache.clear();
      
      console.log('🗑️ Progress data aggregator cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Default/empty data generators
   */

  createEmptyAnalytics(exerciseType, timeRange) {
    return {
      exerciseType,
      timeRange,
      generatedAt: new Date(),
      summary: this.getEmptySummaryMetrics(),
      timeSeries: [],
      trends: {
        overall: 'no_data',
        score: 'no_data',
        confidence: 'no_data',
        frequency: 'no_data'
      },
      patterns: {},
      comparisons: null,
      projections: null,
      quality: {
        overall: 'insufficient',
        totalSessions: 0
      },
      insights: [{
        type: 'info',
        category: 'getting_started',
        title: 'Start Your Journey',
        description: 'Complete a few analysis sessions to see your progress trends and insights',
        priority: 'low',
        actionable: true
      }]
    };
  }

  createEmptyTimeSeries(exerciseType, timeRange, granularity, metrics) {
    return {
      exerciseType,
      timeRange,
      granularity,
      metrics,
      data: [],
      statistics: {
        totalDataPoints: 0,
        timePoints: 0,
        coverage: 0,
        gaps: []
      },
      generatedAt: new Date()
    };
  }

  getEmptySummaryMetrics() {
    return {
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      recentAverageScore: 0,
      averageConfidence: 0,
      improvement: 0,
      consistency: 0,
      personalBests: 0,
      lastSession: null,
      firstSession: null,
      timeSpan: 0
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.cache.clear();
    this.analyticsCache.clear();
    this.trendsCache.clear();
    this.isInitialized = false;
    console.log('🔄 Progress Data Aggregator destroyed');
  }
}

// Create singleton instance
const progressDataAggregator = new ProgressDataAggregator();

export default progressDataAggregator;