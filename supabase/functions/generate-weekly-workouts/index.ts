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

  console.log('Starting Gemini generation with prompt length:', prompt.length);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      temperature: 0.7, // Reduced from 0.9 for faster, more focused responses
      topP: 0.8, // Reduced from 0.95 for more focused token selection
      topK: 20, // Reduced from 40 for faster processing
      maxOutputTokens: 4096, // Reduced from 8192 to optimize response time
    },
  });

  try {
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API timeout')), 15000)
      ),
    ]);

    if (result instanceof Error) throw result;
    console.log('Successfully received Gemini response');
    return result.response.text();
  } catch (error) {
    console.error('Error in generateWithGemini:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

// Simplified prompt to reduce token count while maintaining quality
const createExpertCoachPrompt = (expertise: string) => `
As an expert coach, create a focused weekly workout plan based on ${expertise}. Include:

1. Daily Focus:
   - Purpose and goals
   - Expected outcomes

2. Warmup:
   - Movement prep
   - Mobility work
   - Intensity build-up

3. Main Workout:
   - Movement standards
   - Loading parameters
   - Rest periods
   - Scaling options

4. Strength Focus:
   - Primary movements
   - Loading schemes
   - Technical cues

5. Coaching Notes:
   - Key points
   - Safety tips
   - Recovery guidelines

Return in JSON format:
{
  "Sunday": {
    "description": "Focus and purpose",
    "warmup": "Warmup protocol",
    "workout": "Main workout",
    "notes": "Coaching notes",
    "strength": "Strength focus"
  },
  "Monday": {
    "description": "string",
    "warmup": "string",
    "workout": "string",
    "notes": "string",
    "strength": "string"
  },
  "Tuesday": {
    "description": "string",
    "warmup": "string",
    "workout": "string",
    "notes": "string",
    "strength": "string"
  },
  "Wednesday": {
    "description": "string",
    "warmup": "string",
    "workout": "string",
    "notes": "string",
    "strength": "string"
  },
  "Thursday": {
    "description": "string",
    "warmup": "string",
    "workout": "string",
    "notes": "string",
    "strength": "string"
  },
  "Friday": {
    "description": "string",
    "warmup": "string",
    "workout": "string",
    "notes": "string",
    "strength": "string"
  },
  "Saturday": {
    "description": "string",
    "warmup": "string",
    "workout": "string",
    "notes": "string",
    "strength": "string"
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { prompt } = await req.json();
    console.log('Processing request for expertise:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid or missing prompt');
    }

    const expertPrompt = createExpertCoachPrompt(prompt);
    const textResponse = await generateWithGemini(expertPrompt);

    try {
      const cleanedText = textResponse.replace(/```json\n?|\n?```/g, '').trim();
      const workouts = JSON.parse(cleanedText);

      // Validate required structure
      const requiredDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const requiredFields = ['description', 'warmup', 'workout', 'notes', 'strength'];

      const isValid = requiredDays.every(day => 
        workouts[day] && requiredFields.every(field => 
          typeof workouts[day][field] === 'string' && workouts[day][field].length > 0
        )
      );

      if (!isValid) {
        console.error('Invalid workout structure');
        throw new Error('Generated workout plan is incomplete');
      }

      return new Response(JSON.stringify(workouts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error('Failed to generate valid workout plan');
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate workouts'
      }), {
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
