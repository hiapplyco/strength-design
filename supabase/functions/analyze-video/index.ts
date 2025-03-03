
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { videoUrl, userPrompt } = await req.json();
    
    if (!videoUrl) {
      throw new Error('No video URL provided');
    }

    console.log('Processing video analysis request for URL:', videoUrl);
    console.log('Custom prompt:', userPrompt || 'Using default prompt');

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    // First, we need to upload the video to Gemini API
    const uploadResponse = await uploadVideoToGemini(videoUrl, apiKey);
    
    if (!uploadResponse || !uploadResponse.file || !uploadResponse.file.uri) {
      throw new Error('Failed to upload video to Gemini');
    }

    console.log('Video uploaded successfully to Gemini, URI:', uploadResponse.file.uri);

    // Now we can analyze the video with Gemini
    const defaultPrompt = `
You are an expert Jiu Jitsu coach with 20+ years of experience analyzing techniques and coaching students of all skill levels. Your task is to review video footage of Jiu Jitsu techniques, infer the practitioner's skill level (beginner, intermediate, advanced, or elite), and provide concise, actionable feedback tailored to their observed understanding.

Structure your analysis as follows:

Skill Assessment: Briefly categorize the practitioner's level based on technical precision, strategic awareness, and adaptability. Example: 'Intermediate: Solid base understanding but inconsistent hip engagement during transitions.'

Key Strengths: Highlight 2-3 technically sound elements (e.g., grip fighting, guard retention, submission setups) with specific timestamps.

Critical Errors: Identify 2-3 highest-impact technical flaws (e.g., posture breakdown, misaligned frames, poor weight distribution) with timestamps. Explain why these errors are problematic using Jiu Jitsu principles.

Recommendations: Provide 1-2 drills/concepts to fix errors (e.g., 'Practice shrimp escapes with focus on hip elevation to address guard recovery timing at 0:45'). Prioritize solutions that offer the fastest improvement.

Coaching Insight: Add 1 strategic tip for coaches (e.g., 'Reinforce cross-collar grip fundamentals before teaching choke chains').

Student Takeaways: Summarize 1 actionable mantra for the practitioner (e.g., 'Protect your neck before bridging').

Tone & Format:
- Use clear, jargon-free language for students but include precise terminology (define if necessary).
- Bullet points with bold headings for skimmability.
- Balance positive reinforcement with direct, solution-oriented critique.
- Target 300 words or less.

Remember: Coaches want efficiency; students need clarity. Prioritize insights that prevent injury, accelerate growth, and align with their current skill trajectory.
`;

    const prompt = userPrompt || defaultPrompt;
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

async function uploadVideoToGemini(videoUrl: string, apiKey: string) {
  try {
    console.log('Downloading video from URL:', videoUrl);
    
    // Download the video from the provided URL
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
    }
    
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
    
    console.log('Video downloaded, size:', videoBuffer.byteLength, 'bytes');
    
    // Prepare for upload to Gemini
    const formData = new FormData();
    formData.append('file', videoBlob, 'video.mp4');

    const uploadHeaders = {
      'X-Goog-Upload-Command': 'start, upload, finalize',
      'X-Goog-Upload-Header-Content-Length': videoBuffer.byteLength.toString(),
      'X-Goog-Upload-Header-Content-Type': 'video/mp4',
      'Content-Type': 'application/json'
    };

    const metadata = {
      file: { display_name: 'jiu_jitsu_analysis.mp4' }
    };

    // Upload to Gemini API
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    const uploadResult = await fetch(uploadUrl, {
      method: 'POST',
      headers: uploadHeaders,
      body: JSON.stringify(metadata) + videoBlob // Append binary data to metadata
    });

    if (!uploadResult.ok) {
      const errorText = await uploadResult.text();
      throw new Error(`Failed to upload video to Gemini: ${uploadResult.status} ${uploadResult.statusText} - ${errorText}`);
    }

    return await uploadResult.json();
  } catch (error) {
    console.error('Error uploading video to Gemini:', error);
    throw error;
  }
}

async function analyzeVideoWithGemini(fileUri: string, mimeType: string, prompt: string, apiKey: string) {
  try {
    console.log('Analyzing video with Gemini, URI:', fileUri);
    
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: fileUri,
                mimeType: mimeType
              }
            }
          ]
        },
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain"
      }
    };

    const analysisUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const analysisResult = await fetch(analysisUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!analysisResult.ok) {
      const errorText = await analysisResult.text();
      throw new Error(`Failed to analyze video with Gemini: ${analysisResult.status} ${analysisResult.statusText} - ${errorText}`);
    }

    const response = await analysisResult.json();
    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error analyzing video with Gemini:', error);
    throw error;
  }
}
