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
      throw new Error('Missing required fields');
    }

    console.log('Received data:', {
      hasVideo: !!video,
      movement,
      videoSize: video.length,
    });

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
        model: 'gemini-1.5-pro',
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.8,
          seed: 0,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'OFF',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'OFF',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'OFF',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'OFF',
          }
        ],
      });

      const prompt = `You are FormCoachAI - the world's most advanced sports movement analyst. Analyze this ${movement} video and provide expert feedback.

      Analysis Protocol:
      1. Movement Architecture  
         - Phase segmentation with timestamps (MM:SS)  
         - Joint/segment alignment in critical positions  
         - Force distribution patterns (bilateral symmetry, ground contact)  
         - Temporal sequencing (acceleration/deceleration ratios)  
         - Kinetic chain efficiency audit  

      2. Expert Evaluation  
         - 3 Biomechanical Advantages ("Optimal patterns observed...")  
         - 3 Priority Corrections ("Essential adjustments for...")  
         - Injury Probability Matrix (Low/Moderate/High + risk factors)  
         - Activity-Specific Efficiency Enhancers  

      3. Adaptive Prescriptions  
         - 2-3 Neuro-Muscular Drills (scalable difficulty)  
         - Equipment/Task Constraint Modifications  
         - Load Management Strategy (volume, intensity, frequency)`;

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