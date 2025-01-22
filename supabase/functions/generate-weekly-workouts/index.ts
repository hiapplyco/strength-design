import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const {
      prompt,
      numberOfDays = 7,
      weatherPrompt = "",
      selectedExercises = [],
      fitnessLevel = "",
      prescribedExercises = ""
    } = await req.json();
    
    console.log("Received request with:", {
      prompt,
      numberOfDays,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises
    });
    
    if (!prompt) {
      console.error("No prompt provided");
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Initializing Gemini API");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const generationConfig = {
      temperature: 0.9,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
    };

    console.log("Starting chat with Gemini");
    const chat = model.startChat({
      generationConfig,
      history: [],
    });

    const exercisesPrompt = selectedExercises.length > 0 
      ? `Include these exercises in the program: ${selectedExercises.map(e => e.name).join(", ")}. Instructions for reference: ${selectedExercises.map(e => e.instructions[0]).join(" ")}` 
      : "";
    
    const fitnessPrompt = fitnessLevel 
      ? `Consider this fitness profile: ${fitnessLevel}.`
      : "";

    const prescribedPrompt = prescribedExercises
      ? `Please incorporate these prescribed exercises/restrictions: ${prescribedExercises}.`
      : "";

    const expertPrompt = `
As an expert coach with deep expertise in exercise programming and movement optimization, create a ${numberOfDays}-day workout plan based on this context: ${prompt}
${weatherPrompt ? `Weather conditions to consider: ${weatherPrompt}` : ""}
${exercisesPrompt}
${fitnessPrompt}
${prescribedPrompt}

Return ONLY a valid JSON object with no additional text, following this exact format for ${numberOfDays} days:
{
  "[Day Name]": {
    "description": "Brief overview of the day's focus (1-2 sentences)",
    "warmup": "Detailed warmup protocol (2-3 paragraphs)",
    "workout": "Main workout details (2-3 paragraphs)",
    "strength": "Strength work details (1-2 paragraphs)",
    "notes": "Coaching notes and considerations (1-2 paragraphs)"
  }
}`;

    console.log("Sending prompt to Gemini:", expertPrompt);

    let result;
    try {
      result = await Promise.race([
        chat.sendMessage(expertPrompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 25000)
        )
      ]);
      console.log("Received response from Gemini");
    } catch (error) {
      console.error("Error during Gemini API call:", error);
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${error.message}` }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!result) {
      console.error("No response received from Gemini");
      return new Response(
        JSON.stringify({ error: 'No response received from Gemini API' }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      console.error("Failed to parse JSON:", error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate valid workout data',
          details: error.message,
          rawResponse: text 
        }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});