
// supabase/functions/bjj-analyzer/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle video analysis with Gemini
import { analyzeVideoWithGemini } from './gemini-api.ts'

// Main edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
    
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is required')
    }

    // Parse the request data
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await req.formData()
      const videoFile = formData.get('video') as File
      const query = formData.get('query') as string

      if (!videoFile || !query) {
        return new Response(
          JSON.stringify({ error: 'Video file and query are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate video file
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
      if (!validVideoTypes.includes(videoFile.type)) {
        return new Response(
          JSON.stringify({ error: 'Only MP4, MOV, and AVI videos are supported' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check file size - Gemini has a 20MB limit
      const MAX_SIZE = 20 * 1024 * 1024 // 20MB
      if (videoFile.size > MAX_SIZE) {
        return new Response(
          JSON.stringify({ error: 'Video file is too large (max 20MB)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        console.log(`Processing video: ${videoFile.name}, size: ${videoFile.size}, type: ${videoFile.type}`)
        
        // Analyze the video using Gemini
        const analysis = await analyzeVideoWithGemini(videoFile, query, GOOGLE_API_KEY)
        
        // Return the analysis
        return new Response(
          JSON.stringify({ analysis }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Error processing video:', error)
        return new Response(
          JSON.stringify({ error: `Failed to analyze video: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid content type. Expected multipart/form-data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
