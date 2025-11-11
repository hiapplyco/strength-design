
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    // Support "multipart/form-data" for file uploads
    if (!req.headers.get('content-type')?.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: "Only multipart/form-data supported" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flashflash-exp" });

    // Convert the file to base64
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64String = btoa(String.fromCharCode(...uint8Array));

    // Construct the system prompt for file parsing
    const prompt = `
You are an expert fitness assistant specialized in reading gym notes, workout journals, exercise programs, and handwritten or typed logs. Your job is to extract structured workout configuration from the uploaded file and summarize it for setup.

RESPONSE FORMAT:
{
  "summary": "A plain language summary for the chat",
  "configUpdates": {
    // Fields you recognize: prescribedExercises (user goals/objectives), fitnessLevel, injuries, numberOfDays, numberOfCycles, selectedExercises.
    // EXAMPLES:
    // - If you see fitness goals, add to prescribedExercises.
    // - If the user has listed training cycles/days, provide those.
    // - If you see exercise/equipment names, include for selectedExercises (as comma-separated string).
    // - If you find injuries/limitations, set injuries.
    // Only set what you are confident about.
  }
}
The user uploaded a file. Please:
- Extract workout goals, session breakdowns, routines, exercises, and important notes.
- Summarize and map data to config fields as much as possible, with only the fields you are certain of.

File follows.
`;

    // Prepare Gemini request (file as inlineData)
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: file.type,
              data: base64String
            }
          }
        ]
      }],
      generationConfig: {
        maxOutputTokens: 3072,
        temperature: 0.2
      }
    });

    const responseText = result.response.text();
    let extracted, configUpdates;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      configUpdates = extracted?.configUpdates ?? {};
    } catch (e) {
      extracted = { summary: responseText, configUpdates: {} };
      configUpdates = {};
    }

    return new Response(JSON.stringify({
      ...extracted,
      configUpdates,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-workout-file:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
