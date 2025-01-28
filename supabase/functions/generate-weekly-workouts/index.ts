import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createWorkoutGenerationPrompt, getGeminiConfig } from "../shared/prompts.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  const startTime = performance.now();

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { numberOfDays, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, injuries } = await req.json();
    
    console.log('Request parameters:', {
      numberOfDays,
      hasWeather: !!weatherPrompt,
      exerciseCount: selectedExercises?.length,
      fitnessLevel,
      hasPrescribed: !!prescribedExercises,
      hasInjuries: !!injuries
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        ...getGeminiConfig().generationConfig,
        maxOutputTokens: 8192,
        temperature: 0.9,
        topK: 40,
        topP: 0.8,
      },
    });

    const systemPrompt = createWorkoutGenerationPrompt({
      numberOfDays,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises,
      injuries
    });

    console.log('Sending request to Gemini');
    
    // Make up to 3 attempts to get a valid response
    let workouts = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !workouts) {
      attempts++;
      console.log(`Attempt ${attempts} of ${maxAttempts}`);

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
    }

    if (!workouts) {
      throw new Error(`Failed to generate valid workout plan after ${maxAttempts} attempts`);
    }

    console.log(`Generated ${Object.keys(workouts).length} days of workouts`);

    // Store session data
    const sessionData = {
      weather_data: null,
      weather_prompt: weatherPrompt,
      selected_exercises: selectedExercises,
      fitness_level: fitnessLevel,
      prescribed_exercises: prescribedExercises,
      injuries: injuries,
      number_of_days: numberOfDays,
      generated_workouts: workouts,
      session_duration_ms: Math.round(performance.now() - startTime),
      success: true
    };

    const { error: sessionError } = await supabase
      .from('session_io')
      .insert(sessionData);

    if (sessionError) {
      console.error('Error storing session:', sessionError);
    } else {
      console.log('Successfully stored session data');
    }

    return new Response(JSON.stringify(workouts), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    
    // Store failed session
    if (error instanceof Error) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('session_io').insert({
          session_duration_ms: Math.round(performance.now() - startTime),
          success: false,
          error_message: error.message
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate workouts',
      details: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});