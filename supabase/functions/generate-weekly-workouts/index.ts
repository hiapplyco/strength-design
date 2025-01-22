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
      console.error('Missing Gemini API key');
      throw new Error('Missing Gemini API key');
    }

    const { prompt, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, numberOfDays } = await req.json();
    console.log('Request params:', { weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, numberOfDays });

    if (!numberOfDays || numberOfDays < 1) {
      console.error('Invalid number of days:', numberOfDays);
      throw new Error('Invalid number of days');
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

    if (!result || !result.response) {
      console.error('No response from Gemini');
      throw new Error('Failed to generate response from Gemini');
    }

    const response = result.response;
    const text = response.text();
    console.log('Raw response from Gemini:', text);

    try {
      // Clean the response text
      const cleanedText = text
        .replace(/```json\s*|\s*```/g, '') // Remove JSON code block markers
        .replace(/\n/g, ' ') // Remove newlines
        .trim();

      console.log('Cleaned response:', cleanedText);
      
      // Attempt to parse the JSON
      let workouts;
      try {
        workouts = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Failed to parse text:', cleanedText);
        throw new Error(`Invalid JSON structure: ${parseError.message}`);
      }

      // Validate the workout structure
      if (!workouts || typeof workouts !== 'object') {
        console.error('Invalid workout structure:', workouts);
        throw new Error('Invalid workout structure: not an object');
      }

      // Validate each workout day
      Object.entries(workouts).forEach(([day, workout]: [string, any]) => {
        if (!workout || typeof workout !== 'object') {
          throw new Error(`Invalid workout for ${day}: not an object`);
        }
        
        const requiredFields = ['description', 'warmup', 'workout', 'strength'];
        requiredFields.forEach(field => {
          if (!workout[field] || typeof workout[field] !== 'string') {
            throw new Error(`Missing or invalid ${field} for ${day}`);
          }
        });
      });

      console.log('Successfully validated workouts:', workouts);
      return new Response(JSON.stringify(workouts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (parseError) {
      console.error('Error processing Gemini response:', parseError);
      throw new Error(`Failed to process workout data: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate workouts',
      details: 'An error occurred while generating workouts'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});