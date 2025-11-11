/**
 * Workout Service
 * Manages workout generation, saving, and retrieval with Firebase
 * Integrates user context for AI-powered workout generation
 */

import { auth, db, functions } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { profileService } from './ProfileService';
import { exerciseSelectionService } from './ExerciseSelectionService';

class WorkoutService {
  constructor() {
    this.currentWorkout = null;
    this.savedWorkouts = [];
    this.listeners = new Set();
    
    // Initialize Firebase Functions
    this.generateWorkout = httpsCallable(functions, 'generateWorkout');
    this.generateStructuredWorkout = httpsCallable(functions, 'generateStructuredWorkout');
    this.chatWithGemini = httpsCallable(functions, 'chatWithGemini');
    this.generateWorkoutTitle = httpsCallable(functions, 'generateWorkoutTitle');
    this.generateWorkoutSummary = httpsCallable(functions, 'generateWorkoutSummary');
  }

  /**
   * Get comprehensive user context for AI generation
   */
  async getUserContext() {
    try {
      // Get user profile with preferences
      const profile = await profileService.loadProfile(auth.currentUser?.uid);
      
      // Get saved preferences from localStorage
      const savedPreferences = localStorage.getItem('userPreferences');
      const preferences = savedPreferences ? JSON.parse(savedPreferences) : {};
      
      // Get selected exercises
      const selectedExercises = exerciseSelectionService.getSelectedExercises();
      const exerciseSummary = exerciseSelectionService.getSummary();
      
      // Get recent workout history
      const workoutHistory = await this.getRecentWorkouts(7);
      
      // Get nutrition preferences and recent logs
      const nutritionData = await this.getNutritionContext();
      
      // Get recent fitness programs searched
      const programHistory = this.getRecentProgramSearches();
      
      // Compile comprehensive context
      const context = {
        profile: {
          name: profile?.displayName || 'User',
          age: this.calculateAge(profile?.profile?.dateOfBirth),
          gender: profile?.profile?.gender || 'not-specified',
          fitnessLevel: profile?.fitness?.level || preferences.difficulty || 'intermediate',
          experience: profile?.fitness?.experience || 1,
          goals: profile?.fitness?.goals || [],
          currentWeight: profile?.fitness?.currentWeight,
          targetWeight: profile?.fitness?.targetWeight,
          height: profile?.fitness?.height,
          injuries: profile?.fitness?.injuries || [],
          equipment: profile?.fitness?.equipment || preferences.equipment || []
        },
        preferences: {
          workoutDuration: preferences.preferredDuration || 45,
          restTime: preferences.restTimeBetweenSets || 60,
          difficulty: preferences.difficulty || 'intermediate',
          equipment: preferences.equipment || [],
          units: preferences.units || 'metric',
          autoStartTimer: preferences.autoStartTimer || false
        },
        selectedExercises: selectedExercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          category: ex.category,
          primaryMuscles: ex.primaryMuscles,
          equipment: ex.equipment
        })),
        exerciseSummary: {
          totalCount: exerciseSummary.totalCount,
          byCategory: exerciseSummary.byCategory,
          byMuscleGroup: exerciseSummary.byMuscleGroup,
          byEquipment: exerciseSummary.byEquipment
        },
        workoutHistory: workoutHistory.map(w => ({
          date: w.createdAt,
          name: w.name,
          exercises: w.exercises?.length || 0,
          duration: w.duration || 0,
          difficulty: w.difficulty
        })),
        nutrition: nutritionData,
        recentPrograms: programHistory,
        integrations: {
          healthConnected: profile?.integrations?.appleHealth?.connected || 
                          profile?.integrations?.googleFit?.connected || 
                          profile?.integrations?.healthDemo?.connected || false,
          averageDailySteps: profile?.stats?.averageDailySteps || 0
        },
        timestamp: new Date().toISOString()
      };
      
      return context;
    } catch (error) {
      console.error('Error getting user context:', error);
      // Return minimal context on error
      return {
        profile: { fitnessLevel: 'intermediate' },
        preferences: { workoutDuration: 45 },
        selectedExercises: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate workout with full context
   */
  async generateWorkoutWithContext(prompt, chatHistory = []) {
    try {
      // Get comprehensive user context
      const userContext = await this.getUserContext();
      
      // Call Firebase Function with context
      const response = await this.generateStructuredWorkout({
        prompt,
        userContext,
        chatHistory: chatHistory.slice(-10), // Last 10 messages for context
        preferences: {
          includeNutrition: true,
          includeWarmup: true,
          includeCooldown: true,
          detailedInstructions: true
        }
      });
      
      const workout = response.data;
      
      // Save generated workout
      if (workout && auth.currentUser) {
        await this.saveWorkout(workout);
      }
      
      return workout;
    } catch (error) {
      console.error('Error generating workout:', error);
      throw error;
    }
  }

  /**
   * Chat with AI including context
   */
  async chatWithContext(message, chatHistory = []) {
    try {
      const userContext = await this.getUserContext();
      
      const response = await this.chatWithGemini({
        message,
        context: {
          userProfile: userContext.profile,
          preferences: userContext.preferences,
          selectedExercises: userContext.selectedExercises,
          exerciseSummary: userContext.exerciseSummary,
          nutrition: userContext.nutrition,
          recentPrograms: userContext.recentPrograms
        },
        history: chatHistory.slice(-10),
        systemPrompt: this.getSystemPrompt(userContext)
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }

  /**
   * Get system prompt with user context
   */
  getSystemPrompt(context) {
    return `You are an expert fitness coach and nutritionist helping ${context.profile.name || 'the user'}.
    
User Profile:
- Fitness Level: ${context.profile.fitnessLevel}
- Goals: ${context.profile.goals?.join(', ') || 'General fitness'}
- Experience: ${context.profile.experience || 1} years
- Available Equipment: ${context.profile.equipment?.join(', ') || 'Bodyweight only'}
${context.profile.injuries?.length > 0 ? `- Injuries/Limitations: ${context.profile.injuries.join(', ')}` : ''}

Preferences:
- Preferred workout duration: ${context.preferences.workoutDuration} minutes
- Rest between sets: ${context.preferences.restTime} seconds
- Difficulty level: ${context.preferences.difficulty}

${context.selectedExercises?.length > 0 ? `
Selected Exercises:
${context.selectedExercises.map(ex => `- ${ex.name} (${ex.category})`).join('\n')}
` : ''}

${context.nutrition?.recentMeals?.length > 0 ? `
Recent Nutrition:
- Daily calories: ${context.nutrition.dailyCalories || 'Not tracked'}
- Diet type: ${context.nutrition.dietType || 'Standard'}
` : ''}

Please provide personalized recommendations based on this context. When creating workouts:
1. Consider the user's fitness level and experience
2. Work around any injuries or limitations
3. Use only available equipment
4. Keep workouts within the preferred duration
5. Include warm-up and cool-down recommendations
6. Provide clear instructions and form cues
7. If nutrition is discussed, consider their dietary preferences and goals

Always be encouraging, professional, and safety-conscious.`;
  }

  /**
   * Save workout to Firebase
   */
  async saveWorkout(workout) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    try {
      const workoutId = `workout_${Date.now()}`;
      const workoutRef = doc(db, 'users', auth.currentUser.uid, 'workouts', workoutId);
      
      const workoutData = {
        ...workout,
        id: workoutId,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'saved',
        source: 'ai_generated'
      };
      
      await setDoc(workoutRef, workoutData);
      
      // Update current workout
      this.currentWorkout = workoutData;
      
      // Add to saved workouts list
      this.savedWorkouts.unshift(workoutData);
      
      // Notify listeners
      this.notifyListeners('workout-saved', workoutData);
      
      return workoutData;
    } catch (error) {
      console.error('Error saving workout:', error);
      throw error;
    }
  }

  /**
   * Get saved workouts from Firebase
   */
  async getSavedWorkouts() {
    if (!auth.currentUser) return [];
    
    try {
      const workoutsRef = collection(db, 'users', auth.currentUser.uid, 'workouts');
      const q = query(workoutsRef, orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      
      const workouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      this.savedWorkouts = workouts;
      this.notifyListeners('workouts-loaded', workouts);
      
      return workouts;
    } catch (error) {
      console.error('Error getting saved workouts:', error);
      return [];
    }
  }

  /**
   * Get recent workouts for context
   */
  async getRecentWorkouts(days = 7) {
    if (!auth.currentUser) return [];
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const workoutsRef = collection(db, 'users', auth.currentUser.uid, 'workouts');
      const q = query(
        workoutsRef,
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting recent workouts:', error);
      return [];
    }
  }

  /**
   * Delete workout
   */
  async deleteWorkout(workoutId) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'workouts', workoutId));
      
      // Remove from saved workouts list
      this.savedWorkouts = this.savedWorkouts.filter(w => w.id !== workoutId);
      
      // Clear current workout if it's the one being deleted
      if (this.currentWorkout?.id === workoutId) {
        this.currentWorkout = null;
      }
      
      this.notifyListeners('workout-deleted', workoutId);
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  }

  /**
   * Start workout session
   */
  async startWorkout(workoutId) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    try {
      // Get the workout
      const workout = this.savedWorkouts.find(w => w.id === workoutId);
      if (!workout) throw new Error('Workout not found');
      
      // Create workout session
      const sessionId = `session_${Date.now()}`;
      const sessionRef = doc(db, 'users', auth.currentUser.uid, 'workoutSessions', sessionId);
      
      const sessionData = {
        id: sessionId,
        workoutId,
        workout,
        startedAt: serverTimestamp(),
        status: 'in_progress',
        completedExercises: [],
        currentExerciseIndex: 0
      };
      
      await setDoc(sessionRef, sessionData);
      
      this.notifyListeners('workout-started', sessionData);
      return sessionData;
    } catch (error) {
      console.error('Error starting workout:', error);
      throw error;
    }
  }

  /**
   * Get nutrition context
   */
  async getNutritionContext() {
    try {
      // Get from localStorage for now
      const nutritionLogs = localStorage.getItem('nutritionLogs');
      const recentMeals = nutritionLogs ? JSON.parse(nutritionLogs) : [];
      
      // Get user's nutrition preferences from profile
      const profile = profileService.currentProfile;
      
      return {
        dietType: profile?.nutrition?.dietType || 'standard',
        allergies: profile?.nutrition?.allergies || [],
        intolerances: profile?.nutrition?.intolerances || [],
        dailyCalories: profile?.nutrition?.dailyCalories?.target || 2000,
        macros: profile?.nutrition?.macros || {},
        recentMeals: recentMeals.slice(0, 5) // Last 5 meals
      };
    } catch (error) {
      console.error('Error getting nutrition context:', error);
      return {};
    }
  }

  /**
   * Get recent program searches
   */
  getRecentProgramSearches() {
    try {
      const searches = localStorage.getItem('recentProgramSearches');
      return searches ? JSON.parse(searches) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Subscribe to workout events
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners of events
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Workout listener error:', error);
      }
    });
  }

  /**
   * Clear all workouts
   */
  clearAll() {
    this.currentWorkout = null;
    this.notifyListeners('workouts-cleared', {});
  }
}

// Create singleton instance
export const workoutService = new WorkoutService();

export default workoutService;