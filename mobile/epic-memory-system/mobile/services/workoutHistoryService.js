/**
 * Workout History Service
 * Manages user workout history, progress tracking, and analytics
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
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

const HISTORY_CACHE_KEY = '@workout_history_cache';
const PROGRESS_CACHE_KEY = '@user_progress_cache';

class WorkoutHistoryService {
  constructor() {
    this.historyCache = [];
    this.progressCache = {};
    this.isInitialized = false;
  }

  /**
   * Initialize service and load cached data
   */
  async initialize() {
    try {
      // Load cached history
      const cachedHistory = await AsyncStorage.getItem(HISTORY_CACHE_KEY);
      if (cachedHistory) {
        this.historyCache = JSON.parse(cachedHistory);
      }

      // Load cached progress
      const cachedProgress = await AsyncStorage.getItem(PROGRESS_CACHE_KEY);
      if (cachedProgress) {
        this.progressCache = JSON.parse(cachedProgress);
      }

      this.isInitialized = true;
      console.log('📊 Workout history service initialized');
      
      // Sync with Firestore in background
      this.syncWithFirestore();
      
      return true;
    } catch (error) {
      console.error('Error initializing workout history:', error);
      return false;
    }
  }

  /**
   * Record a completed workout session
   */
  async recordWorkoutSession(workoutData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const sessionData = {
        userId: user.uid,
        workoutId: workoutData.workoutId,
        workoutName: workoutData.name,
        programId: workoutData.programId || null,
        weekNumber: workoutData.weekNumber || null,
        dayNumber: workoutData.dayNumber || null,
        
        // Performance data
        exercises: workoutData.exercises.map(ex => ({
          exerciseId: ex.id,
          name: ex.name,
          sets: ex.sets.map(set => ({
            reps: set.actualReps || set.targetReps,
            weight: set.actualWeight || set.targetWeight,
            restSeconds: set.restSeconds,
            rpe: set.rpe || null,
            notes: set.notes || null
          })),
          totalVolume: this.calculateExerciseVolume(ex),
          personalRecord: this.checkPersonalRecord(ex)
        })),
        
        // Session metrics
        totalVolume: this.calculateTotalVolume(workoutData.exercises),
        totalSets: this.countTotalSets(workoutData.exercises),
        totalReps: this.countTotalReps(workoutData.exercises),
        duration: workoutData.duration || null,
        
        // User feedback
        sessionRPE: workoutData.sessionRPE || null,
        mood: workoutData.mood || null,
        energyLevel: workoutData.energyLevel || null,
        notes: workoutData.notes || null,
        
        // Timestamps
        startedAt: workoutData.startedAt || new Date(),
        completedAt: new Date(),
        createdAt: serverTimestamp()
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'workoutHistory'), sessionData);
      
      // Update local cache
      const sessionWithId = { ...sessionData, id: docRef.id };
      this.historyCache.unshift(sessionWithId);
      await this.saveHistoryCache();
      
      // Update progress tracking
      await this.updateProgressTracking(sessionData);
      
      // Update user stats
      await this.updateUserStats(user.uid);
      
      console.log('✅ Workout session recorded:', docRef.id);
      
      return sessionWithId;
    } catch (error) {
      console.error('Error recording workout session:', error);
      throw error;
    }
  }

  /**
   * Get user's workout history
   */
  async getUserHistory(userId = null, limitCount = 50) {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('User ID required');

      // Return cache if available
      if (this.historyCache.length > 0) {
        return this.historyCache.slice(0, limitCount);
      }

      // Query Firestore
      const q = query(
        collection(db, 'workoutHistory'),
        where('userId', '==', uid),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const history = [];
      
      snapshot.forEach(doc => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Update cache
      this.historyCache = history;
      await this.saveHistoryCache();
      
      return history;
    } catch (error) {
      console.error('Error fetching workout history:', error);
      return this.historyCache; // Return cache as fallback
    }
  }

  /**
   * Get progress for specific exercise
   */
  async getExerciseProgress(exerciseId, userId = null) {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('User ID required');

      // Check cache first
      const cacheKey = `${uid}_${exerciseId}`;
      if (this.progressCache[cacheKey]) {
        return this.progressCache[cacheKey];
      }

      // Query Firestore
      const q = query(
        collection(db, 'userProgress'),
        where('userId', '==', uid),
        where('exerciseId', '==', exerciseId),
        orderBy('date', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const progress = [];
      
      snapshot.forEach(doc => {
        progress.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Update cache
      this.progressCache[cacheKey] = progress;
      await this.saveProgressCache();
      
      return progress;
    } catch (error) {
      console.error('Error fetching exercise progress:', error);
      return [];
    }
  }

  /**
   * Update progress tracking for exercises
   */
  async updateProgressTracking(sessionData) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      for (const exercise of sessionData.exercises) {
        // Check if this is a personal record
        const isPR = await this.checkPersonalRecord(exercise);
        
        const progressData = {
          userId: user.uid,
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.name,
          
          // Best set data
          bestSet: this.findBestSet(exercise.sets),
          totalVolume: exercise.totalVolume,
          
          // Session reference
          sessionId: sessionData.id,
          workoutId: sessionData.workoutId,
          
          // Timestamps
          date: sessionData.completedAt,
          createdAt: serverTimestamp(),
          
          // Flags
          isPersonalRecord: isPR
        };

        await addDoc(collection(db, 'userProgress'), progressData);
        
        // Update cache
        const cacheKey = `${user.uid}_${exercise.exerciseId}`;
        if (!this.progressCache[cacheKey]) {
          this.progressCache[cacheKey] = [];
        }
        this.progressCache[cacheKey].unshift(progressData);
      }
      
      await this.saveProgressCache();
    } catch (error) {
      console.error('Error updating progress tracking:', error);
    }
  }

  /**
   * Update user statistics
   */
  async updateUserStats(userId) {
    try {
      const stats = await this.calculateUserStats(userId);
      
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        workoutStats: stats,
        lastWorkoutAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('📈 User stats updated');
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  /**
   * Calculate user statistics
   */
  async calculateUserStats(userId) {
    try {
      const history = await this.getUserHistory(userId);
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentHistory = history.filter(session => 
        new Date(session.completedAt) > thirtyDaysAgo
      );
      
      const weekHistory = history.filter(session => 
        new Date(session.completedAt) > sevenDaysAgo
      );
      
      return {
        totalWorkouts: history.length,
        workoutsThisMonth: recentHistory.length,
        workoutsThisWeek: weekHistory.length,
        
        totalVolume: history.reduce((sum, s) => sum + (s.totalVolume || 0), 0),
        volumeThisMonth: recentHistory.reduce((sum, s) => sum + (s.totalVolume || 0), 0),
        
        averageSessionDuration: this.calculateAverageDuration(history),
        averageSessionRPE: this.calculateAverageRPE(history),
        
        currentStreak: this.calculateStreak(history),
        longestStreak: this.calculateLongestStreak(history),
        
        favoriteExercises: this.findFavoriteExercises(history),
        personalRecords: await this.getPersonalRecords(userId),
        
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return {};
    }
  }

  /**
   * Helper: Calculate exercise volume
   */
  calculateExerciseVolume(exercise) {
    return exercise.sets.reduce((total, set) => {
      const reps = set.actualReps || set.targetReps || 0;
      const weight = set.actualWeight || set.targetWeight || 0;
      return total + (reps * weight);
    }, 0);
  }

  /**
   * Helper: Calculate total volume
   */
  calculateTotalVolume(exercises) {
    return exercises.reduce((total, ex) => 
      total + this.calculateExerciseVolume(ex), 0
    );
  }

  /**
   * Helper: Count total sets
   */
  countTotalSets(exercises) {
    return exercises.reduce((total, ex) => 
      total + (ex.sets?.length || 0), 0
    );
  }

  /**
   * Helper: Count total reps
   */
  countTotalReps(exercises) {
    return exercises.reduce((total, ex) => 
      total + ex.sets.reduce((sum, set) => 
        sum + (set.actualReps || set.targetReps || 0), 0
      ), 0
    );
  }

  /**
   * Helper: Find best set
   */
  findBestSet(sets) {
    if (!sets || sets.length === 0) return null;
    
    return sets.reduce((best, set) => {
      const volume = (set.actualReps || set.targetReps || 0) * 
                    (set.actualWeight || set.targetWeight || 0);
      const bestVolume = (best.actualReps || best.targetReps || 0) * 
                        (best.actualWeight || best.targetWeight || 0);
      
      return volume > bestVolume ? set : best;
    });
  }

  /**
   * Helper: Check for personal record
   */
  async checkPersonalRecord(exercise) {
    try {
      const progress = await this.getExerciseProgress(exercise.exerciseId || exercise.id);
      if (progress.length === 0) return true; // First time is always a PR
      
      const currentBest = this.findBestSet(exercise.sets);
      if (!currentBest) return false;
      
      const currentVolume = (currentBest.actualReps || currentBest.targetReps || 0) * 
                           (currentBest.actualWeight || currentBest.targetWeight || 0);
      
      const previousBest = progress[0]?.bestSet;
      if (!previousBest) return true;
      
      const previousVolume = (previousBest.actualReps || previousBest.targetReps || 0) * 
                            (previousBest.actualWeight || previousBest.targetWeight || 0);
      
      return currentVolume > previousVolume;
    } catch (error) {
      console.error('Error checking PR:', error);
      return false;
    }
  }

  /**
   * Helper: Calculate workout streak
   */
  calculateStreak(history) {
    if (history.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const session of history) {
      const sessionDate = new Date(session.completedAt);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Calculate longest streak
   */
  calculateLongestStreak(history) {
    // Implementation for longest streak calculation
    return this.calculateStreak(history); // Simplified for now
  }

  /**
   * Find favorite exercises
   */
  findFavoriteExercises(history) {
    const exerciseCount = {};
    
    history.forEach(session => {
      session.exercises?.forEach(ex => {
        const name = ex.name;
        exerciseCount[name] = (exerciseCount[name] || 0) + 1;
      });
    });
    
    return Object.entries(exerciseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  /**
   * Get personal records
   */
  async getPersonalRecords(userId) {
    try {
      const q = query(
        collection(db, 'userProgress'),
        where('userId', '==', userId),
        where('isPersonalRecord', '==', true),
        orderBy('date', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const records = [];
      
      snapshot.forEach(doc => {
        records.push(doc.data());
      });
      
      return records;
    } catch (error) {
      console.error('Error fetching PRs:', error);
      return [];
    }
  }

  /**
   * Calculate average duration
   */
  calculateAverageDuration(history) {
    const sessionsWithDuration = history.filter(s => s.duration);
    if (sessionsWithDuration.length === 0) return 0;
    
    const totalDuration = sessionsWithDuration.reduce((sum, s) => 
      sum + s.duration, 0
    );
    
    return Math.round(totalDuration / sessionsWithDuration.length);
  }

  /**
   * Calculate average RPE
   */
  calculateAverageRPE(history) {
    const sessionsWithRPE = history.filter(s => s.sessionRPE);
    if (sessionsWithRPE.length === 0) return 0;
    
    const totalRPE = sessionsWithRPE.reduce((sum, s) => 
      sum + s.sessionRPE, 0
    );
    
    return (totalRPE / sessionsWithRPE.length).toFixed(1);
  }

  /**
   * Sync with Firestore
   */
  async syncWithFirestore() {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      // Fetch latest history
      await this.getUserHistory();
      
      console.log('✅ Synced with Firestore');
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  /**
   * Save history cache
   */
  async saveHistoryCache() {
    try {
      await AsyncStorage.setItem(
        HISTORY_CACHE_KEY, 
        JSON.stringify(this.historyCache.slice(0, 100))
      );
    } catch (error) {
      console.error('Error saving history cache:', error);
    }
  }

  /**
   * Save progress cache
   */
  async saveProgressCache() {
    try {
      await AsyncStorage.setItem(
        PROGRESS_CACHE_KEY, 
        JSON.stringify(this.progressCache)
      );
    } catch (error) {
      console.error('Error saving progress cache:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    try {
      await AsyncStorage.multiRemove([HISTORY_CACHE_KEY, PROGRESS_CACHE_KEY]);
      this.historyCache = [];
      this.progressCache = {};
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

// Create singleton instance
const workoutHistoryService = new WorkoutHistoryService();

export default workoutHistoryService;