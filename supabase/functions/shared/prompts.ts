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
  const exerciseList = selectedExercises?.length 
    ? `INCLUDED EXERCISES: ${selectedExercises.map(e => e.name).join(", ")}`
    : '';

  const weatherConsideration = weatherPrompt
    ? `WEATHER ADAPTATIONS: Account for ${weatherPrompt.toLowerCase()} conditions`
    : '';

  const prescription = prescribedExercises
    ? `REQUIRED MODIFICATIONS: Incorporate ${prescribedExercises}`
    : '';

  return `As an elite fitness coach, design a scientifically-grounded ${numberOfDays}-day training program.
  
PROGRAM PARAMETERS:
- Target fitness level: ${fitnessLevel}
${weatherConsideration ? `- ${weatherConsideration}\n` : ''}${exerciseList ? `- ${exerciseList}\n` : ''}${prescription ? `- ${prescription}\n` : ''}

DAILY STRUCTURE REQUIREMENTS:
1. Focus description: Scientific training stimulus and physiological adaptation
2. Warmup: Progressive activation sequence
3. Workout: Periodized prescription with sets/reps/tempo
4. Strength component: Compound movement pattern focus
5. Notes: Regeneration strategies or scaling options

FORMAT SPECIFICATION:
Generate valid JSON following this exact structure:
{
  "day1": {
    "description": "string",
    "warmup": "string",
    "workout": "string",
    "strength": "string",
    "notes": "string"
  }
  // ... Repeat for each day
}

CRITICAL INSTRUCTIONS:
- Use double quotes for all strings
- Maintain consistent JSON syntax
- Avoid markdown formatting
- Ensure proper escape characters
- Include all 5 required sections per day
- Prioritize exercise science principles`;
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