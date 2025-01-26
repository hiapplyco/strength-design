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
  console.log('Function invoked with method:', req.method);
  
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

    console.log('Parsing request body...');
    const { numberOfDays, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, injuries } = await req.json();
    
    console.log('Request parameters:', {
      numberOfDays,
      hasWeather: !!weatherPrompt,
      exerciseCount: selectedExercises?.length,
      fitnessLevel,
      hasPrescribed: !!prescribedExercises,
      hasInjuries: !!injuries
    });

    if (!numberOfDays || typeof numberOfDays !== 'number') {
      throw new Error('Invalid or missing numberOfDays parameter');
    }

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
      prescribedExercises,
      injuries
    });

    console.log('Sending request to Gemini with numberOfDays:', numberOfDays);
    const result = await model.generateContent(systemPrompt);
    console.log('Received response from Gemini');

    if (!result?.response) {
      console.error('Invalid response from Gemini:', result);
      throw new Error('Invalid response from Gemini');
    }

    const responseText = result.response.text();
    if (!responseText) {
      console.error('No text content in Gemini response');
      throw new Error('No text content in Gemini response');
    }

    console.log('Raw response length:', responseText.length);
    
    const cleanJson = (text: string): string => {
      try {
        let cleaned = text.replace(/```(json)?|```/g, '').trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        
        if (start === -1 || end === -1) {
          console.error('Invalid JSON structure - missing braces');
          throw new Error('Invalid JSON structure');
        }

        cleaned = cleaned.slice(start, end + 1);
        cleaned = cleaned
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
          .replace(/'/g, '"')
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/\\"/g, '"')
          .replace(/"([^"]*)""/g, '"$1"')
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          .replace(/":"/g, '": "')
          .replace(/\s+/g, ' ')
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
          .replace(/\\n/g, '\\n')
          .replace(/\n/g, '\\n');

        JSON.parse(cleaned); // Validate JSON
        console.log('Successfully cleaned and validated JSON');
        return cleaned;
      } catch (error) {
        console.error('Error cleaning JSON:', error);
        console.error('Problematic text:', text);
        throw new Error(`Failed to clean JSON: ${error.message}`);
      }
    };

    console.log('Cleaning and parsing JSON...');
    const cleanedText = cleanJson(responseText);
    const workouts = JSON.parse(cleanedText);
    console.log('Successfully parsed JSON with keys:', Object.keys(workouts));

    // Validate workout structure
    for (let i = 1; i <= numberOfDays; i++) {
      const dayKey = `day${i}`;
      const workout = workouts[dayKey];
      
      if (!workout) {
        throw new Error(`Missing workout for ${dayKey}`);
      }

      const requiredFields = ['description', 'warmup', 'workout', 'strength'];
      for (const field of requiredFields) {
        if (!workout[field] || typeof workout[field] !== 'string') {
          throw new Error(`Invalid or missing ${field} for ${dayKey}`);
        }
      }
    }

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
      status: 400, // Changed from 500 to 400 for client errors
      headers: corsHeaders,
    });
  }
});