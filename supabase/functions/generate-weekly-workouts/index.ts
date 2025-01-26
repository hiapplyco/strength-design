import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createWorkoutGenerationPrompt, getGeminiConfig } from "../shared/prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }

    const { numberOfDays, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, injuries } = await req.json();
    
    console.log('Request parameters:', {
      numberOfDays,
      hasWeather: !!weatherPrompt,
      exerciseCount: selectedExercises?.length,
      fitnessLevel,
      hasPrescribed: !!prescribedExercises,
      hasInjuries: !!injuries
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: getGeminiConfig().generationConfig,
    });

    const systemPrompt = createWorkoutGenerationPrompt({
      numberOfDays,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises,
      injuries
    });

    console.log('Sending request to Gemini');
    const result = await model.generateContent(systemPrompt);
    
    if (!result?.response) {
      throw new Error('Invalid response from Gemini');
    }

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error('No text content in Gemini response');
    }

    // Clean and parse JSON - simplified version
    const cleanedText = responseText
      .replace(/```json\s*|\s*```/g, '')  // Remove markdown
      .trim()
      .replace(/\n/g, ' ')               // Remove newlines
      .replace(/\s+/g, ' ');             // Normalize spaces

    console.log('Cleaned text:', cleanedText);
    
    const workouts = JSON.parse(cleanedText);

    // Validate workout structure
    for (let i = 1; i <= numberOfDays; i++) {
      const dayKey = `day${i}`;
      if (!workouts[dayKey]) {
        throw new Error(`Missing workout for ${dayKey}`);
      }
    }

    console.log(`Generated ${Object.keys(workouts).length} days of workouts`);

    return new Response(JSON.stringify(workouts), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate workouts',
      details: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});