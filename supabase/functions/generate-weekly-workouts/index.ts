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
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response;
    console.log('Successfully received Gemini response');
    return response.text();
  } catch (error) {
    console.error('Error in generateWithGemini:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

const createExpertCoachPrompt = (expertise: string) => `
You are a world-renowned coach and movement specialist with over 25 years of experience in athletic development, movement optimization, and performance enhancement. Your expertise spans across multiple domains including:
- Olympic weightlifting and powerlifting
- Gymnastics and calisthenics
- Sport-specific conditioning
- Rehabilitation and injury prevention
- Movement screening and assessment
- Periodization and program design
- Mental performance coaching

Based on your extensive expertise in ${expertise}, create a comprehensive weekly progression plan that demonstrates your deep understanding of movement science and athletic development.

For each training day, provide:

1. STRATEGIC OVERVIEW:
   - Day's specific focus and purpose
   - Connection to overall progression
   - Expected adaptation markers
   - Integration with weekly flow

2. DETAILED WARMUP PROTOCOL:
   - Movement preparation sequence
   - Mobility/stability work
   - Progressive intensity building
   - Neural preparation elements

3. MAIN WORKOUT:
   - Clear movement standards
   - Loading parameters with rationale
   - Work-to-rest ratios
   - Intensity guidelines
   - Progression/regression options
   - Time domains with purpose

4. STRENGTH DEVELOPMENT:
   - Primary movement patterns
   - Loading schemes
   - Tempo guidelines
   - Accessory work
   - Integration with skill work

5. COACHING NOTES:
   - Technical priorities
   - Common faults and corrections
   - Performance metrics
   - Safety considerations
   - Recovery guidelines

Return the response in this exact JSON format:

{
  "Sunday": {
    "description": "Detailed focus and purpose",
    "warmup": "Complete warmup protocol",
    "workout": "Main workout with all parameters",
    "notes": "Comprehensive coaching notes",
    "strength": "Detailed strength focus"
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
}

Ensure each day's workout demonstrates your expertise in ${expertise} while maintaining sound training principles and scientific methodology.`;

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

    const { prompt } = await req.json();
    console.log('Received expertise area:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid or missing prompt in request body');
    }

    const expertPrompt = createExpertCoachPrompt(prompt);
    console.log('Generated expert prompt:', expertPrompt);

    const textResponse = await generateWithGemini(expertPrompt);
    console.log('Raw Gemini response:', textResponse);

    try {
      const cleanedText = textResponse.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned response:', cleanedText);

      const workouts = JSON.parse(cleanedText);
      console.log('Parsed workouts:', workouts);

      const requiredDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const requiredFields = ['description', 'warmup', 'workout', 'notes', 'strength'];

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