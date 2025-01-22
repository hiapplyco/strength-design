import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createWorkoutGenerationPrompt, getGeminiConfig } from "../shared/prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Function invoked with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('Missing Gemini API key');
      throw new Error('Missing Gemini API key');
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

    console.log('Sending prompt to Gemini:', systemPrompt);
    
    const timeoutMs = 60000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 60 seconds')), timeoutMs);
    });

    console.log('Starting Gemini request...');
    const generationPromise = model.generateContent(systemPrompt);
    const result = await Promise.race([generationPromise, timeoutPromise]);
    
    console.log('Response received from Gemini:', result?.response ? 'Has response' : 'No response');

    if (!result?.response?.text) {
      console.error('Invalid response from Gemini:', result);
      throw new Error('Invalid response from Gemini');
    }

    const responseText = result.response.text.trim();
    console.log('Raw response length:', responseText.length);
    console.log('First 100 chars of response:', responseText.substring(0, 100));

    try {
      const workouts = JSON.parse(responseText);
      console.log('Successfully parsed workouts object with keys:', Object.keys(workouts));
      return new Response(JSON.stringify(workouts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Problematic JSON text:', responseText);
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate workouts',
      details: error.stack,
      timestamp: new Date().toISOString(),
      type: error.name || 'UnknownError'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});