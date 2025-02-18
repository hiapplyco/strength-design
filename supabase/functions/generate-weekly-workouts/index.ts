
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { corsHeaders } from "../_shared/cors.ts";

interface WorkoutRequest {
  prompt: string;
  weatherPrompt: string;
  fitnessLevel: string;
  prescribedExercises: string;
  numberOfDays: number;
}

serve(async (req) => {
  console.log("Function invoked with request:", req.method);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error(`HTTP method ${req.method} is not allowed.`);
    }

    const reqBody = await req.json();
    console.log("Request body:", reqBody);

    const { prompt, weatherPrompt, fitnessLevel, prescribedExercises, numberOfDays } = reqBody as WorkoutRequest;

    if (!prompt || !fitnessLevel || !numberOfDays) {
      throw new Error("Missing required fields in request");
    }

    // Initialize Gemini
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro",
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 1,
        maxOutputTokens: 2048,
      },
    });

    // Build the workout prompt
    const workoutPrompt = `
      Create a ${numberOfDays}-day workout plan for a ${fitnessLevel} level athlete.
      ${weatherPrompt ? `Consider the weather conditions: ${weatherPrompt}` : ''}
      ${prescribedExercises ? `Include these exercises: ${prescribedExercises}` : ''}
      Additional requirements: ${prompt}
    `;

    // Add JSON formatting instruction
    const jsonInstruction = `
      Format your response as a JSON object with the following structure for each day:
      {
        "day1": {
          "description": "Brief overview of the day's workout",
          "warmup": "Detailed warmup routine",
          "workout": "Main workout with exercises, sets, and reps",
          "strength": "Strength training component",
          "notes": "Additional coaching notes",
          "exercises": [
            {
              "name": "Exercise Name",
              "sets": "Number of sets",
              "reps": "Number of reps",
              "details": "Additional details"
            }
          ]
        }
      }
    `;

    const finalPrompt = `${workoutPrompt}\n\n${jsonInstruction}`;
    console.log("Sending request to Gemini with prompt:", finalPrompt);

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response as JSON and validate structure
    let workoutData;
    try {
      workoutData = JSON.parse(text);
      console.log("Successfully parsed workout data:", workoutData);
      
      // Ensure each day has the required structure and extract exercises
      Object.keys(workoutData).forEach(day => {
        const dayData = workoutData[day];
        if (!dayData.exercises) {
          dayData.exercises = extractExercises(dayData.workout);
        }
      });
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      throw new Error("Failed to parse workout data: " + error.message);
    }

    return new Response(JSON.stringify(workoutData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-weekly-workouts:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function extractExercises(workoutText: string): Array<{ name: string; sets?: string; reps?: string; details?: string }> {
  if (!workoutText) return [];
  
  const exercises: Array<{ name: string; sets?: string; reps?: string; details?: string }> = [];
  const lines = workoutText.split('\n');
  
  lines.forEach(line => {
    const exerciseMatch = line.match(/([A-Z][a-zA-Z\s-]+)(?:\s*[-:]\s*(\d+)\s*(?:sets?|x)\s*(?:of\s*)?(\d+)|.*)/i);
    if (exerciseMatch) {
      exercises.push({
        name: exerciseMatch[1].trim(),
        sets: exerciseMatch[2] || undefined,
        reps: exerciseMatch[3] || undefined,
        details: line.trim()
      });
    }
  });
  
  return exercises;
}
