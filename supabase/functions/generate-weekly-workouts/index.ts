
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { generateSystemPrompt, generateUserPrompt } from "./prompts.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      prompt,
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays
    } = await req.json()

    console.log('Received request with params:', {
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .limit(50)

    if (exercisesError) {
      throw new Error(`Error fetching exercises: ${exercisesError.message}`)
    }

    if (!exercises?.length) {
      throw new Error('No exercises found in database')
    }

    console.log(`Found ${exercises.length} exercises`);

    const exercisesList = exercises.map(ex => ({
      name: ex.name,
      type: ex.category,
      equipment: ex.equipment,
      primaryMuscles: ex.primary_muscles,
      level: ex.level,
      images: ex.images || []
    }))

    const systemPrompt = `${generateSystemPrompt(exercisesList)}
    
    Important: You must return a valid JSON object with exactly ${numberOfDays} workout days. Each day should be formatted as:
    {
      "day1": {
        "description": "Focus of the day",
        "warmup": "Detailed warmup routine",
        "workout": "Main workout content",
        "strength": "Strength focus",
        "notes": "Additional coaching notes",
        "images": ["Array of image URLs from the exercises used"]
      },
      ... (continue for all days)
    }
    
    Include images array for each day by selecting relevant images from the exercises being used in that day's workout.`

    const userPrompt = generateUserPrompt({
      prompt,
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays
    })

    console.log('Generated prompts');

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY environment variable')
    }

    const geminiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'

    const response = await fetch(`${geminiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I will create workouts using these exercises and include relevant images.' }]
          },
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topK: 40,
          topP: 0.95,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json()
    console.log('Received Gemini API response');

    let workoutPlan = data.candidates[0].content.parts[0].text;

    // Clean up the response to ensure it's valid JSON
    workoutPlan = workoutPlan.replace(/```json\s*|\s*```/g, '').trim();
    
    // Parse the workout plan to validate it's proper JSON
    const parsedWorkoutPlan = JSON.parse(workoutPlan);
    
    // Validate the number of days matches the request
    const daysInPlan = Object.keys(parsedWorkoutPlan).length;
    if (daysInPlan !== numberOfDays) {
      throw new Error(`Generated plan has ${daysInPlan} days but ${numberOfDays} were requested`);
    }

    return new Response(JSON.stringify(parsedWorkoutPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
