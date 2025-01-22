import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createWorkoutModificationPrompt, getGeminiConfig } from "../shared/prompts.ts";

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
    console.log('Received request data:', requestData);

    const { dayToModify, modificationPrompt, currentWorkout } = requestData;

    if (!dayToModify || typeof dayToModify !== 'string') {
      throw new Error('Invalid or missing dayToModify');
    }

    if (!modificationPrompt || typeof modificationPrompt !== 'string') {
      throw new Error('Invalid or missing modificationPrompt');
    }

    if (!currentWorkout || typeof currentWorkout !== 'object') {
      throw new Error('No workout data provided for modification');
    }

    if (!currentWorkout.workout || !currentWorkout.warmup) {
      throw new Error('Current workout must contain at least workout and warmup fields');
    }

    const prompt = createWorkoutModificationPrompt(dayToModify, modificationPrompt, currentWorkout);
    console.log('Generated prompt:', prompt);

    const genAI = new GoogleGenerativeAI(apiKey);
    const config = getGeminiConfig();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: config.generationConfig,
    });

    const timeoutMs = 60000; // Increased to 60 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 60 seconds')), timeoutMs);
    });

    const generationPromise = model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    console.log('Starting Gemini request with 60s timeout');
    const result = await Promise.race([generationPromise, timeoutPromise]);
    console.log('Received response from Gemini');

    if (!result || !('response' in result)) {
      throw new Error('Failed to generate response from Gemini');
    }

    const text = result.response.text();
    console.log('Raw Gemini response:', text);

    const cleanedText = text.trim();
    console.log('Cleaned response:', cleanedText);
    
    let modifiedWorkout;
    try {
      modifiedWorkout = JSON.parse(cleanedText);
      console.log('Successfully parsed workout:', modifiedWorkout);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Problematic JSON text:', cleanedText);
      throw new Error(`Invalid JSON structure: ${parseError.message}`);
    }

    return new Response(JSON.stringify(modifiedWorkout), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in workout-modifier:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to modify workout',
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});