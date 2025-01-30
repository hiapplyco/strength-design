import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Client } from 'https://esm.sh/@gradio/client'

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

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload to storage first
    const fileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`
    console.log('Uploading to storage with filename:', fileName)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName)

    console.log('File uploaded successfully. Public URL:', publicUrl)

    // Initialize Gradio client and analyze video
    const client = await Client.connect("hysts/ViTPose-transformers", {
      hf_token: Deno.env.get('HUGGINGFACE_API_KEY')
    });

    console.log('Sending video to HuggingFace API for analysis...')
    
    const result = await client.predict("/process_video", [
      publicUrl  // Send the public URL to the video
    ]);

    console.log('Analysis complete:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: result,
        videoUrl: publicUrl 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

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