import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createWorkoutGenerationPrompt, getGeminiConfig } from "../shared/prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  console.log('Function invoked with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('Missing Gemini API key');
      throw new Error('Missing Gemini API key');
    }

    if (req.method !== 'POST') {
      throw new Error(`HTTP method ${req.method} not allowed`);
    }

    console.log('Parsing request body...');
    const { prompt, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, numberOfDays } = await req.json();
    
    console.log('Request parameters:', {
      hasPrompt: !!prompt,
      hasWeather: !!weatherPrompt,
      exerciseCount: selectedExercises?.length,
      fitnessLevel,
      numberOfDays,
      hasPrescribed: !!prescribedExercises
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const config = getGeminiConfig();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: config.generationConfig,
    });

    const systemPrompt = createWorkoutGenerationPrompt({
      numberOfDays,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises
    });

    console.log('Generated system prompt:', systemPrompt);
    
    const result = await model.generateContent(systemPrompt);
    console.log('Response received from Gemini:', result?.response ? 'Has response' : 'No response');

    if (!result?.response) {
      console.error('Invalid response from Gemini:', result);
      throw new Error('Invalid response from Gemini');
    }

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      console.error('No text content in Gemini response');
      throw new Error('No text content in Gemini response');
    }

    console.log('Raw response length:', responseText.length);
    console.log('First 100 chars of response:', responseText.substring(0, 100));

    try {
      console.log('Attempting to parse response as JSON...');
      const workouts = JSON.parse(responseText.trim());
      console.log('Successfully parsed workouts object with keys:', Object.keys(workouts));
      
      // Validate the workout structure
      Object.entries(workouts).forEach(([day, workout]: [string, any]) => {
        console.log(`Validating workout for ${day}:`, workout);
        if (!workout.description || !workout.warmup || !workout.workout || !workout.strength) {
          console.error(`Invalid workout structure for ${day}:`, workout);
          throw new Error(`Invalid workout structure for ${day}. Missing required fields.`);
        }
      });

      return new Response(JSON.stringify(workouts), {
        headers: corsHeaders,
        status: 200,
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Problematic JSON text:', responseText);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse workout data',
        details: parseError.message,
        type: 'ParseError'
      }), {
        headers: corsHeaders,
        status: 400,
      });
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate workouts',
      details: error.stack,
      timestamp: new Date().toISOString(),
      type: error.name || 'UnknownError'
    }), {
      status: error.status || 500,
      headers: corsHeaders,
    });
  }
});