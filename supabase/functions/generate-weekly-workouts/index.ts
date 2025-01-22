import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ChatGPTAPI } from "npm:chatgpt@5.2.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      numberOfDays,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises
    } = await req.json();

    console.log("Received parameters:", {
      numberOfDays,
      hasWeather: !!weatherPrompt,
      hasExercises: !!selectedExercises?.length,
      hasFitnessLevel: !!fitnessLevel,
      hasPrescribedExercises: !!prescribedExercises
    });
    
    // Require at least fitness level and number of days
    if (!fitnessLevel || !numberOfDays) {
      console.error("Missing required parameters");
      return new Response(
        JSON.stringify({ error: 'Please select your fitness level and number of days' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const api = new ChatGPTAPI({
      apiKey: Deno.env.get('OPENAI_API_KEY') || '',
      completionParams: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      debug: true,
    });

    const prompt_template = `As an expert fitness coach, create a ${numberOfDays}-day workout program. ${weatherPrompt ? ` ${weatherPrompt}` : ""}${selectedExercises?.length ? ` Include these exercises: ${selectedExercises.join(", ")}` : ""}${fitnessLevel ? ` Consider this fitness level: ${fitnessLevel}` : ""}${prescribedExercises ? ` Include these prescribed exercises: ${prescribedExercises}` : ""}

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
      },
      // ... repeat for each day
    }

    Ensure the response is a valid JSON object.`;

    console.log("Sending prompt to OpenAI:", prompt_template);

    const response = await api.sendMessage(prompt_template, {
      systemMessage: "You are an expert fitness coach specializing in creating personalized workout programs. You always provide detailed, safe, and effective workouts tailored to the individual's needs and circumstances.",
    });

    console.log("Received response from OpenAI");

    try {
      const workouts = JSON.parse(response.text);
      return new Response(
        JSON.stringify(workouts),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
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
