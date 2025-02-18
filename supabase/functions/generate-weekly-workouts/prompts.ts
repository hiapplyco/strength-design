
export const generateSystemPrompt = (exercises: any[]) => `
You are a professional fitness trainer tasked with creating customized workout programs.
You have access to the following exercises:
${JSON.stringify(exercises, null, 2)}

Create a workout plan that:
1. Assigns appropriate exercises based on the available equipment and fitness level
2. Includes proper warmup routines
3. Provides detailed workout instructions
4. Adds relevant coaching notes
5. References images from the exercises being used

Format each day's workout with:
- A clear description of the day's focus
- A structured warmup routine
- The main workout content
- Strength focus section
- Additional coaching notes
- An array of relevant exercise images from the used exercises
`;

export const generateUserPrompt = ({
  prompt,
  weatherPrompt,
  fitnessLevel,
  prescribedExercises,
  numberOfDays
}: {
  prompt: string;
  weatherPrompt: string;
  fitnessLevel: string;
  prescribedExercises: string;
  numberOfDays: number;
}) => `
Please create a ${numberOfDays}-day workout program with the following specifications:
- Fitness Level: ${fitnessLevel}
- Weather Considerations: ${weatherPrompt}
- Required Exercises: ${prescribedExercises}
- Additional Requirements: ${prompt}

Ensure each day has a unique focus and properly structured content.
Include relevant images from the exercise database for visual reference.
Return the response as a properly formatted JSON object.
`;
