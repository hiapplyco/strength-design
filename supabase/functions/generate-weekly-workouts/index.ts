
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

    const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`
    
    // Get credentials from environment
    const credentials = JSON.parse(Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS') || '{}')

    // Get access token using service account credentials
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await generateJWT(credentials),
      }),
    })

    const { access_token } = await tokenResponse.json()

    if (!access_token) {
      throw new Error('Failed to get access token')
    }

    const response = await fetch(vertexUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
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

// Helper function to generate JWT for Google OAuth
async function generateJWT(credentials: any) {
  const now = Math.floor(Date.now() / 1000)
  const oneHour = 60 * 60
  
  const jwt = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + oneHour,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  }

  // Use SubtleCrypto for signing
  const encoder = new TextEncoder()
  const header = encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = encoder.encode(JSON.stringify(jwt))
  
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    base64ToArrayBuffer(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    encoder.encode(`${btoa(header)}.${btoa(payload)}`)
  )
  
  return `${btoa(header)}.${btoa(payload)}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`
}

// Helper function to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64.replace(/[-_]/g, m => ({ '-': '+', '_': '/' })[m] ?? m).replace(/[^A-Za-z0-9\+\/]/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
