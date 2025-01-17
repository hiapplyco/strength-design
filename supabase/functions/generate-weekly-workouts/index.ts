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
    const { prompt } = await req.json();
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `You are an experienced CrossFit coach and box owner creating a week of workouts. 
    For each day (Sunday through Saturday), provide a structured workout with these components:
    - Description: A brief overview of the day's focus
    - Warmup: Detailed warmup routine
    - WOD (Workout of the Day): The main workout with specific movements, reps, and scaling options
    - Notes: Additional coaching cues, movement standards, and safety considerations
    
    Consider CrossFit principles of constantly varied, functional movements at high intensity while maintaining proper progression and recovery throughout the week.
    
    Format the response as a JSON object with days as keys, each containing description, warmup, wod, and notes fields.`;

    const fullPrompt = `${systemPrompt}\n\nAdditional context from coach: ${prompt}`;

    console.log('Generating workouts with prompt:', fullPrompt);

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response as JSON
    const workouts = JSON.parse(text);

    console.log('Generated workouts:', workouts);

    return new Response(JSON.stringify(workouts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating workouts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});