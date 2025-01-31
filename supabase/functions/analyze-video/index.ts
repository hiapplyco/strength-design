import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { VertexAI } from "npm:@google-cloud/vertexai"

// Bypass Node.js-specific logging initialization
(globalThis as any).process = {
  env: {
    GOOGLE_SDK_NODE_LOGGING: 'disable',
    NODE_DEBUG: ''
  }
}

console.log("Hello from analyze-video function!");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { videoUrl, movement } = await req.json();

    console.log('Received request with videoUrl and movement:', { videoUrl, movement });

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

    console.log('Initialized Vertex AI client');

    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: "gemini-1.0-pro-vision",
      generation_config: {
        max_output_tokens: 2048,
        temperature: 0.4,
        top_p: 1,
        top_k: 32,
      },
    });

    console.log('Created generative model instance');

    const prompt = `You are a professional fitness trainer and movement analyst. 
    Analyze this video of a ${movement} exercise and provide detailed feedback on:
    1. Form and technique
    2. Common mistakes to watch out for
    3. Specific recommendations for improvement
    4. Safety considerations
    
    Format your response in clear sections with bullet points where appropriate.
    Be specific and actionable in your feedback.`;

    const request = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "video/mp4",
                data: videoUrl,
              },
            },
          ],
        },
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
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});