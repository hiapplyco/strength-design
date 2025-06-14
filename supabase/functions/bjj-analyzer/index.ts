
// Enhanced BJJ Analyzer with Gemini 2.0 and dynamic system prompts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Import enhanced analysis functions
import { analyzeVideoWithGemini, createSystemPrompt } from './gemini-api.ts'

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
      
      // Enhanced options for analysis
      const analysisType = formData.get('analysisType') as string || 'technique'
      const customFrameRate = formData.get('frameRate') ? parseInt(formData.get('frameRate') as string) : undefined
      const startOffset = formData.get('startOffset') as string || undefined
      const endOffset = formData.get('endOffset') as string || undefined
      const useTimestamps = formData.get('useTimestamps') === 'true'
      const customSystemPrompt = formData.get('systemPrompt') as string || undefined

      if (!videoFile || !query) {
        return new Response(
          JSON.stringify({ error: 'Video file and query are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Enhanced video validation for Gemini 2.0
      const validVideoTypes = [
        'video/mp4', 
        'video/quicktime', 
        'video/x-msvideo',
        'video/mpeg',
        'video/mov',
        'video/webm',
        'video/wmv',
        'video/3gpp'
      ]
      
      if (!validVideoTypes.includes(videoFile.type)) {
        return new Response(
          JSON.stringify({ 
            error: 'Unsupported video format. Please use MP4, MOV, AVI, MPEG, WebM, WMV, or 3GPP formats.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Enhanced file size validation
      const MAX_SIZE = 50 * 1024 * 1024 // 50MB for better support
      if (videoFile.size > MAX_SIZE) {
        return new Response(
          JSON.stringify({ 
            error: 'Video file is too large (max 50MB). For larger files, please compress or trim your video.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        console.log(`Processing video: ${videoFile.name}`)
        console.log(`Size: ${(videoFile.size / 1024 / 1024).toFixed(2)}MB, Type: ${videoFile.type}`)
        console.log(`Analysis type: ${analysisType}`)
        
        // Prepare analysis options
        const analysisOptions = {
          customFrameRate,
          startOffset,
          endOffset,
          systemPrompt: customSystemPrompt || createSystemPrompt(analysisType),
          useTimestamps
        }
        
        console.log('Analysis options:', analysisOptions)
        
        // Analyze the video using enhanced Gemini 2.0
        const analysis = await analyzeVideoWithGemini(
          videoFile, 
          query, 
          GOOGLE_API_KEY,
          analysisOptions
        )
        
        // Return enhanced analysis response
        return new Response(
          JSON.stringify({ 
            analysis,
            metadata: {
              analysisType,
              frameRate: customFrameRate,
              videoClipping: startOffset || endOffset ? { startOffset, endOffset } : null,
              timestampsUsed: useTimestamps,
              videoSize: videoFile.size,
              videoType: videoFile.type,
              processingModel: 'gemini-2.0-flash-exp'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Error processing video:', error)
        return new Response(
          JSON.stringify({ 
            error: `Analysis failed: ${error.message}`,
            details: 'Please check your video format and try again. For technical support, ensure your video is under 50MB and in a supported format.'
          }),
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
