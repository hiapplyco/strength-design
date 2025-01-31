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
    const { videoUrl, movement } = await req.json();
    console.log('Received request with videoUrl:', videoUrl, 'and movement:', movement);

    if (!videoUrl || !movement) {
      console.error('Missing required fields');
      throw new Error('Missing required fields: videoUrl and movement are required');
    }

    // Validate URL format
    try {
      new URL(videoUrl);
    } catch (e) {
      console.error('Invalid video URL:', e);
      throw new Error('Invalid video URL format');
    }

    const vertexAI = new VertexAI({
      project: Deno.env.get('GOOGLE_CLOUD_PROJECT') || '',
      location: 'us-central1',
      auth: {
        clientOptions: {
          credentials: JSON.parse(Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS') || '{}')
        }
      }
    });

    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: 'gemini-1.5-flash-002',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 1,
        topP: 0.95,
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

    const text1 = {
      text: `You are strength.analysis - the world's most advanced physical movement analyst. 
      Analyze this ${movement} video and provide expert feedback.
      
      **Analysis Protocol:**`
    };

    const video1 = {
      fileData: {
        mimeType: 'video/mp4',
        fileUri: videoUrl
      }
    };

    const text2 = {
      text: `1. **Movement Architecture**  
        - Phase segmentation with timestamps (MM:SS)  
        - Joint/segment alignment in critical positions  
        - Force distribution patterns (bilateral symmetry, ground contact)  
        - Temporal sequencing (acceleration/deceleration ratios)  
        - Kinetic chain efficiency audit  

      2. **Expert Evaluation**  
        - 3 Biomechanical Advantages ("Optimal patterns observed...")  
        - 3 Priority Corrections ("Essential adjustments for...")  
        - Injury Probability Matrix (Low/Moderate/High + risk factors)  
        - Activity-Specific Efficiency Enhancers  

      3. **Adaptive Prescriptions**  
        - 2-3 Neuro-Muscular Drills (scalable difficulty)  
        - Equipment/Task Constraint Modifications  
        - Load Management Strategy (volume, intensity, frequency)`
    };

    console.log('Sending request to Vertex AI');
    
    const request = {
      contents: [
        {role: 'user', parts: [text1, video1, text2]}
      ],
    };

    // Add timeout for Vertex AI request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const result = await generativeModel.generateContent(request, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const response = result.response;
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
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Analysis request timed out after 30 seconds');
      }
      throw error;
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