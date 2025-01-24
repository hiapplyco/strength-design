interface WorkoutGenerationParams {
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

    For each day, provide a detailed workout program in this exact format:
    {
      "day1": {
        "description": "Brief focus description",
        "warmup": "1. Dynamic stretching\n2. Mobility work\n3. Movement prep",
        "workout": "1. Main movement pattern\n2. Conditioning piece\n3. Accessory work\nInclude sets, reps, and rest periods",
        "strength": "Primary lift focus with sets/reps scheme",
        "notes": "Scaling options and movement tips"
      }
    }

    IMPORTANT FORMATTING RULES:
    1. Use line breaks (\n) to separate movements
    2. Number each movement step
    3. Include specific details for sets, reps, and rest periods
    4. Format as valid JSON without markdown
    5. Ensure proper exercise progression
    6. Include clear movement standards

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
  return `As an expert coach with deep expertise in exercise programming and movement optimization, modify this workout based on the following request while maintaining its core purpose and progression:

CURRENT WORKOUT FOR ${dayToModify}:
Warmup: ${currentWorkout.warmup}
Workout: ${currentWorkout.workout}
Notes: ${currentWorkout.notes || 'None provided'}

MODIFICATION REQUEST: ${modificationPrompt}

Consider:
1. Movement pattern integrity
2. Exercise progression/regression needs
3. Equipment modifications
4. Safety and technique priorities
5. Energy system demands
6. Recovery implications

Return ONLY a JSON object with the modified workout in this exact format:
{
    "description": "Brief focus description",
    "warmup": "1. Movement prep\n2. Mobility work\n3. Specific preparation",
    "workout": "1. Main movement\n2. Conditioning\n3. Accessory work\nInclude specific sets/reps/rest",
    "notes": "Coaching cues and scaling options",
    "strength": "Primary movement focus"
}

IMPORTANT:
1. Use line breaks (\n) to separate movements
2. Number each step
3. Include specific details
4. Format as valid JSON without markdown
5. Maintain exercise progression
6. Provide clear standards`;
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

export const validateFileType = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPG or PNG image.');
  }
  return true;
};