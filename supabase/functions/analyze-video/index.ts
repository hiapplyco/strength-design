import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Video Analysis Function Started');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing new video analysis request');
    const formData = await req.formData()
    const file = formData.get('video')
    const movement = formData.get('movement')

    if (!file || !(file instanceof File)) {
      console.error('Invalid file input:', file)
      throw new Error('No video file provided or invalid file type')
    }

    if (!movement) {
      throw new Error('No movement type specified')
    }

    console.log('Analyzing movement:', movement);

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
      const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `You are FormCoachAI - the world's most advanced sports movement analyst. Analyze this ${movement} video and provide expert feedback.

      Analysis Protocol:
      1. Movement Breakdown
         - Phase segmentation (setup -> execution -> follow-through)
         - Joint angle analysis in critical positions
         - Weight distribution patterns
         - Timing/rhythm evaluation

      2. Expert Feedback
         - 3 Key Strengths ("What's working well...")
         - 3 Critical Improvements ("Focus on adjusting...")
         - Injury Risk Assessment
         - Sport-Specific Cues

      3. Prescriptive Guidance
         - 2-3 Drills to reinforce proper mechanics
         - Equipment/form adjustments
         - Progressive overload recommendations

      Please provide your analysis in this format:
      [Sport/Discipline]: ${movement}

      **Key Observations**
      - Phase 1 (Setup):
      - Phase 2 (Execution):
      - Phase 3 (Completion):

      **Strength Highlights**
      1.
      2.
      3.

      **Form Optimization**
      ⚠️ Safety Note:
      1. Primary Correction:
      2. Secondary Adjustment:
      3. Efficiency Boost:

      **Recommended Drills**
      1.
      2.`;

      console.log('Sending prompt to Gemini:', prompt);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();

      console.log('Received analysis from Gemini:', analysis);

      return new Response(
        JSON.stringify({ 
          success: true, 
          result: {
            analysis,
            videoUrl: publicUrl 
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (geminiError) {
      console.error('Error in Gemini processing:', geminiError)
      
      // Clean up the uploaded file on analysis failure
      console.log('Cleaning up uploaded file after analysis failure')
      await supabase.storage
        .from('videos')
        .remove([fileName])
        .then(() => console.log('Cleaned up uploaded file'))
        .catch(err => console.error('Failed to clean up file:', err))

      throw new Error(`Video analysis failed: ${geminiError.message}`)
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