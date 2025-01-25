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
    const { prompt, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, numberOfDays, injuries } = await req.json();
    
    console.log('Request parameters:', {
      hasPrompt: !!prompt,
      hasWeather: !!weatherPrompt,
      exerciseCount: selectedExercises?.length,
      fitnessLevel,
      numberOfDays,
      hasPrescribed: !!prescribedExercises,
      hasInjuries: !!injuries
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
      prescribedExercises,
      injuries
    });

    console.log('Sending request to Gemini...');
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
        // Remove markdown code blocks and comments
        let cleaned = text.replace(/```(json)?|```/g, '').trim();
        
        // Find the first { and last } to extract the JSON object
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        
        if (start === -1 || end === -1) {
          console.error('Invalid JSON structure - missing braces');
          throw new Error('Invalid JSON structure');
        }

        cleaned = cleaned.slice(start, end + 1);

        // Fix common JSON formatting issues
        cleaned = cleaned
          // Ensure property names are properly quoted
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
          // Replace single quotes with double quotes
          .replace(/'/g, '"')
          // Remove trailing commas
          .replace(/,(\s*[}\]])/g, '$1')
          // Fix escaped quotes within strings
          .replace(/\\"/g, '"')
          .replace(/"([^"]*)""/g, '"$1"')
          // Remove any invalid control characters
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          // Ensure proper spacing after colons
          .replace(/":"/g, '": "')
          // Fix multiple spaces
          .replace(/\s+/g, ' ');

        // Validate JSON structure
        JSON.parse(cleaned);
        return cleaned;
      } catch (error) {
        console.error('Error cleaning JSON:', error);
        throw new Error(`Failed to clean JSON: ${error.message}`);
      }
    };

    console.log('Cleaning and parsing JSON...');
    const cleanedText = cleanJson(responseText);
    console.log('Cleaned text:', cleanedText);

    try {
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
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Problematic JSON text:', cleanedText);
      
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