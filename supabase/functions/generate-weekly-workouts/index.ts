import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { createWorkoutGenerationPrompt, getGeminiConfig } from "./prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    // Parse request body
    const requestData = await req.json();
    const {
      numberOfDays,
      fitnessLevel,
      prescribedExercises,
      selectedExercises,
      injuries,
      weatherData,
      weatherPrompt,
    } = requestData;

    // Validate required fields
    if (!numberOfDays || !fitnessLevel) {
      throw new Error('Missing required fields');
    }

    console.log('Initializing Gemini');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      ...getGeminiConfig(),
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.9,
        topK: 40,
        topP: 0.8,
      },
    });

    const systemPrompt = createWorkoutGenerationPrompt({
      numberOfDays,
      fitnessLevel,
      prescribedExercises,
      selectedExercises,
      injuries,
      weatherData,
      weatherPrompt,
    });

    console.log('Sending request to Gemini');
    
    // Make up to 3 attempts to get a valid response
    let workouts = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !workouts) {
      attempts++;
      console.log(`Attempt ${attempts} of ${maxAttempts}`);

      try {
        const result = await model.generateContent(systemPrompt);
        
        if (!result?.response) {
          console.log('No response from Gemini, retrying...');
          continue;
        }

        const responseText = result.response.text();
        if (!responseText) {
          console.log('Empty response from Gemini, retrying...');
          continue;
        }

        try {
          // Clean and parse JSON
          const cleanedText = responseText
            .replace(/```json\s*|\s*```/g, '')
            .trim()
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ');

          console.log('Cleaned text:', cleanedText);
          
          const parsedWorkouts = JSON.parse(cleanedText);

          // Validate workout structure
          let isValid = true;
          for (let i = 1; i <= numberOfDays; i++) {
            const dayKey = `day${i}`;
            if (!parsedWorkouts[dayKey] || 
                !parsedWorkouts[dayKey].description ||
                !parsedWorkouts[dayKey].warmup ||
                !parsedWorkouts[dayKey].workout ||
                !parsedWorkouts[dayKey].strength) {
              console.log(`Missing or invalid data for ${dayKey}`);
              isValid = false;
              break;
            }
          }

          if (isValid) {
            workouts = parsedWorkouts;
            break;
          }
        } catch (error) {
          console.error('Error parsing response:', error);
        }
      } catch (error) {
        console.error('Error generating content:', error);
      }
    }

    if (!workouts) {
      throw new Error(`Failed to generate valid workout plan after ${maxAttempts} attempts`);
    }

    console.log(`Generated ${Object.keys(workouts).length} days of workouts`);

    return new Response(
      JSON.stringify(workouts),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});