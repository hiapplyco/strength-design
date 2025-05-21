
import { supabase } from "@/integrations/supabase/client";
import { sanitizeText, cleanJsonText } from "@/utils/text";

export const modifyWorkout = async (
  title: string,
  modificationPrompt: string,
  allWorkouts: Record<string, { warmup: string; workout: string; notes?: string; strength?: string; }> | undefined
) => {
  const currentWorkout = {
    warmup: sanitizeText(allWorkouts?.[title]?.warmup || ''),
    workout: sanitizeText(allWorkouts?.[title]?.workout || ''),
    notes: sanitizeText(allWorkouts?.[title]?.notes || ''),
    strength: sanitizeText(allWorkouts?.[title]?.strength || '')
  };

  const { data, error } = await supabase.functions.invoke('workout-modifier', {
    body: {
      dayToModify: title,
      modificationPrompt: sanitizeText(modificationPrompt),
      currentWorkout,
      allWorkouts,
    },
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error('Failed to modify workout. Please try with a different request.');
  }

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
};
