import { useState, useEffect } from "react";

interface WorkoutState {
  warmup: string;
  wod: string;
  notes: string;
}

export function useWorkoutState(
  title: string,
  allWorkouts?: Record<string, { warmup: string; wod: string; notes: string; }>
) {
  const [state, setState] = useState<WorkoutState>({
    warmup: "",
    wod: "",
    notes: ""
  });

  useEffect(() => {
    if (allWorkouts && allWorkouts[title]) {
      const workout = allWorkouts[title];
      setState({
        warmup: workout.warmup || "",
        wod: workout.wod || "",
        notes: workout.notes || ""
      });
    }
  }, [allWorkouts, title]);

  const setWarmup = (warmup: string) => setState(prev => ({ ...prev, warmup }));
  const setWod = (wod: string) => setState(prev => ({ ...prev, wod }));
  const setNotes = (notes: string) => setState(prev => ({ ...prev, notes }));

  return {
    ...state,
    setWarmup,
    setWod,
    setNotes,
    setState
  };
}