import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Client } from "https://esm.sh/@gradio/client"

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
    console.log('Starting video analysis...')
    const formData = await req.formData()
    const file = formData.get('video')

    if (!file || !(file instanceof File)) {
      throw new Error('No video file provided or invalid file type')
    }

    // Add file size check to prevent resource exhaustion
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 50MB limit')
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a unique filename with timestamp to prevent conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `${timestamp}-${crypto.randomUUID()}-${file.name}`
    console.log('Uploading to storage with filename:', fileName)

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

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName)

    console.log('File uploaded successfully. Public URL:', publicUrl)

    try {
      // Initialize Gradio client with timeout
      console.log('Initializing Gradio client...')
      const client = await Client.connect("jschlauch/strength-design", {
        hf_token: Deno.env.get('HUGGINGFACE_API_KEY')
      });

      // Process video in smaller chunks if needed
      console.log('Converting file to ArrayBuffer...')
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      console.log('Sending video to HuggingFace API for analysis...')
      const result = await Promise.race([
        client.predict("/process_video", [uint8Array]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analysis timeout after 25 seconds')), 25000)
        )
      ]);

      if (!result || !result.data) {
        throw new Error('No result returned from Gradio API')
      }

      console.log('Analysis complete, result:', result)

      return new Response(
        JSON.stringify({ 
          success: true, 
          result: result.data,
          videoUrl: publicUrl 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } catch (gradioError) {
      console.error('Error in Gradio processing:', gradioError)
      
      // Clean up the uploaded file on analysis failure
      await supabase.storage
        .from('videos')
        .remove([fileName])
        .then(() => console.log('Cleaned up uploaded file after analysis failure'))
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