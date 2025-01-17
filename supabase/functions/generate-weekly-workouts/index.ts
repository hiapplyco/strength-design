import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const generateWithGemini = async (prompt: string) => {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    console.log('Starting Gemini generation with prompt:', prompt);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(prompt);
    console.log('Successfully received Gemini response');
    return result.response.text();
  } catch (error) {
    console.error('Error in generateWithGemini:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

serve(async (req) => {
  console.log('Received request:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 204,
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    const { prompt } = await req.json();
    console.log('Received prompt:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid or missing prompt in request body');
    }

    const systemPrompt = `You are a CrossFit coach creating a week of workouts. Create a complete weekly program that includes a brief description, warmup, workout (WOD), and coaching notes for each day. Consider progression, recovery, and variety in the programming.

Additional context from coach: ${prompt}

Important: Return the response as a properly formatted JSON object with the following structure for each day (Sunday through Saturday):
{
  "Sunday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string"
  },
  // ... same structure for Monday through Saturday
}`;

    const textResponse = await generateWithGemini(systemPrompt);
    console.log('Processing Gemini response');

    try {
      // Clean and parse the response
      const cleanedText = textResponse
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\\n/g, ' ')
        .replace(/\n/g, ' ');

      const workouts = JSON.parse(cleanedText);

      // Validate the structure
      const requiredDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const requiredFields = ['description', 'warmup', 'wod', 'notes'];

      const isValid = requiredDays.every(day => 
        workouts[day] && requiredFields.every(field => 
          typeof workouts[day][field] === 'string' && workouts[day][field].length > 0
        )
      );

      if (!isValid) {
        throw new Error('Generated JSON is missing required days or fields');
      }

      return new Response(JSON.stringify(workouts), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      });
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error(`Invalid JSON structure: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate or parse workouts'
      }), {
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});