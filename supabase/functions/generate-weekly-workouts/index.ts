
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { generateSystemPrompt, generateUserPrompt } from "./prompts.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch exercises from the database
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .limit(50)

    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError);
      throw new Error(`Error fetching exercises: ${exercisesError.message}`)
    }

    if (!exercises || exercises.length === 0) {
      console.error('No exercises found in database');
      throw new Error('No exercises found in database')
    }

    console.log(`Found ${exercises.length} exercises`);

    // Format exercises for the prompt
    const exercisesList = exercises.map(ex => ({
      name: ex.name,
      type: ex.category,
      equipment: ex.equipment,
      primaryMuscles: ex.primary_muscles,
      level: ex.level
    }))

    const systemPrompt = generateSystemPrompt(exercisesList)
    const userPrompt = generateUserPrompt({
      prompt,
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays
    })

    console.log('Generated prompts:', {
      systemPrompt: systemPrompt.substring(0, 100) + '...',
      userPrompt
    });

    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT')
    const location = 'us-central1'
    const model = 'gemini-pro'
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY environment variable')
    }

    if (!projectId) {
      throw new Error('Missing GOOGLE_CLOUD_PROJECT environment variable')
    }

    const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`

    const response = await fetch(vertexUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            messages: [
              {
                author: 'user',
                content: systemPrompt
              },
              {
                author: 'assistant',
                content: 'I understand. I will create workouts using these exercises.'
              },
              {
                author: 'user',
                content: userPrompt
              }
            ]
          }
        ],
        parameters: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topK: 40,
          topP: 0.95,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Vertex AI error:', errorData);
      throw new Error(`Vertex AI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json()
    console.log('Received Vertex AI response');

    const workoutPlan = data.predictions[0].messages[0].content

    return new Response(JSON.stringify(workoutPlan), {
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
