import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { sanitizeText, cleanJsonText } from "@/utils/text";
import type { WorkoutDay } from "@/types/fitness";

export const modifyWorkout = async (
  title: string,
  modificationPrompt: string,
  allWorkouts: Record<string, WorkoutDay> | undefined
) => {
  const currentWorkout = {
    warmup: sanitizeText(allWorkouts?.[title]?.warmup || ''),
    workout: sanitizeText(allWorkouts?.[title]?.workout || ''),
    notes: sanitizeText(allWorkouts?.[title]?.notes || ''),
    strength: sanitizeText(allWorkouts?.[title]?.strength || '')
  };

  try {
    const workoutModifier = httpsCallable(functions, 'workoutModifier');
    const result = await workoutModifier({
      dayToModify: title,
      modificationPrompt: sanitizeText(modificationPrompt),
      currentWorkout,
      allWorkouts,
    });

    const data = result.data as any;

    if (!data) {
      throw new Error('No data returned from workout modification');
    }

    if (data.error) {
      console.error('Data error:', data.error);
      throw new Error(data.message || 'Failed to modify workout');
    }

    return {
      warmup: sanitizeText(data.warmup || currentWorkout.warmup),
      workout: sanitizeText(data.workout || currentWorkout.workout),
      notes: sanitizeText(data.notes || currentWorkout.notes),
      strength: sanitizeText(data.strength || currentWorkout.strength),
      description: data.description ? sanitizeText(data.description) : undefined
    };
  } catch (error) {
    console.error('Firebase function error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to modify workout. Please try with a different request.');
  }
};
