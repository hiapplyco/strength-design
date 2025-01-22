import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }

    const { prompt, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, numberOfDays } = await req.json();

    console.log('Starting workout generation with inputs:', {
      weatherPrompt,
      exercisesCount: selectedExercises?.length,
      fitnessLevel,
      numberOfDays
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const exercisesList = selectedExercises?.map(e => e.name).join(", ") || '';
    
    const systemPrompt = `You are a professional fitness coach creating a ${numberOfDays}-day workout program.
    Weather conditions: ${weatherPrompt || 'Not specified'}
    Exercises to include: ${exercisesList || 'No specific exercises required'}
    Fitness level: ${fitnessLevel || 'Not specified'}
    Additional exercises: ${prescribedExercises || 'None'}

    Create a workout plan with these components for each day:
    1. Brief description
    2. Warmup routine
    3. Main workout
    4. Strength focus
    5. Optional notes

    Respond with ONLY a JSON object in this format:
    {
      "Monday": {
        "description": "Focus of the day",
        "warmup": "Warmup routine",
        "workout": "Main workout",
        "strength": "Strength component",
        "notes": "Optional notes"
      }
    }`;

    console.log('Sending prompt to Gemini');
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
    });

    if (!result?.response?.text) {
      throw new Error('No response from Gemini');
    }

    console.log('Received response from Gemini');

    // Clean up the response text to ensure valid JSON
    const cleanedText = result.response.text
      .replace(/```json\s*|\s*```/g, '')  // Remove markdown code blocks
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')  // Remove comments
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      .trim();

    console.log('Parsing response as JSON');
    
    const workouts = JSON.parse(cleanedText);

    return new Response(JSON.stringify(workouts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});