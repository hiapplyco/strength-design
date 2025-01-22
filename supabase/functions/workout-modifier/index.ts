import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createWorkoutModificationPrompt, getGeminiConfig } from "../../../src/utils/geminiPrompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanJsonText = (text: string): string => {
  return text
    .replace(/```json\s*|\s*```/g, '')           
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')     
    .replace(/,(\s*[}\]])/g, '$1')               
    .replace(/\s+/g, ' ')                        
    .replace(/\\n/g, ' ')                        
    .replace(/\n/g, ' ')                         
    .trim();                                     
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

    const { dayToModify, modificationPrompt, allWorkouts } = await req.json();
    console.log('Received request to modify workout:', { dayToModify, modificationPrompt });

    if (!allWorkouts || !allWorkouts[dayToModify]) {
      throw new Error('No workout data provided for modification');
    }

    const currentWorkout = allWorkouts[dayToModify];
    const prompt = createWorkoutModificationPrompt(dayToModify, modificationPrompt, currentWorkout);

    console.log('Sending prompt to Gemini:', prompt);

    const genAI = new GoogleGenerativeAI(apiKey);
    const config = getGeminiConfig();
    const model = genAI.getGenerativeModel(config);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    if (!result || !result.response) {
      throw new Error('Failed to generate response from Gemini');
    }

    const response = result.response;
    const text = response.text();
    console.log('Received response from Gemini:', text);

    try {
      const cleanedText = cleanJsonText(text);
      console.log('Cleaned response:', cleanedText);
      
      let modifiedWorkout;
      try {
        modifiedWorkout = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Initial JSON parse failed, attempting to fix common issues:', parseError);
        const fixedText = cleanedText
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
          .replace(/'/g, '"')
          .replace(/\\/g, '\\\\');
        modifiedWorkout = JSON.parse(fixedText);
      }

      console.log('Parsed workout:', modifiedWorkout);

      const requiredFields = ['description', 'warmup', 'workout', 'notes', 'strength'];
      const missingFields = requiredFields.filter(field => 
        !modifiedWorkout[field] || typeof modifiedWorkout[field] !== 'string' || !modifiedWorkout[field].trim()
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing or invalid required fields: ${missingFields.join(', ')}`);
      }

      return new Response(JSON.stringify(modifiedWorkout), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new Error(`Invalid JSON structure: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in workout-modifier function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to modify workout'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});