import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { workoutPlan } = await req.json()
    
    if (!workoutPlan) {
      throw new Error('Workout plan is required')
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
    You are a charismatic fitness influencer creating a video script for a workout plan. 
    Convert this workout plan into an engaging, motivational script that feels natural and conversational.
    Include emojis and enthusiasm, but keep it professional.
    Make sure to cover all exercises and important form cues.
    Break down the content into clear sections.
    
    Workout Plan:
    ${workoutPlan}
    `;

    const result = await model.generateContent(prompt);
    const monologue = result.response.text();

    console.log('Generated monologue:', monologue);

    return new Response(
      JSON.stringify({ monologue }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})