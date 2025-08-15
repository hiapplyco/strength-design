
interface WorkoutGenerationParams {
  numberOfCycles: number;
  numberOfDays: number;
  weatherPrompt?: string;
  selectedExercises?: Array<{ name: string; instructions: string[] }>;
  fitnessLevel: string;
  prescribedExercises?: string;
  injuries?: string;
}

export const createWorkoutGenerationPrompt = ({
  numberOfCycles,
  numberOfDays,
  weatherPrompt,
  selectedExercises,
  fitnessLevel,
  prescribedExercises,
  injuries
}: WorkoutGenerationParams): string => {
  const exercisesPrompt = selectedExercises?.length 
    ? `**Specific Exercises:** Include these exercises across the program: ${selectedExercises.map(e => e.name).join(", ")}.` 
    : '';

  return `As an elite fitness coach, design a ${numberOfCycles}-cycle training program with ${numberOfDays} days per cycle.

    PROGRAM STRUCTURE:
    - Total Cycles: ${numberOfCycles}
    - Days per Cycle: ${numberOfDays}
    - Total Training Days: ${numberOfCycles * numberOfDays}

    PARAMETERS:
    ${weatherPrompt ? `- Weather Adaptations: ${weatherPrompt}` : ''}
    ${exercisesPrompt}
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

    Return ONLY the JSON object with no additional text or markdown.`;
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
  return `As an expert fitness coach with deep expertise in exercise programming and movement optimization, modify the following workout based on the provided request while maintaining its core purpose and progression:

    **CURRENT WORKOUT FOR ${dayToModify}:**
    - Warmup: ${currentWorkout.warmup}
    - Workout: ${currentWorkout.workout}
    - Notes: ${currentWorkout.notes || 'None provided'}

    **MODIFICATION REQUEST:** ${modificationPrompt}

    Consider the following factors when making modifications:
    1. **Movement Pattern Integrity:** Ensure the modifications align with the original movement patterns.
    2. **Exercise Progression/Regression:** Adjust exercises to match the individual's fitness level or goals.
    3. **Equipment Modifications:** Account for available equipment or lack thereof.
    4. **Safety and Technique:** Prioritize safe movement execution and proper technique.
    5. **Energy System Demands:** Maintain the intended energy system focus (e.g., aerobic, anaerobic).
    6. **Recovery Implications:** Ensure the modifications do not overstress the individual or hinder recovery.

    Return ONLY a JSON object with the modified workout in this exact format:
    {
        "description": "Brief focus description",
        "warmup": "1. Movement prep\\n2. Mobility work\\n3. Specific preparation",
        "workout": "1. Main movement\\n2. Conditioning\\n3. Accessory work\\nInclude specific sets/reps/rest",
        "notes": "Coaching cues and scaling options",
        "strength": "Primary movement focus"
    }

    IMPORTANT:
    1. Use line breaks (\\n) to separate movements
    2. Number each step
    3. Include specific details
    4. Format as valid JSON without markdown
    5. Maintain exercise progression
    6. Provide clear standards`;
};

export const validateFileType = (file: File) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a PDF or image file (JPG, PNG, HEIC).');
  }
  return true;
};

export const getGeminiConfig = () => ({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});
