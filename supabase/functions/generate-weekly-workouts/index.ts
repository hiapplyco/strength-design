import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createWorkoutGenerationPrompt, getGeminiConfig } from "../shared/prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }

    const requestData = await req.json();
    console.log('Received request with params:', requestData);

    const { prompt, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, numberOfDays } = requestData;

    // Validate required fields
    if (!fitnessLevel || typeof fitnessLevel !== 'string') {
      throw new Error('Invalid or missing fitnessLevel');
    }

    if (!numberOfDays || typeof numberOfDays !== 'number' || numberOfDays < 1 || numberOfDays > 12) {
      throw new Error('Invalid numberOfDays: must be a number between 1 and 12');
    }

    const generationPrompt = createWorkoutGenerationPrompt({
      numberOfDays,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises
    });

    console.log('Generated prompt:', generationPrompt);

    const genAI = new GoogleGenerativeAI(apiKey);
    const config = getGeminiConfig();
    const model = genAI.getGenerativeModel(config);

    console.log('Sending request to Gemini...');
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: generationPrompt }] }],
    });

    console.log('Received result from Gemini:', result);

    if (!result?.response) {
      console.error('No response from Gemini');
      throw new Error('Failed to generate response from Gemini');
    }

    const text = result.response.text();
    console.log('Raw response text:', text);

    if (!text?.trim()) {
      console.error('Empty response from Gemini');
      throw new Error('Empty response from Gemini');
    }

    // Clean and parse the response
    const cleanedText = text
      .replace(/```json\s*|\s*```/g, '')
      .replace(/\n/g, ' ')
      .trim();

    console.log('Cleaned text:', cleanedText);

    let workouts;
    try {
      workouts = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed text:', cleanedText);
      throw new Error(`Invalid JSON structure: ${parseError.message}`);
    }

    if (!workouts || typeof workouts !== 'object') {
      console.error('Invalid workout structure:', workouts);
      throw new Error('Invalid workout data structure');
    }

    // Validate each workout
    Object.entries(workouts).forEach(([day, workout]: [string, any]) => {
      if (!workout || typeof workout !== 'object') {
        console.error(`Invalid workout for ${day}:`, workout);
        throw new Error(`Invalid workout data for ${day}`);
      }

      const requiredFields = ['description', 'warmup', 'workout', 'strength'];
      const missingFields = requiredFields.filter(field => {
        const value = workout[field];
        if (!value || typeof value !== 'string' || !value.trim()) {
          console.error(`Missing or invalid field ${field} for ${day}:`, value);
          return true;
        }
        return false;
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Missing or invalid required fields for ${day}: ${missingFields.join(', ')}`);
      }
    });

    console.log('Successfully validated workouts:', workouts);

    return new Response(JSON.stringify(workouts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-weekly-workouts function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate workouts',
      details: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});