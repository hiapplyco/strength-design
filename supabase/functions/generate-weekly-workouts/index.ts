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
    
    console.log('Starting workout generation with params:', {
      hasWeather: !!weatherPrompt,
      exerciseCount: selectedExercises?.length,
      fitnessLevel,
      days: numberOfDays
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const systemPrompt = `Create a ${numberOfDays}-day workout program as a JSON object.
${weatherPrompt ? `Weather conditions: ${weatherPrompt}` : ''}
${selectedExercises?.length ? `Include exercises: ${selectedExercises.map(e => e.name).join(', ')}` : ''}
${fitnessLevel ? `Fitness level: ${fitnessLevel}` : ''}
${prescribedExercises ? `Additional exercises: ${prescribedExercises}` : ''}

Format as JSON with numbered days (day1, day2, etc). Each day must have:
- description: Brief focus description
- warmup: Detailed warmup
- workout: Main workout
- strength: Strength component
- notes: Optional coaching notes

Example format:
{
  "day1": {
    "description": "Focus description",
    "warmup": "Warmup details",
    "workout": "Workout details",
    "strength": "Strength focus",
    "notes": "Optional notes"
  }
}`;

    console.log('Sending prompt to Gemini');
    
    const result = await model.generateContent(systemPrompt);
    console.log('Response received:', result?.response ? 'Has response' : 'No response');

    if (!result?.response?.text) {
      throw new Error('Invalid response from Gemini');
    }

    const responseText = result.response.text.trim();
    console.log('Response length:', responseText.length);

    try {
      // First try direct JSON parse
      const workouts = JSON.parse(responseText);
      return new Response(JSON.stringify(workouts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (directParseError) {
      console.log('Direct JSON parse failed, attempting to extract JSON');
      
      // Try to extract JSON if direct parse fails
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const cleanedJson = jsonMatch[0]
        .replace(/```json\s*|\s*```/g, '')
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
        .replace(/,(\s*[}\]])/g, '$1')
        .trim();

      try {
        const workouts = JSON.parse(cleanedJson);
        return new Response(JSON.stringify(workouts), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (extractedParseError) {
        throw new Error(`Failed to parse JSON: ${extractedParseError.message}`);
      }
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});