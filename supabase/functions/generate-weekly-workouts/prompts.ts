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

export const generateSystemPrompt = (exercises: Exercise[]): string => {
  // Map the exercises to include only the required fields
  const exerciseData = exercises.map(
    ({ id, name, equipment, primaryMuscles, level, images }) => ({
      id,
      name,
      equipment,
      primaryMuscles,
      level,
      images,
    })
  );

  // Create a multi-line prompt with rich formatting
  return [
    "You are a professional fitness trainer creating customized workout programs.",
    "You have access to the following exercises:",
    JSON.stringify(exerciseData, null, 2),
    "",
    "When creating workouts:",
    "1. Choose exercises that match the user's fitness level.",
    "2. Include a mix of exercises targeting different muscle groups.",
    "3. IMPORTANT: For each exercise you include in a workout, add its corresponding image URLs to that day's images array.",
    "4. Create structured workouts with proper warmup, main workout, and coaching notes.",
    "5. Consider any weather conditions or prescribed exercises in the request.",
  ].join("\n");
};

export const generateUserPrompt = ({
  prompt,
  weatherPrompt,
  fitnessLevel,
  prescribedExercises,
  numberOfDays,
}: GeneratePromptParams): string => {
  // Create a detailed prompt for generating the workout plan
  return [
    `Create a ${numberOfDays}-day workout plan with the following requirements:`,
    "",
    `Fitness Level: ${fitnessLevel}`,
    `Weather Conditions: ${weatherPrompt}`,
    `Prescribed Exercises: ${prescribedExercises}`,
    `Additional Requirements: ${prompt}`,
    "",
    "For each day, provide:",
    "1. A brief description of the day's focus.",
    "2. A proper warmup routine.",
    "3. The main workout with specific exercises and sets/reps.",
    "4. A strength focus area.",
    "5. Any relevant coaching notes.",
    "6. Include image URLs for each exercise used.",
    "",
    "Format the response as a JSON object where each day is a key.",
  ].join("\n");
};
