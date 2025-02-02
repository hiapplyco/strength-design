import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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
    const { workoutPlan, dayToSpeak, warmup, wod, notes } = await req.json()
    
    if (!workoutPlan) {
      throw new Error('Workout plan is required')
    }

    // Create the monologue
    const monologue = `Hey everyone! Let's go through today's workout plan.
    
    For our warmup today, we'll be doing: ${warmup}
    
    Now for the main workout: ${wod}
    
    Some important notes to keep in mind: ${notes}
    
    Remember to focus on form and technique throughout the workout. Stay hydrated and let's crush it!`

    return new Response(
      JSON.stringify({ monologue }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})