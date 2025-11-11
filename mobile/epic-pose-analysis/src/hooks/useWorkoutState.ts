
import { useState, useEffect } from "react";
import type { WorkoutDay } from "@/types/fitness";

interface WorkoutState {
  warmup: string;
  workout: string;
  notes?: string;
  strength: string;
}

export function useWorkoutState(
  title: string,
  allWorkouts?: Record<string, WorkoutDay>
) {
  const [state, setState] = useState<WorkoutState>({
    warmup: "",
    workout: "",
    notes: "",
    strength: ""
  });

  useEffect(() => {
    if (allWorkouts && allWorkouts[title]) {
      const workout = allWorkouts[title];
      setState({
        warmup: workout.warmup || "",
        workout: workout.workout || "",
        notes: workout.notes || "",
        strength: workout.strength || ""
      });
    }
  }, [allWorkouts, title]);

  const setWarmup = (warmup: string) => setState(prev => ({ ...prev, warmup }));
  const setWorkout = (workout: string) => setState(prev => ({ ...prev, workout }));
  const setNotes = (notes: string) => setState(prev => ({ ...prev, notes }));
  const setStrength = (strength: string) => setState(prev => ({ ...prev, strength }));

  return {
    ...state,
    setWarmup,
    setWorkout,
    setNotes,
    setStrength,
    setState
  };
}
