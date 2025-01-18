import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('Missing Gemini API key');
    }

    const { dayToModify, modificationPrompt, allWorkouts } = await req.json();
    console.log('Received request to modify workout:', { dayToModify, modificationPrompt });

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const currentWorkout = allWorkouts[dayToModify];
    if (!currentWorkout) {
      throw new Error(`No workout found for ${dayToModify}`);
    }

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
    "notes": "Modified coaching notes"
}
`;

    console.log('Sending prompt to Gemini:', prompt);

    const result = await model.generateContent(prompt);
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

      const requiredFields = ['description', 'warmup', 'wod', 'notes'];
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