import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('Missing Gemini API key');
    }

    const { dayToModify, modificationPrompt, allWorkouts } = await req.json();
    console.log('Received request to modify workout:', { dayToModify, modificationPrompt });

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Format the current workout plan for context
    const currentWorkoutPlan = Object.entries(allWorkouts)
      .map(([day, workout]) => `${day}:
Warmup: ${workout.warmup}
WOD: ${workout.wod}
Notes: ${workout.notes || 'None'}`).join('\n\n');

    const currentWorkout = allWorkouts[dayToModify];

    const prompt = `You are an expert CrossFit coach modifying a specific workout based on new user input.

Here is the current 5-day workout plan (context only, do not modify days other than the specified one):

${currentWorkoutPlan}

User's request for modifications to ${dayToModify}'s workout: ${modificationPrompt}

Original workout for ${dayToModify}:
Warmup: ${currentWorkout.warmup}
WOD: ${currentWorkout.wod}
Notes: ${currentWorkout.notes || 'None'}

Modify the workout for ${dayToModify}, taking into account the user's request and the principles of periodization (progressive overload, movement pattern balance, energy system development, recovery).

Provide a new workout for ${dayToModify} with the following:

1. Description (1-2 sentences):
    * A brief, engaging summary of the workout's focus and intensity level.
    * Example: "High-intensity cardio session focusing on explosive movements and endurance."

2. Warmup (10-15 minutes):
    * Movement preparation specific to the day's workout.
    * Mobility work for key joints involved.
    * Progressive intensity buildup.

3. WOD (Workout of the Day):
    * Clear structure (e.g., AMRAP, For Time, EMOM).
    * Specific rep schemes and weights (or scaling options).
    * Work-to-rest ratios.
    * Target time domain.

4. Coaching Notes:
    * Detailed movement standards.
    * Scaling options for different fitness levels.
    * Strategy recommendations.
    * Safety considerations.

Return a JSON object in the following format:

{
    "day": "${dayToModify}",
    "description": "Brief workout description",
    "warmup": "Detailed modified warmup plan",
    "wod": "Detailed modified workout details",
    "notes": "Detailed modified coaching notes"
}

Ensure all text is clear, concise, and free of markdown formatting. Provide only the JSON output.`;

    console.log('Sending prompt to Gemini:', prompt);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log('Received response from Gemini:', text);

    try {
      // Clean the response text
      const cleanedText = text
        .replace(/```json\n?|\n?```/g, '')  // Remove markdown code blocks
        .replace(/^\s+|\s+$/g, '')          // Remove leading/trailing whitespace
        .replace(/\\n/g, ' ')               // Replace escaped newlines
        .replace(/\n/g, ' ');               // Replace actual newlines

      const modifiedWorkout = JSON.parse(cleanedText);

      // Validate the structure
      const requiredFields = ['day', 'description', 'warmup', 'wod', 'notes'];
      const isValid = requiredFields.every(field => 
        typeof modifiedWorkout[field] === 'string' && modifiedWorkout[field].length > 0
      );

      if (!isValid) {
        console.error('Invalid workout structure:', modifiedWorkout);
        throw new Error('Generated JSON is missing required fields');
      }

      // Extract just the fields we need
      const response = {
        description: modifiedWorkout.description,
        warmup: modifiedWorkout.warmup,
        wod: modifiedWorkout.wod,
        notes: modifiedWorkout.notes
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new Error(`Invalid JSON structure: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in workout-modifier function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate or parse workouts'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});