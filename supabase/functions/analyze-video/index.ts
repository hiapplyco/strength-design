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
    const formData = await req.formData()
    const file = formData.get('video')
    const spaceName = formData.get('space') || 'hysts/ViTPose-transformers'

    if (!file) {
      throw new Error('No video file provided')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload to storage first
    const fileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, file)

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName)

    // Initialize Gradio client and analyze video
    const client = await Client.connect(spaceName, {
      hf_token: Deno.env.get('HUGGINGFACE_API_KEY')
    });

    console.log('Analyzing video:', publicUrl);
    
    const result = await client.predict("/process_video", { 
      video_path: publicUrl,  // Send the public URL to the video
    });

    console.log('Analysis complete:', result);

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

  } catch (error) {
    console.error('Error in analyze-video function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})