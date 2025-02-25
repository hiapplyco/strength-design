
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { dayToModify, modificationPrompt, allWorkouts } = await req.json();

    // Create Gemini API request
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI fitness trainer. Modify the workout for ${dayToModify} based on this request: "${modificationPrompt}". 
                   Here are all the workouts for context: ${JSON.stringify(allWorkouts)}.
                   Return ONLY a JSON object with these exact keys: { warmup: string, workout: string, notes: string, description: string }
                   Make sure the response is valid JSON.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    const data = await response.json();
    console.log('Gemini Response:', data);

    let modifiedWorkout;
    try {
      const textResponse = data.candidates[0].content.parts[0].text;
      // Clean the response to ensure valid JSON
      const cleanedResponse = textResponse.replace(/```json\n?|\n?```/g, '').trim();
      modifiedWorkout = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse workout modification response');
    }

    return new Response(JSON.stringify(modifiedWorkout), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
