import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkoutDay {
  description: string;
  warmup: any[];
  workout: any[];
  strength: any[];
  cooldown?: any[];
  [key: string]: any;
}

interface WorkoutCycle {
  [day: string]: WorkoutDay;
}

interface GeneratedWorkout {
  [cycle: string]: WorkoutCycle;
  _meta?: any;
}

interface WorkoutStore {
  currentWorkout: GeneratedWorkout | null;
  workoutTitle: string | null;
  workoutSummary: string | null;
  lastGeneratedAt: Date | null;
  
  setWorkout: (workout: GeneratedWorkout, title: string, summary: string) => void;
  updateWorkoutDay: (cycleKey: string, dayKey: string, updatedDay: WorkoutDay) => void;
  clearWorkout: () => void;
  hasValidWorkout: () => boolean;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      currentWorkout: null,
      workoutTitle: null,
      workoutSummary: null,
      lastGeneratedAt: null,
      
      setWorkout: (workout, title, summary) => set({
        currentWorkout: workout,
        workoutTitle: title,
        workoutSummary: summary,
        lastGeneratedAt: new Date()
      }),
      
      updateWorkoutDay: (cycleKey, dayKey, updatedDay) => set((state) => {
        if (!state.currentWorkout) return state;
        
        return {
          ...state,
          currentWorkout: {
            ...state.currentWorkout,
            [cycleKey]: {
              ...state.currentWorkout[cycleKey],
              [dayKey]: updatedDay
            }
          }
        };
      }),
      
      clearWorkout: () => set({
        currentWorkout: null,
        workoutTitle: null,
        workoutSummary: null,
        lastGeneratedAt: null
      }),
      
      hasValidWorkout: () => {
        const state = get();
        if (!state.currentWorkout || !state.lastGeneratedAt) return false;
        
        // Check if workout is less than 24 hours old
        const hoursSinceGenerated = (new Date().getTime() - new Date(state.lastGeneratedAt).getTime()) / (1000 * 60 * 60);
        return hoursSinceGenerated < 24;
      }
    }),
    {
      name: 'workout-storage',
      partialize: (state) => ({
        currentWorkout: state.currentWorkout,
        workoutTitle: state.workoutTitle,
        workoutSummary: state.workoutSummary,
        lastGeneratedAt: state.lastGeneratedAt
      })
    }
  )
);