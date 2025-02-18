
interface PromptParams {
  prompt: string;
  weatherPrompt: string;
  fitnessLevel: string;
  prescribedExercises: string;
  numberOfDays: number;
}

interface Exercise {
  name: string;
  type: string;
  equipment: string | null;
  primaryMuscles: string[];
  level: string | null;
}

export const generateSystemPrompt = (exercises: Exercise[]) => {
  const exerciseDescriptions = exercises
    .map(ex => `- ${ex.name} (Type: ${ex.type}, Level: ${ex.level || 'Any'}, Equipment: ${ex.equipment || 'None'})`)
    .join('\n');

  return `You are a professional fitness trainer creating personalized workout programs. Use these exercises in your programs:

${exerciseDescriptions}

Create detailed, structured workouts that:
1. Match the user's fitness level
2. Include appropriate exercises from the provided list
3. Consider any prescribed exercises or restrictions
4. Structure workouts with warmup, main workout, and cooldown sections
5. Provide clear sets, reps, and rest periods
6. Include intensity guidelines appropriate for the fitness level`;
};

export const generateUserPrompt = (params: PromptParams) => {
  let prompt = `Create a ${params.numberOfDays}-day workout program for a ${params.fitnessLevel} level individual.`;

  if (params.weatherPrompt) {
    prompt += `\nWeather considerations: ${params.weatherPrompt}`;
  }

  if (params.prescribedExercises) {
    prompt += `\nInclude or consider these specific exercises/requirements: ${params.prescribedExercises}`;
  }

  return prompt;
};
