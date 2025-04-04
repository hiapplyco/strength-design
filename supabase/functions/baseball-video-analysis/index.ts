
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }

    const { videoUrl, question } = await req.json();
    
    if (!videoUrl) {
      throw new Error('No video URL provided');
    }

    console.log(`Processing video analysis request for URL: ${videoUrl}`);
    console.log(`Analysis question: ${question}`);

    // Fetch the video file
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText}`);
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBase64 = btoa(String.fromCharCode(...new Uint8Array(videoBuffer)));
    const mimeType = videoResponse.headers.get('content-type') || 'video/mp4';

    console.log(`Video fetched successfully. Size: ${videoBase64.length} bytes, MIME type: ${mimeType}`);

    // Configure Gemini
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create prompt based on the question
    const prompt = `
Analyze the provided baseball video. Focus on the specific question: "${question}"

Based *only* on the visual information in the video, provide a biomechanical assessment.

Return the analysis as a single JSON object containing the following keys:
- "visual_description": (string) A detailed step-by-step description of the baseball motion observed in the video, highlighting key phases and movements.
- "metrics": An object where each key is a metric name (like "Arm Slot", "Hip Rotation", "Stride", "Balance", "Torso Rotation", "Follow Through", "Release Point", "Timing") and the value is another object with:
    - "value_desc": (string) A brief qualitative description of the observed mechanics for this metric.
    - "percentile_est": (integer) Your *estimated* percentile ranking (0-100) compared to a typical athlete for this metric, based *only* on what you see.
    - "trend_est": (string) Your *estimated* trend ("improving", "stable", "declining") if discernible, otherwise "stable".
    - "recommendation": (string) One specific, actionable recommendation related to this metric based on the visual analysis.
    - "status": (string) "Optimal" or "Needs Attention" based on your visual assessment.
- "power_score_est": (integer) Your *estimated* overall Athletic Power Score (0-200) based on the visual analysis.
- "strengths_feedback": (list of strings) 2-3 key strengths observed in the video.
- "weaknesses_feedback": (list of strings) 2-3 key areas for improvement observed.
- "overall_recommendations": (list of strings) 2-3 general training recommendations based on the overall analysis.
- "injury_risk_est": (object) An object with keys representing body parts (like "Shoulder", "Elbow", "Lower Back", "Knee") and values "Low", "Moderate", or "High" representing the *estimated* injury risk based *only* on the observed mechanics.

Ensure your analysis is specifically focused on baseball mechanics and relevant to the question asked.
`;

    console.log("Sending video to Gemini for analysis...");

    // Generate content with the model
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: videoBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      }
    });

    console.log("Received response from Gemini");
    
    const responseText = result.response.text();
    
    // Parse JSON from response text
    // Sometimes Gemini returns markdown-formatted JSON, so we clean it up
    const cleanedJsonText = responseText.replace(/```json\s*|\s*```/g, '').trim();
    
    try {
      const parsedResponse = JSON.parse(cleanedJsonText);
      console.log("Successfully parsed JSON response");
      
      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      console.log("Response text:", cleanedJsonText.substring(0, 200) + "...");
      
      // Attempt to extract JSON using regex as a fallback
      const jsonMatch = cleanedJsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          console.log("Successfully extracted JSON using regex");
          
          return new Response(JSON.stringify(extractedJson), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        } catch (extractError) {
          console.error("Failed to extract JSON using regex:", extractError);
        }
      }
      
      // If all parsing attempts fail, return the raw text
      return new Response(JSON.stringify({ 
        error: "Failed to parse Gemini response as JSON",
        rawResponse: responseText
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
  } catch (error) {
    console.error(`Error in baseball-video-analysis function:`, error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      details: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
