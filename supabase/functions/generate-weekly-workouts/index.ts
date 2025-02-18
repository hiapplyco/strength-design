
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

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
    // Add a basic response first to test if the function is working
    console.log('Function called');
    
    const {
      prompt,
      weatherPrompt,
      fitnessLevel,
      prescribedExercises,
      numberOfDays
    } = await req.json()

    console.log('Received params:', { prompt, weatherPrompt, fitnessLevel, prescribedExercises, numberOfDays });

    // Return a test response
    return new Response(
      JSON.stringify({
        day1: {
          description: "Test workout",
          warmup: "Test warmup",
          workout: "Test workout content",
          strength: "Test strength",
          notes: "Test notes",
          images: []
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Error in function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})
