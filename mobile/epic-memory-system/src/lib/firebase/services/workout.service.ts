import { 
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config';
import type { Workout, WorkoutHistory, VoiceRecording, WorkoutSession, WorkoutMetric } from '../types';
import { COLLECTIONS } from '../types';

export class WorkoutService {
  /**
   * Create a new workout
   */
  static async createWorkout(userId: string, workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const collectionRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUTS);
      const docRef = await addDoc(collectionRef, {
        ...workout,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
  }

  /**
   * Get a specific workout
   */
  static async getWorkout(userId: string, workoutId: string): Promise<Workout | null> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUTS, workoutId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Workout;
      }
      return null;
    } catch (error) {
      console.error('Error getting workout:', error);
      throw error;
    }
  }

  /**
   * Get all workouts for a user
   */
  static async getUserWorkouts(userId: string, limitCount: number = 50): Promise<Workout[]> {
    try {
      const collectionRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUTS);
      const q = query(
        collectionRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workout[];
    } catch (error) {
      console.error('Error getting user workouts:', error);
      throw error;
    }
  }

  /**
   * Get favorite workouts
   */
  static async getFavoriteWorkouts(userId: string): Promise<Workout[]> {
    try {
      const collectionRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUTS);
      const q = query(
        collectionRef,
        where('isFavorite', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workout[];
    } catch (error) {
      console.error('Error getting favorite workouts:', error);
      throw error;
    }
  }

  /**
   * Update a workout
   */
  static async updateWorkout(userId: string, workoutId: string, data: Partial<Workout>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUTS, workoutId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
  }

  /**
   * Delete a workout
   */
  static async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUTS, workoutId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  }

  /**
   * Toggle workout favorite status
   */
  static async toggleFavorite(userId: string, workoutId: string): Promise<void> {
    try {
      const workout = await this.getWorkout(userId, workoutId);
      if (workout) {
        await this.updateWorkout(userId, workoutId, {
          isFavorite: !workout.isFavorite,
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Add workout history
   */
  static async addWorkoutHistory(
    userId: string, 
    workoutId: string, 
    history: Omit<WorkoutHistory, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const collectionRef = collection(
        db, 
        COLLECTIONS.USERS, 
        userId, 
        COLLECTIONS.WORKOUTS, 
        workoutId, 
        COLLECTIONS.WORKOUT_HISTORY
      );
      
      const docRef = await addDoc(collectionRef, {
        ...history,
        createdAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding workout history:', error);
      throw error;
    }
  }

  /**
   * Get workout history
   */
  static async getWorkoutHistory(userId: string, workoutId: string): Promise<WorkoutHistory[]> {
    try {
      const collectionRef = collection(
        db, 
        COLLECTIONS.USERS, 
        userId, 
        COLLECTIONS.WORKOUTS, 
        workoutId, 
        COLLECTIONS.WORKOUT_HISTORY
      );
      
      const q = query(collectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WorkoutHistory[];
    } catch (error) {
      console.error('Error getting workout history:', error);
      throw error;
    }
  }

  /**
   * Create a workout session
   */
  static async createWorkoutSession(
    userId: string, 
    session: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const collectionRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUT_SESSIONS);
      const docRef = await addDoc(collectionRef, {
        ...session,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating workout session:', error);
      throw error;
    }
  }

  /**
   * Complete a workout session
   */
  static async completeWorkoutSession(
    userId: string,
    sessionId: string,
    completionData: {
      actualDurationMinutes: number;
      perceivedExertion?: number;
      satisfactionRating?: number;
      modifications?: string;
      notes?: string;
      metrics?: WorkoutMetric[];
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUT_SESSIONS, sessionId);
      await updateDoc(docRef, {
        ...completionData,
        status: 'completed',
        completedDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error completing workout session:', error);
      throw error;
    }
  }

  /**
   * Get upcoming workout sessions
   */
  static async getUpcomingWorkoutSessions(userId: string, days: number = 7): Promise<WorkoutSession[]> {
    try {
      const collectionRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUT_SESSIONS);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      const q = query(
        collectionRef,
        where('scheduledDate', '>=', Timestamp.fromDate(startDate)),
        where('scheduledDate', '<=', Timestamp.fromDate(endDate)),
        where('status', '==', 'scheduled'),
        orderBy('scheduledDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WorkoutSession[];
    } catch (error) {
      console.error('Error getting upcoming workout sessions:', error);
      throw error;
    }
  }

  /**
   * Get workout statistics
   */
  static async getWorkoutStats(userId: string): Promise<{
    totalWorkouts: number;
    completedSessions: number;
    averageDuration: number;
    favoriteCount: number;
  }> {
    try {
      // Get total workouts
      const workoutsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUTS);
      const workoutsSnapshot = await getDocs(workoutsRef);
      const totalWorkouts = workoutsSnapshot.size;
      
      // Get favorite count
      const favoritesQuery = query(workoutsRef, where('isFavorite', '==', true));
      const favoritesSnapshot = await getDocs(favoritesQuery);
      const favoriteCount = favoritesSnapshot.size;
      
      // Get completed sessions
      const sessionsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.WORKOUT_SESSIONS);
      const completedQuery = query(sessionsRef, where('status', '==', 'completed'));
      const completedSnapshot = await getDocs(completedQuery);
      const completedSessions = completedSnapshot.size;
      
      // Calculate average duration
      let totalDuration = 0;
      let sessionCount = 0;
      completedSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.actualDurationMinutes) {
          totalDuration += data.actualDurationMinutes;
          sessionCount++;
        }
      });
      
      const averageDuration = sessionCount > 0 ? totalDuration / sessionCount : 0;
      
      return {
        totalWorkouts,
        completedSessions,
        averageDuration: Math.round(averageDuration),
        favoriteCount,
      };
    } catch (error) {
      console.error('Error getting workout stats:', error);
      throw error;
    }
  }
}