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

export const getGeminiConfig = () => ({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});