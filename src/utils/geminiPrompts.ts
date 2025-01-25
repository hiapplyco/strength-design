interface WorkoutGenerationParams {
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
  const exercisesPrompt = selectedExercises?.length 
    ? `**Specific Exercises:** Include these specific exercises: ${selectedExercises.map(e => e.name).join(", ")}.` 
    : '';
  
  return `As an expert fitness coach, create a ${numberOfDays}-day workout program tailored to the following specifications:

    ${weatherPrompt ? `**Weather Conditions:** ${weatherPrompt}` : ''}
    ${exercisesPrompt}
    ${fitnessLevel ? `**Fitness Level:** This program is for a ${fitnessLevel} level individual.` : ''}
    ${prescribedExercises ? `**Prescribed Exercises/Modifications:** Include these: ${prescribedExercises}.` : ''}
    ${injuries ? `**Health Considerations:** Please consider these conditions: ${injuries}.` : ''}

    For each day, provide a detailed workout program in the following exact JSON format:
    {
      "dayX": {
        "description": "Brief focus description for the day (e.g., strength, endurance, recovery).",
        "warmup": "1. Dynamic stretching\\n2. Mobility work\\n3. Movement prep",
        "workout": "1. Main movement pattern\\n2. Conditioning piece\\n3. Accessory work\\nInclude sets, reps, and rest periods.",
        "strength": "Primary lift focus with sets/reps scheme.",
        "notes": "Scaling options, movement tips, and safety considerations."
      }
    }

    IMPORTANT FORMATTING RULES:
    1. Use line breaks (\\n) to separate movements
    2. Number each movement step
    3. Include specific details for sets, reps, and rest periods
    4. Format as valid JSON without markdown
    5. Ensure proper exercise progression
    6. Include clear movement standards

    Ensure the program is balanced, progressive, and aligned with the individual's fitness level and goals.
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
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});