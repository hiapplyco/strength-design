// Initialize process before any imports
(globalThis as any).process = {
  env: {
    GOOGLE_SDK_NODE_LOGGING: 'disable',
    NODE_DEBUG: '',
    // Add other required env vars
    GOOGLE_CLOUD_PROJECT: Deno.env.get('GOOGLE_CLOUD_PROJECT'),
    GOOGLE_APPLICATION_CREDENTIALS: Deno.env.get('GOOGLE_CREDENTIALS')
  },
  // Add minimal process methods that might be called
  nextTick: (callback: () => void) => setTimeout(callback, 0),
  version: 'v16.0.0'
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { VertexAI } from "npm:@google-cloud/vertexai@0.5.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

console.log("Hello from analyze-video function!");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate content type
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      throw new Error("Invalid content type")
    }

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

    // Debug logging for credentials
    console.log("Project ID:", Deno.env.get("GOOGLE_CLOUD_PROJECT"));
    console.log("Google Credentials (first 20 chars):", 
      Deno.env.get("GOOGLE_CREDENTIALS")?.slice(0, 20) + "...");

    const vertexAI = new VertexAI({
      project: Deno.env.get('GOOGLE_CLOUD_PROJECT') || '',
      location: 'us-central1',
      authOptions: {
        credentials: JSON.parse(Deno.env.get('GOOGLE_CREDENTIALS') || '{}'),
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      }
    });

    console.log('Initialized Vertex AI client');

    const model = vertexAI.preview.getGenerativeModel({
      model: "gemini-1.5-flash-002",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
        topP: 1,
        topK: 32,
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
              fileData: {
                mimeType: "video/mp4",
                fileUri: videoUrl
              }
            },
          ],
        },
      ],
    };

    // Add timeout for Vertex AI request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const result = await model.generateContent(request, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      // Validate response structure
      if (!result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response from AI model");
      }

      const analysis = result.response.candidates[0].content.parts[0].text;
      console.log('Successfully received analysis from Vertex AI');

      return new Response(
        JSON.stringify({ 
          success: true, 
          analysis 
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
        throw new Error('Analysis request timed out after 25 seconds');
      }
      throw error;
    }

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message.includes("AbortError") 
          ? "Analysis timed out (25s limit)" 
          : error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: error.message.includes("AbortError") ? 504 : 400
      }
    );
  }
});