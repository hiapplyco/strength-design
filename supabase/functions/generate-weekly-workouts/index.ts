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
    
    const systemPrompt = `As a professional fitness coach, create a ${numberOfDays}-day workout program.
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

    Format the response as a JSON object with numbered days as keys (day1, day2, etc).
    Each day should have these exact fields: description, warmup, workout, strength, notes.
    Keep the response concise and focused on the workout details.`;

    console.log('Sending prompt to Gemini');
    
    const result = await model.generateContent(systemPrompt);
    console.log('Received response from Gemini:', result);

    if (!result?.response?.text) {
      console.error('Invalid response structure:', result);
      throw new Error('Invalid response from Gemini');
    }

    const responseText = result.response.text;
    console.log('Response text type:', typeof responseText);
    console.log('Raw response:', responseText);

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', responseText);
      throw new Error('No valid JSON found in response');
    }

    const cleanedJson = jsonMatch[0]
      .replace(/```json\s*|\s*```/g, '')  // Remove markdown code blocks
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')  // Remove comments
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      .trim();

    console.log('Cleaned JSON:', cleanedJson);
    
    try {
      const workouts = JSON.parse(cleanedJson);
      return new Response(JSON.stringify(workouts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error(`Failed to parse response as JSON: ${parseError.message}`);
    }

  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});