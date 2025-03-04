// supabase/functions/bjj-analyzer/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Separate file for Gemini API
// supabase/functions/bjj-analyzer/gemini-api.ts
import { GoogleGenerativeAI, Part } from 'https://esm.sh/@google/generative-ai'

export async function analyzeVideoWithGemini(videoBlob: Blob, query: string, apiKey: string) {
  try {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Convert video blob to base64
    const arrayBuffer = await videoBlob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const base64String = btoa(String.fromCharCode(...uint8Array))

    // Create parts for the model input
    const textPart: Part = { text: query }
    const filePart: Part = {
      inlineData: {
        data: base64String,
        mimeType: videoBlob.type,
      },
    }

    // Create the analysis prompt
    const analysisPrompt = `You are Professor Garcia, an IBJJF Hall of Fame BJJ coach with extensive competition and teaching experience. Analyze this BJJ video and address: ${query}

    First, determine the practitioner's skill level (beginner, intermediate, advanced, elite) based on movement fluidity, technical precision, and conceptual understanding.

    Structure your analysis as follows:

    ## SKILL ASSESSMENT
    Categorize the practitioner's level with specific observations of their technical execution. Example: "Intermediate: Shows understanding of basic mechanics but struggles with weight distribution during transitions."

    ## KEY STRENGTHS (2-3)
    • Identify technically sound elements with timestamps
    • Explain why these elements demonstrate good Jiu-Jitsu

    ## CRITICAL IMPROVEMENTS (2-3)
    • Pinpoint the highest-leverage technical corrections needed with timestamps
    • Explain the biomechanical principles being violated
    • Note potential consequences in live rolling scenarios

    ## SPECIFIC DRILLS (1-2)
    • Prescribe targeted exercises that address the identified weaknesses
    • Explain the correct feeling/sensation to aim for when practicing

    ## COACHING INSIGHT
    One key conceptual understanding that would elevate their game

    ## STUDENT TAKEAWAY
    A memorable principle they should internalize (think: "Position before submission")

    Use precise BJJ terminology while remaining accessible. Balance encouragement with honest technical assessment. Keep your analysis under 400 words total.`

    // Generate analysis
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: analysisPrompt }, filePart],
        },
      ],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
        topP: 0.95,
      },
    })

    const response = result.response
    return response.text()
  } catch (error) {
    console.error('Error analyzing video with Gemini:', error)
    throw new Error(`Gemini analysis failed: ${error.message}`)
  }
}

// Main edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is required')
    }
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase credentials are required')
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
        // Import the Gemini API functions
        const { analyzeVideoWithGemini } = await import('./gemini-api.ts')
        
        // Analyze the video using Gemini
        const analysis = await analyzeVideoWithGemini(videoFile, query, GOOGLE_API_KEY)
        
        // Option: Save analysis to Supabase for history
        const { data, error } = await supabase
          .from('video_analyses')
          .insert({
            query,
            video_filename: videoFile.name,
            analysis,
            created_at: new Date().toISOString()
          })

        if (error) console.error('Error saving analysis to database:', error)
        
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
