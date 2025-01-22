import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { numberOfDays, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises } = await req.json();

    // Validate required fields
    if (!fitnessLevel) {
      return new Response(
        JSON.stringify({ error: 'Please select your fitness level' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!numberOfDays || numberOfDays < 1) {
      return new Response(
        JSON.stringify({ error: 'Please select number of days' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Construct prompt from user inputs
    const prompt = `As an expert fitness coach, create a ${numberOfDays}-day workout program. 
      ${weatherPrompt ? `Consider these weather conditions: ${weatherPrompt}` : ''}
      ${selectedExercises?.length ? `Include these exercises: ${selectedExercises.join(", ")}` : ''}
      ${fitnessLevel ? `This program is for a ${fitnessLevel} level individual` : ''}
      ${prescribedExercises ? `Include these prescribed exercises/modifications: ${prescribedExercises}` : ''}

      For each day, provide:
      1. A brief description of the focus and stimulus
      2. A warmup routine
      3. The main workout
      4. A strength component
      5. Optional notes or modifications

      Format each day as follows:
      {
        "day1": {
          "description": "...",
          "warmup": "...",
          "workout": "...",
          "strength": "...",
          "notes": "..."
        }
      }

      Ensure the response is a valid JSON object.`;

    console.log('Sending prompt to Gemini:', prompt);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response;
    const text = response.text();
    
    console.log('Received response from Gemini:', text);

    try {
      const workouts = JSON.parse(text);
      return new Response(
        JSON.stringify(workouts),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate workout plan' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
  } catch (error) {
    console.error("Error in generate-weekly-workouts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});