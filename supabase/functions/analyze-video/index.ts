// supabase/functions/bjj-analyzer/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

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
    // Get environment variables
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is required')
    }

    // Parse the request data
    const formData = await req.formData()
    const videoFile = formData.get('video') as File
    const query = formData.get('query') as string

    if (!videoFile || !query) {
      return new Response(
        JSON.stringify({ error: 'Video file and query are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Process the video file
    const fileBytes = await videoFile.arrayBuffer()
    const videoData = {
      inlineData: {
        data: Array.from(new Uint8Array(fileBytes)),
        mimeType: videoFile.type,
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
      contents: [{ role: 'user', parts: [{ text: analysisPrompt }, videoData] }],
    })
    
    const response = result.response
    const analysis = response.text()

    // Return the analysis
    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
