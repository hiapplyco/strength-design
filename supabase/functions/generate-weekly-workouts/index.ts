import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getGeminiConfig } from "../shared/prompts.ts";

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
    const config = getGeminiConfig();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: config.generationConfig,
    });

    const systemPrompt = `Create a ${numberOfDays}-day workout program as a JSON object.
${weatherPrompt ? `Weather conditions: ${weatherPrompt}` : ''}
${selectedExercises?.length ? `Include exercises: ${selectedExercises.map(e => e.name).join(', ')}` : ''}
${fitnessLevel ? `Fitness level: ${fitnessLevel}` : ''}
${prescribedExercises ? `Additional exercises: ${prescribedExercises}` : ''}

IMPORTANT: Your response MUST be a valid, parseable JSON object with this exact structure:
{
  "day1": {
    "description": "string - Brief focus description",
    "warmup": "string - Detailed warmup",
    "workout": "string - Main workout",
    "strength": "string - Strength component",
    "notes": "string - Optional coaching notes"
  }
  // ... repeat for each day
}

Do not include any text outside of the JSON object.
Do not include markdown code blocks.
Ensure all string values are properly escaped.
Do not use trailing commas.`;

    console.log('Sending prompt to Gemini');
    
    const result = await model.generateContent(systemPrompt);
    console.log('Response received:', result?.response ? 'Has response' : 'No response');

    if (!result?.response?.text) {
      throw new Error('Invalid response from Gemini');
    }

    const responseText = result.response.text.trim();
    console.log('Raw response length:', responseText.length);
    console.log('Raw Gemini response:', responseText);

    try {
      const workouts = JSON.parse(responseText);
      console.log('Successfully parsed workouts');
      return new Response(JSON.stringify(workouts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (directParseError) {
      console.log('Direct JSON parse failed, attempting to extract JSON');
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No valid JSON found in response');
        throw new Error('No valid JSON found in response');
      }

      const cleanedJson = jsonMatch[0]
        .replace(/```json\s*|\s*```/g, '')
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
        .replace(/,(\s*[}\]])/g, '$1')
        .trim();

      console.log('Cleaned JSON:', cleanedJson);

      try {
        const workouts = JSON.parse(cleanedJson);
        console.log('Successfully parsed cleaned JSON');
        return new Response(JSON.stringify(workouts), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (extractedParseError) {
        console.error('Failed to parse cleaned JSON:', extractedParseError);
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