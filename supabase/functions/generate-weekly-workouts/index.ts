import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, userId } = await req.json()
    console.log('Received request with prompt:', prompt)
    console.log('User ID:', userId)
    
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!
    )

    // Call Gemini API to generate workouts
    console.log('Calling Gemini API...')
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();
    console.log('Gemini API response received')
    
    if (!response.ok) {
      console.error('Gemini API error:', data.error)
      throw new Error(data.error?.message || 'Failed to generate workouts');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    const workoutData = JSON.parse(generatedText);
    console.log('Parsed workout data')

    // Delete existing workouts for this user
    console.log('Deleting existing workouts...')
    const { error: deleteError } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting existing workouts:', deleteError)
      throw deleteError;
    }

    // Store the workouts in Supabase
    console.log('Storing new workouts...')
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    for (const day of days) {
      const { error: insertError } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          day: day,
          warmup: workoutData[day].warmup || '',
          wod: workoutData[day].wod || '',
          notes: workoutData[day].notes || ''
        })

      if (insertError) {
        console.error(`Error inserting workout for ${day}:`, insertError)
        throw insertError
      }
    }

    console.log('Successfully stored all workouts')
    return new Response(
      JSON.stringify(workoutData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})