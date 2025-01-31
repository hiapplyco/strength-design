import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

    // Add file size check
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

    try {
      // Convert video to base64 more efficiently
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64 in smaller chunks to prevent stack overflow
      const chunkSize = 1024; // Process 1KB at a time
      let base64Data = '';
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64Data += btoa(String.fromCharCode.apply(null, [...chunk]));
      }
      
      console.log('Successfully processed video data');
      
      const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const prompt = `You are FormCoachAI - the world's most advanced sports movement analyst. Analyze this ${movement} video and provide expert feedback.

      Analysis Protocol:
      1. Movement Breakdown
         - Phase segmentation with timestamps (MM:SS format)
         - Joint angle analysis in critical positions
         - Weight distribution patterns
         - Timing/rhythm evaluation
         - Audio analysis for breathing patterns or technique cues (if applicable)

      2. Expert Feedback
         - 3 Key Strengths ("What's working well...")
         - 3 Critical Improvements ("Focus on adjusting...")
         - Injury Risk Assessment
         - Sport-Specific Cues

      3. Prescriptive Guidance
         - 2-3 Drills to reinforce proper mechanics
         - Equipment/form adjustments
         - Progressive overload recommendations`;

      console.log('Sending prompt to Gemini:', prompt);
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        }
      ]);
      const response = await result.response;
      const analysis = response.text();

      console.log('Received analysis from Gemini');

      // Create a data URL for the video
      const dataUrl = `data:${file.type};base64,${base64Data}`;

      return new Response(
        JSON.stringify({ 
          success: true, 
          result: {
            analysis,
            videoUrl: dataUrl
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (geminiError) {
      console.error('Error in Gemini processing:', geminiError)
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