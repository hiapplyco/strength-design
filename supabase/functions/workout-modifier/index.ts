import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

    const { dayToModify, modificationPrompt, currentWorkout } = await req.json();
    console.log('Received request to modify workout:', { dayToModify, modificationPrompt });

    const prompt = `
As an expert coach, modify this workout based on the user's request:

Current workout for ${dayToModify}:
Warmup: ${currentWorkout.warmup}
WOD: ${currentWorkout.wod}
Notes: ${currentWorkout.notes || 'None'}

User's modification request: ${modificationPrompt}

Return a JSON object with the modified workout in this exact format:
{
    "description": "Brief workout description",
    "warmup": "Modified warmup plan",
    "wod": "Modified workout details",
    "notes": "Modified coaching notes",
    "strength": "Modified strength focus"
}

Ensure you maintain the core purpose of the workout while adapting it according to the user's needs.`;

    console.log('Sending prompt to Gemini:', prompt);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response;
    const text = response.text();
    console.log('Received response from Gemini:', text);

    try {
      const cleanedText = text
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\\n/g, ' ')
        .replace(/\n/g, ' ');

      console.log('Cleaned response:', cleanedText);
      
      const modifiedWorkout = JSON.parse(cleanedText);
      console.log('Parsed workout:', modifiedWorkout);

      const requiredFields = ['description', 'warmup', 'wod', 'notes', 'strength'];
      const isValid = requiredFields.every(field => 
        typeof modifiedWorkout[field] === 'string' && modifiedWorkout[field].length > 0
      );

      if (!isValid) {
        console.error('Invalid workout structure:', modifiedWorkout);
        throw new Error('Generated JSON is missing required fields');
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