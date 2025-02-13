import { supabase } from "@/integrations/supabase/client";
import { sanitizeText, cleanJsonText } from "@/utils/text";

export const modifyWorkout = async (
  title: string,
  modificationPrompt: string,
  allWorkouts: Record<string, { warmup: string; workout: string; notes?: string; }> | undefined
) => {
  const { data, error } = await supabase.functions.invoke('workout-modifier', {
    body: {
      dayToModify: title,
      modificationPrompt: sanitizeText(modificationPrompt),
      allWorkouts,
    },
  });

  if (error) throw error;

  if (data) {
    return {
      warmup: sanitizeText(data.warmup),
      workout: sanitizeText(data.workout),
      notes: sanitizeText(data.notes || ''), // Provide default empty string if notes is undefined
      description: sanitizeText(data.description)
    };
  }

  throw new Error('No data returned from workout modification');
};