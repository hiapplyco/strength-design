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

    const { day, modificationPrompt, currentWorkout } = await req.json();
    console.log('Received modification request:', { day, modificationPrompt, currentWorkout });

    const prompt = createWorkoutModificationPrompt(day, modificationPrompt, currentWorkout);
    console.log('Generated prompt:', prompt);

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
      const cleanedText = text
        .replace(/```json\s*|\s*```/g, '')
        .replace(/\n/g, ' ')
        .trim();

      console.log('Cleaned response:', cleanedText);
      
      const modifiedWorkout = JSON.parse(cleanedText);
      console.log('Parsed modified workout:', modifiedWorkout);

      return new Response(JSON.stringify(modifiedWorkout), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new Error(`Invalid JSON structure: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in workout-modifier function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to modify workout',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});