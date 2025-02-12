
export interface WorkoutGenerationParams {
  numberOfDays: number;
  weatherPrompt?: string;
  selectedExercises?: Array<{ name: string; instructions: string[] }>;
  fitnessLevel: string;
  prescribedExercises?: string;
  injuries?: string;
  weatherData?: any;
}

export const createWorkoutGenerationPrompt = ({
  numberOfDays,
  weatherPrompt,
  selectedExercises,
  fitnessLevel,
  prescribedExercises,
  injuries,
  weatherData
}: WorkoutGenerationParams): string => {
  // Build exercise context more explicitly
  const exerciseContext = selectedExercises?.length 
    ? `MUST INCLUDE THESE EXERCISES IN WORKOUT SECTIONS:\n${selectedExercises
        .map(e => `- ${e.name}: ${e.instructions.join(' ')}`)
        .join('\n')}`
    : '';

  // Add specific injury modifications
  const injuryModifications = injuries
    ? `INJURY ADAPTATIONS REQUIRED:\n- Modify exercises to avoid aggravating ${injuries}\n- Include alternative exercises where needed\n- Adjust range of motion and loading`
    : '';

  // Weather-specific instructions
  const weatherInstructions = weatherPrompt && weatherData
    ? `WEATHER ADAPTATIONS:\n- Warmup: ${weatherData.temperature < 15 ? 'Extend warmup duration' : 'Normal activation'}\n- Exercise Selection: ${weatherData.precipitation > 0 ? 'Include indoor alternatives' : 'Use outdoor options'}\n- Hydration: ${weatherData.humidity > 70 ? 'Increase hydration breaks' : 'Standard hydration protocol'}`
    : '';

  // Prescribed exercise integration
  const prescriptionIntegration = prescribedExercises
    ? `PRESCRIBED MODIFICATIONS:\n- Primary focus: ${prescribedExercises}\n- Integrate into strength sections\n- Progressively overload across days`
    : '';

  return `As an elite sports scientist, create a ${numberOfDays}-day periodized program with:\n\n` +
    `USER CONTEXT:\n` +
    `1. FITNESS LEVEL: ${fitnessLevel} (scale intensity accordingly)\n` +
    `2. INJURY PROFILE: ${injuries || 'none'} (modify exercises appropriately)\n` +
    `3. ENVIRONMENT: ${weatherPrompt || 'standard conditions'}\n\n` +
    
    `PROGRAM REQUIREMENTS:\n` +
    `${exerciseContext}\n\n` +
    `${injuryModifications}\n\n` +
    `${weatherInstructions}\n\n` +
    `${prescriptionIntegration}\n\n` +
    
    `DAILY STRUCTURE TEMPLATE (JSON):\n` +
    `Each day must contain:\n` +
    `- Description: Physiological focus & ${fitnessLevel}-appropriate adaptations\n` +
    `- Warmup: ${weatherData ? 'Weather-adapted' : ''} activation sequence\n` +
    `- Workout: ${selectedExercises?.length ? 'Using specified exercises' : 'Exercise variation'} with ${fitnessLevel} volume\n` +
    `- Strength: ${prescribedExercises ? 'Incorporate prescribed modifications' : 'Compound movement pattern'}\n` +
    `- Notes: ${injuries ? 'Injury-specific regressions' : 'Recovery strategies'}\n\n` +
    
    `CRITICAL RULES:\n` +
    `1. Apply ${fitnessLevel} parameters to ALL exercise selections\n` +
    `2. Modify EVERY warmup based on ${weatherPrompt ? 'weather data' : 'standard conditions'}\n` +
    `3. Include ${selectedExercises?.length || 'at least 2'} specified exercises in EACH workout\n` +
    `4. Address ${injuries || 'no injuries'} in exercise descriptions AND notes\n` +
    `5. Progressively overload strength components across days\n\n` +
    
    `JSON FORMAT EXAMPLE:\n` +
    `{\n` +
    `  "day1": {\n` +
    `    "description": "[${fitnessLevel}-appropriate] Focus on...",\n` +
    `    "warmup": "${weatherData ? 'Extended' : 'Standard'} activation for...",\n` +
    `    "workout": "3 sets of [${selectedExercises?.[0]?.name || 'exercise'}] with...",\n` +
    `    "strength": "${prescribedExercises || 'Deadlift'} progression...",\n` +
    `    "notes": "${injuries ? 'Modified ROM for' : 'Recovery'}..."\n` +
    `  }\n` +
    `}`;
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
