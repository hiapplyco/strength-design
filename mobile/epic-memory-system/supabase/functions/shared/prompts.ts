
export interface WorkoutGenerationParams {
  numberOfDays: number;
  numberOfCycles?: number;
  weatherPrompt?: string;
  selectedExercises?: Array<{ name: string; instructions: string[] }>;
  fitnessLevel: string;
  prescribedExercises?: string;
  injuries?: string;
  chatHistory?: Array<{ role: string; content: string; timestamp: Date }>;
}

export const createWorkoutGenerationPrompt = ({
  numberOfDays,
  numberOfCycles = 1,
  weatherPrompt,
  selectedExercises,
  fitnessLevel,
  prescribedExercises,
  injuries,
  chatHistory = []
}: WorkoutGenerationParams): string => {
  const exerciseList = selectedExercises?.length 
    ? `**Specific Exercises:** Include these exercises across the program: ${selectedExercises.map(e => e.name).join(", ")}.` 
    : '';

  // Format chat history for context
  const chatContext = chatHistory.length > 0 
    ? `**CONVERSATIONAL CONTEXT:**
Based on our previous conversation, here are the key details discussed:
${chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

Please use this conversational context to create a workout that aligns with the preferences, goals, and specific requirements discussed in the chat.

` 
    : '';

  return `As an elite fitness coach, design a ${numberOfCycles}-cycle training program with ${numberOfDays} days per cycle.

    ${chatContext}PROGRAM STRUCTURE:
    - Total Cycles: ${numberOfCycles}
    - Days per Cycle: ${numberOfDays}
    - Total Training Days: ${numberOfCycles * numberOfDays}

    PARAMETERS:
    ${weatherPrompt ? `- Weather Adaptations: ${weatherPrompt}` : ''}
    ${exerciseList ? `- ${exerciseList}` : ''}
    - Fitness Level: ${fitnessLevel}
    ${prescribedExercises ? `- Required Exercises: ${prescribedExercises}` : ''}
    ${injuries ? `- Injury Considerations: ${injuries}` : ''}

    For each cycle and day, provide a detailed workout program in this exact JSON format:
    {
      "cycle1": {
        "day1": {
          "description": "Focus description for this day",
          "warmup": "1. Dynamic stretching\\n2. Mobility work\\n3. Movement prep",
          "workout": "1. Main exercises\\n2. Conditioning\\n3. Accessory work",
          "strength": "Primary strength focus",
          "notes": "Scaling options and safety considerations"
        }
        // ... repeat for each day in the cycle
      }
      // ... repeat for each cycle
    }

    IMPORTANT RULES:
    1. Create progressive overload across cycles
    2. Vary focus areas across days within each cycle
    3. Maintain exercise technique descriptions
    4. Include specific sets, reps, and rest periods
    5. Format as valid JSON without markdown
    6. Use proper exercise progression
    7. Include clear movement standards
    8. Incorporate insights and preferences from the chat conversation

    Return ONLY the JSON object with no additional text or markdown.`;
};

export const getGeminiConfig = () => ({
  model: "gemini-2.5-flashflash",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});
