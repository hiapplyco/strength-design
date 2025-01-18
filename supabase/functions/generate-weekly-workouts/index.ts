import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanText = (text: string): string => {
  return text
    .replace(/[^\w\s.,!?;:()\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(\d+)x/g, '$1 times')
    .replace(/(\d+)m/g, '$1 meters')
    .replace(/(\d+)s/g, '$1 seconds')
    .replace(/(\d+)min/g, '$1 minutes')
    .replace(/@/g, 'at')
    .replace(/%/g, 'percent')
    .replace(/&/g, 'and')
    .replace(/\+/g, 'plus')
    .replace(/=/g, 'equals')
    .trim();
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
    
    // Clean the response text
    return cleanText(result.response.text());
  } catch (error) {
    console.error('Error in generateWithGemini:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

const cleanJsonText = (text: string): string => {
  let cleaned = text.replace(/```json\n?|\n?```/g, '');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/\\n/g, ' ');
  cleaned = cleaned.replace(/\n/g, ' ');
  return cleaned;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    const { prompt } = await req.json();
    console.log('Received prompt:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid or missing prompt in request body');
    }

    const textResponse = await generateWithGemini(prompt);
    console.log('Processing Gemini response');

    try {
      const cleanedText = cleanJsonText(textResponse);
      console.log('Cleaned JSON text:', cleanedText);

      const workouts = JSON.parse(cleanedText);

      const requiredDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const requiredFields = ['description', 'strength', 'warmup', 'wod', 'notes'];

      const isValid = requiredDays.every(day => 
        workouts[day] && requiredFields.every(field => 
          typeof workouts[day][field] === 'string' && workouts[day][field].length > 0
        )
      );

      if (!isValid) {
        console.error('Invalid workout structure:', workouts);
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
      console.error('Raw text response:', textResponse);
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
