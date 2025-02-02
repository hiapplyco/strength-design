import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dayToSpeak, workoutPlan, warmup, wod, notes } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Starting Gemini generation with input:', {
      dayToSpeak,
      workoutPlan: workoutPlan.substring(0, 100) + '...', // Log truncated for brevity
      warmup: warmup?.substring(0, 100) + '...',
      wod: wod?.substring(0, 100) + '...',
      notes: notes?.substring(0, 100) + '...'
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `As a professional fitness coach, create a motivational monologue for ${dayToSpeak}'s workout. Include natural pauses and directorial notes in [brackets]. Format the response with clear sections and pauses for demonstration.

    Workout Components:
    ${warmup ? `Warmup: ${warmup}` : ''}
    ${wod ? `Workout: ${wod}` : ''}
    ${notes ? `Notes: ${notes}` : ''}

    Please structure the monologue with:
    1. Clear introduction
    2. Natural breaks for demonstrations
    3. Motivational cues
    4. Form reminders
    5. Pacing guidance
    
    Use [PAUSE] for demonstration breaks
    Use [DEMO] for exercise demonstrations
    Use [ENERGY SHIFT] for tone changes`;

    console.log('Sending prompt to Gemini');
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response;
    console.log('Successfully received Gemini response');
    
    return new Response(
      JSON.stringify({ monologue: response.text() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-workout-monologue function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Error generating workout monologue'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});