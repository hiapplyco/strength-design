
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing')
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is required' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Processing video analysis request...')
    
    // Parse the multipart form data
    const formData = await req.formData()
    const videoFile = formData.get('video') as File
    const query = formData.get('query') as string
    
    // Get optional analysis parameters
    const analysisType = formData.get('analysisType') as string || 'general'
    const frameRate = formData.get('frameRate') as string
    const startOffset = formData.get('startOffset') as string
    const endOffset = formData.get('endOffset') as string
    const useTimestamps = formData.get('useTimestamps') === 'true'
    const customSystemPrompt = formData.get('systemPrompt') as string

    if (!videoFile) {
      console.error('No video file provided')
      return new Response(
        JSON.stringify({ error: 'No video file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!query) {
      console.error('No analysis query provided')
      return new Response(
        JSON.stringify({ error: 'No analysis query provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Video file: ${videoFile.name}, size: ${videoFile.size}, type: ${videoFile.type}`)
    console.log(`Analysis type: ${analysisType}, query: ${query}`)

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Convert video to base64
    const arrayBuffer = await videoFile.arrayBuffer()
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Create analysis prompt based on type
    let systemPrompt = customSystemPrompt || getSystemPrompt(analysisType)
    
    const fullPrompt = `${systemPrompt}

User Question: ${query}

Please provide a detailed analysis of the movement technique shown in this video. Focus on:
1. Technical execution and form
2. Areas for improvement
3. Specific coaching recommendations
4. Safety considerations if applicable

${useTimestamps ? 'Include timestamps in your analysis where relevant.' : ''}
`

    console.log('Sending video to Gemini for analysis...')

    // Generate content with Gemini
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: videoFile.type || 'video/mp4'
        }
      },
      fullPrompt
    ])

    const response = await result.response
    const analysisText = response.text()

    console.log('Analysis completed successfully')

    // Create metadata object
    const metadata = {
      processingModel: 'gemini-2.0-flash',
      analysisType,
      frameRate: frameRate ? parseInt(frameRate) : null,
      videoClipping: {
        startOffset: startOffset || null,
        endOffset: endOffset || null
      },
      timestampsUsed: useTimestamps,
      videoSize: videoFile.size,
      videoType: videoFile.type
    }

    return new Response(
      JSON.stringify({ 
        analysis: analysisText,
        metadata 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error('Error processing video analysis:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze video',
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function getSystemPrompt(analysisType: string): string {
  switch (analysisType) {
    case 'weightlifting':
      return `You are an expert weightlifting coach and biomechanics analyst. Analyze this weightlifting video focusing on:
- Proper form and technique
- Range of motion
- Muscle activation patterns
- Safety considerations
- Progressive overload opportunities`

    case 'martial-arts':
      return `You are an expert martial arts instructor and movement analyst. Analyze this martial arts technique video focusing on:
- Technical execution and precision
- Balance and footwork
- Timing and rhythm
- Power generation and transfer
- Defensive positioning`

    case 'injury-prevention':
      return `You are a sports medicine specialist and movement analyst. Analyze this movement video focusing on:
- Injury risk factors
- Movement compensation patterns
- Joint stability and mobility
- Muscle imbalances
- Corrective exercise recommendations`

    default:
      return `You are an expert movement analyst and coach. Analyze this movement video focusing on:
- Overall technique and form
- Efficiency of movement patterns
- Areas for improvement
- Safety considerations
- Specific coaching recommendations`
  }
}
