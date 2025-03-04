
// supabase/functions/analyze-video/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { uploadVideoToGemini, analyzeVideoWithGemini } from './gemini-api.ts'
import { corsHeaders, validateRequest, getDefaultPrompt } from './utils.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request data
    const requestData = await req.json()
    const { videoUrl, userPrompt } = requestData

    // Validate the request
    const validationError = validateRequest(videoUrl)
    if (validationError) {
      throw validationError
    }

    // Get API key from environment variables
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required')
    }

    console.log('Starting video analysis for URL:', videoUrl)
    
    // Upload video to Gemini
    const uploadResponse = await uploadVideoToGemini(videoUrl, apiKey)
    
    if (!uploadResponse || !uploadResponse.file || !uploadResponse.file.uri) {
      throw new Error('Failed to get valid upload response from Gemini API')
    }
    
    // Generate the analysis prompt
    const promptTemplate = getDefaultPrompt()
    const fullPrompt = userPrompt 
      ? `${promptTemplate}\n\nUser has specifically requested: ${userPrompt}` 
      : promptTemplate
    
    console.log('Video uploaded successfully, proceeding with analysis')
    
    // Analyze the video
    const analysisResult = await analyzeVideoWithGemini(
      uploadResponse.file.uri,
      uploadResponse.file.mimeType || 'video/mp4',
      fullPrompt,
      apiKey
    )
    
    console.log('Analysis complete, returning results')
    
    // Return the analysis result
    return new Response(
      JSON.stringify({ analysis: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error processing request:', error)
    // Return a detailed error response
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
