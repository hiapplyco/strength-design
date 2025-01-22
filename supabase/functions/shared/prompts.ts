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

    For each day, provide:
    1. A brief description of the focus and stimulus
    2. A warmup routine
    3. The main workout
    4. A strength component
    5. Optional notes or modifications

    Return the response in this exact JSON format:
    {
      "day1": {
        "description": "Focus of the day",
        "warmup": "Warmup routine",
        "workout": "Main workout",
        "strength": "Strength component",
        "notes": "Optional notes"
      }
    }

    Respond only with the JSON object, no additional text.`;
};