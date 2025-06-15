
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create authenticated Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { videoUrl, question } = await req.json()

    // Input validation
    if (!videoUrl || typeof videoUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid video URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!question || typeof question !== 'string' || question.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Valid question (max 1000 characters) is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sanitize inputs
    const sanitizedQuestion = question.trim().substring(0, 1000)
    
    console.log('Processing form video analysis for user:', user.id)
    console.log('Video URL:', videoUrl)
    console.log('Question:', sanitizedQuestion)

    // TODO: Implement actual video analysis logic here
    // For now, return a placeholder response
    const analysis = `This is a placeholder analysis for your question: "${sanitizedQuestion}". In a real scenario, this would contain a detailed breakdown of your form, including comments on posture, movement patterns, and efficiency.`;
    const strengths = ["Good starting position", "Consistent speed during the lift"];
    const areas_for_improvement = ["Slight rounding of the lower back at the bottom of the movement", "Knees collapsing inward during ascent"];
    const recommendations = ["Engage your core more actively throughout the movement.", "Focus on driving your knees out.", "Consider reducing weight to focus on form."];


    return new Response(
      JSON.stringify({ 
        analysis,
        strengths,
        areas_for_improvement,
        recommendations,
        videoUrl,
        question: sanitizedQuestion,
        userId: user.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Form video analysis error:', error)
    
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

