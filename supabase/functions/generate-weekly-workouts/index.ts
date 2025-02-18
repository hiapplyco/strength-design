
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { corsHeaders } from "../_shared/cors.ts";
import { buildWorkoutPrompt } from "./prompts.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

interface WorkoutRequest {
  prompt: string;
  weatherPrompt: string;
  fitnessLevel: string;
  prescribedExercises: string;
  numberOfDays: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, weatherPrompt, fitnessLevel, prescribedExercises, numberOfDays } = await req.json() as WorkoutRequest;

    // Initialize Gemini
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

    const workoutPrompt = buildWorkoutPrompt({
      prompt,
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays,
    });

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
        },
        // ... repeat for each day
      }
    `;

    const finalPrompt = `${workoutPrompt}\n\n${jsonInstruction}`;
    console.log("Sending request to Gemini...");

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response as JSON and validate structure
    let workoutData;
    try {
      workoutData = JSON.parse(text);
      
      // Ensure each day has the required structure and extract exercises
      Object.keys(workoutData).forEach(day => {
        const dayData = workoutData[day];
        if (!dayData.exercises) {
          dayData.exercises = extractExercises(dayData.workout);
        }
      });
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      throw new Error("Failed to parse workout data");
    }

    return new Response(JSON.stringify(workoutData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating workout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to extract exercises from workout text if not properly formatted
function extractExercises(workoutText: string): Array<{ name: string; sets?: string; reps?: string; details?: string }> {
  const exercises: Array<{ name: string; sets?: string; reps?: string; details?: string }> = [];
  if (!workoutText) return exercises;
  
  const lines = workoutText.split('\n');
  
  lines.forEach(line => {
    // Match common exercise patterns
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
