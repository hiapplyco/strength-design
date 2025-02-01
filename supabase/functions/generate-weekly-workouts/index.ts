import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { createWorkoutGenerationPrompt, getGeminiConfig } from "./prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestData {
  numberOfDays: number;
  fitnessLevel: string;
  prescribedExercises?: string;
  selectedExercises?: Array<{ name: string; instructions: string[] }>;
  injuries?: string;
  weatherData?: unknown;
  weatherPrompt?: string;
}

/**
 * Attempts to generate valid workout data from Gemini.
 */
const getWorkoutsFromGemini = async (
  model: any,
  systemPrompt: string,
  numberOfDays: number,
  maxAttempts = 3
): Promise<any> => {
  let workouts: any = null;
  let attempts = 0;

  while (attempts < maxAttempts && !workouts) {
    attempts++;
    console.log(`Attempt ${attempts} of ${maxAttempts}`);

    try {
      const result = await model.generateContent(systemPrompt);
      if (!result?.response) {
        console.log("No response from Gemini, retrying...");
        continue;
      }

      const responseText = result.response.text();
      if (!responseText) {
        console.log("Empty response from Gemini, retrying...");
        continue;
      }

      // Clean and parse the JSON response
      const cleanedText = responseText
        .replace(/```json\s*|\s*```/g, "")
        .trim()
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ");
      console.log("Cleaned text:", cleanedText);

      const parsedWorkouts = JSON.parse(cleanedText);

      // Validate workout structure for each day
      let isValid = true;
      for (let i = 1; i <= numberOfDays; i++) {
        const dayKey = `day${i}`;
        if (
          !parsedWorkouts[dayKey] ||
          !parsedWorkouts[dayKey].description ||
          !parsedWorkouts[dayKey].warmup ||
          !parsedWorkouts[dayKey].workout ||
          !parsedWorkouts[dayKey].strength
        ) {
          console.log(`Missing or invalid data for ${dayKey}`);
          isValid = false;
          break;
        }
      }

      if (isValid) {
        workouts = parsedWorkouts;
        break;
      }
    } catch (error) {
      console.error("Error during generation attempt:", error);
    }
  }

  return workouts;
};

const handleRequest = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    // Parse and validate the request body
    const requestData = (await req.json()) as RequestData;
    const { 
      numberOfDays, 
      fitnessLevel, 
      prescribedExercises, 
      selectedExercises, 
      injuries, 
      weatherData, 
      weatherPrompt 
    } = requestData;

    if (!numberOfDays || !fitnessLevel) {
      throw new Error('Missing required fields');
    }

    console.log('Initializing Gemini with configuration');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      ...getGeminiConfig(),
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.9,
        topK: 40,
        topP: 0.8,
      },
    });

    const systemPrompt = createWorkoutGenerationPrompt({
      numberOfDays,
      fitnessLevel,
      prescribedExercises,
      selectedExercises,
      injuries,
      weatherData,
      weatherPrompt,
    });

    console.log('Sending request to Gemini');
    
    // Attempt to generate workouts (with up to 3 attempts)
    const workouts = await getWorkoutsFromGemini(model, systemPrompt, numberOfDays, 3);

    if (!workouts) {
      throw new Error(`Failed to generate valid workout plan after 3 attempts`);
    }

    console.log(`Generated ${Object.keys(workouts).length} days of workouts`);

    return new Response(JSON.stringify(workouts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handleRequest);