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

Based on your extensive experience, create a comprehensive weekly progression plan for someone wanting to master ${prompt}. Your program should reflect your deep understanding of skill acquisition and development. Consider:

- The natural progression of movement patterns specific to ${prompt}
- How to build foundational strength and mobility required for ${prompt}
- Energy system development tailored to ${prompt}'s demands
- Recovery needs based on training intensity and volume
- Common technical challenges in ${prompt} and how to address them
- Safety considerations and injury prevention specific to ${prompt}

For each day, provide:
1. A strategic description that explains:
   - The day's specific focus within the weekly progression
   - How this session builds upon previous work
   - What skills or attributes we're developing

2. A carefully designed warmup that:
   - Prepares the body for the specific demands of ${prompt}
   - Includes movement preparation and mobility work
   - Gradually increases intensity
   - Incorporates skill-specific drills

3. The main workout (WOD) with:
   - Clear movement standards and technique cues
   - Specific loading parameters or scaling options
   - Work-to-rest ratios when applicable
   - Target time domains or intensity guidelines
   - Progressive variations based on skill level

4. Expert coaching notes including:
   - Common technical errors to watch for
   - Success metrics for the session
   - Recovery considerations
   - Mental preparation tips
   - How this connects to long-term progression

5. Strength focus that:
   - Complements the skill work
   - Builds specific strength needed for ${prompt}
   - Includes appropriate loading schemes
   - Addresses common weaknesses in ${prompt}

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

Ensure each component reflects your expertise in programming, progression, and coaching methodology. Make the program specific to ${prompt} while maintaining proper training principles.`;

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