import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

const cleanJsonText = (text: string): string => {
  // Remove any markdown code blocks
  let cleaned = text.replace(/```json\n?|\n?```/g, '');
  
  // Remove any comments (both // and /* */ style)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  
  // Remove any trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Remove any whitespace between properties
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Trim any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Replace any escaped newlines with spaces
  cleaned = cleaned.replace(/\\n/g, ' ');
  
  // Remove actual newlines
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

    const systemPrompt = `You are an expert CrossFit coach designing a comprehensive SEVEN-DAY workout program (Sunday through Saturday).

The user will provide you with their fitness goals, preferences, and any limitations. 

IMPORTANT: When writing workouts, spell out all special characters and symbols for text-to-speech compatibility. For example:
- Use "percent" instead of "%"
- Use "at" instead of "@"
- Use "to" instead of "-" when describing ranges
- Spell out any other symbols or special characters

Create a detailed 7-day workout plan following these principles of periodization:

1. Progressive Overload: Gradually increase intensity across the week.
2. Movement Pattern Balance: Include a mix of pushing, pulling, squatting, hinging, and core work each week.
3. Energy System Development: Mix cardio, strength, and skill work throughout the week.
4. Recovery Consideration: Alternate muscle groups and intensity levels to prevent overtraining.
5. Concurrent Periodization: Develop strength, endurance, and skill simultaneously.
6. Emphasis and Compromise: Balance user's specific goals with overall fitness.

User's request: ${prompt}

YOU MUST PROVIDE WORKOUTS FOR ALL SEVEN DAYS OF THE WEEK (Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday).

For each day, you MUST provide ALL of these sections:

1. Description:
    * A brief, motivating overview of the day's primary training goal

2. Strength Focus:
    * Main lift or strength movement
    * Sets, reps, and loading strategy
    * Technical cues and progression options

3. Warmup (10-15 minutes):
    * Movement preparation specific to the day's workout
    * Mobility work for key joints involved
    * Progressive intensity buildup

4. WOD (Workout of the Day):
    * Clear structure (e.g., AMRAP, For Time, EMOM)
    * Specific rep schemes and weights (or scaling options)
    * Work-to-rest ratios
    * Target time domain

5. Coaching Notes:
    * Detailed movement standards
    * Scaling options for different fitness levels
    * Strategy recommendations
    * Safety considerations

IMPORTANT: Return a valid JSON object with EXACTLY this structure for ALL seven days:

{
  "Sunday": {
    "description": "A brief overview focusing on the day's primary training goal",
    "strength": "Detailed strength portion with sets, reps, and loading strategy",
    "warmup": "Detailed 10-15 minute warmup plan with movement prep and mobility",
    "wod": "Structured workout with clear format, rep schemes, and time domains",
    "notes": "Coaching tips including standards, scaling, and safety"
  },
  "Monday": { same structure as Sunday },
  "Tuesday": { same structure as Sunday },
  "Wednesday": { same structure as Sunday },
  "Thursday": { same structure as Sunday },
  "Friday": { same structure as Sunday },
  "Saturday": { same structure as Sunday }
}

DO NOT include any additional text or markdown formatting. ONLY return the JSON object.`;

    const textResponse = await generateWithGemini(systemPrompt);
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