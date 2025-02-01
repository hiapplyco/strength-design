// Initialize process before any imports
(globalThis as any).process = {
  env: {
    GOOGLE_SDK_NODE_LOGGING: 'disable',
    NODE_DEBUG: '',
    GOOGLE_CLOUD_PROJECT: Deno.env.get('GOOGLE_CLOUD_PROJECT'),
    GOOGLE_APPLICATION_CREDENTIALS: Deno.env.get('GOOGLE_CREDENTIALS')
  },
  nextTick: (callback: () => void) => setTimeout(callback, 0),
  version: 'v16.0.0'
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { VertexAI } from "npm:@google-cloud/vertexai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate content type
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const { videoUrl, movement } = await req.json();
    console.log('Received request:', { videoUrl, movement });

    if (!videoUrl || !movement) {
      throw new Error('Missing required fields: videoUrl and movement are required');
    }

    // Validate URL format
    try {
      new URL(videoUrl);
    } catch (e) {
      throw new Error('Invalid video URL format');
    }

    // Debug logging for credentials
    console.log("Project ID:", Deno.env.get("GOOGLE_CLOUD_PROJECT"));
    console.log("Credentials available:", !!Deno.env.get("GOOGLE_CREDENTIALS"));

    // Initialize Vertex AI client
    const vertexAI = new VertexAI({
      project: Deno.env.get('GOOGLE_CLOUD_PROJECT') || '',
      location: 'us-central1',
    });

    console.log('Initialized Vertex AI client');

    // Create generative model instance with updated model and generation configuration
    const model = vertexAI.preview.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 1,
        topP: 0.95,
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
Describe the video first then provide your feedback.
Be specific and actionable in your feedback.`;

    const request = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              fileData: {
                mimeType: "video/webm",  // updated MIME type to match the recorded format
                fileUri: videoUrl
              }
            },
          ],
        },
      ],
    };

    // Set up a timeout for the Vertex AI request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const result = await model.generateContent(request, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response from AI model");
      }

      const analysis = result.response.candidates[0].content.parts[0].text;
      console.log('Successfully received analysis from Vertex AI');

      return new Response(
        JSON.stringify({ 
          success: true, 
          result: analysis 
        }),
        { headers: { ...corsHeaders }, status: 200 }
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
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: corsHeaders,
        status: error.message.includes("timeout") ? 504 : 400
      }
    );
  }
});