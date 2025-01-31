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
      console.error('Missing required fields');
      throw new Error('Missing required fields: video and movement are required');
    }

    try {
      // Extract base64 data
      const base64Data = video.split('base64,')[1] || video;
      console.log('Successfully processed video data');

      // Initialize Vertex AI with project ID from environment
      const vertexAI = new VertexAI({
        project: Deno.env.get('GOOGLE_CLOUD_PROJECT'),
        location: 'us-central1',
      });

      const generativeModel = vertexAI.getGenerativeModel({
        model: 'gemini-1.5-pro-vision',
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.4,
          topP: 0.8,
          topK: 40,
        },
      });

      console.log('Sending request to Vertex AI');
      
      const request = {
        contents: [{
          role: 'user',
          parts: [
            {
              text: prompt
            },
            {
              fileData: {
                mimeType: 'video/mp4',
                data: base64Data
              }
            }
          ]
        }]
      };

      const result = await generativeModel.generateContent(request);
      const response = await result.response;
      const analysis = response.candidates[0].content.parts[0].text;

      console.log('Successfully received analysis from Vertex AI');

      return new Response(
        JSON.stringify({ 
          success: true, 
          result: analysis 
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
        error: error.message || 'An unexpected error occurred'
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