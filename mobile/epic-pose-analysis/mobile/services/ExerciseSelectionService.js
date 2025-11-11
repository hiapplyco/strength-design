/**
 * Exercise Selection Service
 * Manages selected exercises and provides data structure for cross-app integration
 * Enables sharing exercise data with chat, workout generation, and other features
 */

class ExerciseSelectionService {
  constructor() {
    this.selectedExercises = new Map();
    this.selectionHistory = [];
    this.workoutContext = null;
    this.listeners = new Set();
    
    // Selection metadata
    this.selectionMetadata = {
      totalSelected: 0,
      lastUpdated: null,
      sessionId: this.generateSessionId(),
      categories: new Set(),
      muscleGroups: new Set(),
      equipment: new Set(),
      estimatedDuration: 0
    };
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add exercise to selection
   */
  selectExercise(exercise, context = {}) {
    const selectionData = {
      exercise: this.normalizeExercise(exercise),
      selectedAt: new Date().toISOString(),
      context: {
        source: context.source || 'search',
        searchQuery: context.searchQuery || '',
        selectedFrom: context.selectedFrom || 'exercise-library',
        userAction: context.userAction || 'manual-select',
        ...context
      },
      metadata: {
        sets: context.sets || null,
        reps: context.reps || null,
        weight: context.weight || null,
        duration: context.duration || null,
        notes: context.notes || '',
        difficulty: exercise.difficulty,
        estimatedTime: this.estimateExerciseTime(exercise, context)
      }
    };

    this.selectedExercises.set(exercise.id, selectionData);
    this.addToHistory('select', exercise, context);
    this.updateMetadata();
    this.notifyListeners('exercise-selected', { exercise, selectionData });

    console.log(`✅ Exercise selected: ${exercise.name}`, selectionData);
    return selectionData;
  }

  /**
   * Remove exercise from selection
   */
  deselectExercise(exerciseId, context = {}) {
    const selectionData = this.selectedExercises.get(exerciseId);
    if (selectionData) {
      this.selectedExercises.delete(exerciseId);
      this.addToHistory('deselect', selectionData.exercise, context);
      this.updateMetadata();
      this.notifyListeners('exercise-deselected', { exerciseId, selectionData });
      
      console.log(`❌ Exercise deselected: ${selectionData.exercise.name}`);
      return true;
    }
    return false;
  }

  /**
   * Update exercise selection with new metadata
   */
  updateExerciseSelection(exerciseId, updates) {
    const selectionData = this.selectedExercises.get(exerciseId);
    if (selectionData) {
      selectionData.metadata = { ...selectionData.metadata, ...updates };
      selectionData.updatedAt = new Date().toISOString();
      
      this.updateMetadata();
      this.notifyListeners('exercise-updated', { exerciseId, selectionData, updates });
      
      console.log(`🔄 Exercise updated: ${selectionData.exercise.name}`, updates);
      return selectionData;
    }
    return null;
  }

  /**
   * Normalize exercise data for consistent structure
   */
  normalizeExercise(exercise) {
    return {
      id: exercise.id,
      name: exercise.name,
      slug: exercise.slug || exercise.name.toLowerCase().replace(/\s+/g, '-'),
      description: exercise.description || '',
      instructions: exercise.instructions || [],
      category: exercise.category || 'other',
      type: Array.isArray(exercise.type) ? exercise.type : [exercise.type || 'strength'],
      equipment: Array.isArray(exercise.equipment) ? exercise.equipment : [exercise.equipment || 'bodyweight'],
      primary_muscles: exercise.primary_muscles || [],
      secondary_muscles: exercise.secondary_muscles || [],
      difficulty: exercise.difficulty || 'intermediate',
      mechanics_type: exercise.mechanics_type || 'compound',
      force: exercise.force || '',
      images: exercise.images || [],
      videos: exercise.videos || [],
      source: exercise.source || 'unknown',
      
      // Additional computed fields
      muscleGroups: [...(exercise.primary_muscles || []), ...(exercise.secondary_muscles || [])],
      equipmentList: Array.isArray(exercise.equipment) ? exercise.equipment : [exercise.equipment || 'bodyweight']
    };
  }

  /**
   * Estimate exercise time based on type and context
   */
  estimateExerciseTime(exercise, context = {}) {
    const baseTime = {
      'strength': 3, // minutes per set
      'cardio': 15,  // minutes total
      'stretching': 2, // minutes per stretch
      'plyometrics': 2, // minutes per set
      'powerlifting': 4, // minutes per set (longer rest)
      'olympic': 4,
      'strongman': 5,
      'calisthenics': 2
    };

    const exerciseType = exercise.category || 'strength';
    const time = baseTime[exerciseType] || 3;
    
    const sets = context.sets || 3;
    const isCardio = exerciseType === 'cardio';
    
    return isCardio ? time : time * sets;
  }

  /**
   * Add action to history
   */
  addToHistory(action, exercise, context) {
    const historyEntry = {
      action,
      exercise: {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category
      },
      context,
      timestamp: new Date().toISOString()
    };

    this.selectionHistory.unshift(historyEntry);
    
    // Keep only last 50 history entries
    if (this.selectionHistory.length > 50) {
      this.selectionHistory = this.selectionHistory.slice(0, 50);
    }
  }

  /**
   * Update selection metadata
   */
  updateMetadata() {
    const exercises = Array.from(this.selectedExercises.values());
    
    this.selectionMetadata = {
      totalSelected: exercises.length,
      lastUpdated: new Date().toISOString(),
      sessionId: this.selectionMetadata.sessionId,
      categories: new Set(exercises.map(s => s.exercise.category)),
      muscleGroups: new Set(exercises.flatMap(s => s.exercise.muscleGroups)),
      equipment: new Set(exercises.flatMap(s => s.exercise.equipmentList)),
      estimatedDuration: exercises.reduce((total, s) => total + s.metadata.estimatedTime, 0),
      
      // Workout composition analysis
      distribution: this.analyzeExerciseDistribution(exercises),
      workoutType: this.determineWorkoutType(exercises),
      difficulty: this.calculateAverageDifficulty(exercises)
    };
  }

  /**
   * Analyze exercise distribution
   */
  analyzeExerciseDistribution(exercises) {
    const distribution = {
      byCategory: {},
      byMuscleGroup: {},
      byEquipment: {},
      byDifficulty: {}
    };

    exercises.forEach(selection => {
      const exercise = selection.exercise;
      
      // Category distribution
      distribution.byCategory[exercise.category] = 
        (distribution.byCategory[exercise.category] || 0) + 1;
      
      // Muscle group distribution
      exercise.muscleGroups.forEach(muscle => {
        distribution.byMuscleGroup[muscle] = 
          (distribution.byMuscleGroup[muscle] || 0) + 1;
      });
      
      // Equipment distribution
      exercise.equipmentList.forEach(equip => {
        distribution.byEquipment[equip] = 
          (distribution.byEquipment[equip] || 0) + 1;
      });
      
      // Difficulty distribution
      distribution.byDifficulty[exercise.difficulty] = 
        (distribution.byDifficulty[exercise.difficulty] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Determine workout type based on selected exercises
   */
  determineWorkoutType(exercises) {
    if (exercises.length === 0) return 'none';
    
    const categories = exercises.map(s => s.exercise.category);
    const muscleGroups = new Set(exercises.flatMap(s => s.exercise.muscleGroups));
    
    // Full body if 4+ different muscle groups
    if (muscleGroups.size >= 4) return 'full-body';
    
    // Upper/lower split detection
    const upperMuscles = ['chest', 'shoulders', 'triceps', 'biceps', 'lats', 'upper back'];
    const lowerMuscles = ['quadriceps', 'hamstrings', 'glutes', 'calves'];
    
    const hasUpper = exercises.some(s => 
      s.exercise.muscleGroups.some(m => upperMuscles.includes(m))
    );
    const hasLower = exercises.some(s => 
      s.exercise.muscleGroups.some(m => lowerMuscles.includes(m))
    );
    
    if (hasUpper && !hasLower) return 'upper-body';
    if (hasLower && !hasUpper) return 'lower-body';
    if (hasUpper && hasLower) return 'upper-lower';
    
    // Push/pull/legs detection
    const pushExercises = exercises.filter(s => s.exercise.force === 'push');
    const pullExercises = exercises.filter(s => s.exercise.force === 'pull');
    
    if (pushExercises.length > pullExercises.length * 2) return 'push';
    if (pullExercises.length > pushExercises.length * 2) return 'pull';
    
    // Default categorization
    const primaryCategory = categories[0];
    return primaryCategory || 'mixed';
  }

  /**
   * Calculate average difficulty
   */
  calculateAverageDifficulty(exercises) {
    if (exercises.length === 0) return 'intermediate';
    
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
    const reverseMap = { 1: 'beginner', 2: 'intermediate', 3: 'advanced' };
    
    const totalDifficulty = exercises.reduce((sum, selection) => {
      return sum + (difficultyMap[selection.exercise.difficulty] || 2);
    }, 0);
    
    const averageDifficulty = Math.round(totalDifficulty / exercises.length);
    return reverseMap[averageDifficulty] || 'intermediate';
  }

  /**
   * Get current selection for chat context
   */
  getChatContext() {
    const exercises = Array.from(this.selectedExercises.values());
    
    return {
      selectedExercises: exercises.map(s => ({
        name: s.exercise.name,
        category: s.exercise.category,
        muscles: s.exercise.muscleGroups,
        equipment: s.exercise.equipmentList,
        difficulty: s.exercise.difficulty,
        notes: s.metadata.notes
      })),
      workoutSummary: {
        totalExercises: exercises.length,
        estimatedDuration: this.selectionMetadata.estimatedDuration,
        workoutType: this.selectionMetadata.workoutType,
        difficulty: this.selectionMetadata.difficulty,
        muscleGroups: Array.from(this.selectionMetadata.muscleGroups),
        equipment: Array.from(this.selectionMetadata.equipment)
      },
      context: this.workoutContext
    };
  }

  /**
   * Generate workout plan from selections
   */
  generateWorkoutPlan() {
    const exercises = Array.from(this.selectedExercises.values());
    
    if (exercises.length === 0) {
      return null;
    }

    return {
      id: `workout_${Date.now()}`,
      name: `Custom Workout - ${this.selectionMetadata.workoutType}`,
      type: this.selectionMetadata.workoutType,
      difficulty: this.selectionMetadata.difficulty,
      estimatedDuration: this.selectionMetadata.estimatedDuration,
      createdAt: new Date().toISOString(),
      
      exercises: exercises.map((selection, index) => ({
        order: index + 1,
        exercise: selection.exercise,
        sets: selection.metadata.sets || 3,
        reps: selection.metadata.reps || null,
        weight: selection.metadata.weight || null,
        duration: selection.metadata.duration || null,
        restTime: this.calculateRestTime(selection.exercise),
        notes: selection.metadata.notes,
        alternatives: [] // Could be populated with similar exercises
      })),
      
      metadata: {
        muscleGroups: Array.from(this.selectionMetadata.muscleGroups),
        equipment: Array.from(this.selectionMetadata.equipment),
        distribution: this.selectionMetadata.distribution,
        sessionId: this.selectionMetadata.sessionId
      }
    };
  }

  /**
   * Calculate rest time based on exercise type and difficulty
   */
  calculateRestTime(exercise) {
    const restTimes = {
      'powerlifting': 180, // 3 minutes
      'strength': 120,     // 2 minutes
      'olympic': 150,      // 2.5 minutes
      'plyometrics': 90,   // 1.5 minutes
      'cardio': 60,        // 1 minute
      'stretching': 30,    // 30 seconds
      'calisthenics': 90   // 1.5 minutes
    };

    const baseRest = restTimes[exercise.category] || 120;
    
    // Adjust for difficulty
    const difficultyMultiplier = {
      'beginner': 0.8,
      'intermediate': 1.0,
      'advanced': 1.2
    };

    return Math.round(baseRest * (difficultyMultiplier[exercise.difficulty] || 1.0));
  }

  /**
   * Set workout context for AI chat integration
   */
  setWorkoutContext(context) {
    this.workoutContext = {
      ...context,
      timestamp: new Date().toISOString()
    };
    this.notifyListeners('context-updated', { context: this.workoutContext });
  }

  /**
   * Subscribe to selection changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Clear all selections
   */
  clearAll() {
    const previousSelections = Array.from(this.selectedExercises.values());
    this.selectedExercises.clear();
    this.updateMetadata();
    this.addToHistory('clear-all', null, { count: previousSelections.length });
    this.notifyListeners('all-cleared', { previousSelections });
    
    console.log('🧹 All exercise selections cleared');
  }

  /**
   * Get summary for display
   */
  getSummary() {
    return {
      totalSelected: this.selectionMetadata.totalSelected,
      estimatedDuration: this.selectionMetadata.estimatedDuration,
      workoutType: this.selectionMetadata.workoutType,
      difficulty: this.selectionMetadata.difficulty,
      muscleGroups: Array.from(this.selectionMetadata.muscleGroups),
      lastUpdated: this.selectionMetadata.lastUpdated
    };
  }

  /**
   * Export selection data for sharing
   */
  exportSelection() {
    return {
      selections: Array.from(this.selectedExercises.values()),
      metadata: this.selectionMetadata,
      history: this.selectionHistory.slice(0, 10), // Last 10 actions
      workoutPlan: this.generateWorkoutPlan(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import selection data
   */
  importSelection(data) {
    try {
      if (data.selections) {
        this.selectedExercises.clear();
        data.selections.forEach(selection => {
          this.selectedExercises.set(selection.exercise.id, selection);
        });
      }
      
      if (data.metadata) {
        this.selectionMetadata = { ...this.selectionMetadata, ...data.metadata };
      }
      
      this.notifyListeners('selection-imported', { data });
      console.log('📥 Exercise selection imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import selection:', error);
      return false;
    }
  }
}

// Create singleton instance
export const exerciseSelectionService = new ExerciseSelectionService();

export default exerciseSelectionService;