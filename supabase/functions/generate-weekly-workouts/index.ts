import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createWorkoutGenerationPrompt, getGeminiConfig } from "./prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanJsonText = (text: string): string => {
  return text
    .replace(/```json\s*|\s*```/g, '')           
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')     
    .replace(/,(\s*[}\]])/g, '$1')               
    .replace(/\s+/g, ' ')                        
    .replace(/\\n/g, ' ')                        
    .replace(/\n/g, ' ')                         
    .trim();                                     
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

    const requestBody = await req.json();
    console.log('Raw request body:', JSON.stringify(requestBody, null, 2));

    const { numberOfDays, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises } = requestBody;
    console.log('Parsed parameters:', { numberOfDays, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises });

    if (!fitnessLevel) {
      throw new Error('Please select your fitness level');
    }

    if (!numberOfDays || numberOfDays < 1) {
      throw new Error('Please select number of days');
    }

    console.log('Initializing Gemini with API key');
    const genAI = new GoogleGenerativeAI(apiKey);
    const config = getGeminiConfig();
    const model = genAI.getGenerativeModel(config);

    const prompt = createWorkoutGenerationPrompt({
      numberOfDays,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises
    });

    console.log('Sending prompt to Gemini:', prompt);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    console.log('Received response from Gemini:', result);

    if (!result || !result.response) {
      throw new Error('Failed to generate response from Gemini');
    }

    const response = result.response;
    const text = response.text();
    console.log('Raw text from Gemini:', text);

    try {
      const cleanedText = cleanJsonText(text);
      console.log('Cleaned response:', cleanedText);
      
      let workouts;
      try {
        workouts = JSON.parse(cleanedText);
        console.log('Successfully parsed JSON:', workouts);
      } catch (parseError) {
        console.error('Initial JSON parse failed:', parseError);
        console.log('Attempting to fix common JSON issues');
        const fixedText = cleanedText
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
          .replace(/'/g, '"')
          .replace(/\\/g, '\\\\');
        console.log('Fixed text:', fixedText);
        workouts = JSON.parse(fixedText);
        console.log('Successfully parsed fixed JSON:', workouts);
      }

      const requiredFields = ['description', 'warmup', 'workout', 'strength', 'notes'];
      Object.entries(workouts).forEach(([day, workout]: [string, any]) => {
        console.log(`Validating day ${day}:`, workout);
        const missingFields = requiredFields.filter(field => 
          !workout[field] || typeof workout[field] !== 'string' || !workout[field].trim()
        );

        if (missingFields.length > 0) {
          console.error(`Validation failed for day ${day}. Missing fields:`, missingFields);
          throw new Error(`Day ${day} is missing or has invalid required fields: ${missingFields.join(', ')}`);
        }
      });

      console.log('All validation passed, returning workouts');
      return new Response(
        JSON.stringify(workouts),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate workout plan', details: error.message }),
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