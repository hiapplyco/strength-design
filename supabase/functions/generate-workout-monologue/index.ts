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
      model: "gemini-2.0-flash-exp",
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

    const systemPrompt = `You are an expert CrossFit coach delivering a precisely timed monologue about today's workout.

Today is ${dayToSpeak}.

Here is the context of the entire week's workout plan (use this for background information, but only focus on today's workout in your monologue):

${JSON.stringify(workoutPlan, null, 2)}

Today's workout is structured as follows:

Warm Up: ${warmup}

Workout Of the Day (WOD): ${wod}

Coaching Notes: ${notes}

Your task is to create a motivating and descriptive monologue that a coach might deliver to an athlete or a class before starting today's workout.

IMPORTANT FORMATTING REQUIREMENTS:
1. The monologue MUST be exactly 150 words long. Not more, not less.
2. Structure the monologue in exactly this order with these word counts:
   - Introduction (20 words): Greet athletes and mention the day
   - Warmup Description (35 words): Explain the warmup's purpose and flow
   - WOD Explanation (60 words): Detail the workout, pacing, and intended stimulus
   - Coaching Tips (35 words): Share key movement tips and scaling options

Additional guidelines:
- Use a natural, conversational tone
- Be enthusiastic and motivating
- Focus on proper form and safety
- Keep explanations clear and concise
- Avoid unnecessary repetition
- Maintain consistent energy throughout

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