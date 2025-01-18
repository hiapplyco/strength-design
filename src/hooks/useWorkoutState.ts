import { useState, useEffect } from "react";

interface WorkoutState {
  warmup: string;
  wod: string;
  notes: string;
  strength: string;
}

export function useWorkoutState(
  title: string,
  allWorkouts?: Record<string, { warmup: string; wod: string; notes: string; strength: string; }>
) {
  const [state, setState] = useState<WorkoutState>({
    warmup: "",
    wod: "",
    notes: "",
    strength: ""
  });

  useEffect(() => {
    if (allWorkouts && allWorkouts[title]) {
      const workout = allWorkouts[title];
      setState({
        warmup: workout.warmup || "",
        wod: workout.wod || "",
        notes: workout.notes || "",
        strength: workout.strength || ""
      });
    }
  }, [allWorkouts, title]);

  const setWarmup = (warmup: string) => setState(prev => ({ ...prev, warmup }));
  const setWod = (wod: string) => setState(prev => ({ ...prev, wod }));
  const setNotes = (notes: string) => setState(prev => ({ ...prev, notes }));
  const setStrength = (strength: string) => setState(prev => ({ ...prev, strength }));

  return {
    ...state,
    setWarmup,
    setWod,
    setNotes,
    setStrength,
    setState
  };
}