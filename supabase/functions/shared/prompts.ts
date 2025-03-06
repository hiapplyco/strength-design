export interface WorkoutGenerationParams {
  numberOfDays: number;
  weatherPrompt?: string;
  selectedExercises?: Array<{ name: string; instructions: string[] }>;
  fitnessLevel: string;
  prescribedExercises?: string;
  injuries?: string;
}

export const createWorkoutGenerationPrompt = ({
  numberOfDays,
  weatherPrompt,
  selectedExercises,
  fitnessLevel,
  prescribedExercises,
  injuries
}: WorkoutGenerationParams): string => {
  const exerciseList = selectedExercises?.length 
    ? `INCLUDED EXERCISES: ${selectedExercises.map(e => e.name).join(", ")}`
    : '';

  const weatherConsideration = weatherPrompt
    ? `WEATHER ADAPTATIONS: Account for ${weatherPrompt.toLowerCase()} conditions`
    : '';

  const prescription = prescribedExercises
    ? `REQUIRED MODIFICATIONS: Incorporate the following prescribed exercises/workouts:\n${prescribedExercises}`
    : '';

  const injuryConsideration = injuries
    ? `INJURY CONSIDERATIONS: Adapt for ${injuries}`
    : '';

  return `As an elite fitness coach, design a scientifically-grounded ${numberOfDays}-day training program.\n\n` +
    `PROGRAM PARAMETERS:\n` +
    `- Target fitness level: ${fitnessLevel}\n` +
    `${weatherConsideration ? `- ${weatherConsideration}\n` : ''}` +
    `${exerciseList ? `- ${exerciseList}\n` : ''}` +
    `${prescription ? `- ${prescription}\n` : ''}` +
    `${injuryConsideration ? `- ${injuryConsideration}\n` : ''}\n` +
    `DAILY STRUCTURE REQUIREMENTS:\n` +
    `1. Focus description: Scientific training stimulus and physiological adaptation\n` +
    `2. Warmup: Progressive activation sequence\n` +
    `3. Workout: Periodized prescription with sets/reps/tempo\n` +
    `4. Strength component: Compound movement pattern focus\n` +
    `5. Notes: Regeneration strategies or scaling options\n\n` +
    `FORMAT SPECIFICATION:\n` +
    `Generate valid JSON following this exact structure for ${numberOfDays} days:\n` +
    `{\n` +
    `  "day1": {\n` +
    `    "description": "string",\n` +
    `    "warmup": "string",\n` +
    `    "workout": "string",\n` +
    `    "strength": "string",\n` +
    `    "notes": "string"\n` +
    `  },\n` +
    `  // ... Repeat for each day up to day${numberOfDays}\n` +
    `}\n\n` +
    `CRITICAL INSTRUCTIONS:\n` +
    `- Generate exactly ${numberOfDays} days of workouts\n` +
    `- Use double quotes for all strings\n` +
    `- Maintain consistent JSON syntax\n` +
    `- Avoid markdown formatting\n` +
    `- Ensure proper escape characters\n` +
    `- Include all 5 required sections per day\n` +
    `- Prioritize exercise science principles`;
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
