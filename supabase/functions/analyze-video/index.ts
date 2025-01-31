import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Client } from "https://esm.sh/@gradio/client"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Video Analysis Function Started');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing new video analysis request');
    const formData = await req.formData()
    const file = formData.get('video')

    if (!file || !(file instanceof File)) {
      console.error('Invalid file input:', file)
      throw new Error('No video file provided or invalid file type')
    }

    // Add file size check to prevent resource exhaustion
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
    if (file.size > MAX_FILE_SIZE) {
      console.error('File size too large:', file.size)
      throw new Error('File size exceeds 50MB limit')
    }

    console.log('File validation passed:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `${timestamp}-${crypto.randomUUID()}-${file.name}`
    console.log('Generated unique filename:', fileName)

    console.log('Attempting to upload file to storage')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    console.log('File uploaded successfully:', uploadData)

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName)

    console.log('Generated public URL:', publicUrl)

    try {
      // Initialize Gradio client
      console.log('Initializing Gradio client')
      const hfToken = Deno.env.get('HUGGINGFACE_API_KEY')
      if (!hfToken) {
        throw new Error('HUGGINGFACE_API_KEY is not set')
      }

      const client = await Client.connect("hysts/ViTPose-transformers", {
        hf_token: hfToken
      });

      // Convert file to blob for processing
      console.log('Converting file to ArrayBuffer for processing')
      const arrayBuffer = await file.arrayBuffer()
      const videoBlob = new Blob([arrayBuffer], { type: file.type })
      
      console.log('Sending video to HuggingFace API for analysis')
      const result = await Promise.race([
        client.predict("/process_video", {
          video_path: videoBlob
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analysis timeout after 25 seconds')), 25000)
        )
      ]);

      console.log('Raw API response received:', JSON.stringify(result))

      if (!result?.data) {
        throw new Error('No data received from ViTPose API')
      }

      if (!result.data.video) {
        throw new Error('No video data in API response')
      }

      console.log('Analysis complete, result structure:', {
        hasVideo: !!result.data.video,
        hasAnalytics: !!result.data[1],
        responseKeys: Object.keys(result.data)
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          result: {
            processedVideo: result.data.video,
            analytics: result.data[1],
            videoUrl: publicUrl 
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } catch (gradioError) {
      console.error('Error in Gradio processing:', gradioError)
      
      // Clean up the uploaded file on analysis failure
      console.log('Cleaning up uploaded file after analysis failure')
      await supabase.storage
        .from('videos')
        .remove([fileName])
        .then(() => console.log('Cleaned up uploaded file'))
        .catch(err => console.error('Failed to clean up file:', err))

      throw new Error(`Video analysis failed: ${gradioError.message}`)
    }

  } catch (error) {
    console.error('Error in analyze-video function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})