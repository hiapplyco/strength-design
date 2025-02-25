import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Workout plan types and interfaces
interface WorkoutDay {
  title: string;
  focus: string;
  warmup: {
    duration: string;
    exercises: Array<{
      name: string;
      instructions: string;
      duration?: string;
      reps?: number;
    }>;
  };
  mainWorkout: Array<{
    exercise: string;
    sets: number;
    reps: string | number;
    rest: string;
    notes?: string;
    modifications?: {
      beginner?: string;
      advanced?: string;
    };
  }>;
  strengthFocus: {
    area: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string | number;
      rest: string;
    }>;
  };
  cooldown: {
    duration: string;
    exercises: Array<{
      name: string;
      duration: string;
    }>;
  };
  coachingNotes: string;
  nutrition?: {
    hydration: string;
    preWorkout?: string;
    postWorkout?: string;
  };
  recovery?: {
    suggestions: string[];
    estimatedFatigue: string;
  };
}

interface WorkoutPlan {
  metadata: {
    fitnessLevel: string;
    weatherConditions: string;
    durationDays: number;
    targetAreas: string[];
    equipment: string[];
    goals: string[];
  };
  days: Record<string, WorkoutDay>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const { 
      prompt = "",
      weatherPrompt = "Any", 
      fitnessLevel = "Intermediate", 
      prescribedExercises = "",
      numberOfDays = 5,
      goals = "General fitness",
      restrictions = "",
      equipment = "Basic home equipment",
      focusAreas = "",
      intensity = "Moderate",
      duration = "45-60 minutes",
      restDays = true,
      nutritionAdvice = false,
      recoveryGuidance = false
    } = await req.json();

    console.log('Generating workout with params:', { 
      prompt, weatherPrompt, fitnessLevel, prescribedExercises, 
      numberOfDays, goals, restrictions, equipment, 
      focusAreas, intensity, duration 
    });

    // Construct a more detailed prompt
    const fullPrompt = `Generate a comprehensive ${numberOfDays}-day workout plan with the following specifications:

ATHLETE PROFILE:
- Fitness Level: ${fitnessLevel}
- Goals: ${goals}
- Restrictions/Injuries: ${restrictions}
- Prescribed Exercises: ${prescribedExercises}

WORKOUT PARAMETERS:
- Weather Conditions: ${weatherPrompt}
- Available Equipment: ${equipment}
- Focus Areas: ${focusAreas}
- Intensity Level: ${intensity}
- Workout Duration: ${duration}
- Include Rest Days: ${restDays ? "Yes" : "No"}
- Include Nutrition Advice: ${nutritionAdvice ? "Yes" : "No"}
- Include Recovery Guidance: ${recoveryGuidance ? "Yes" : "No"}

Additional Requirements: ${prompt}

For each workout day, provide:
1. A title and brief description of the day's focus
2. A proper warmup routine with specific exercises and durations
3. The main workout with detailed exercises, sets, reps, and rest periods
4. Modifications for beginners and advanced athletes where appropriate
5. A strength focus section targeting specific muscle groups
6. A cooldown routine
7. Coaching notes with form tips and common mistakes to avoid
${nutritionAdvice ? "8. Nutrition recommendations for before and after the workout" : ""}
${recoveryGuidance ? "9. Recovery suggestions and estimated fatigue level" : ""}

${restDays ? "Include appropriate rest days with active recovery options." : ""}

Format the response as a JSON object with the following structure:
{
  "metadata": {
    "fitnessLevel": string,
    "weatherConditions": string,
    "durationDays": number,
    "targetAreas": string[],
    "equipment": string[],
    "goals": string[]
  },
  "days": {
    "day1": {
      "title": string,
      "focus": string,
      "warmup": {
        "duration": string,
        "exercises": [{"name": string, "instructions": string, "duration": string}]
      },
      "mainWorkout": [{"exercise": string, "sets": number, "reps": number or string, "rest": string, "notes": string, "modifications": {"beginner": string, "advanced": string}}],
      "strengthFocus": {
        "area": string,
        "exercises": [{"name": string, "sets": number, "reps": number or string, "rest": string}]
      },
      "cooldown": {
        "duration": string,
        "exercises": [{"name": string, "duration": string}]
      },
      "coachingNotes": string,
      ${nutritionAdvice ? `"nutrition": {"hydration": string, "preWorkout": string, "postWorkout": string},` : ""}
      ${recoveryGuidance ? `"recovery": {"suggestions": string[], "estimatedFatigue": string}` : ""}
    },
    ... (for each day)
  }
}

Ensure the workout plan is scientifically sound, appropriately progressive, and considers all specified parameters.`;

    console.log('Using prompt:', fullPrompt);

    // Generate content with Gemini
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: 8000,
        temperature: 0.7
      }
    });

    const response = result.response;
    console.log('Response received from Gemini');

    // Process and parse the response
    let parsedResponse: WorkoutPlan;
    try {
      // Clean up the response text to ensure it's valid JSON
      const responseText = response.text().replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(responseText);
      
      // Validate the structure matches our expected format
      if (!parsedResponse.metadata || !parsedResponse.days) {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      
      // Attempt to extract any JSON-like structure from the text
      const match = response.text().match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedResponse = JSON.parse(match[0]);
        } catch {
          throw new Error('Failed to parse workout data');
        }
      } else {
        throw new Error('Failed to parse workout data');
      }
    }

    // Return the processed workout plan
    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error generating workout:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: "Failed to generate workout plan. Please try again with different parameters." 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
