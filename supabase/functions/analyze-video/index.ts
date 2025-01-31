import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { VertexAI } from 'npm:@google-cloud/vertexai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

console.log('Video Analysis Function Started');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    console.log('Processing new video analysis request');
    
    const body = await req.json();
    const { video, movement } = body;

    if (!video || !movement) {
      throw new Error('Missing required fields');
    }

    console.log('Received data:', {
      hasVideo: !!video,
      movement,
    });

    try {
      // Remove the data:video/* prefix from base64 string if it exists
      const base64Data = video.includes('base64,') ? video.split('base64,')[1] : video;
      
      console.log('Successfully processed video data');

      // Initialize Vertex AI
      const vertexAI = new VertexAI({
        project: Deno.env.get('GOOGLE_CLOUD_PROJECT'),
        location: 'us-central1',
      });

      const generativeModel = vertexAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
      });

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

      console.log('Sending prompt to Vertex AI');
      
      const request = {
        contents: [{
          role: 'user',
          parts: [
            {
              fileData: {
                mimeType: 'video/mp4',
                data: base64Data
              }
            },
            {
              text: prompt
            }
          ]
        }]
      };

      const result = await generativeModel.generateContent(request);
      const response = await result.response;
      const analysis = response.candidates[0].content.parts[0].text;

      console.log('Received analysis from Vertex AI');

      return new Response(
        JSON.stringify({ 
          success: true, 
          result: {
            analysis,
            videoUrl: video
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          },
          status: 200 
        }
      );

    } catch (vertexError) {
      console.error('Error in Vertex AI processing:', vertexError);
      throw new Error(`Video analysis failed: ${vertexError.message}`);
    }

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 500 
      }
    );
  }
});