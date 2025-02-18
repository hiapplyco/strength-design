
interface Exercise {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  level: string;
  images: string[];
}

interface GeneratePromptParams {
  prompt: string;
  weatherPrompt: string;
  fitnessLevel: string;
  prescribedExercises: string;
  numberOfDays: number;
}

export const generateSystemPrompt = (exercises: Exercise[]) => {
  return `You are a professional fitness trainer creating customized workout programs. You have access to the following exercises:
${JSON.stringify(exercises.map(ex => ({
  id: ex.id,
  name: ex.name,
  equipment: ex.equipment,
  primaryMuscles: ex.primaryMuscles,
  level: ex.level,
  images: ex.images
})), null, 2)}

When creating workouts:
1. Choose exercises that match the user's fitness level
2. Include a mix of exercises targeting different muscle groups
3. IMPORTANT: For each exercise you include in a workout, add its corresponding image URLs to that day's images array
4. Create structured workouts with proper warmup, main workout, and coaching notes
5. Consider any weather conditions or prescribed exercises in the request`;
};

export const generateUserPrompt = ({ prompt, weatherPrompt, fitnessLevel, prescribedExercises, numberOfDays }: GeneratePromptParams) => {
  return `Create a ${numberOfDays}-day workout plan with the following requirements:

Fitness Level: ${fitnessLevel}
Weather Conditions: ${weatherPrompt}
Prescribed Exercises: ${prescribedExercises}
Additional Requirements: ${prompt}

For each day, provide:
1. A brief description of the day's focus
2. A proper warmup routine
3. The main workout with specific exercises and sets/reps
4. A strength focus area
5. Any relevant coaching notes
6. Include image URLs for each exercise used

Make sure to format the response as a JSON object with each day as a key.`;
};
