import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const generateWithGemini = async (prompt: string) => {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    console.log('Starting Gemini generation with prompt:', prompt);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(prompt);
    console.log('Successfully received Gemini response');
    return result.response.text();
  } catch (error) {
    console.error('Error in generateWithGemini:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    const { dayToSpeak, workoutPlan, warmup, wod, notes } = await req.json();
    console.log('Received request for day:', dayToSpeak);

    const systemPrompt = `You are an expert CrossFit coach delivering an engaging and informative monologue about today's workout.

Today is ${dayToSpeak}.

Here is the context of the entire week's workout plan (use this for background information, but only focus on today's workout in your monologue):

${JSON.stringify(workoutPlan, null, 2)}

Today's workout is structured as follows:

Warm Up: ${warmup}

Workout Of the Day (WOD): ${wod}

Coaching Notes: ${notes}

Your task is to create a motivating and descriptive monologue that a coach might deliver to an athlete or a class before starting today's workout.

The monologue should:

1. Acknowledge the day of the week and create excitement for the workout.
2. Describe the Warmup, explaining its purpose and how it prepares the body for the WOD.
3. Explain the WOD (Workout of the Day) in detail, including the movements, rep scheme, and intended stimulus.
4. Provide coaching cues from the Notes section, focusing on proper form, safety, and strategy.
5. Offer scaling options from the Notes for different fitness levels.
6. Deliver the monologue in a natural, conversational tone, as if speaking directly to an athlete or a group.
7. Be enthusiastic and motivating, encouraging athletes to push themselves while staying safe.
8. Keep the monologue concise, aiming for a delivery time of under 2 minutes.

Output the monologue as a single block of text with no additional formatting.`;

    const monologue = await generateWithGemini(systemPrompt);
    console.log('Generated monologue:', monologue);

    return new Response(JSON.stringify({ monologue }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error in generate-workout-monologue:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate workout monologue'
      }), {
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});