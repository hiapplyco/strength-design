
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateRequest, getDefaultPrompt } from "./utils.ts";
import { uploadVideoToGemini, analyzeVideoWithGemini } from "./gemini-api.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { videoUrl, userPrompt } = await req.json();
    
    const validationError = validateRequest(videoUrl);
    if (validationError) {
      throw validationError;
    }

    console.log('Processing video analysis request for URL:', videoUrl);
    console.log('Custom prompt:', userPrompt || 'Using default prompt');

    const apiKey = Deno.env.get('GEMINI_API_KEY')!;

    // First, we need to upload the video to Gemini API
    const uploadResponse = await uploadVideoToGemini(videoUrl, apiKey);
    
    if (!uploadResponse || !uploadResponse.file || !uploadResponse.file.uri) {
      throw new Error('Failed to upload video to Gemini: Invalid response format');
    }

    console.log('Video uploaded successfully to Gemini, URI:', uploadResponse.file.uri);
    console.log('File details:', JSON.stringify(uploadResponse.file));

    // Now we can analyze the video with Gemini
    const prompt = userPrompt || getDefaultPrompt();
    const analysisResponse = await analyzeVideoWithGemini(
      uploadResponse.file.uri, 
      uploadResponse.file.mimeType || "video/mp4",
      prompt,
      apiKey
    );

    console.log('Video analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: analysisResponse,
        videoUri: uploadResponse.file.uri
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in video analysis:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unknown error occurred',
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
