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

    const structuredPrompt = `You are an elite-level coach with over 20 years of experience in strength and conditioning, movement optimization, and athletic development. Your expertise spans across multiple domains including Olympic weightlifting, powerlifting, gymnastics, and endurance training. You have successfully coached athletes from beginners to elite competitors.

Based on your extensive experience, create a comprehensive weekly progression plan for ${prompt}. Your program should reflect your deep understanding of:
- Progressive overload principles
- Movement pattern development
- Energy system optimization
- Recovery and adaptation

For each day, provide:
1. A strategic description of the day's focus and its role in the overall progression
2. A carefully designed warmup that primes the body for the day's specific demands
3. The main workout (WOD) with precise movement standards and loading parameters
4. Expert coaching notes including form cues, scaling options, and strategic advice
5. Strength focus that aligns with the day's objectives

Return the response in this exact JSON format, with no additional text or explanations:

{
  "Sunday": {
    "description": "Active recovery and mobility focus to promote tissue repair and movement quality",
    "warmup": "Detailed mobility routine",
    "wod": "Recovery-focused movement practice",
    "notes": "Specific mobility and recovery guidelines",
    "strength": "Movement quality focus"
  },
  "Monday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  },
  "Tuesday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  },
  "Wednesday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  },
  "Thursday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  },
  "Friday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  },
  "Saturday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  }
}

Ensure each component reflects your expertise in programming, progression, and coaching methodology.`;

    const result = await model.generateContent(structuredPrompt);
    console.log('Successfully received Gemini response');
    return result.response.text();
  } catch (error) {
    console.error('Error in generateWithGemini:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

const cleanJsonText = (text: string): string => {
  // First, try to find JSON object within the text using regex
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in response');
  }
  
  let cleaned = jsonMatch[0];
  // Remove any comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  // Fix trailing commas
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();
  // Remove newlines
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