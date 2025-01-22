export interface WorkoutGenerationParams {
  numberOfDays: number;
  weatherPrompt?: string;
  selectedExercises?: Array<{ name: string; instructions: string[] }>;
  fitnessLevel: string;
  prescribedExercises?: string;
}

export const createWorkoutGenerationPrompt = ({
  numberOfDays,
  weatherPrompt,
  selectedExercises,
  fitnessLevel,
  prescribedExercises
}: WorkoutGenerationParams): string => {
  const exercisesPrompt = selectedExercises?.length 
    ? `Include these exercises: ${selectedExercises.map(e => e.name).join(", ")}` 
    : '';
  
  return `As an expert fitness coach, create a ${numberOfDays}-day workout program. 
    ${weatherPrompt ? `Consider these weather conditions: ${weatherPrompt}` : ''}
    ${exercisesPrompt}
    ${fitnessLevel ? `This program is for a ${fitnessLevel} level individual` : ''}
    ${prescribedExercises ? `Include these prescribed exercises/modifications: ${prescribedExercises}` : ''}

    IMPORTANT: Your response MUST be a valid, parseable JSON object with the following structure:
    {
      "day1": {
        "description": "string - Brief focus description",
        "warmup": "string - Detailed warmup routine",
        "workout": "string - Main workout details",
        "strength": "string - Strength component",
        "notes": "string - Optional coaching notes"
      },
      // ... repeat for each day
    }

    Do not include any text outside of the JSON object.
    Do not include markdown code blocks.
    Ensure all string values are properly escaped.
    Do not use trailing commas.`;
};

export const createWorkoutModificationPrompt = (
  dayToModify: string,
  modificationPrompt: string,
  currentWorkout: {
    warmup: string;
    workout: string;
    notes?: string;
  }
): string => {
  return `As an expert coach, modify this workout based on the following request while maintaining its core purpose and progression:

CURRENT WORKOUT FOR ${dayToModify}:
Warmup: ${currentWorkout.warmup}
Workout: ${currentWorkout.workout}
Notes: ${currentWorkout.notes || 'None provided'}

MODIFICATION REQUEST: ${modificationPrompt}

Consider:
1. Movement pattern integrity
2. Exercise progression/regression needs
3. Equipment modifications
4. Safety and technique priorities
5. Energy system demands
6. Recovery implications

IMPORTANT: Your response MUST be a valid, parseable JSON object with this exact structure:
{
    "description": "string - Brief workout description",
    "warmup": "string - Detailed warmup plan",
    "workout": "string - Complete workout details",
    "notes": "string - Comprehensive coaching notes",
    "strength": "string - Specific strength focus"
}

Do not include any text outside of the JSON object.
Do not include markdown code blocks.
Ensure all string values are properly escaped.
Do not use trailing commas.`;
};

export const getGeminiConfig = () => ({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});