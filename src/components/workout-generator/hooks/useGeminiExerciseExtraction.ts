
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "@/components/exercise-search/types";

export function useGeminiExerciseExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractExercises = async (workoutText: string): Promise<Exercise[]> => {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: {
          message: `Analyze this workout text and extract all exercises mentioned:
            ${workoutText}
            
            Return ONLY a JSON array of exercise objects with this format:
            {
              "name": "exercise name",
              "instructions": ["step 1", "step 2"],
              "type": "strength" or "cardio"
            }
            
            Include ONLY exercises that are explicitly mentioned in the text.`
        }
      });

      if (error) {
        console.error('Error invoking chat-with-gemini:', error);
        return [];
      }

      try {
        // The response is already parsed from the edge function
        if (data.response) {
          const parsedResponse = JSON.parse(data.response);
          return Array.isArray(parsedResponse) ? parsedResponse : [];
        }
        return [];
      } catch (e) {
        console.error('Failed to parse exercises response:', e);
        return [];
      }
    } catch (error) {
      console.error('Error extracting exercises:', error);
      return [];
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    extractExercises,
    isExtracting
  };
}
