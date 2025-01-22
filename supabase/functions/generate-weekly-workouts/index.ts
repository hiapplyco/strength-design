import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge function called with method:", req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body");
    const { prompt, numberOfDays, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises } = await req.json();
    console.log("Request parameters:", { 
      promptLength: prompt?.length,
      numberOfDays,
      hasWeatherPrompt: !!weatherPrompt,
      exercisesCount: selectedExercises?.length,
      hasFitnessLevel: !!fitnessLevel,
      hasPrescribedExercises: !!prescribedExercises
    });
    
    // Check if we have any input parameters to work with
    if (!weatherPrompt && !selectedExercises?.length && !fitnessLevel && !prescribedExercises && !prompt) {
      console.error("No workout parameters provided");
      return new Response(
        JSON.stringify({ error: 'Please provide some workout parameters (exercises, fitness level, or specific requirements)' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log("Initializing Gemini API");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192,
    };

    console.log("Starting chat with Gemini");
    const chat = model.startChat({
      generationConfig,
      history: [],
    });

    // Construct base prompt if no direct prompt is provided
    const basePrompt = prompt || "Create a balanced workout program focusing on strength and conditioning";

    const prompt_template = `As an expert fitness coach, create a ${numberOfDays}-day workout program. ${basePrompt}${weatherPrompt ? ` ${weatherPrompt}` : ""}${selectedExercises?.length ? ` Include these exercises: ${selectedExercises.join(", ")}` : ""}${fitnessLevel ? ` Consider this fitness level: ${fitnessLevel}` : ""}${prescribedExercises ? ` Include these prescribed exercises: ${prescribedExercises}` : ""}

    For each day, provide:
    1. A brief description of the focus and stimulus
    2. A detailed warmup sequence
    3. The main workout with clear standards
    4. A strength component
    5. Coaching notes with form cues

    Return ONLY a JSON object where each key is the day (Day 1, Day 2, etc) and contains:
    {
      "description": "Brief focus description",
      "warmup": "Detailed warmup sequence",
      "workout": "Main workout details",
      "strength": "Strength component",
      "notes": "Coaching notes and cues"
    }`;

    console.log("Sending prompt to Gemini, length:", prompt_template.length);

    let result;
    try {
      result = await Promise.race([
        chat.sendMessage(prompt_template),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 25000)
        )
      ]);
      console.log("Received response from Gemini");
    } catch (error) {
      console.error("Error during Gemini API call:", error);
      return new Response(
        JSON.stringify({ error: `Failed to generate workout: ${error.message}` }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    if (!result) {
      console.error("No response received from Gemini");
      return new Response(
        JSON.stringify({ error: 'No response received from Gemini API' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const text = result.response.text();
    console.log("Raw response from Gemini:", text);
    
    try {
      const workouts = JSON.parse(text);
      console.log("Successfully parsed workouts:", workouts);
      return new Response(
        JSON.stringify(workouts),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse workout data',
          details: error.message,
          rawResponse: text
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
  } catch (error) {
    console.error("Unexpected error in edge function:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error occurred',
        details: error.message 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});