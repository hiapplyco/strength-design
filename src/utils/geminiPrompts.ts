interface WorkoutGenerationParams {
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

    For each day, provide:
    1. A brief description of the focus and stimulus
    2. A warmup routine
    3. The main workout
    4. A strength component
    5. Optional notes or modifications

    Format each day as follows:
    {
      "day1": {
        "description": "...",
        "warmup": "...",
        "workout": "...",
        "strength": "...",
        "notes": "..."
      }
    }

    Ensure the response is a valid JSON object.`;
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
  return `As an expert coach with deep expertise in exercise programming and movement optimization, modify this workout based on the following request while maintaining its core purpose and progression:

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

Provide a complete, modified workout that includes ALL of the following sections:

1. Brief description explaining focus and stimulus
2. Detailed warmup sequence
3. Complete workout with:
   - Clear movement standards
   - Loading parameters
   - Work/rest ratios
   - Scaling options
4. Strength focus with specific movement patterns
5. Comprehensive coaching notes

Return ONLY a JSON object with the modified workout in this exact format:
{
    "description": "Brief workout description",
    "warmup": "Detailed warmup plan",
    "workout": "Complete workout details",
    "notes": "Comprehensive coaching notes",
    "strength": "Specific strength focus"
}

Ensure all sections are detailed and complete, maintaining the professional coaching standard of the original workout.`;
};

export const getGeminiConfig = () => ({
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});